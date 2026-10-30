import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

export interface StickyActionBarProps {
  children: ReactNode;
  className?: string;
}

export function StickyActionBar({ children, className }: StickyActionBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 px-4",
        className,
      )}
    >
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card/95 p-3 shadow-lift backdrop-blur">
        {children}
      </div>
    </div>
  );
}
