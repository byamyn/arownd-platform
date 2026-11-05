/**
 * طبقة PWA — تسجيل Service Worker + إشعار التحديث + زر التثبيت.
 *
 * تُستدعى من `AppShell`/root بعد أول رسم. لا تفعل شيئًا في بيئات
 * لا تدعمها (SSR، WebView قديم، iOS Safari جزئيًا).
 */

import { isNativePlatform } from "@/lib/platform";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const updateListeners = new Set<() => void>();
const installListeners = new Set<(canInstall: boolean) => void>();

/** هل التطبيق قابل للتثبيت الآن (المتصفح عرض نافذة التثبيت)؟ */
export function canInstall(): boolean {
  return deferredPrompt !== null;
}

/** يطلب من المتصفح عرض نافذة التثبيت. يُرجع true إذا قبل المستخدم. */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  const ev = deferredPrompt;
  deferredPrompt = null;
  notifyInstall();
  try {
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    return outcome === "accepted";
  } catch {
    return false;
  } finally {
    notifyInstall();
  }
}

/** يشترك في تغيّر إمكانية التثبيت. يُرجع دالة إلغاء الاشتراك. */
export function onInstallChange(cb: (canInstall: boolean) => void): () => void {
  installListeners.add(cb);
  return () => installListeners.delete(cb);
}

/** يشترك في توفّر تحديث جديد. يُرجع دالة إلغاء الاشتراك. */
export function onUpdateAvailable(cb: () => void): () => void {
  updateListeners.add(cb);
  return () => updateListeners.delete(cb);
}

function notifyInstall() {
  const value = deferredPrompt !== null;
  installListeners.forEach((cb) => cb(value));
}

function notifyUpdate() {
  updateListeners.forEach((cb) => cb());
}

/** يفعّل التحديث فورًا (المستخدم اختار «تحديث»). */
export function applyUpdate(): void {
  navigator.serviceWorker?.getRegistration().then((reg) => {
    reg?.waiting?.postMessage("SKIP_WAITING");
  });
}

/**
 * يسجّل Service Worker مرة واحدة.
 * آمن للاستدعاء المتكرر، ولا يرمي استثناءات أبدًا.
 */
export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  // Native apps are updated through the app stores, not a web Service Worker.
  if (isNativePlatform()) return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notifyInstall();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyInstall();
  });

  window.addEventListener("load", () => {
    let hasController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hasController) {
        window.location.reload();
      } else {
        hasController = true;
      }
    });

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // تحديث متاح الآن
        if (registration.waiting) notifyUpdate();
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              notifyUpdate();
            }
          });
        });
      })
      .catch(() => {
        // فشل التسجيل لا يجب أن يُعطّل التطبيق (مثلًا في بيئة غير آمنة)
      });

    // فحص دوري للتحديثات (كل ساعة) — يكفي دون إغراق الشبكة.
    window.setInterval(
      () => {
        navigator.serviceWorker
          .getRegistration()
          .then((reg) => reg?.update().catch(() => undefined));
      },
      60 * 60 * 1000,
    );
  });
}
