import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { translate, useTranslation } from "@/lib/i18n";
import { ArowndBrand } from "@/components/sooqy/logo";

// رابط عودة OAuth: في التطبيق الأصلي deep link مخصص يعيد فتح التطبيق،
// وفي الويب مسار /auth/callback العادي (مع حماية من بيئة SSR بلا window).
const AUTH_REDIRECT_URL = Capacitor.isNativePlatform()
  ? "com.sooqy.app://auth/callback"
  : typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : "http://localhost/auth/callback";

export const Route = createFileRoute("/auth")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { redirect?: string | undefined; reset?: boolean } => ({
    redirect:
      typeof s["redirect"] === "string" &&
      s["redirect"].startsWith("/") &&
      !s["redirect"].startsWith("//") &&
      !s["redirect"].includes("\\")
        ? s["redirect"]
        : undefined,
    reset: s["reset"] === "1" || s["reset"] === true || s["reset"] === "true",
  }),
  head: () => ({
    meta: [
      { title: translate("auth_seo_title") },
      { name: "description", content: translate("auth_seo_description") },
      { property: "og:title", content: translate("auth_seo_title") },
      { property: "og:description", content: translate("auth_seo_og") },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect, reset } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isRTL } = useTranslation();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && !reset) navigate({ to: (redirect ?? "/") as "/", replace: true });
  }, [user, redirect, navigate, reset]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reset && password !== confirm) {
      toast.error(t("passwords_do_not_match"));
      return;
    }
    setBusy(true);
    try {
      if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${AUTH_REDIRECT_URL}?reset=1`,
        });
        if (error) throw error;
        toast.success(t("reset_link_sent"));
        setForgot(false);
      } else if (reset) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success(t("password_updated"));
        navigate({ to: "/", replace: true });
      } else if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: AUTH_REDIRECT_URL, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success(t("account_created"));
      }
    } catch (err) {
      const msg = (err as Error).message;
      // رسائل عامة لمنع كشف وجود الحسابات (account enumeration)
      if (forgot) {
        toast.success(t("email_registered"));
        setForgot(false);
      } else if (typeof navigator !== "undefined" && !navigator.onLine) {
        // لا نُظهر "بيانات غير صحيحة" عندما تكون المشكلة انقطاع الشبكة
        toast.error(t("error"));
      } else if (mode === "up") {
        toast.error(t("account_creation_failed"));
      } else {
        toast.error(t("invalid_credentials"));
      }
      console.debug("[auth]", msg);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (redirect) sessionStorage.setItem("sooqy-redirect", redirect);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: AUTH_REDIRECT_URL,
          skipBrowserRedirect: Capacitor.isNativePlatform(),
        },
      });
      if (error) throw error;
      if (!data.url) throw new Error("OAuth provider did not return a redirect URL");
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: data.url });
      }
    } catch (error) {
      console.error("[auth:google]", error);
      toast.error(t("error"));
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex size-full items-center justify-between px-4 py-4">
        <Link
          to="/"
          aria-label={t("common_back")}
          className="flex size-10 items-center justify-center rounded-full bg-card"
        >
          <ArrowLeft className="size-6 rtl:rotate-180" />
        </Link>
        <div className="flex size-10 items-center justify-center rounded-full bg-card" />
      </header>

      <main className="flex-1 px-4 pt-12">
        <div className="flex flex-col items-center text-center pt-12">
          <ArowndBrand className="mx-auto h-20 w-auto shrink-0" />
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {mode === "in"
              ? t("auth_welcome_back")
              : t("auth_welcome_new")}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3 mt-4">
          {!reset && !forgot && mode === "up" && (
            <div className="relative">
              <User className="absolute end-3 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("enter_name")}
                className="h-12 w-full rounded-xl border border-border bg-card pe-10 ps-4 text-sm focus:ring-2 focus:ring-primary/30 focus:border-transparent outline-none transition-colors"
              />
            </div>
          )}
          {!reset && (
            <div className="relative">
              <Mail className="absolute end-3 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
              <input
                required
                type="email"
                autoComplete={mode === "up" ? "email" : "username"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("enter_email")}
                className="h-12 w-full rounded-xl border border-border bg-card pe-10 ps-4 text-sm focus:ring-2 focus:ring-primary/30 focus:border-transparent outline-none transition-colors"
              />
            </div>
          )}
          {forgot ? (
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              {t("verify_email")}
            </p>
          ) : reset ? (
            <>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("enter_password")}
                  className="h-12 w-full rounded-xl border border-border bg-card px-4 ps-12 text-sm focus:ring-2 focus:ring-primary/30 focus:border-transparent outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? t("hide_password") : t("show_password")}
                >
                  {showPassword ? <EyeOff className="size-6" /> : <Eye className="size-6" />}
                </button>
              </div>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={t("confirm_password")}
                  className="h-12 w-full rounded-xl border border-border bg-card pe-10 ps-4 text-sm focus:ring-2 focus:ring-primary/30 focus:border-transparent outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? t("hide_password") : t("show_password")}
                >
                  {showPassword ? <EyeOff className="size-6" /> : <Eye className="size-6" />}
                </button>
              </div>
            </>
          ) : (
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("enter_password")}
                className="h-12 w-full rounded-xl border border-border bg-card pe-10 ps-4 text-sm focus:ring-2 focus:ring-primary/30 focus:border-transparent outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? t("hide_password") : t("show_password")}
              >
                {showPassword ? <EyeOff className="size-6" /> : <Eye className="size-6" />}
              </button>
            </div>
          )}
          {!reset && !forgot && mode === "in" && (
            <button
              type="button"
              onClick={() => setForgot(true)}
              className={isRTL ? "text-left ml-1 mt-2 text-accent-ink" : "text-right mr-1 mt-2 text-accent-ink"}
              aria-label={t("forgot_password")}
            >
              {t("forgot_password")}
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full py-2"
          >
            {busy
              ? t("loading")
              : reset
                ? t("save")
                : forgot
                  ? t("send")
                  : mode === "in"
                    ? t("sign_in")
                    : t("sign_up")}
          </button>
        </form>

        {!reset && !forgot && (
          <>
            {mode === "in" && (
              <button
                type="button"
                onClick={() => setForgot(true)}
                className="w-full text-center text-xs font-semibold text-accent-ink underline mt-3"
              >
                {t("forgot_password")}
              </button>
            )}
            <div className="relative flex items-center justify-center gap-2 mt-2">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold text-muted-foreground">{t("or")}</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <button
              type="button"
              onClick={google}
              disabled={busy}
              className="w-full rounded-xl border border-border bg-card py-3 font-semibold text-foreground disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {busy ? t("loading") : "Google"}
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
              className="w-full text-sm font-semibold text-accent-ink mt-3"
            >
              {mode === "in" ? t("create_account_prompt") : t("already_have_account")}
            </button>
          </>
        )}
        {forgot && (
          <button
            type="button"
            onClick={() => setForgot(false)}
            className="w-full text-sm font-semibold text-accent-ink mt-3"
          >
            {t("sign_in")}
          </button>
        )}

        <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
          {t("terms_agreement")}{" "}
          <Link to="/terms" className="underline text-accent-ink">
            {t("terms")}
          </Link>{" "}
          {t("and")}
          <Link to="/privacy" className="underline text-accent-ink">
            {t("privacy")}
          </Link>
        </p>
      </main>
    </div>
  );
}
