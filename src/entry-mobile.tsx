// نقطة دخول SPA لتطبيق الجوال (Capacitor WebView):
// TanStack Start client يتطلب حمولة SSR (__TSR__) للرسم — غير متوفرة في WebView.
// الحل: RouterProvider مباشرة (SPA خالص) — يرسم من الصفر بدون hydration.
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { getRouter } from "./router";

// صائد أخطاء الشاشة أولًا (يتجاهل SSR)
import "@/lib/screen-error";
import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/500.css";
import "@fontsource/tajawal/700.css";
import "@fontsource/tajawal/800.css";
import "./styles.css";

// نظام Error Tracking (Sentry)
import "./utils/sentry";
import { AppErrorBoundary, ErrorFallback } from "./components/AppErrorBoundary";

// Android adjustResize يدير مساحة لوحة المفاتيح أصلًا.
// تعطيل التمرير الناعم العام في WebView يمنع تنافس حركة scrollIntoView
// مع إعادة قياس نافذة Android عند فتح لوحة المفاتيح.
if (Capacitor.isNativePlatform()) {
  document.documentElement.style.scrollBehavior = "auto";
}

const router = getRouter();
const queryClient = router.options.context.queryClient;

// Deep link لـ OAuth (تسجيل الدخول عبر Google):
// بعد الموافقة في المتصفح يعيد Android فتح التطبيق برابط
// com.sooqy.app://auth/callback?code=... — نوجّهه لصفحة /auth/callback لتبادل الكود.
if (Capacitor.isNativePlatform()) {
  App.addListener("appUrlOpen", ({ url }) => {
    try {
      const u = new URL(url);
      if (u.protocol !== "com.sooqy.app:" || u.host !== "auth" || u.pathname !== "/callback")
        return;
      const search: { reset: boolean; code?: string | undefined } = {
        reset: u.searchParams.get("reset") === "1",
        code: u.searchParams.get("code") ?? undefined,
      };
      router.navigate({ to: "/auth/callback", search, replace: true });
    } catch {
      // رابط غير متوقع — نتجاهله
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary fallback={<ErrorFallback />}>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </AppErrorBoundary>,
);
