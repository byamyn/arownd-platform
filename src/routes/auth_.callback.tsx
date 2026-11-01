import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { translate, useTranslation } from "@/lib/i18n";

type RegistrationIntent = "customer" | "merchant" | "delivery";

export const Route = createFileRoute("/auth_/callback")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    reset: boolean;
    code?: string;
    intent?: RegistrationIntent;
    redirect?: string;
  } => ({
    reset: s["reset"] === "1" || s["reset"] === true || s["reset"] === "true",
    code: typeof s["code"] === "string" ? s["code"] : undefined,
    intent:
      s["intent"] === "merchant" || s["intent"] === "delivery" || s["intent"] === "customer"
        ? s["intent"]
        : undefined,
    redirect:
      typeof s["redirect"] === "string" &&
      s["redirect"].startsWith("/") &&
      !s["redirect"].startsWith("//") &&
      !s["redirect"].includes("\\")
        ? s["redirect"]
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: translate("auth_callback_seo_title") },
      { name: "description", content: translate("auth_callback_seo_description") },
      { property: "og:title", content: translate("auth_callback_seo_title") },
      { property: "og:description", content: translate("auth_callback_seo_description") },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CallbackPage,
});

function safePath(path: string | null | undefined) {
  return path &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("/\\") &&
    !path.includes("\\")
    ? path
    : "/";
}

function CallbackPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { reset, code, intent, redirect } = Route.useSearch();

  useEffect(() => {
    let done = false;

    const go = () => {
      if (done) return;
      done = true;

      if (intent === "merchant") {
        navigate({ to: "/create-store", replace: true });
        return;
      }
      if (intent === "delivery") {
        navigate({ to: "/delivery-register", replace: true });
        return;
      }

      if (intent === "customer") {
        navigate({ to: "/profile", search: { setup: true }, replace: true });
        return;
      }

      const storedRedirect =
        typeof window !== "undefined" ? sessionStorage.getItem("sooqy-redirect") : null;
      if (typeof window !== "undefined") sessionStorage.removeItem("sooqy-redirect");
      const target = safePath(redirect ?? storedRedirect);
      navigate({ to: target as "/", replace: true });
    };

    if (reset) {
      navigate({ to: "/auth", search: { reset: true }, replace: true });
      return;
    }

    const run = async () => {
      if (code && Capacitor.isNativePlatform()) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.debug("[auth/callback] exchange failed", error.message);
          navigate({ to: "/auth", replace: true });
        } else {
          go();
        }
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session) go();
    };

    void run().catch((error) => {
      if (done) return;
      console.debug("[auth/callback] session recovery failed", error);
      navigate({ to: "/auth", replace: true });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go();
    });
    const timeout = window.setTimeout(() => {
      if (!done) navigate({ to: "/auth", replace: true });
    }, 8000);

    return () => {
      subscription.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [navigate, reset, code, intent, redirect]);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-3 px-4 text-center">
      <Loader2 className="size-8 animate-spin text-accent-ink" />
      <p className="font-bold">{t("auth_callback_title")}</p>
      <p className="text-xs text-muted-foreground">{t("auth_callback_description")}</p>
    </div>
  );
}
