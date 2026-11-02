// دالة Vercel (Serverless) لموقع SooQy — TanStack Start SSR.
//
// المسار:
//   1) الملفات الثابتة في dist/client تُخدَم مباشرة من طبقة Vercel الثابتة.
//   2) أي مسار آخر يصل هنا، ويُمرَّر إلى معالج SSR في TanStack Start.
//
// الاستيراد الساكن لحزمة الخادم المُجمّعة (server.cjs) ضروري كي يتتبّعها
// مُحزِّم Vercel ويضمّها إلى الدالة. لا تستبدله بـ import() ديناميكي.

import type { IncomingMessage, ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { gzipSync } from "node:zlib";
import serverModule from "./_generated/server.cjs";

type Fetcher = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

const mod = serverModule as unknown as Fetcher & { default?: Fetcher };
const app: Fetcher = mod.default ?? mod;

const CLIENT_DIR = join(process.cwd(), "dist", "client");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

/** أنواع المحتوى القابلة للضغط */
const COMPRESSIBLE_TYPES = [
  "text/html",
  "text/css",
  "text/javascript",
  "application/javascript",
  "application/json",
  "application/manifest+json",
  "image/svg+xml",
];

/** حد حجم جسم الطلب (1 ميغابايت) */
const MAX_BODY_SIZE = 1024 * 1024;

/** نافذة تحديد المعدل: 60 طلباً في الدقيقة لكل IP */
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 60;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true };
}

/** يضغط المحتوى إذا قبل العميل gzip والنوع قابل للضغط */
function compressIfAccepted(
  body: Uint8Array,
  acceptEncoding: string | undefined,
  mimeType: string,
): { body: Uint8Array; encoding?: string } {
  const canCompress =
    acceptEncoding?.includes("gzip") && COMPRESSIBLE_TYPES.some((t) => mimeType.startsWith(t));
  if (!canCompress || body.length < 512) {
    return { body };
  }
  try {
    const compressed = gzipSync(Buffer.from(body));
    return { body: new Uint8Array(compressed), encoding: "gzip" };
  } catch {
    return { body };
  }
}

/** رؤوس الأمان الأساسية */
function setSecurityHeaders(res: ServerResponse, isHttps: boolean): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Allow this origin to use location and camera only when the user invokes
  // the related feature. Keep microphone and unrelated device APIs disabled.
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(self), camera=(self), microphone=(), payment=(), usb=()",
  );
  if (isHttps) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

/** يخدم ملفًا ثابتًا من dist/client إن وُجد (شبكة أمان إن لم تخدمه Vercel). */
async function tryStatic(
  pathname: string,
  acceptEncoding: string | undefined,
): Promise<Response | null> {
  const rel = normalize(decodeURIComponent(pathname))
    .replace(/^(\.\.[/\\])+/, "")
    .replace(/^[/\\]+/, "");
  if (!rel || rel.includes("..")) return null;
  const filePath = join(CLIENT_DIR, rel);
  try {
    const info = await stat(filePath);
    if (!info.isFile()) return null;
    const body = await readFile(filePath);
    const mimeType = MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream";
    const compressed = compressIfAccepted(new Uint8Array(body.buffer), acceptEncoding, mimeType);
    const headers: Record<string, string> = {
      "content-type": mimeType,
      "cache-control": rel.startsWith("assets/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=0, must-revalidate",
    };
    if (compressed.encoding) {
      headers["content-encoding"] = "gzip";
    }
    return new Response(compressed.body as BodyInit, { status: 200, headers });
  } catch {
    return null;
  }
}

function readBody(
  req: IncomingMessage,
): Promise<Uint8Array | typeof undefined | { error: string }> {
  return new Promise((resolve) => {
    const method = (req.method ?? "GET").toUpperCase();
    if (method === "GET" || method === "HEAD") return resolve(undefined);
    const chunks: Buffer[] = [];
    let totalLength = 0;
    req.on("data", (c: Buffer) => {
      chunks.push(c);
      totalLength += c.length;
      if (totalLength > MAX_BODY_SIZE) {
        req.destroy();
        resolve({ error: "Request body too large" });
      }
    });
    req.on("end", () => {
      if (totalLength > MAX_BODY_SIZE) return;
      resolve(chunks.length ? new Uint8Array(Buffer.concat(chunks)) : undefined);
    });
    req.on("error", () => resolve(undefined));
  });
}

/** يخفي أي سر محتمل من رسالة الخطأ قبل عرضها. */
function sanitizeMessage(message: string): string {
  return message
    .replace(/sb_[A-Za-z0-9_-]{6,}/g, "sb_•••")
    .replace(/eyJ[A-Za-z0-9._-]{10,}/g, "eyJ•••")
    .replace(/[A-Za-z0-9_-]{40,}/g, "•••")
    .slice(0, 400);
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

/** حضور المتغيرات فقط (✓/✗) — لا تُطبع أي قيمة، فهذا آمن ومفيد للتشخيص. */
function envPresence(): string {
  const keys = [
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SOOQY_CRON_SECRET",
  ];
  return keys.map((k) => `${k}=${process.env[k] ? "✓" : "✗"}`).join(" · ");
}

/** يعرض صفحة خطأ عربية مع تفاصيل تقنية منظَّفة تساعد على تحديد السبب. */
function reportFailure(res: ServerResponse, error: unknown): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const presence = envPresence();
  console.error("[vercel] handler error:", err.message);
  console.error("[vercel] stack:", err.stack);
  console.error("[vercel] env presence:", presence);

  if (res.headersSent) {
    res.end();
    return;
  }
  res.statusCode = 500;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(
    `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width, initial-scale=1">` +
      `<title>تعذّر تحميل الصفحة</title></head>` +
      `<body style="font-family:system-ui,sans-serif;padding:24px;line-height:1.7;background:#F8FAFC;color:#111827">` +
      `<h1 style="color:#4F46E5">تعذّر تحميل الصفحة</h1>` +
      `<p>حدث خطأ غير متوقع. أعد المحاولة بعد قليل.</p>` +
      `<details style="margin-top:16px"><summary style="cursor:pointer;color:#4F46E5">تفاصيل تقنية (للدعم)</summary>` +
      `<p style="font-size:13px"><b>الرسالة:</b> ${escapeHtml(sanitizeMessage(err.message))}</p>` +
      `<p style="font-size:13px"><b>متغيرات البيئة:</b> ${escapeHtml(presence)}</p>` +
      `</details></body></html>`,
  );
}

/** مهلة انتظار للطلب (10 ثوانٍ) */
const REQUEST_TIMEOUT_MS = 10_000;

function withTimeout<T>(value: T | Promise<T>, ms: number): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Request timeout")), ms);
  });
  return Promise.race([Promise.resolve(value), timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const isForwardedHttps =
    typeof forwardedProto === "string" &&
    forwardedProto.split(",")[0].trim().toLowerCase() === "https";
  const socket = req.socket as typeof req.socket & { encrypted?: boolean };
  const isHttps = isForwardedHttps || Boolean(socket.encrypted);
  try {
    // تحديد المعدل لكل عنوان IP
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      res.statusCode = 429;
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.setHeader("retry-after", String(rateLimit.retryAfter ?? 60));
      setSecurityHeaders(res, isHttps);
      res.end(
        `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8">` +
          `<meta name="viewport" content="width=device-width, initial-scale=1">` +
          `<title>تم تجاوز الحد المسموح</title></head>` +
          `<body style="font-family:system-ui,sans-serif;padding:24px;line-height:1.7;background:#F8FAFC;color:#111827">` +
          `<h1 style="color:#4F46E5">تم تجاوز الحد المسموح للطلبات</h1>` +
          `<p>يُرجى المحاولة مرة أخرى بعد <strong>${rateLimit.retryAfter ?? 60}</strong> ثانية.</p>` +
          `</body></html>`,
      );
      return;
    }

    const host =
      (req.headers["x-forwarded-host"] as string) || (req.headers.host as string) || "localhost";
    const proto = (req.headers["x-forwarded-proto"] as string) || "https";
    const url = new URL(req.url ?? "/", `${proto}://${host}`);
    const acceptEncodingRaw = req.headers["accept-encoding"];
    const acceptEncoding = typeof acceptEncodingRaw === "string" ? acceptEncodingRaw : undefined;

    // محاولة خدمة ملف ثابت
    const staticRes = await tryStatic(url.pathname, acceptEncoding);
    if (staticRes) {
      res.statusCode = staticRes.status;
      staticRes.headers.forEach((value, key) => res.setHeader(key, value));
      setSecurityHeaders(res, isHttps);
      res.end(Buffer.from(await staticRes.arrayBuffer()));
      return;
    }

    // قراءة جسم الطلب مع تحديد الحجم
    const bodyResult = await readBody(req);
    if (typeof bodyResult === "object" && "error" in bodyResult) {
      res.statusCode = 413;
      res.setHeader("content-type", "text/html; charset=utf-8");
      setSecurityHeaders(res, isHttps);
      res.end(
        `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8">` +
          `<meta name="viewport" content="width=device-width, initial-scale=1">` +
          `<title>جسم الطلب كبير جداً</title></head>` +
          `<body style="font-family:system-ui,sans-serif;padding:24px;line-height:1.7;background:#F8FAFC;color:#111827">` +
          `<h1 style="color:#4F46E5">جسم الطلب كبير جداً</h1>` +
          `<p>يُرجى تقليل حجم البيانات المرسلة والمحاولة مرة أخرى.</p>` +
          `</body></html>`,
      );
      return;
    }
    const body = bodyResult;

    const bodyForRequest =
      body && !(typeof body === "object" && "error" in body) ? body : undefined;
    const request = new Request(url, {
      method: req.method ?? "GET",
      headers: req.headers as Record<string, string>,
      body: bodyForRequest as BodyInit | undefined,
      ...(bodyForRequest ? { duplex: "half" as const } : {}),
    } as RequestInit);

    // استدعاء الخادم مع مهلة انتظار
    // app.fetch返回 Response | Promise<Response>، لكن withTimeout يحتاج Promise<Response> لذا نلصقها
    const response = await withTimeout(app.fetch(request, process.env, {}), REQUEST_TIMEOUT_MS);
    res.statusCode = response.status;
    // set-cookie قد تكون عدة ترويسات، و Headers.forEach يدمجها بفاصلة فتُفسد الجلسة.
    const headersWithCookies = response.headers as Headers & { getSetCookie?: () => string[] };
    const setCookies =
      typeof headersWithCookies.getSetCookie === "function"
        ? headersWithCookies.getSetCookie()
        : [];
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") return;
      res.setHeader(key, value);
    });
    if (setCookies.length) res.setHeader("set-cookie", setCookies);

    // لا نضغط إذا كان الاستجابة موجودة مسبقاً (مثلاً من CDN أو الخادم نفسه)
    // ولا نضغط للطلبات HEAD أو الاستجابات 304
    const existingEncoding = response.headers.get("content-encoding");
    if (existingEncoding || req.method === "HEAD" || response.status === 304) {
      setSecurityHeaders(res, isHttps);
      // لا نخزن الصفحات الديناميكية (طلبات، ملفات تعريف، إلخ) في الكاش
      res.setHeader("cache-control", "no-store, private, must-revalidate");
      res.end();
      return;
    }

    // ضغط استجابة SSR إذا كان العميل يقبل gzip
    const responseBody = new Uint8Array(await response.arrayBuffer());
    const responseMime = (response.headers.get("content-type") ?? "").split(";")[0];
    const compressed = compressIfAccepted(responseBody, acceptEncoding, responseMime);
    if (compressed.encoding) {
      res.setHeader("content-encoding", "gzip");
    }
    res.setHeader("content-length", String(compressed.body.length));
    setSecurityHeaders(res, isHttps);
    // لا نخزن الصفحات الديناميكية (طلبات، ملفات تعريف، إلخ) في الكاش
    res.setHeader("cache-control", "no-store, private, must-revalidate");
    res.end(Buffer.from(compressed.body));
  } catch (error) {
    reportFailure(res, error);
  }
}
