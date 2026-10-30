import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Check, Truck, X, Clock, PackageCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useRealtimeSubscription } from "@/hooks/use-realtime";
import { supabase } from "@/integrations/supabase/client";
import { fetchShipmentsByStore, type Shipment } from "@/lib/delivery";
import { SHIPMENT_STATUS_LABELS } from "@/lib/delivery";
import { formatDate } from "@/lib/market";
import { PageHeader } from "@/components/sooqy/page-header";
import { EmptyState } from "@/components/sooqy/empty-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/studio/shipments")({
  component: StudioShipmentsPage,
});

function StudioShipmentsPage() {
  const { user, ready } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const storeId = (user?.user_metadata as { store_id?: string })?.store_id;

  const {
    data: shipments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["store-shipments", storeId, statusFilter],
    queryFn: async () => {
      if (!storeId) return [];
      const all = await fetchShipmentsByStore(storeId);
      if (statusFilter) return all.filter((s) => s.status === statusFilter);
      return all;
    },
    enabled: ready && !!user && !!storeId,
  });

  // تحديثات حية: شحنات المتجر (Supabase Realtime)
  useRealtimeSubscription({
    table: "shipments",
    queryKeys: [["store-shipments"]],
    enabled: ready && !!user && !!storeId,
  });

  if (!ready) return null;
  if (!user) {
    return (
      <div className="p-6 text-center">
        <PageHeader title="الشحنات" back="/studio/settings" />
        <div className="text-danger-foreground">سجّل الدخول لعرض شحنات متجرك</div>
        <Link to="/auth" className="btn-primary mt-4 inline-block">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <PageHeader title="الشحنات" back="/studio/settings" />
        <div className="text-danger-foreground">حدث خطأ أثناء تحميل الشحنات</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <PageHeader title="الشحنات" back="/studio/settings" />
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="p-6 text-center">
        <PageHeader title="الشحنات" back="/studio/settings" />
        <div className="text-danger-foreground">لا يوجد متجر مرتبط بهذا الحساب</div>
      </div>
    );
  }

  const statusCounts = {
    pending: (shipments ?? []).filter((s) => s.status === "pending").length,
    accepted: (shipments ?? []).filter((s) => s.status === "accepted").length,
    picked_up: (shipments ?? []).filter((s) => s.status === "picked_up").length,
    in_transit: (shipments ?? []).filter((s) => s.status === "in_transit").length,
    delivered: (shipments ?? []).filter((s) => s.status === "delivered").length,
    failed: (shipments ?? []).filter((s) => s.status === "failed").length,
    returned: (shipments ?? []).filter((s) => s.status === "returned").length,
  };

  const filteredShipments =
    (statusFilter ? (shipments ?? []).filter((s) => s.status === statusFilter) : shipments) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="الشحنات" back="/studio/settings" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ملخص الحالات */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            {
              key: null,
              label: "الجميع",
              count: (shipments ?? []).length,
              color: "border-accent-ink bg-primary-soft text-accent-ink",
            },
            {
              key: "pending",
              label: "قيد الانتظار",
              count: statusCounts.pending,
              color: "bg-warning-soft text-warning",
            },
            {
              key: "accepted",
              label: "تم القبول",
              count: statusCounts.accepted,
              color: "bg-primary-soft text-accent-ink",
            },
            {
              key: "picked_up",
              label: "تم الاستلام",
              count: statusCounts.picked_up,
              color: "bg-primary-soft text-accent-ink",
            },
            {
              key: "in_transit",
              label: "قيد التوصيل",
              count: statusCounts.in_transit,
              color: "bg-primary-soft text-accent-ink",
            },
            {
              key: "delivered",
              label: "تم التسليم",
              count: statusCounts.delivered,
              color: "bg-success-soft text-success",
            },
            {
              key: "failed",
              label: "تعذر التسليم",
              count: statusCounts.failed,
              color: "bg-danger-soft text-danger",
            },
            {
              key: "returned",
              label: "مرتجع",
              count: statusCounts.returned,
              color: "bg-danger-soft text-danger",
            },
          ].map((item) => (
            <button
              key={item.key ?? "all"}
              onClick={() => setStatusFilter(item.key ?? null)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                item.color,
                statusFilter === item.key ? "ring-2 ring-primary" : "",
              )}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>

        {/* قائمة الشحنات */}
        <div className="space-y-2">
          {(filteredShipments ?? []).length === 0 ? (
            <EmptyState
              Icon={Truck}
              title="لا توجد شحنات"
              hint="عندما تُنشأ شحنات لمتجرك، ستظهر هنا مع حالتها."
            />
          ) : (
            (filteredShipments ?? []).map((shipment) => (
              <ShipmentRow key={shipment.id} shipment={shipment} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function BadgeStatus({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: "bg-warning-soft text-warning",
    accepted: "bg-primary-soft text-accent-ink",
    picked_up: "bg-primary-soft text-accent-ink",
    in_transit: "bg-primary-soft text-accent-ink",
    delivered: "bg-success-soft text-success",
    failed: "bg-danger-soft text-danger",
    returned: "bg-danger-soft text-danger",
  };

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", variants[status])}>
      {SHIPMENT_STATUS_LABELS[status as keyof typeof SHIPMENT_STATUS_LABELS] ?? status}
    </span>
  );
}

function ShipmentRow({
  shipment,
}: {
  shipment: Shipment & { order?: { id: string; full_name: string; phone: string; total: number } };
}) {
  const order = shipment.order;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-semibold text-foreground">{order?.full_name ?? "عميل"}</div>
          <div className="text-sm text-muted-foreground">
            طلب #{order?.id?.slice(-6) ?? shipment.id.slice(-6)}
          </div>
        </div>
        <BadgeStatus status={shipment.status} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
        <div className="text-muted-foreground">الهاتف</div>
        <div className="font-semibold text-foreground">{order?.phone ?? "—"}</div>
        <div className="text-muted-foreground">المبلغ</div>
        <div className="font-semibold text-foreground">{order?.total ?? 0} دج</div>
        <div className="text-muted-foreground">الشركة</div>
        <div className="font-semibold text-foreground">{shipment.company_id?.slice(-4) ?? "—"}</div>
        <div className="text-muted-foreground">تاريخ الإنشاء</div>
        <div className="font-semibold text-foreground">
          {formatDate(shipment.created_at)}
        </div>
      </div>

      <div className="flex gap-2">
        {order?.id && (
          <Link
            to="/orders/$orderId"
            params={{ orderId: order.id }}
            className="flex-1 px-3 py-2 rounded-xl bg-primary text-accent-ink-foreground text-sm font-medium text-center"
          >
            عرض الطلب
          </Link>
        )}
      </div>
    </div>
  );
}
