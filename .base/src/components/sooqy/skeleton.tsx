import { cn } from "@/lib/utils";

/** هيكل تحميل لبطاقة المنتج — يحاكي الشكل النهائي closely. */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <div className="aspect-square animate-pulse bg-neutral-200" />
      <div className="space-y-2 p-2.5">
        <div className="h-3 w-3/4 animate-pulse rounded-full bg-neutral-200" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-neutral-200" />
        <div className="h-4 w-2/5 animate-pulse rounded-full bg-neutral-200" />
      </div>
    </div>
  );
}

/** هيكل تحميل لبطاقة المتجر. */
export function StoreCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-3 rounded-2xl border border-border bg-card p-3", className)}>
      <div className="size-20 shrink-0 animate-pulse rounded-xl bg-neutral-200" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-neutral-200" />
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-neutral-200" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-neutral-200" />
      </div>
    </div>
  );
}

/** شبكة هيكل تحميل لمنتجات — عمودان على الهاتف. */
export function ProductGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4", className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** قائمة هيكل تحميل لصفوف المتاجر. */
export function ListSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <StoreCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** اسم موحّد لمكوّنات التحميل (LoadingSkeleton). */
export const LoadingSkeleton = ListSkeleton;
