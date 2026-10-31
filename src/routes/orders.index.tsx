import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Archive, PackageCheck, Package, Trash2, Truck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRealtimeSubscription } from "@/hooks/use-realtime";
import { formatDA } from "@/lib/geo";
import { formatDate } from "@/lib/market";
import { archiveMyActivity, fetchMyOrders } from "@/lib/sooqy";
import { EmptyState } from "@/components/sooqy/empty-state";
import { OrderStatusBadge } from "@/components/sooqy/badges";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/sooqy/error-state";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { SeoHead } from "@/components/seo/SeoHead";

export const Route = createFileRoute("/orders/")({
  head: () => ({}),
  component: OrdersPage,
});

type Tab = "all" | "active" | "delivered" | "cancelled";

const TABS: { id: Tab; labelKey: string }[] = [
  { id: "all", labelKey: "orders_tab_all" },
  { id: "active", labelKey: "orders_tab_active" },
  { id: "delivered", labelKey: "orders_tab_delivered" },
  { id: "cancelled", labelKey: "orders_tab_cancelled" },
];

function trackCode(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function OrdersPage() {
  const { t } = useTranslation();
  const { user, ready } = useAuth();
  const queryClient = useQueryClient();
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
        <h1 className="text-h1 text-foreground">{t("orders_login_title")}</h1>
        <p className="max-w-xs text-body text-muted-foreground">{t("orders_login_hint")}</p>
        <Link to="/auth" search={{ redirect: "/orders" }} className="btn-primary mt-2">
          {t("checkout_login_cta")}
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
        title={t("orders_seo_title")}
        description={t("orders_seo_description")}
        keywords={t("orders_seo_keywords")}
        ogType="website"
      />
      <div className="space-y-4 px-4 pt-5">
        <header className="flex items-center gap-2 py-1">
          <h1 className="text-h1 text-foreground">{t("orders_heading")}</h1>
        </header>

        {/* التبويبات */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={cn(
                "min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
                tab === tb.id
                  ? "border-accent-ink bg-primary text-accent-ink-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {t(tb.labelKey)}
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

        {orders.isError && (
          <ErrorState
            title={t("orders_load_failed")}
            error={orders.error}
            onRetry={() => orders.refetch()}
          />
        )}

        {!orders.isLoading && !orders.isError && filtered.length === 0 && (
          <EmptyState
            Icon={tab === "cancelled" ? Trash2 : Package}
            title={tab === "all" ? t("orders_empty_all") : t("orders_empty_tab")}
            hint={t("orders_empty_hint")}
            action={
              <Link to="/explore" className="btn-primary">
                {t("orders_browse")}
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
                    <p className="text-sm font-bold text-foreground">
                      {t("orders_code", { code: trackCode(o.id) })}
                    </p>
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
                      {t("orders_more_items", { count: (o.items ?? []).length - 3 })}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Truck className="size-3.5" />
                    {o.delivery_type === "home"
                      ? t("orders_delivery_home")
                      : t("orders_delivery_desk")}
                  </span>
                  <b className="text-price text-accent-ink">{formatDA(o.total)}</b>
                </div>

                <Link
                  to="/orders/$orderId"
                  params={{ orderId: o.id }}
                  className="btn-secondary !h-10 mt-3 w-full text-sm"
                >
                  {t("orders_track")}
                </Link>
                {(o.status === "delivered" || o.status === "cancelled") && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm("هل تريد إخفاء هذا الطلب من سجلّك؟ سيبقى محفوظًا في قاعدة البيانات.")) return;
                      try {
                        await archiveMyActivity("order", o.id);
                        await queryClient.invalidateQueries({ queryKey: ["my-orders"] });
                        toast.success("تم إخفاء الطلب من سجلك.");
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "تعذر إخفاء الطلب.");
                      }
                    }}
                    className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground transition hover:bg-muted"
                  >
                    <Archive className="size-4" /> إخفاء من السجل
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
