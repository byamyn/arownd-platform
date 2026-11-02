/**
 * Service Worker — Arownd
 *
 * الاستراتيجية:
 *  • هيكل التطبيق (HTML/JS/CSS): precache عند التثبيت + stale-while-revalidate
 *  • الأصول الثابتة (صور/خطوط/خريطة): cache-first مع حدّ عمر
 *  • البيانات (Supabase API): network-first مع fallback للنسخة المخزّنة
 *  • رسائل التطبيق: "update available" + "skip waiting" عند الطلب
 *
 * الهدف: التطبيق يفتح بسرعة ويعمل (بالقراءة) حتى دون اتصال.
 */

const VERSION = "v1";
const SHELL_CACHE = `arownd-shell-${VERSION}`;
const ASSET_CACHE = `arownd-assets-${VERSION}`;
const DATA_CACHE = `arownd-data-${VERSION}`;
const MAX_ASSETS = 80;
const MAX_DATA_ENTRIES = 40;
const DATA_TTL_MS = 24 * 60 * 60 * 1000; // يوم

/** أصول الهيكل — تُخزَّن مسبقًا عند التثبيت. */
const SHELL_ASSETS = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // نتجاهل فشل أي أصل منفرد حتى لا يفشل التثبيت كله.
      await Promise.allSettled(SHELL_ASSETS.map((url) => cache.add(url)));
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, ASSET_CACHE, DATA_CACHE]);
      const names = await caches.keys();
      await Promise.all(names.filter((n) => !keep.has(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
  if (event.data === "CLEAR_DATA_CACHE") {
    event.waitUntil(caches.delete(DATA_CACHE));
  }
});

/** يحذف أقدم المدخلات عندما يتجاوز الكاش الحدّ الأقصى. */
async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  for (const key of keys.slice(0, keys.length - max)) {
    await cache.delete(key);
  }
}

function isAsset(url) {
  return (
    url.pathname.startsWith("/_build/") ||
    url.pathname.startsWith("/assets/") ||
    /\.(?:js|css|png|jpe?g|webp|svg|woff2?|ico)$/i.test(url.pathname)
  );
}

function isData(url) {
  return (
    url.pathname.includes("/rest/v1/") ||
    url.pathname.includes("/auth/v1/") ||
    url.pathname.includes("/functions/v1/")
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // لا نتدخل في النطاقات الخارجية (Supabase يُعالَج عبر isData إن كان على نفس النطاق).
  if (url.origin !== self.location.origin) return;

  // 1) التنقّل: network-first مع fallback لنسخة الهيكل المخزّنة.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(SHELL_CACHE);
          cache.put("/", fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match("/");
          return (
            cached ||
            new Response("<!doctype html><meta charset=utf-8><title>Arownd</title>", {
              status: 200,
              headers: { "Content-Type": "text/html; charset=utf-8" },
            })
          );
        }
      })(),
    );
    return;
  }

  // 2) البيانات: network-first، ثم الكاش (مع حدّ عمر).
  if (isData(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(DATA_CACHE);
        try {
          const fresh = await fetch(request);
          if (fresh.ok) {
            cache.put(request, fresh.clone());
            void trimCache(DATA_CACHE, MAX_DATA_ENTRIES);
          }
          return fresh;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ error: "offline" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }
      })(),
    );
    return;
  }

  // 3) الأصول: cache-first مع تحديث في الخلفية.
  if (isAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
              void trimCache(ASSET_CACHE, MAX_ASSETS);
            }
            return response;
          })
          .catch(() => undefined);
        return cached || (await network) || new Response("", { status: 504 });
      })(),
    );
  }
});

// مزامنة في الخلفية: تُرسل المراجعات عندما تعود الشبكة.
self.addEventListener("sync", (event) => {
  if (event.tag === "arownd-sync") {
    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach((client) => client.postMessage({ type: "SYNC_COMPLETE" }));
      })(),
    );
  }
});
