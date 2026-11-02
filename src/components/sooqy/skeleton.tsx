import { cn } from "@/lib/utils";

/** Loading placeholders follow the same geometry as their final components. */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-3xl border border-border bg-card", className)}>
      <div className="aspect-square skeleton" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-3/4 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-2/5 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

export function StoreCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-3 rounded-3xl border border-border bg-card p-4", className)}>
      <div className="size-20 shrink-0 animate-pulse rounded-2xl bg-muted" />
      <div className="min-w-0 flex-1 space-y-2 py-1">
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-[var(--gutter)] sm:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <StoreCardSkeleton key={i} />
      ))}
    </div>
  );
}

export const LoadingSkeleton = ListSkeleton;
