import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { ENGLISH_ENABLED, useTranslation } from "@/lib/i18n";

export function PageHeader({
  title,
  subtitle,
  back,
  action,
  className,
  showLanguageToggle,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: string;
  action?: ReactNode;
  className?: string;
  showLanguageToggle?: boolean;
}) {
  const { lang, switchLang, t } = useTranslation();

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-border bg-background px-[var(--margin)] py-2",
        className,
      )}
    >
      {back && (
        <Link
          to={back}
          aria-label={t("aria_back")}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground transition-colors active:bg-muted"
        >
          <ChevronRight className="size-5 rtl:rotate-180" aria-hidden="true" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-h1 leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 truncate text-caption text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
      {showLanguageToggle && ENGLISH_ENABLED && (
        <button
          type="button"
          onClick={() => switchLang(lang === "ar" ? "en" : "ar")}
          aria-label={lang === "ar" ? t("aria_switch_lang") : t("aria_switch_lang_en")}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground transition-colors active:bg-muted"
        >
          <Globe className="size-5" aria-hidden="true" />
        </button>
      )}
    </header>
  );
}
