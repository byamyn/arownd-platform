import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * نافذة تأكيد موحّدة للعمليات الحساسة (مثل الحذف).
 * تعمل باللمس على الهاتف: طبقة معتمة + بطاقة سفلية، مع إغلاق بمفتاح Escape.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-end justify-center bg-[var(--color-overlay-scrim)] p-4 pb-8 sm:items-center"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="animate-scale-in w-full max-w-sm rounded-[var(--radius-card)] border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-[var(--control-height)] rounded-[var(--radius-pill)] border border-border bg-background px-4 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {cancelLabel ?? t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={cn(
              "min-h-[var(--control-height)] rounded-[var(--radius-pill)] px-4 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50",
              tone === "danger" ? "bg-danger text-danger-foreground" : "bg-primary text-accent-ink-foreground",
            )}
          >
            {busy ? t("action_busy") : (confirmLabel ?? t("action_confirm"))}
          </button>
        </div>
      </div>
    </div>
  );
}
