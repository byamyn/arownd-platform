import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { fetchMyRoles } from "@/lib/sooqy";
import { useRealtimeSubscription } from "@/hooks/use-realtime";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/sooqy/page-header";
import { ErrorState } from "@/components/sooqy/error-state";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { formatDA } from "@/lib/geo";
import { goBackOrTo } from "@/lib/nav";

export const Route = createFileRoute("/admin/delivery-companies")({
  head: () => ({
    meta: [{ title: "إدارة شركات التوصيل — Arownd" }],
  }),
  component: AdminDeliveryCompaniesPage,
});

function AdminDeliveryCompaniesPage() {
  const { user, ready } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const { t } = useTranslation();
  const [assignmentSelection, setAssignmentSelection] = useState<Record<string, string>>({});
  const [assigningShipmentId, setAssigningShipmentId] = useState<string | null>(null);

  // user_roles تقبل عدة أدوار لكل مستخدم — استعلام مصفوفة بدل .single() الذي يفشل بـ406
  const roleQuery = useQuery({
    queryKey: ["admin-role", user?.id],
    queryFn: fetchMyRoles,
    enabled: !!user && ready,
  });

  const companiesQuery = useQuery({
    queryKey: ["admin-delivery-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_companies")
        .select("*, user_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && ready && !!roleQuery.data?.includes("admin"),
  });

  const coverageQuery = useQuery({
    queryKey: ["admin-delivery-coverage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_coverage_areas")
        .select("company_id, wilaya_id, communes")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!user && ready && !!roleQuery.data?.includes("admin"),
  });

  const unassignedShipmentsQuery = useQuery({
    queryKey: ["admin-unassigned-shipments"],
    queryFn: async () => {
      const { data: shipments, error } = await supabase
        .from("shipments")
        .select(
          "id, order_id, merchant_order_id, fee, created_at, recipient_name, recipient_phone, delivery_address",
        )
        .is("company_id", null)
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (!shipments.length) return [];

      const orderIds = [
        ...new Set(
          shipments
            .map((shipment) => shipment.order_id)
            .filter((id): id is string => typeof id === "string"),
        ),
      ];
      const merchantOrderIds = [
        ...new Set(
          shipments
            .map((shipment) => shipment.merchant_order_id)
            .filter((id): id is string => typeof id === "string"),
        ),
      ];
      const [
        { data: orders, error: ordersError },
        { data: merchantOrders, error: merchantOrdersError },
      ] = await Promise.all([
        supabase
          .from("orders")
          .select("id, full_name, phone, wilaya_id, commune, address_line")
          .in("id", orderIds),
        merchantOrderIds.length
          ? supabase.from("merchant_orders").select("id, store_id").in("id", merchantOrderIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (ordersError) throw ordersError;
      if (merchantOrdersError) throw merchantOrdersError;

      const storeIds = [...new Set((merchantOrders ?? []).map((item) => item.store_id))];
      const { data: stores, error: storesError } = storeIds.length
        ? await supabase.from("stores").select("id, name").in("id", storeIds)
        : { data: [], error: null };
      if (storesError) throw storesError;

      return shipments.map((shipment) => {
        const merchantOrder = (merchantOrders ?? []).find(
          (item) => item.id === shipment.merchant_order_id,
        );
        return {
          ...shipment,
          order: (orders ?? []).find((item) => item.id === shipment.order_id) ?? null,
          store: (stores ?? []).find((item) => item.id === merchantOrder?.store_id) ?? null,
        };
      });
    },
    enabled: !!user && ready && !!roleQuery.data?.includes("admin"),
  });

  // تحديثات حية: شركات التوصيل والشحنات التي تنتظر الإسناد.
  useRealtimeSubscription({
    table: "delivery_companies",
    queryKeys: [["admin-delivery-companies"]],
    enabled: !!user && ready && !!roleQuery.data?.includes("admin"),
  });
  useRealtimeSubscription({
    table: "shipments",
    queryKeys: [["admin-unassigned-shipments"]],
    enabled: !!user && ready && !!roleQuery.data?.includes("admin"),
  });

  if (!ready) return null;
  if (!user) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-h1 text-foreground">سجّل الدخول كمدير المنصة</h1>
        <Link to="/auth" search={{ redirect: "/admin/delivery-companies" }} className="btn-primary">
          دخول
        </Link>
      </div>
    );
  }

  if (roleQuery.isLoading)
    return (
      <div className="m-4 h-64 animate-pulse rounded-[var(--radius-card)] border border-border bg-card" />
    );

  if (roleQuery.isError) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 pt-6">
        <PageHeader title="إدارة شركات التوصيل" back="/admin" />
        <ErrorState
          scope="admin:delivery:role"
          error={roleQuery.error}
          onRetry={() => roleQuery.refetch()}
        />
      </div>
    );
  }

  // التحقق من دور المشرف
  if (!roleQuery.data?.includes("admin")) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldCheck className="size-12 text-muted-foreground" />
        <h1 className="text-h1 text-foreground">غير مسموح بالدخول</h1>
        <p className="text-body text-muted-foreground">هذه الصفحة مخصصة لمديري المنصة فقط.</p>
        <Link to="/" className="btn-primary mt-4">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  if (companiesQuery.isLoading) {
    return (
      <div className="m-4 h-64 animate-pulse rounded-[var(--radius-card)] border border-border bg-card" />
    );
  }

  if (companiesQuery.isError) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 pt-6">
        <PageHeader title="إدارة شركات التوصيل" back="/admin" />
        <ErrorState
          scope="admin:delivery:companies"
          error={companiesQuery.error}
          onRetry={() => companiesQuery.refetch()}
        />
      </div>
    );
  }

  const companies = companiesQuery.data ?? [];
  const coverageAreas = coverageQuery.data ?? [];
  const unassignedShipments = unassignedShipmentsQuery.data ?? [];

  const eligibleCompaniesFor = (shipment: (typeof unassignedShipments)[number]) => {
    const wilayaId = shipment.order?.wilaya_id;
    const commune = shipment.order?.commune?.trim().toLocaleLowerCase();
    if (!wilayaId) return [];
    return companies.filter((company) => {
      if (!company.is_approved) return false;
      return coverageAreas.some((area) => {
        if (area.company_id !== company.id || area.wilaya_id !== wilayaId) return false;
        const communes = area.communes ?? [];
        return (
          communes.length === 0 ||
          communes.some((areaCommune) => areaCommune.trim().toLocaleLowerCase() === commune)
        );
      });
    });
  };

  const assignShipment = async (shipmentId: string) => {
    const companyId = assignmentSelection[shipmentId];
    if (!companyId || assigningShipmentId) return;
    setAssigningShipmentId(shipmentId);
    const rpc = supabase.rpc as unknown as (
      fn: string,
      args: { _shipment_id: string; _company_id: string },
    ) => Promise<{ error: unknown }>;
    try {
      const { error } = await rpc("admin_assign_shipment_company", {
        _shipment_id: shipmentId,
        _company_id: companyId,
      });
      if (error) throw error;
      toast.success(t("admin_assign_company_success"));
      setAssignmentSelection((current) => {
        const next = { ...current };
        delete next[shipmentId];
        return next;
      });
      await qc.invalidateQueries({ queryKey: ["admin-unassigned-shipments"] });
    } catch {
      toast.error(t("admin_assign_company_failed"));
    } finally {
      setAssigningShipmentId(null);
    }
  };

  const handleToggleApproval = async (id: string, current: boolean) => {
    const { error } = await supabase.rpc("admin_set_delivery_company_approval", {
      _company_id: id,
      _is_approved: !current,
    });
    if (error) {
      toast.error("تعذر تحديث حالة الاعتماد");
      return;
    }
    toast.success(`تم ${!current ? "اعتماد" : "إلغاء اعتماد"} الشركة بنجاح`);
    qc.invalidateQueries({ queryKey: ["admin-delivery-companies"] });
  };

  return (
    <div className="space-y-4 px-4 pt-4">
      <header className="flex items-center gap-2 py-1">
        <button
          type="button"
          onClick={() => goBackOrTo(router, "/admin")}
          aria-label="رجوع"
          className="icon-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowRight className="size-5" />
        </button>
        <h1 className="text-h1 text-foreground">إدارة شركات التوصيل</h1>
      </header>

      <section className="space-y-3 rounded-[var(--radius-card)] border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-section font-bold text-foreground">
            {t("admin_unassigned_shipments_heading")}
          </h2>
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-accent-ink">
            {unassignedShipments.length}
          </span>
        </div>
        {unassignedShipmentsQuery.isLoading || coverageQuery.isLoading ? (
          <div className="h-24 animate-pulse rounded-[var(--radius-control)] bg-muted" />
        ) : unassignedShipmentsQuery.isError || coverageQuery.isError ? (
          <ErrorState
            scope="admin:delivery:unassigned"
            error={unassignedShipmentsQuery.error ?? coverageQuery.error}
            onRetry={() => {
              void unassignedShipmentsQuery.refetch();
              void coverageQuery.refetch();
            }}
          />
        ) : unassignedShipments.length === 0 ? (
          <p className="rounded-[var(--radius-control)] bg-background p-4 text-sm text-muted-foreground">
            {t("admin_unassigned_shipments_empty")}
          </p>
        ) : (
          <div className="space-y-3">
            {unassignedShipments.map((shipment) => {
              const eligibleCompanies = eligibleCompaniesFor(shipment);
              return (
                <article
                  key={shipment.id}
                  className="space-y-3 rounded-[var(--radius-control)] border border-border bg-background p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-bold text-foreground">
                        {shipment.store?.name ?? t("orders_store_quote_heading")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("admin_shipment_recipient")}:{" "}
                        {shipment.recipient_name ?? shipment.order?.full_name ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("admin_shipment_location")}: {shipment.order?.commune ?? "—"} ·{" "}
                        {shipment.order?.wilaya_id ?? "—"}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-accent-ink">
                      {formatDA(Number(shipment.fee ?? 0))}
                    </p>
                  </div>
                  {eligibleCompanies.length > 0 ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        aria-label={`${t("admin_assign_company_placeholder")} — ${shipment.store?.name ?? t("orders_store_quote_heading")}`}
                        value={assignmentSelection[shipment.id] ?? ""}
                        onChange={(event) =>
                          setAssignmentSelection((current) => ({
                            ...current,
                            [shipment.id]: event.target.value,
                          }))
                        }
                        className="min-h-[var(--control-height)] min-w-0 flex-1 rounded-[var(--radius-control)] border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">{t("admin_assign_company_placeholder")}</option>
                        {eligibleCompanies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.company_name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={
                          !assignmentSelection[shipment.id] || assigningShipmentId === shipment.id
                        }
                        onClick={() => void assignShipment(shipment.id)}
                        className="min-h-[var(--control-height)] rounded-[var(--radius-control)] bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {assigningShipmentId === shipment.id
                          ? t("studio_saving")
                          : t("admin_assign_company_action")}
                      </button>
                    </div>
                  ) : (
                    <p className="rounded-lg bg-warning-soft p-3 text-xs leading-relaxed text-warning">
                      {t("admin_no_coverage_company")}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="rounded-[var(--radius-card)] border border-border bg-card p-4">
        <p className="text-body text-muted-foreground mb-4">
          قائمة شركات التوصيل المسجلة. اعتمد الشركات لتتمكن من استقبال طلبات الشحن داخل التطبيق.
        </p>

        {companies?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">لا توجد شركات توصيل مسجلة بعد.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(companies ?? []).map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-border bg-background p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex shrink-0 items-center justify-center size-8 rounded-full bg-primary/10 text-accent-ink">
                    <UserPlus className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {company.company_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {company.contact_phone} · {company.email ?? "—"}
                    </p>
                    {company.license_number && (
                      <p className="text-xs text-muted-foreground truncate">
                        السجل التجاري: {company.license_number}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeStatus isApproved={company.is_approved} />
                  <button
                    type="button"
                    aria-label={`${company.is_approved ? "إلغاء اعتماد" : "اعتماد"} ${company.company_name}`}
                    onClick={() => handleToggleApproval(company.id, company.is_approved)}
                    className={cn(
                      "min-h-11 rounded-[var(--radius-control)] px-3 py-2 text-caption font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ",
                      company.is_approved
                        ? "bg-primary text-accent-ink-foreground hover:bg-primary/90"
                        : "bg-primary/10 text-accent-ink hover:bg-primary",
                    )}
                  >
                    {company.is_approved ? "إلغاء الاعتماد" : "اعتماد"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link to="/" className="btn-secondary w-full">
        <ArrowRight className="size-4" /> العودة للرئيسية
      </Link>
    </div>
  );
}

function BadgeStatus({ isApproved }: { isApproved: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isApproved ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
      )}
    >
      {isApproved ? "معتمد" : "قيد المراجعة"}
    </span>
  );
}
