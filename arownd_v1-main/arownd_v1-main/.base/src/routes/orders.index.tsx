import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PackageCheck, Package, Trash2, Truck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRealtimeSubscription } from "@/hooks/use-realtime";
import { formatDA } from "@/lib/geo";
import { formatDate } from "@/lib/market";
import { fetchMyOrders } from "@/lib/sooqy";
import { EmptyState } from "@/components/sooqy/empty-state";
import { OrderStatusBadge } from "@/components/sooqy/badges";
import { cn } from "@/lib/utils";
import { SeoHead } from "@/components/seo/SeoHead";

export const Route = createFileRoute("/orders/")({
  head: () => ({}),
  component: OrdersPage,
});

type Tab = "all" | "active" | "delivered" | "cancelled";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "active", label: "قيد التنفيذ" },
  { id: "delivered", label: "مكتملة" },
  { id: "cancelled", label: "ملغية" },
];

function trackCode(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function OrdersPage() {
  const { user, ready } = useAuth();
  const [tab, setTab] = useState<Tab>("all");
  const orders = useQuery({
    queryKey: ["my-orders"],
    queryFn: fetchMyOrders,
    enabled: !!user,
  });

  // تحديثات حية: تغييرات حالة الطلب (Supabase Realtime)
  useRealtimeSubscription({
    table: "orders",
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    queryKeys: [["my-orders"]],
    enabled: !!user,
  });

  if (!ready) return null;
  if (!user) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="flex size-20 items-center justify-center rounded-3xl bg-primary-soft">
          <PackageCheck className="size-9 text-accent-ink" strokeWidth={1.6} />
        </span>
        <h1 className="text-h1 text-foreground">سجّل الدخول لعرض طلباتك</h1>
        <p className="max-w-xs text-body text-muted-foreground">
          طلباتك وحالاتها ستظهر هنا بعد تسجيل الدخول.
        </p>
        <Link to="/auth" search={{ redirect: "/orders" }} className="btn-primary mt-2">
          دخول
        </Link>
      </div>
    );
  }

  const list = orders.data ?? [];
  const filtered =
    tab === "all"
      ? list
      : tab === "active"
        ? list.filter((o) => ["pending", "confirmed", "shipped"].includes(o.status))
        : tab === "delivered"
          ? list.filter((o) => o.status === "delivered")
          : list.filter((o) => o.status === "cancelled");

  return (
    <>
      <SeoHead
        title="طلباتي"
        description="Follow your orders and their status from Algerian stores."
        keywords="طلباتي, تتبع الطلب, SOOQY"
        ogType="website"
      />
      <div className="space-y-4 px-4 pt-5">
        <header className="flex items-center gap-2 py-1">
          <h1 className="text-h1 text-foreground">طلباتي</h1>
        </header>

        {/* التبويبات */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
                tab === t.id
                  ? "border-accent-ink bg-primary text-accent-ink-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {orders.isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </div>
        )}

        {!orders.isLoading && filtered.length === 0 && (
          <EmptyState
            Icon={tab === "cancelled" ? Trash2 : Package}
            title={tab === "all" ? "لا توجد طلبات بعد" : "لا توجد طلبات في هذا القسم"}
            hint="عندما تطلب منتجات من المتاجر، ستظهر طلباتك هنا مع حالتها لحظة بلحظة."
            action={
              <Link to="/explore" className="btn-primary">
                تصفح المنتجات
              </Link>
            }
          />
        )}

        <div className="space-y-3">
          {filtered.map((o) => {
            const date = formatDate(o.created_at, undefined, {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            return (
              <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">طلب #{trackCode(o.id)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {date}
                      {o.wilaya?.name_ar ? ` · ${o.wilaya.name_ar}` : ""}
                    </p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>

                <div className="mt-3 space-y-1.5 rounded-xl bg-background p-3">
                  {(o.items ?? []).slice(0, 3).map((it) => (
                    <div key={it.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="line-clamp-1 font-semibold text-foreground">
                        {it.product_name}{" "}
                        <span className="text-muted-foreground">× {it.quantity}</span>
                      </span>
                      <span className="shrink-0 font-bold text-ink">
                        {formatDA(it.unit_price * it.quantity)}
                      </span>
                    </div>
                  ))}
                  {(o.items ?? []).length > 3 && (
                    <p className="text-[11px] text-muted-foreground">
                      + {(o.items ?? []).length - 3} منتجات أخرى
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Truck className="size-3.5" />
                    {o.delivery_type === "home" ? "توصيل للمنزل" : "استلام من المكتب"}
                  </span>
                  <b className="text-price text-accent-ink">{formatDA(o.total)}</b>
                </div>

                <Link
                  to="/orders/$orderId"
                  params={{ orderId: o.id }}
                  className="btn-secondary !h-10 mt-3 w-full text-sm"
                >
                  تتبع الطلب
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
