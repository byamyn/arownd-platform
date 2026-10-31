import { useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "@/lib/i18n";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** محتوى ثابت أسفل الورقة (أزرار الإجراء الأساسية). */
  footer?: ReactNode;
  className?: string;
  /** نمط "نموذج مركّز" بدلًا من ورقة من الأسفل. القائمة تظهر في منتصف الشاشة. */
  modal?: boolean;
  /** عرض النموذج بالبكسل — افتراضي 320. */
  width?: number;
}

/**
 * ورقة سفلية للهاتف: تنزلق من الأسفل، قابلة للتمرير،
 * مع عنوان واضح ومقبض إغلاق وركن إجراءات ثابت.
 * مع `modal` تصبح نافذة مركّزة في وسط الشاشة.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className,
  modal = false,
  width = 320,
}: BottomSheetProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // منع تمرير الخلفية أثناء فتح الورقة
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[1200] flex items-end justify-center bg-black/45",
        modal && "items-center",
      )}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        className={cn(
          "animate-fade-up flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden",
          "rounded-t-3xl border-t border-border bg-card shadow-float",
          "pb-[env(safe-area-inset-bottom)]",
          modal && "animate-scale-in items-center rounded-3xl border-t-0 max-w-[calc(100vw-2rem)]",
          className,
        )}
        style={modal ? { width } : undefined}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* مقبض + رأس — في النمط المركّز لا نحتاج المقبض */}
        <div className="shrink-0 px-5 pt-3">
          {!modal && (
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          )}
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-h3 text-foreground">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("aria_close")}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition active:scale-95"
            >
              <X className="size-4.5" />
            </button>
          </div>
        </div>

        {/* محتوى قابل للتمرير */}
        <div className={cn("min-h-0 flex-1 overflow-y-auto", modal ? "px-5 py-4" : "px-5 py-4")}>
          {children}
        </div>

        {/* ركن إجراءات ثابت */}
        {footer && (
          <div className="shrink-0 border-t border-border bg-card px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
