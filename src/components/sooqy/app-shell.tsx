import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto min-h-screen w-full max-w-2xl bg-background px-4",
        "pb-28", // for BottomNav height + safe area
        className,
      )}
    >
      {children}
    </div>
  );
}
