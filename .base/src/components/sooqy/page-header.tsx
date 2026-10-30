import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

/**
 * رأس صفحة موحد ومتسق عبر جميع الشاشات.
 * - عنوان رئيسي بحجم text-h1 (28px، bold)
 * - عنوان فرعي اختياري بحجم text-caption
 * - زر رجوع اختياري مع دعم RTL تلقائي
 * - إجراء جانبي اختياري (زر أو رابط)
 * - padding ثابت p-6، عرض كامل مع مسافة جانبية آمنة
 */
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
  const { lang, switchLang, isRTL, t } = useTranslation();

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur",
        className,
      )}
    >
      {back && (
        <Link
          to={back}
          aria-label={t("aria_back")}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card shadow-soft transition hover:bg-neutral-100 active:scale-95 dark:hover:bg-neutral-800"
        >
          <ChevronRight className="size-5 rtl:rotate-180" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-h1 leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 truncate text-caption text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
      {showLanguageToggle && (
        <button
          onClick={() => switchLang(lang === "ar" ? "en" : "ar")}
          aria-label={lang === "ar" ? t("aria_switch_lang") : t("aria_switch_lang_en")}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card shadow-soft transition hover:bg-neutral-100 active:scale-95 dark:hover:bg-neutral-800"
        >
          <Globe className="size-5" />
        </button>
      )}
    </header>
  );
}
