import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useLocation,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

// صائد أخطاء الشاشة — يجب أن يُستورد أولًا ليعتمد قبل أي طبقة أخرى (يتجاهل SSR)
import "@/lib/screen-error";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { ENGLISH_ENABLED, ogLocale, translate, useTranslation } from "@/lib/i18n";
// تهيئة Sentry على الويب — قبل سابقًا لم يكن هناك رصد لأخطاء الويب إطلاقًا.
import "@/utils/sentry";
import { AppErrorBoundary, ErrorFallback } from "@/components/AppErrorBoundary";
import { BagProvider } from "@/lib/bag";
import { ThemeProvider } from "@/lib/theme";
import { BottomNav } from "@/components/sooqy/BottomNav";
import { PwaPrompt, useServiceWorkerRegistration } from "@/components/sooqy/PwaPrompt";
import { ConnectionBanner } from "@/components/sooqy/ConnectionBanner";
import { DynamicIsland } from "@/components/sooqy/DynamicIsland";
import { PageTransition } from "@/components/sooqy/page-transition";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("notfound_title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("notfound_hint")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            {t("notfound_home")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{t("error_title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("error_hint")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            {t("error_retry")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border bg-card px-4 py-2 text-sm font-medium"
          >
            {t("error_home")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0B0F0C" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { title: translate("root_title") },
      {
        name: "description",
        content: translate("root_description"),
      },
      {
        name: "keywords",
        content: translate("root_keywords"),
      },
      { name: "author", content: "Arownd" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Arownd" },
      { property: "og:locale", content: ogLocale() },
      ...(ENGLISH_ENABLED
        ? [{ property: "og:locale:alternate", content: ogLocale() === "ar_DZ" ? "en_DZ" : "ar_DZ" }]
        : []),
      { property: "og:image", content: "https://arownd.app/seo/og.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: translate("root_title") },
      {
        name: "twitter:description",
        content: translate("root_twitter_description"),
      },
      { name: "twitter:image", content: "https://arownd.app/seo/og.svg" },
    ],
    links: [
      // appCss يreference "" في بيئة الاختبار فقط — تجاهله حتى لا يُرسم <link> بـhref فارغ
      ...(appCss ? [{ rel: "stylesheet", href: appCss }] : []),
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=Noto+Sans+Arabic:wght@400;500;700;800&display=swap",
      },
      { rel: "preload", href: "/seo/og.svg", as: "image" },
      { rel: "sitemap", href: "/sitemap.xml", type: "application/xml" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // اللغة والاتجاه يتبعان اختيار المستخدم — أساس الشرط الثنائي (RTL/LTR).
  const { lang } = useTranslation();

  // Testing Library mounts inside a div; render only the app subtree in Vitest.
  // Production SSR must keep the full document shell for TanStack Start.
  if (import.meta.env.MODE === "test") return <>{children}</>;
  const dir = lang === "ar" ? "rtl" : "ltr";
  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <head>
        <HeadContent />
        <meta name="theme-color" content="#0B0F0C" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Arownd" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sooqy-theme');var mq=window.matchMedia('(prefers-color-scheme: dark)').matches;var d=(t==='dark')||((t==='system'||!t)&&mq);var r=document.documentElement;if(d){r.classList.add('dark');}r.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <AppErrorBoundary fallback={<ErrorFallback />}>{children}</AppErrorBoundary>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useServiceWorkerRegistration();
  const location = useLocation();
  const isAuth = location.pathname === "/auth";

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BagProvider>
            <div className={isAuth ? "min-h-screen w-full max-w-none pb-0" : "mx-auto min-h-screen max-w-xl pb-28"}>
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
            {!isAuth && (
              <>
                <ConnectionBanner />
                <DynamicIsland />
                <BottomNav />
                <PwaPrompt />
              </>
            )}
            <Toaster position="top-center" richColors />
          </BagProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
