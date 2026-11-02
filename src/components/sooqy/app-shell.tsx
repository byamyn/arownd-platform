import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "app-page min-h-screen bg-background",
        className,
      )}
    >
      {children}
    </div>
  );
}
