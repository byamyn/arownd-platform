import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Truck, X, Clock, PackageCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useRealtimeSubscription } from "@/hooks/use-realtime";
import {
  fetchMyDeliveryCompany,
  fetchPendingShipmentsForCompany,
  fetchShipmentsByCompany,
  updateShipmentStatus,
  SHIPMENT_STATUS_LABELS,
  type Shipment,
  type ShipmentStatus,
} from "@/lib/delivery";
import { PageHeader } from "@/components/sooqy/page-header";
import { AppShell } from "@/components/sooqy/app-shell";
import { ErrorState } from "@/components/sooqy/error-state";
import { ConfirmDialog } from "@/components/sooqy/confirm-dialog";
import { translate } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { collectMerchantOrderCod } from "@/lib/sooqy";
import { DashboardLoadingSkeleton } from "@/components/sooqy/skeleton";

export const Route = createFileRoute("/delivery-dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة شركة التوصيل — Arownd" },
      {
        name: "description",
        content:
          "إدارة طلبات الشحن، قبولها أو رفضها، وتحديث حالات التوصيل لشركة التوصيل في Arownd.",
      },
    ],
  }),
  component: DeliveryDashboardPage,
});

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  pending: "bg-warning-soft text-warning border-warning/30",
  accepted: "bg-info-soft text-info border-info/30",
  picked_up: "bg-primary-soft text-accent-ink border-primary/30",
  in_transit: "bg-primary-soft text-accent-ink border-primary/30",
  delivered: "bg-success-soft text-success border-success/30",
  failed: "bg-danger-soft text-danger border-danger/30",
  returned: "bg-muted text-muted-foreground border-border",
  rejected: "bg-muted text-muted-foreground border-border",
};

function DeliveryDashboardPage() {
  const { user, ready } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [collectingCodFor, setCollectingCodFor] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<{
    id: string;
    decision: "accept" | "reject";
  } | null>(null);

  // جميع hooks تُستدعى دائمًا (ليس مشروطًا) لاحترام قواعد React Hooks
  const company = useQuery({
    queryKey: ["my-delivery-company", user?.id ?? ""],
    queryFn: () => fetchMyDeliveryCompany(user!.id),
    enabled: !!ready && !!user,
  });

  const pendingShipments = useQuery({
    queryKey: ["pending-shipments", company.data?.id ?? ""],
    queryFn: () => fetchPendingShipmentsForCompany(company.data!.id),
    enabled: !!ready && !!company.data?.is_approved,
  });

  const allShipments = useQuery({
    queryKey: ["all-shipments", company.data?.id ?? ""],
    queryFn: () => fetchShipmentsByCompany(company.data!.id),
    enabled: !!ready && !!company.data,
  });

  // تحديثات حية: شحنات جديدة/تغيرات (Supabase Realtime)
  useRealtimeSubscription({
    table: "shipments",
    filter: company.data?.id ? `company_id=eq.${company.data.id}` : undefined,
    queryKeys: [["pending-shipments"], ["all-shipments"]],
    enabled: !!ready && !!company.data,
  });

  const shipments: Shipment[] =
    activeTab === "pending" ? (pendingShipments.data ?? []) : (allShipments.data ?? []);

  // يطلب التأكيد عبر ConfirmDialog (لا حوارات المتصفح الأصلية)
  const handleDecision = (shipmentId: string, decision: "accept" | "reject") => {
    setPendingDecision({ id: shipmentId, decision });
  };

  const runDecision = async (shipmentId: string, decision: "accept" | "reject") => {
    try {
      await updateShipmentStatus(
        shipmentId,
        decision === "accept" ? "accepted" : "rejected",
        decision === "reject" ? "تم الرفض من قبل شركة التوصيل" : undefined,
      );
      toast.success(decision === "accept" ? "تم قبول طلب الشحن ✅" : "تم رفض طلب الشحن ❌");
      qc.invalidateQueries({ queryKey: ["pending-shipments"] });
      qc.invalidateQueries({ queryKey: ["all-shipments"] });
    } catch (error) {
      toast.error("تعذر تحديث الحالة. أعد المحاولة.");
    }
  };

  const handleStatusUpdate = async (shipmentId: string, status: ShipmentStatus) => {
    try {
      await updateShipmentStatus(shipmentId, status);
      toast.success(`تم تحديث الحالة إلى: ${SHIPMENT_STATUS_LABELS[status]} ✅`);
      qc.invalidateQueries({ queryKey: ["all-shipments"] });
      qc.invalidateQueries({ queryKey: ["pending-shipments"] });
    } catch (error) {
      toast.error("تعذر تحديث الحالة. أعد المحاولة.");
    }
  };

  const handleCollectCod = async (shipment: Shipment) => {
    if (shipment.status !== "delivered" || !shipment.merchant_order_id) {
      toast.error("لا يمكن تسجيل التحصيل قبل اكتمال تسليم الشحنة.");
      return;
    }
    if (shipment.cod_collection) {
      toast.info("تم تسجيل الدفع لهذا الطلب مسبقًا.");
      return;
    }

    setCollectingCodFor(shipment.id);
    try {
      await collectMerchantOrderCod(shipment.merchant_order_id);
      toast.success("تم تسجيل تحصيل المبلغ النقدي لهذا الطلب.");
      await qc.invalidateQueries({ queryKey: ["all-shipments"] });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذر تسجيل التحصيل. تحقق من حالة التسليم وصلاحية الحساب.",
      );
    } finally {
      setCollectingCodFor(null);
    }
  };

  if (!ready) return null;

  if (!user) {
    return (
      <div className="space-y-4 px-4 pt-16 text-center">
        <Truck className="mx-auto size-12 text-accent-ink" />
        <h1 className="text-2xl font-bold">تحتاج لدخول الحساب</h1>
        <p className="text-sm text-muted-foreground">لدخول لوحة شركة التوصيل، سجّل الدخول أولاً.</p>
        <Link
          to="/auth"
          search={{ redirect: "/delivery-dashboard" }}
          className="inline-flex min-h-[var(--control-height)] items-center justify-center rounded-[var(--radius-pill)] bg-primary px-6 py-3 font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          دخول
        </Link>
      </div>
    );
  }

  if (company.isLoading) {
    return <DashboardLoadingSkeleton cards={2} />;
  }

  if (company.isError) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 pt-6">
        <PageHeader title="لوحة شركة التوصيل" back="/" />
        <ErrorState
          scope="delivery-dashboard:company"
          error={company.error}
          onRetry={() => company.refetch()}
        />
      </div>
    );
  }

  if (!company.data) {
    return (
      <div className="space-y-4 px-4 pt-16 text-center">
        <AlertCircle className="mx-auto size-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">لا يوجد حساب شركة توصيل</h1>
        <p className="text-sm text-muted-foreground">
          لم يتم العثور على حساب شركة توصيل مرتبط بحسابك.
        </p>
        <Link
          to="/delivery-register"
          className="inline-flex min-h-[var(--control-height)] items-center justify-center rounded-[var(--radius-pill)] bg-primary px-8 py-3 font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          تسجيل شركة توصيل جديدة
        </Link>
      </div>
    );
  }

  if (!company.data.is_approved) {
    return (
      <div className="space-y-4 px-4 pt-16 text-center">
        <Clock className="mx-auto size-12 text-warning" />
        <h1 className="text-2xl font-bold">حسابك قيد المراجعة</h1>
        <p className="text-sm text-muted-foreground">
          تم إرسال طلب تسجيل شركتك ({company.data.company_name}) وسيتم تفعيله بعد مراجعة إدارة
          المنصة واعتماده.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          يمكنك متابعة حالة الطلب من خلال التواصل مع دعم المنصة.
        </p>
      </div>
    );
  }

  const activeShipmentsQuery = activeTab === "pending" ? pendingShipments : allShipments;

  if (activeShipmentsQuery.isLoading) {
    return <DashboardLoadingSkeleton cards={3} />;
  }

  if (activeShipmentsQuery.isError) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 pt-6">
        <PageHeader title="لوحة شركة التوصيل" subtitle={company.data.company_name} back="/" />
        <ErrorState
          scope="delivery-dashboard:shipments"
          error={activeShipmentsQuery.error}
          onRetry={() => activeShipmentsQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <AppShell width="wide" className="space-y-4 overflow-x-clip pt-3 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:space-y-5 sm:pt-5">
      <PageHeader title="لوحة شركة التوصيل" subtitle={company.data.company_name} back="/" />

      {/* بطاقة ملخص الشركة */}
      <section className="space-y-4 rounded-[var(--radius-card)] border border-border bg-card p-3.5 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">نظرة عامة</h2>
            <p className="text-xs text-muted-foreground">
              إدارة طلبات الشحن الخاصة بشركة {company.data.company_name}
            </p>
          </div>
          <BadgeCompany status={company.data.is_approved ? "active" : "pending"} />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
          <StatCard
            label="طلبات جديدة قيد الانتظار"
            value={pendingShipments.data?.length ?? 0}
            icon={PackageCheck}
            color="text-warning"
          />
          <StatCard
            label="إجمالي الشحنات"
            value={allShipments.data?.length ?? 0}
            icon={Truck}
            color="text-accent-ink"
          />
          <StatCard
            label="تم التسليم"
            value={allShipments.data?.filter((s) => s.status === "delivered").length ?? 0}
            icon={Check}
            color="text-success"
          />
          <StatCard
            label="تعذر التسليم"
            value={allShipments.data?.filter((s) => s.status === "failed").length ?? 0}
            icon={X}
            color="text-danger"
          />
        </div>
      </section>

      {/* التبويبات */}
      <section className="rounded-[var(--radius-card)] border border-border bg-card p-3 sm:p-4">
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-border pb-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={cn(
              "min-h-11 min-w-max shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold transition",
              activeTab === "pending"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            طلبات جديدة ({pendingShipments.data?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            aria-pressed={activeTab === "all"}\n            className={cn(
              "px-4 py-2 rounded-[var(--radius-control)] text-sm font-medium transition",
              activeTab === "all"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            جميع الشحنات ({allShipments.data?.length ?? 0})
          </button>
        </div>

        {activeTab === "pending" ? (
          <PendingShipmentsList shipments={shipments} onDecision={handleDecision} />
        ) : (
          <AllShipmentsList
            shipments={shipments}
            onStatusUpdate={handleStatusUpdate}
            onCollectCod={handleCollectCod}
            collectingCodFor={collectingCodFor}
          />
        )}
      </section>
      <ConfirmDialog
        open={pendingDecision !== null}
        title={translate("dlv_confirm_title")}
        message={
          pendingDecision?.decision === "accept"
            ? translate("dlv_confirm_accept")
            : translate("dlv_confirm_reject")
        }
        tone={pendingDecision?.decision === "reject" ? "danger" : "primary"}
        onCancel={() => setPendingDecision(null)}
        onConfirm={() => {
          const d = pendingDecision;
          setPendingDecision(null);
          if (d) void runDecision(d.id, d.decision);
        }}
      />
    </AppShell>
  );
}

function BadgeCompany({ status }: { status: "active" | "pending" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
        status === "active"
          ? "bg-green-soft text-green-soft-foreground"
          : "bg-amber-soft text-amber-soft-foreground",
      )}
    >
      {status === "active" ? "مفعل" : "قيد المراجعة"}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="min-h-[5.5rem] rounded-2xl border border-border bg-background p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="size-6 shrink-0" />
      </div>
    </div>
  );
}

function PendingShipmentsList({
  shipments,
  onDecision,
}: {
  shipments: Shipment[];
  onDecision: (id: string, decision: "accept" | "reject") => void;
}) {
  if (shipments.length === 0) {
    return (
      <div className="px-3 py-10 text-center sm:py-12">
        <PackageCheck className="mx-auto size-16 text-muted-foreground/50" />
        <h3 className="mt-3 text-lg font-bold">لا توجد طلبات شحن جديدة</h3>
        <p className="text-sm text-muted-foreground">
          عندما يرسل متجر طلب شحن إلى شركتك، سيظهر هنا لاتخاذ قرار بشأنه.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {shipments.map((shipment) => (
        <div key={shipment.id} className="rounded-2xl border border-border bg-card p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">طلب شحن #{shipment.id.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground truncate">
                الطلب رقم: {shipment.order_id.slice(0, 8)}
              </p>
              {shipment.recipient_name && (
                <p className="text-sm text-muted-foreground mt-1">
                  المستلم: {shipment.recipient_name}
                </p>
              )}
              {shipment.recipient_phone && (
                <p className="text-sm text-muted-foreground">الهاتف: {shipment.recipient_phone}</p>
              )}
              {shipment.delivery_address && (
                <p className="text-sm text-muted-foreground">
                  العنوان: {shipment.delivery_address}
                </p>
              )}
              {shipment.fee != null && (
                <p className="text-sm font-medium text-accent-ink mt-1">
                  الرسوم: {shipment.fee} دج
                </p>
              )}
            </div>
            <BadgeStatus status={shipment.status} />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => onDecision(shipment.id, "accept")}
              className="min-h-11 flex-1 rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
            >
              <Check className="ms-1.5 size-4" /> قبول
            </button>
            <button
              onClick={() => onDecision(shipment.id, "reject")}
              className="min-h-11 rounded-2xl bg-rose-soft px-4 py-2 text-sm font-bold text-rose-soft-foreground transition hover:bg-rose-soft/80"
            >
              <X className="ms-1.5 size-4" /> رفض
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AllShipmentsList({
  shipments,
  onStatusUpdate,
  onCollectCod,
  collectingCodFor,
}: {
  shipments: Shipment[];
  onStatusUpdate: (id: string, status: ShipmentStatus) => void;
  onCollectCod: (shipment: Shipment) => void;
  collectingCodFor: string | null;
}) {
  if (shipments.length === 0) {
    return (
      <div className="mt-6 text-center py-10">
        <Truck className="mx-auto size-16 text-muted-foreground/50" />
        <h3 className="mt-3 text-lg font-bold">لا توجد شحنات مسجلة</h3>
        <p className="text-sm text-muted-foreground">
          ستظهر الشحنات هنا عندما يختار المتاجر شركتك للتوصيل وتقبل الطلبات.
        </p>
      </div>
    );
  }

  const statusOptions: ShipmentStatus[] = [
    "picked_up",
    "in_transit",
    "delivered",
    "failed",
    "returned",
  ];

  return (
    <div className="mt-4 space-y-3">
      {shipments.map((shipment) => {
        const currentStatus = shipment.status as ShipmentStatus;
        const canUpdate =
          currentStatus === "accepted" ||
          currentStatus === "picked_up" ||
          currentStatus === "in_transit";

        return (
          <div key={shipment.id} className="rounded-[var(--radius-control)] border p-4 bg-card ">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">شحنة #{shipment.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground truncate">
                  الطلب رقم: {shipment.order_id.slice(0, 8)}
                </p>
                {shipment.recipient_name && (
                  <p className="text-sm text-muted-foreground mt-1">
                    المستلم: {shipment.recipient_name}
                  </p>
                )}
                {shipment.recipient_phone && (
                  <p className="text-sm text-muted-foreground">
                    الهاتف: {shipment.recipient_phone}
                  </p>
                )}
                {shipment.delivery_address && (
                  <p className="text-sm text-muted-foreground">
                    العنوان: {shipment.delivery_address}
                  </p>
                )}
                {shipment.fee != null && (
                  <p className="text-sm font-medium text-accent-ink mt-1">
                    الرسوم: {shipment.fee} دج
                  </p>
                )}
              </div>
              <BadgeStatus status={currentStatus} />
            </div>

            {currentStatus === "delivered" && shipment.merchant_order_id && (
              <div className="mt-4 rounded-[var(--radius-control)] border border-border bg-background p-3">
                {shipment.cod_collection ? (
                  <p className="text-sm font-semibold text-green-soft-foreground">
                    تم تسجيل تحصيل الدفع عند الاستلام
                    {" — " + shipment.cod_collection.amount.toLocaleString("ar-DZ") + " دج"}
                  </p>
                ) : (
                  <>
                    <p className="mb-2 text-sm font-semibold">الدفع النقدي عند الاستلام</p>
                    <p className="mb-3 text-xs text-muted-foreground">
                      سجّل التحصيل بعد استلام المبلغ من المستلم. يُسجّل المبلغ من بيانات الطلب على
                      الخادم.
                    </p>
                    <button
                      type="button"
                      disabled={collectingCodFor === shipment.id}
                      onClick={() => onCollectCod(shipment)}
                      className="min-h-11 w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
                    >
                      {collectingCodFor === shipment.id
                        ? "جارٍ تسجيل التحصيل..."
                        : "تأكيد استلام المبلغ نقدًا"}
                    </button>
                  </>
                )}
              </div>
            )}

            {canUpdate && (
              <div className="mt-4 flex flex-wrap gap-2">
                {statusOptions.map((status) => {
                  if (
                    (currentStatus === "accepted" && status !== "picked_up") ||
                    (currentStatus === "picked_up" && status !== "in_transit") ||
                    (currentStatus === "in_transit" &&
                      !["delivered", "failed", "returned"].includes(status))
                  )
                    return null;
                  return (
                    <button
                      key={status}
                      onClick={() => onStatusUpdate(shipment.id, status)}
                      className={cn(
                        "min-h-11 rounded-2xl border px-3 py-2 text-xs font-semibold transition",
                        STATUS_COLORS[status],
                      )}
                    >
                      {SHIPMENT_STATUS_LABELS[status]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BadgeStatus({ status }: { status: string }) {
  const label = SHIPMENT_STATUS_LABELS[status as ShipmentStatus] || status;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border",
        STATUS_COLORS[status as ShipmentStatus] || "border-border",
      )}
    >
      {label}
    </span>
  );
}
