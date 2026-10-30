import { cn } from "@/lib/utils";
import type { StockLevel } from "@/lib/sooqy";
import { BadgeCheck, Clock, XCircle, AlertTriangle, Check } from "lucide-react";
import type { StoreStatus } from "@/lib/geo";
import { useTranslation } from "@/lib/i18n";

/* ═══════════════ شارة مستوى المخزون ═══════════════ */
export function StockBadge({ level, className }: { level: StockLevel; className?: string }) {
  const map = {
    in:  { text: "متوفر", cls: "bg-success-soft text-success border border-success/20" },
    low: { text: "كمية محدودة", cls: "bg-warning-soft text-warning border border-warning/20" },
    out: { text: "نفد", cls: "bg-danger-soft text-danger border border-danger/20" },
  }[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", map.cls, className)}>
      <Check className="size-3" />{map.text}
    </span>
  );
}

/* ═══════════════ شارة حالة فتح المتجر ═══════════════ */
function getStatusConfig(status: StoreStatus) {
  if (status.label === "ساعات العمل غير متوفرة") {
    return {
      icon: AlertTriangle,
      bg: "bg-neutral-200 text-muted-foreground dark:bg-neutral-200 dark:text-muted-foreground",
      dot: "bg-neutral-500 dark:bg-neutral-500",
    };
  }
  if (status.label === "مغلق مؤقتًا") {
    return { icon: XCircle, dotColor: "bg-warning", bgClass: "bg-warning-soft text-warning border border-warning/20" };
  }
  if (status.isOpen) {
    return { icon: Clock, dotColor: "bg-success live-dot", bgClass: "bg-success-soft text-success border border-success/20" };
  }
  return {
    icon: XCircle,
    bg: "bg-neutral-200 text-muted-foreground dark:bg-neutral-200 dark:text-muted-foreground",
    dot: "bg-neutral-500 dark:bg-neutral-500",
  };
}

export function OpenBadge({ open, className, detailed = false, status }: {
  open?: boolean; className?: string; detailed?: boolean; status?: StoreStatus;
}) {
  if (detailed && status) {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", config.bgClass, className)}
        title={status.description + (status.nextChange ? ` — ${status.nextChange}` : "")}>
        <span className={cn("size-1.5 shrink-0 rounded-full", config.dotColor)} />
        <Icon className="size-3 shrink-0" />{status.label}
        {status.nextChange && <span className="opacity-70">· {status.nextChange}</span>}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
        open
          ? "bg-success-soft text-success"
          : "bg-neutral-200 text-muted-foreground dark:bg-neutral-200 dark:text-muted-foreground",
        className,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", open ? "bg-success live-dot" : "bg-neutral-500 dark:bg-neutral-500")}
      />
      {open ? "مفتوح الآن" : "مغلق"}
    </span>
  );
}

/* ═══════════════ شارة التوثيق ═══════════════ */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-[11px] font-bold text-accent-ink", className)}
    >
      <BadgeCheck className="size-3.5" /> متجر موثق
    </span>
  );
}

export function OrderStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const map: Record<string, { key: string; cls: string }> = {
    pending: { key: "status_pending", cls: "bg-warning-soft text-warning" },
    confirmed: { key: "status_confirmed", cls: "bg-primary-soft text-accent-ink" },
    shipped: { key: "status_shipped", cls: "bg-blue-soft text-blue" },
    delivered: { key: "status_delivered", cls: "bg-success-soft text-success" },
    cancelled: { key: "status_cancelled", cls: "bg-danger-soft text-danger" },
    rejected: { key: "status_rejected", cls: "bg-danger-soft text-danger" },
  };
  const m = map[status];
  const label = m ? t(m.key) : t("status_unknown");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
        m.cls,
        className,
      )}
    >
      {label}
    </span>
  );
}