import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  Icon,
  title,
  hint,
  action,
  className,
}: {
  Icon?: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl bg-card px-6 py-10 text-center shadow-soft",
        className,
      )}
    >
      {Icon && (
        <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100">
          <Icon className="text-3xl text-muted-foreground" />
        </div>
      )}
      <p className="text-sm font-bold text-foreground">{title}</p>
      {hint && <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
