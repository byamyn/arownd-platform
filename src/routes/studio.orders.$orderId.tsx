import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { translate } from "@/lib/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useRealtimeSubscription } from "@/hooks/use-realtime";
import { formatDA } from "@/lib/geo";
import { formatDate } from "@/lib/market";
import { fetchOrder, fetchStoreOrderItems, merchantUpdateOrderStatus, deleteOrder, fetchMyStore } from "@/lib/sooqy";
import { Link, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
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
        <PageHeader title="تفاصيل الطلب" back="/studio" />
        <p className="text-sm text-muted-foreground">سجّل الدخول لعرض تفاصيل الطلب.</p>
        <Link to="/auth" search={{ redirect: `/studio/orders/${orderId}` }} className="btn-primary inline-block">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  if (store.isLoading || orderQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="جارٍ تحميل تفاصيل الطلب">
        <span className="size-8 animate-spin rounded-full border-2 border-accent-ink border-t-transparent" />
      </div>
    );
  }

  if (store.isError) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 pt-6">
        <PageHeader title="تفاصيل الطلب" back="/studio" />
        <ErrorState scope="studio:order:store" error={store.error} onRetry={() => store.refetch()} />
      </div>
    );
  }

  if (orderQuery.isError) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 pt-6">
        <PageHeader title="تفاصيل الطلب" back="/studio" />
        <ErrorState scope="studio:order:details" error={orderQuery.error} onRetry={() => orderQuery.refetch()} />
      </div>
    );
  }

  const order = orderQuery.data;
  if (!order) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">الطلب غير موجود أو غير متاح.</p>
        <button onClick={() => goBackOrTo(router, "/studio")}>رجوع</button>
      </div>
    );
  }

  const handleStatus = async (status: "confirmed" | "shipped" | "delivered" | "cancelled") => {
    try {
      await merchantUpdateOrderStatus(order.id, status);
      await qc.invalidateQueries({ queryKey: ["store-orders"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطأ");
    }
  };

  return (
    <>
      <div className="space-y-4 px-4 pt-4">
      <PageHeader title="تفاصيل الطلب" back="/studio" />
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-bold">طلب #{order.id.slice(-6)}</p>
        <p className="text-xs text-muted-foreground">{formatDate(order.created_at, undefined, { day: "numeric", month: "long", year: "numeric" })}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-foreground">المجموع: </span>
          <b className="text-price text-accent-ink">{formatDA(order.total)}</b>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-foreground">الحالة: </span>
          <OrderStatusBadge status={order.status} className="mt-1" />
        </div>
        <div className="mt-3 space-y-2">
          {order.items?.map((it) => (
            <div key={it.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{it.product_name}</p>
                <p className="text-xs text-muted-foreground">× {it.quantity}</p>
              </div>
              <b className="text-price">{formatDA(it.unit_price * it.quantity)}</b>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="أضف ملاحظة (اختياري)"
              className="h-11 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/25"
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
                  toast.success("تم حفظ الملاحظة ✅");
                  await qc.invalidateQueries({ queryKey: ["store-order", orderId] });
                } catch {
                  toast.error("تعذّر حفظ الملاحظة.");
                }
              }}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              حفظ
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            {(["confirmed", "shipped", "delivered", "cancelled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleStatus(s)}
                className="rounded-lg bg-muted px-2 py-1 text-[10px] font-bold transition hover:bg-primary hover:text-primary-foreground"
              >
                {s}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPendingDelete(true)}
              aria-label={translate("studio_delete_order_aria")}
              className="rounded-lg bg-danger-soft px-2 py-1 text-[10px] font-bold text-danger transition hover:bg-danger/25"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      open={pendingDelete}
      title="حذف الطلب"
      message="سيتم حذف هذا الطلب نهائيًا من متجرك ولا يمكن استعادته. هل أنت متأكد؟"
      confirmLabel="حذف نهائي"
      busy={deleting}
      onCancel={() => {
        if (!deleting) setPendingDelete(false);
      }}
      onConfirm={async () => {
        if (deleting) return;
        setDeleting(true);
          try {
            await deleteOrder(orderId, undefined, store.data?.id);
            toast.success("تم حذف الطلب ✅");
            setPendingDelete(false);
            await qc.invalidateQueries({ queryKey: ["store-orders"] });
            router.navigate({ to: "/studio" });
          } catch (error) {
          toast.error(error instanceof Error ? error.message : "تعذّر حذف الطلب.");
        } finally {
          setDeleting(false);
        }
      }}
    />
    </>
  );
}
