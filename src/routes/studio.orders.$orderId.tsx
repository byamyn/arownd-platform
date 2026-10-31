import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useRealtimeSubscription } from "@/hooks/use-realtime";
import { formatDA } from "@/lib/geo";
import { formatDate } from "@/lib/market";
import {
  fetchOrder,
  fetchStoreOrderItems,
  merchantUpdateOrderStatus,
  deleteOrder,
  fetchMyStore,
} from "@/lib/sooqy";
import { Link, useRouter } from "@tanstack/react-router";
import { showError, showSuccess } from "@/lib/feedback";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/sooqy/page-header";
import { ErrorState } from "@/components/sooqy/error-state";
import { OrderStatusBadge } from "@/components/sooqy/badges";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/sooqy/confirm-dialog";
import { useState } from "react";
import { goBackOrTo } from "@/lib/nav";

export const Route = createFileRoute("/studio/orders/$orderId")({
  component: StudioOrderDetailPage,
});

function StudioOrderDetailPage() {
  const { t } = useTranslation();
  const { orderId } = Route.useParams();
  const { user, ready } = useAuth();
  const [note, setNote] = useState("");
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const qc = useQueryClient();

  const store = useQuery({ queryKey: ["my-store"], queryFn: fetchMyStore, enabled: !!user });
  const orderQuery = useQuery({
    queryKey: ["store-order", orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId && !!user,
  });

  // رقم المتجر من سجل المتجر الفعلي (user_metadata.store_id لا يُضبط في أي مكان)
  const myStoreId = store.data?.id;
  const ordersQuery = useQuery({
    queryKey: ["store-orders", myStoreId],
    queryFn: () => fetchStoreOrderItems(myStoreId as string),
    enabled: !!user && !!myStoreId,
  });

  useRealtimeSubscription({
    table: "orders",
    queryKeys: [["store-order", orderId], ["store-orders"]],
    enabled: !!user && !!orderId,
  });

  if (!ready) return null;
  if (!user) {
    return (
      <div className="space-y-4 px-4 pt-16 text-center">
        <PageHeader title={t("studio_order_details")} back="/studio" />
        <p className="text-sm text-muted-foreground">{t("studio_login_order_detail")}</p>
        <Link
          to="/auth"
          search={{ redirect: `/studio/orders/${orderId}` }}
          className="btn-primary inline-block"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  if (store.isLoading || orderQuery.isLoading) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center"
        role="status"
        aria-label={t("studio_order_details_loading")}
      >
        <span className="size-8 animate-spin rounded-full border-2 border-accent-ink border-t-transparent" />
      </div>
    );
  }

  if (store.isError) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 pt-6">
        <PageHeader title={t("studio_order_details")} back="/studio" />
        <ErrorState
          scope="studio:order:store"
          error={store.error}
          onRetry={() => store.refetch()}
        />
      </div>
    );
  }

  if (orderQuery.isError) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 pt-6">
        <PageHeader title={t("studio_order_details")} back="/studio" />
        <ErrorState
          scope="studio:order:details"
          error={orderQuery.error}
          onRetry={() => orderQuery.refetch()}
        />
      </div>
    );
  }

  const order = orderQuery.data;
  if (!order) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">{t("studio_order_unavailable")}</p>
        <button onClick={() => goBackOrTo(router, "/studio")}>{t("studio_back")}</button>
      </div>
    );
  }

  const handleStatus = async (status: "confirmed" | "shipped" | "delivered" | "cancelled") => {
    try {
      await merchantUpdateOrderStatus(order.id, status);
      await qc.invalidateQueries({ queryKey: ["store-orders"] });
    } catch (error) {
      showError(error);
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-4xl space-y-5 px-4 pb-24 pt-5 sm:px-6 lg:pt-8">
        <PageHeader title={t("studio_order_details")} back="/studio" />
        <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
          <div className="rounded-t-[1.75rem] bg-[#111813] p-5 text-white sm:p-6"><p className="text-[10px] font-extrabold tracking-[0.2em] text-[#D4F56A]">AROWND · ORDER</p><p className="mt-2 text-xl font-black">{t("studio_order_number")} #{order.id.slice(-6)}</p>
          <p className="mt-1 text-xs text-white/65">
            {formatDate(order.created_at, undefined, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          </div>
          <div className="space-y-4 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-semibold text-foreground">{t("studio_total")}</span>
            <b className="text-price text-accent-ink">{formatDA(order.total)}</b>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex items-center gap-1 font-semibold text-foreground">{t("studio_status")}</span>
            <OrderStatusBadge status={order.status} className="mt-1" />
          </div>
          <div className="mt-3 space-y-2">
            {order.items?.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/60 p-3">
                <div>
                  <p className="font-semibold">{it.product_name}</p>
                  <p className="text-xs text-muted-foreground">× {it.quantity}</p>
                </div>
                <b className="text-price">{formatDA(it.unit_price * it.quantity)}</b>
              </div>
            ))}
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("studio_order_note_ph")}
                className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-accent-ink focus:ring-2 focus:ring-primary/25"
              />
              <button
                onClick={async () => {
                  if (!note.trim()) return;
                  try {
                    await merchantUpdateOrderStatus(
                      order.id,
                      order.status as "confirmed" | "shipped" | "delivered" | "cancelled",
                      note.trim(),
                    );
                    showSuccess(t("studio_note_saved"));
                    await qc.invalidateQueries({ queryKey: ["store-order", orderId] });
                  } catch (error) {
                    showError(error);
                  }
                }}
                className="min-h-12 rounded-xl bg-primary px-5 py-2 text-sm font-extrabold text-primary-foreground transition active:scale-[.98]"
              >
                حفظ
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["confirmed", "shipped", "delivered", "cancelled"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatus(s)}
                  className="min-h-11 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-extrabold transition hover:border-accent-ink/40 hover:bg-primary hover:text-primary-foreground active:scale-[.98]"
                >
                  {t(`status_${s}`)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPendingDelete(true)}
                aria-label={t("studio_delete_order_aria")}
                className="col-span-2 flex min-h-11 items-center justify-center rounded-xl bg-danger-soft px-3 py-2 text-xs font-bold text-danger transition hover:bg-danger/25 sm:col-span-4"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete}
        title={t("studio_delete_order")}
        message={t("studio_delete_order_confirm")}
        confirmLabel={t("studio_delete_confirm")}
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(false);
        }}
        onConfirm={async () => {
          if (deleting) return;
          setDeleting(true);
          try {
            await deleteOrder(orderId, undefined, store.data?.id);
            showSuccess(t("studio_order_deleted"));
            setPendingDelete(false);
            await qc.invalidateQueries({ queryKey: ["store-orders"] });
            router.navigate({ to: "/studio" });
          } catch (error) {
            showError(error);
          } finally {
            setDeleting(false);
          }
        }}
      />
    </>
  );
}
