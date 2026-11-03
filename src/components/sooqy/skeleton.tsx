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


/** هيكل بطاقة المتجر الأفقية في الصفحة الرئيسية. */
export function StoreRailSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-hidden px-4 pb-1" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-64 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-border bg-card">
          <div className="aspect-[16/10] skeleton" />
          <div className="flex items-center gap-3 p-3">
            <div className="size-11 shrink-0 animate-pulse rounded-xl bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** هيكل صفحة المنتج بأبعاد صورة البطل وبطاقات المعلومات النهائية. */
export function ProductDetailSkeleton() {
  return (
    <div className="pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+3rem)]" role="status" aria-label="جارٍ تحميل المنتج">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-b-[var(--radius-card)] bg-muted sm:aspect-square">
        <div className="size-full skeleton" />
      </div>
      <div className="space-y-6 px-5 pt-6">
        <section className="space-y-4 rounded-[var(--radius-card)] border border-border bg-card p-4">
          <div className="h-6 w-3/4 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-1/3 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-1/2 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
        </section>
        <section className="space-y-4 rounded-[var(--radius-card)] border border-border bg-card p-4">
          <div className="h-5 w-1/3 animate-pulse rounded-full bg-muted" />
          <div className="grid grid-cols-2 gap-3"><div className="h-12 rounded-xl bg-muted animate-pulse" /><div className="h-12 rounded-xl bg-muted animate-pulse" /></div>
        </section>
        <section className="space-y-3 rounded-[var(--radius-card)] border border-border bg-card p-4">
          <div className="h-5 w-1/3 animate-pulse rounded-full bg-muted" />
          <div className="h-24 rounded-2xl bg-muted animate-pulse" />
        </section>
      </div>
    </div>
  );
}

/** هيكل صفحة المتجر: الغلاف، التعريف، التبويبات وشبكة المنتجات. */
export function StoreDetailSkeleton() {
  return (
    <div className="space-y-5 pb-8" role="status" aria-label="جارٍ تحميل المتجر">
      <div className="h-44 w-full skeleton sm:h-56" />
      <div className="space-y-3 px-4">
        <div className="flex items-center gap-3"><div className="-mt-10 size-20 shrink-0 rounded-2xl border-4 border-background bg-muted animate-pulse" /><div className="flex-1 space-y-2"><div className="h-5 w-2/3 rounded-full bg-muted animate-pulse" /><div className="h-3 w-1/3 rounded-full bg-muted animate-pulse" /></div></div>
        <div className="h-4 w-full rounded-full bg-muted animate-pulse" />
        <div className="h-11 w-full rounded-xl bg-muted animate-pulse" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
      </div>
    </div>
  );
}

export const LoadingSkeleton = ListSkeleton;
