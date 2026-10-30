import { Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /**
   * حقل «عاري»: بلا إطار ولا خلفية — الحاوية الأم هي التي توفّر المظهر.
   * يُستخدم داخل صف مضغوط (مثل شريط البحث في صفحة الاكتشاف).
   */
  bare?: boolean;
  /** محتوى إضافي داخل الحقل من جهة النهاية (مثل زر الكاميرا). */
  trailing?: ReactNode;
}

/**
 * حقل بحث مشترك وموحد عبر جميع الصفحات.
 * - هندسة حقل موحدة (border-radius 12px، ارتفاع 48px)
 * - أيقونة بحث داخلية مع أيقونة مسح عند وجود نص
 * - دعم RTL تلقائي
 * - حالة disabled واضحة
 */
export function SearchField({
  value,
  onChange,
  onSearch,
  placeholder,
  disabled,
  className,
  bare = false,
  trailing,
}: SearchFieldProps) {
  const { isRTL, t } = useTranslation();
  const hasValue = value.length > 0;
  const hasTrailing = Boolean(trailing);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto pl-10 rtl:pr-10 flex items-center pointer-events-none">
        <Search className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSearch?.();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        className={cn(
          // h-12 = 48px (كان h-48 = 192px في Tailwind v4) · rounded-xl = 12px
          "w-full h-12 pl-10 pr-4 rtl:pr-10 rtl:pl-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground",
          "focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-colors",
          disabled && "opacity-50 pointer-events-none",
          // حقل عاري: الحاوية الأم توفّر الإطار والارتفاع
          bare && "h-full rounded-none border-0 bg-transparent focus:ring-0 focus:border-transparent",
          // مساحة لأزرار جهة النهاية (الكاميرا / المسح)
          hasTrailing && "pr-20 rtl:pl-20",
          className,
        )}
      />
      {(hasValue || hasTrailing) && !disabled && (
        <div className="absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto flex items-center gap-0.5 pr-2 rtl:pl-2 rtl:pr-0">
          {hasValue && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                onSearch?.();
              }}
              aria-label={t("aria_clear_search")}
              className="flex size-8 items-center justify-center"
            >
              <X className="size-5 text-muted-foreground hover:text-foreground" aria-hidden />
            </button>
          )}
          {trailing}
        </div>
      )}
    </div>
  );
}

/**
 * شريحة تصفية خفيفة وموحدة.
 * - أيقونة اختيارية على اليسار (RTL-aware)
 * - نص متوسط الحجم، وزن متوسط
 * - حالة مختارة تستخدم لون الهوية الأساسية
 * - حالة غير مختارة تستخدم لون السطح مع حدود خفيفة
 */
export interface FilterChipProps {
  label: string;
  value: string;
  selected: boolean;
  onChange: (value: string) => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function FilterChip({
  label,
  value,
  selected,
  onChange,
  icon: Icon,
  className,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        selected
          ? "border-accent-ink bg-primary text-accent-ink-foreground"
          : "border-border bg-card text-foreground hover:bg-neutral-100",
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {label}
    </button>
  );
}
