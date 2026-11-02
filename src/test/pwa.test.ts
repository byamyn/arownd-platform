import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const PUBLIC_DIR = resolve(process.cwd(), "public");

function readManifest(file: string) {
  return JSON.parse(readFileSync(resolve(PUBLIC_DIR, file), "utf8")) as {
    name: string;
    short_name: string;
    start_url: string;
    scope: string;
    display: string;
    lang: string;
    dir: string;
    theme_color: string;
    background_color: string;
    icons: { src: string; sizes: string; type: string; purpose?: string }[];
    shortcuts?: { name: string; url: string }[];
  };
}

describe("PWA — الـ manifest", () => {
  const manifests = ["manifest.webmanifest", "manifest.json"];

  for (const file of manifests) {
    describe(file, () => {
      const m = readManifest(file);

      it("JSON صالح ويحتوي الحقول الأساسية", () => {
        expect(m.name).toBeTruthy();
        expect(m.short_name).toBeTruthy();
        expect(m.start_url).toBe("/");
        expect(m.scope).toBe("/");
        expect(m.display).toBe("standalone");
        expect(m.lang).toBe("ar");
        expect(m.dir).toBe("rtl");
      });

      it("كل أيقونة مذكورة موجودة فعلًا على القرص", () => {
        for (const icon of m.icons) {
          const p = resolve(PUBLIC_DIR, icon.src.replace(/^\//, ""));
          expect(existsSync(p), `أيقونة مفقودة: ${icon.src}`).toBe(true);
        }
      });

      it("يحتوي أيقونات 192 و 512 (شرط التثبيت)", () => {
        const sizes = m.icons.map((i) => i.sizes);
        expect(sizes).toContain("192x192");
        expect(sizes).toContain("512x512");
      });

      it("يحتوي أيقونة maskable (للتثبيت على أندرويد)", () => {
        expect(m.icons.some((i) => i.purpose === "maskable")).toBe(true);
      });

      it("لون الواجهة يطابق هوية التطبيق", () => {
        // AROWND Design System v1.2: الخلفية الفاتحة #F5F5F5 والداكن #0A0A0A
        expect(m.background_color.toLowerCase()).toBe("#f5f5f5");
        expect(m.theme_color.toLowerCase()).toBe("#0a0a0a");
      });

      it("اختصارات التطبيق تشير إلى مسارات موجودة", () => {
        for (const s of m.shortcuts ?? []) {
          expect(s.url.startsWith("/")).toBe(true);
        }
      });
    });
  }

  it("الملفان متطابقان (توحيد الـ manifest)", () => {
    const a = readFileSync(resolve(PUBLIC_DIR, "manifest.webmanifest"), "utf8");
    const b = readFileSync(resolve(PUBLIC_DIR, "manifest.json"), "utf8");
    expect(JSON.parse(a)).toEqual(JSON.parse(b));
  });
});

describe("PWA — Service Worker", () => {
  const sw = readFileSync(resolve(PUBLIC_DIR, "sw.js"), "utf8");

  it("موجود ويdefined", () => {
    expect(existsSync(resolve(PUBLIC_DIR, "sw.js"))).toBe(true);
    expect(sw.length).toBeGreaterThan(500);
  });

  it("يسجّل أحداث install/activate/fetch", () => {
    expect(sw).toContain('addEventListener("install"');
    expect(sw).toContain('addEventListener("activate"');
    expect(sw).toContain('addEventListener("fetch"');
  });

  it("يستخدم network-first للتنقّل (يضمن حداثة المحتوى) مع fallback", () => {
    expect(sw).toContain('request.mode === "navigate"');
    expect(sw).toContain('caches.match("/")');
  });

  it("يخزّن البيانات مع حدّ عمر ومقاس", () => {
    expect(sw).toContain("DATA_TTL_MS");
    expect(sw).toContain("MAX_DATA_ENTRIES");
  });

  it("يحذف الكاش القديم عند التفعيل", () => {
    expect(sw).toContain("caches.delete");
  });
});
