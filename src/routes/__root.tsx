import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useLocation,
  useNavigate,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

// صائد أخطاء الشاشة — يجب أن يُستورد أولًا ليعتمد قبل أي طبقة أخرى (يتجاهل SSR)
import { reportScreenError } from "@/lib/screen-error";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { ENGLISH_ENABLED, ogLocale, translate, useTranslation } from "@/lib/i18n";
// تهيئة Sentry على الويب — قبل سابقًا لم يكن هناك رصد لأخطاء الويب إطلاقًا.
import "@/utils/sentry";
import { AppErrorBoundary, ErrorFallback } from "@/components/AppErrorBoundary";
import { BagProvider } from "@/lib/bag";
import { ThemeProvider } from "@/lib/theme";
import { AccountBottomNav } from "@/components/sooqy/AccountBottomNav";
import { PwaPrompt, useServiceWorkerRegistration } from "@/components/sooqy/PwaPrompt";
import { ConnectionBanner } from "@/components/sooqy/ConnectionBanner";
import { DynamicIsland } from "@/components/sooqy/DynamicIsland";
import { PageTransition } from "@/components/sooqy/page-transition";
import { Toaster } from "@/components/ui/sonner";
import { isNativePlatform } from "@/lib/platform";
import { parseNativeAuthCallback, parseNativeRouteLink } from "@/lib/native-deep-links";
import { openExternalUrl, syncNativeStatusBar } from "@/lib/native-sharing";
import { useTheme } from "@/lib/theme";

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-display text-foreground">404</h1>
        <h2 className="mt-4 text-h1 text-foreground">{t("notfound_title")}</h2>
        <p className="mt-2 text-body text-muted-foreground">{t("notfound_hint")}</p>
        <div className="mt-6">
          <Link to="/" className="btn-primary">
            {t("notfound_home")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  useEffect(() => {
    reportScreenError(error, "TanStack Router root error boundary");
  }, [error]);
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-h1 text-foreground">{t("error_title")}</h1>
        <p className="mt-2 text-body text-muted-foreground">{t("error_hint")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-primary"
          >
            {t("error_retry")}
          </button>
          <a href="/" className="btn-secondary">
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
      { property: "og:image", content: "https://arownd.vercel.app/seo/og.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: translate("root_title") },
      {
        name: "twitter:description",
        content: translate("root_twitter_description"),
      },
      { name: "twitter:image", content: "https://arownd.vercel.app/seo/og.svg" },
    ],
    links: [
      // appCss يreference "" في بيئة الاختبار فقط — تجاهله حتى لا يُرسم <link> بـhref فارغ
      ...(appCss ? [{ rel: "stylesheet", href: appCss }] : []),
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap",
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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <HeadContent />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Arownd" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('arownd-theme')||localStorage.getItem('sooqy-theme');var explicit=t==='light'||t==='dark';var mq=window.matchMedia('(prefers-color-scheme: dark)').matches;var d=explicit?t==='dark':mq;var r=document.documentElement;r.classList.toggle('dark',d);if(explicit){r.setAttribute('data-theme',t);}else{r.removeAttribute('data-theme');}var m=document.querySelector('meta[name=theme-color]');if(!m){m=document.createElement('meta');m.setAttribute('name','theme-color');document.head.appendChild(m);}var v=getComputedStyle(r).getPropertyValue('--color-bg-canvas').trim();if(v)m.setAttribute('content',v);}catch(e){}})();`,
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

function NativeRuntimeSync({ queryClient }: { queryClient: QueryClient }) {
  const { resolved } = useTheme();

  // Keep Android's native status bar synchronized with the app's resolved theme.
  useEffect(() => {
    if (!isNativePlatform()) return;

    const syncStatusBar = () => {
      const tokenColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-bg-canvas")
        .trim();
      const bodyColor = getComputedStyle(document.body).backgroundColor;
      const rgb = bodyColor.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      const bodyHex = rgb
        ? `#${rgb.slice(1, 4).map((channel) => Number(channel).toString(16).padStart(2, "0")).join("")}`
        : undefined;
      const color = /^#[0-9a-f]{6}$/i.test(tokenColor) ? tokenColor : bodyHex;
      void syncNativeStatusBar(
        resolved === "dark",
        color || (resolved === "dark" ? "#111827" : "#ffffff"),
      ).catch((error: unknown) => {
        console.warn("[native] Could not synchronize status bar", error);
      });
    };

    syncStatusBar();
  }, [resolved]);

  // Refresh active queries after returning from the background without
  // introducing a second app-state source of truth.
  useEffect(() => {
    if (!isNativePlatform()) return;

    let disposed = false;
    let removeListener: (() => void) | undefined;

    void import("@capacitor/app")
      .then(async ({ App }) => {
        if (disposed) return;
        const listener = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) {
            void queryClient.invalidateQueries({ refetchType: "active" });
          }
        });
        if (disposed) {
          void listener.remove();
        } else {
          removeListener = () => {
            void listener.remove();
          };
        }
      })
      .catch((error: unknown) => {
        console.warn("[native] Could not subscribe to app lifecycle", error);
      });

    return () => {
      disposed = true;
      removeListener?.();
    };
  }, [queryClient]);

  return null;
}


const dirtyForms = new Set<HTMLFormElement>();
const hasUnsavedFormChanges = () => dirtyForms.size > 0;

function UnsavedFormGuard() {
  useEffect(() => {
    const markDirty = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const form = target.closest("form");
        if (form instanceof HTMLFormElement) dirtyForms.add(form);
      }
    };
    const markSubmitted = (event: Event) => {
      if (event.target instanceof HTMLFormElement) dirtyForms.delete(event.target);
    };
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedFormChanges()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const confirmNavigation = (event: MouseEvent) => {
      if (!hasUnsavedFormChanges() || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.href === window.location.href) return;
      if (!window.confirm("لديك تغييرات غير محفوظة. هل تريد مغادرة الصفحة وفقدانها؟")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      } else {
        dirtyForms.clear();
      }
    };
    document.addEventListener("input", markDirty, true);
    document.addEventListener("change", markDirty, true);
    document.addEventListener("submit", markSubmitted, true);
    document.addEventListener("click", confirmNavigation, true);
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => {
      document.removeEventListener("input", markDirty, true);
      document.removeEventListener("change", markDirty, true);
      document.removeEventListener("submit", markSubmitted, true);
      document.removeEventListener("click", confirmNavigation, true);
      window.removeEventListener("beforeunload", warnBeforeUnload);
    };
  }, []);
  return null;
}

function NativeBackButtonHandler() {
  const router = useRouter();
  const location = useLocation();

  useEffect(() => {
    if (!isNativePlatform()) return;

    let disposed = false;
    let removeListener: (() => void) | undefined;

    void import("@capacitor/app")
      .then(async ({ App }) => {
        if (disposed) return;
        const listener = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack || window.history.length > 1) {
            router.history.back();
            return;
          }

          if (location.pathname !== "/") {
            void router.navigate({ to: "/" });
            return;
          }

          void App.exitApp();
        });

        if (disposed) {
          void listener.remove();
        } else {
          removeListener = () => {
            void listener.remove();
          };
        }
      })
      .catch((error: unknown) => {
        console.warn("[native] Could not subscribe to Android back button", error);
      });

    return () => {
      disposed = true;
      removeListener?.();
    };
  }, [router, location.pathname]);

  return null;
}

function NativeExternalLinkHandler() {
  useEffect(() => {
    if (!isNativePlatform()) return;

    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      const isWebLink = url.protocol === "https:" || url.protocol === "http:";
      const isSystemLink = ["tel:", "mailto:", "sms:", "geo:"].includes(url.protocol);
      if (!isWebLink && !isSystemLink) return;
      if (isWebLink && url.origin === window.location.origin) return;

      event.preventDefault();
      event.stopPropagation();
      void openExternalUrl(url.toString()).catch((error: unknown) => {
        console.warn("[native] Could not open external link", error);
      });
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}

function NativeDeepLinkListener() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativePlatform()) return;

    let disposed = false;
    let lastHandledUrl: string | undefined;
    let removeListener: (() => void) | undefined;

    const handleUrl = async (rawUrl: string) => {
      if (disposed || rawUrl === lastHandledUrl) return;
      const callback = parseNativeAuthCallback(rawUrl);
      const route = callback ? null : parseNativeRouteLink(rawUrl);
      if (!callback && !route) return;

      // The launch URL and appUrlOpen event can both report the same URL.
      // Process only registered auth callbacks or validated app-owned routes.
      lastHandledUrl = rawUrl;
      try {
        if (callback) {
          await navigate({
            to: "/auth/callback",
            search: callback,
            replace: true,
          });
        } else if (route) {
          await navigate({ to: route as never, replace: true });
        }
      } catch (error) {
        console.error("[native] Could not open validated app link", error);
      }
    };

    void import("@capacitor/app")
      .then(async ({ App }) => {
        if (disposed) return;
        const listener = await App.addListener("appUrlOpen", ({ url }) => {
          void handleUrl(url);
        });
        if (disposed) {
          void listener.remove();
          return;
        }
        removeListener = () => {
          void listener.remove();
        };

        const launch = await App.getLaunchUrl();
        if (!disposed && launch?.url) await handleUrl(launch.url);
      })
      .catch((error: unknown) => {
        console.error("[native] Capacitor App plugin failed to initialize", error);
      });

    return () => {
      disposed = true;
      removeListener?.();
    };
  }, [navigate]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useServiceWorkerRegistration();
  const location = useLocation();
  const isAuth = location.pathname === "/auth";
  // Merchant Studio needs the full desktop canvas; consumer pages stay phone-first.
  const isStudio = location.pathname === "/studio" || location.pathname.startsWith("/studio/");

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NativeRuntimeSync queryClient={queryClient} />
          <NativeDeepLinkListener />
          <NativeBackButtonHandler />
          <NativeExternalLinkHandler />
          <BagProvider>
            <div
              className={
                isAuth
                  ? "min-h-screen w-full max-w-none pb-0"
                  : isStudio
                    ? "min-h-screen w-full min-w-0 max-w-none overflow-x-clip pb-28"
                    : "mx-auto min-h-screen w-full max-w-7xl pb-28"
              }
            >
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
            {!isAuth && (
              <>
                <ConnectionBanner />
                <DynamicIsland />
                <AccountBottomNav />
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
