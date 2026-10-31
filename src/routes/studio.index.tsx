import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  Clock,
  Eye,
  MapPin,
  Package,
  PackagePlus,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { showError, showSuccess } from "@/lib/feedback";
import { useTranslation } from "@/lib/i18n";
import { logNetError } from "@/lib/conn";
import { OrderStatusBadge } from "@/components/sooqy/badges";
import { useAuth } from "@/lib/auth";
import {
  becomeMerchant,
  fetchMyStore,
  fetchStoreOrderItems,
  fetchStoreReservations,
  merchantAddOfferImages,
  merchantConfirmAll,
  merchantConfirmReservation,
  merchantCreateStore,
  merchantDeleteOffer,
  merchantQuickAddProduct,
  merchantRemoveOfferImage,
  merchantReplaceOfferImage,
  merchantSetPrimaryImage,
  merchantToggleAvailability,
  merchantUpdateOffer,
  merchantUpdateOrderStatus,
  merchantUpdateProduct,
  fetchMyRoles,
  stockLevel,
  type OfferFull,
} from "@/lib/sooqy";
import { ImageUploader, type ImageUploaderItem } from "@/components/sooqy/image-uploader";
import { formatDA, geoErrorMessage, getStoreStatus, useGeo } from "@/lib/geo";
import {
  DEFAULT_CATEGORY_ID,
  MAIN_CATEGORIES,
  OTHER_CATEGORIES,
  childrenOf,
  parentOf,
  resolveCategoryId,
} from "@/lib/taxonomy";
import { DirectionsButton } from "@/components/sooqy/DirectionsButton";
import { ConfirmDialog } from "@/components/sooqy/confirm-dialog";
import { SideSheet } from "@/components/sooqy/side-sheet";
import { StudioProductRow } from "@/components/sooqy/studio-product-row";
import {
  MerchantOnboarding,
  type StoreForm,
  defaultStoreForm,
} from "@/components/sooqy/merchant-onboarding";
import { ErrorState } from "@/components/sooqy/error-state";
import { PageHeader } from "@/components/sooqy/page-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/studio/")({
  head: () => ({
    meta: [
      { title: "Arownd Merchant Studio — استوديو التاجر" },
      { name: "description", content: "أدر متجرك، منتجاتك، مخزونك وطلباتك بأسلوب احترافي." },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"offers" | "orders">("offers");
  const { t } = useTranslation();
  const [pendingDelete, setPendingDelete] = useState<OfferFull | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [storeForm, setStoreForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    wilaya_id: null as number | null,
    commune: "",
    address_line: "",
    open: "09:00",
    close: "18:00",
    latitude: null as number | null,
    longitude: null as number | null,
    category: null as string | null,
    subcategories: [] as string[],
  });
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: DEFAULT_CATEGORY_ID,
    brand: "",
    description: "",
    sizes: "",
    colors: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  // الطلب قيد التحديث — يمنع الإرسال المزدوج ويعرف أي بطاقة تُعطّل.
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [productFilter, setProductFilter] = useState<"all" | "low" | "out">("all");
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<OfferFull | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: DEFAULT_CATEGORY_ID,
    brand: "",
    description: "",
  });
  const [editImages, setEditImages] = useState<File[]>([]);
  const [editExistingImages, setEditExistingImages] = useState<ImageUploaderItem[]>([]);
  const [managingImageOfferId, setManagingImageOfferId] = useState<string | null>(null);
  const [managingImages, setManagingImages] = useState<ImageUploaderItem[]>([]);

  const roles = useQuery({ queryKey: ["my-roles"], queryFn: fetchMyRoles, enabled: !!user });
  const store = useQuery({ queryKey: ["my-store"], queryFn: fetchMyStore, enabled: !!user });
  const offers = useQuery({
    queryKey: ["my-store-offers", store.data?.id],
    queryFn: async () => {
      const sid = store.data?.id;
      if (!sid) return [];
      const data = await import("@/lib/sooqy").then((m) => m.getStoreOffers(sid));
      return data;
    },
    enabled: !!store.data,
  });
  const reservations = useQuery({
    queryKey: ["store-reservations", store.data?.id],
    queryFn: async () => {
      const sid = store.data?.id;
      if (!sid) return [];
      return import("@/lib/sooqy").then((m) => m.fetchStoreReservations(sid));
    },
    enabled: !!store.data,
  });
  const orders = useQuery({
    queryKey: ["store-orders", store.data?.id],
    queryFn: async () => {
      const sid = store.data?.id;
      if (!sid) return [];
      return import("@/lib/sooqy").then((m) => m.fetchStoreOrderItems(sid));
    },
    enabled: !!store.data,
  });
  const canManage = roles.data?.includes("merchant") || !!store.data;
  const dashboardError = offers.error ?? reservations.error ?? orders.error;

  if (!ready) return null;
  if (!user) {
    return <AuthGate onLogin={() => navigate({ to: "/auth", search: { redirect: "/studio" } })} />;
  }
  if (store.isLoading || roles.isLoading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-label="جارٍ تحميل استوديو التاجر"
      >
        <span className="size-8 animate-spin rounded-full border-2 border-accent-ink border-t-transparent" />
      </div>
    );
  }
  if (store.isError || roles.isError) {
    const error = store.error ?? roles.error;
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 pt-6">
        <PageHeader title="استوديو التاجر" back="/" />
        <ErrorState
          scope="studio:account"
          error={error}
          onRetry={async () => {
            await Promise.all([store.refetch(), roles.refetch()]);
          }}
        />
      </div>
    );
  }
  if (!canManage || !store.data) {
    return (
      <MerchantOnboarding
        onSubmit={async (input) => {
          await becomeMerchant(); // يضمن دور التاجر (idempotent) قبل إنشاء المتجر
          await merchantCreateStore(input);
          await qc.invalidateQueries({ queryKey: ["my-store"] });
          await store.refetch();
        }}
        form={storeForm}
        setForm={setStoreForm}
      />
    );
  }

  if (dashboardError) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 pt-6">
        <PageHeader title="استوديو التاجر" back="/" />
        <ErrorState
          scope="studio:dashboard-data"
          error={dashboardError}
          onRetry={async () => {
            await Promise.all([offers.refetch(), reservations.refetch(), orders.refetch()]);
          }}
        />
      </div>
    );
  }

  const refreshStock = async () => {
    if (!store.data) return;
    setBusy(true);
    try {
      const updated = await merchantConfirmAll(store.data.id);
      showSuccess(`${updated} منتج تم تحديثه اليوم`);
      await qc.invalidateQueries({ queryKey: ["my-store-offers", store.data.id] });
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };

  const confirmReservation = async () => {
    const clean = code.trim();
    if (!clean) {
      toast.error("اكتب كود الحجز أولاً.");
      return;
    }
    try {
      await merchantConfirmReservation(clean);
      showSuccess("تم تأكيد الاستلام ✅");
      setCode("");
      await qc.invalidateQueries({ queryKey: ["store-reservations", store.data?.id] });
    } catch (error) {
      showError(error);
    }
  };

  const addProduct = async () => {
    if (!store.data) return;
    const clean = productForm.name.trim();
    if (!clean || !productForm.price || !Number(productForm.stock)) {
      toast.error("املأ اسم المنتج والسعر والكمية.");
      return;
    }
    setBusy(true);
    try {
      const sizes = productForm.sizes
        .split(/[،,]/)
        .map((v) => v.trim())
        .filter(Boolean);
      const colors = productForm.colors
        .split(/[،,]/)
        .map((v) => v.trim())
        .filter(Boolean);
      await merchantQuickAddProduct(
        {
          storeId: store.data.id,
          name: clean,
          price: Number(productForm.price),
          stock: Number(productForm.stock),
          category: productForm.category,
          ...(productForm.brand.trim() ? { brand: productForm.brand.trim() } : {}),
          ...(productForm.description.trim()
            ? { description: productForm.description.trim() }
            : {}),
          ...(sizes.length ? { sizes } : {}),
          ...(colors.length ? { colors } : {}),
        },
        images.length ? images : null,
      );
      showSuccess("تمت إضافة المنتج بنجاح");
      setProductForm({
        name: "",
        price: "",
        stock: "",
        category: DEFAULT_CATEGORY_ID,
        brand: "",
        description: "",
        sizes: "",
        colors: "",
      });
      setImages([]);
      await qc.invalidateQueries({ queryKey: ["my-store-offers", store.data.id] });
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };

  const editDirty =
    !!editing &&
    (editForm.name !== editing.product.name ||
      editForm.price !== String(editing.price) ||
      editForm.stock !== String(editing.stock_quantity) ||
      editForm.category !== editing.product.category ||
      editForm.brand !== (editing.product.brand ?? "") ||
      editForm.description !== (editing.product.description ?? "") ||
      editImages.length > 0);
  // يمنع ضياع تعديلات غير محفوظة عند الإغلاق بالخطأ (سحب/خلفية/Escape).
  const requestCloseEdit = () => {
    if (editDirty) setConfirmDiscard(true);
    else setEditing(null);
  };

  const startEdit = (o: OfferFull) => {
    setEditing(o);
    setEditForm({
      name: o.product.name,
      price: String(o.price),
      stock: String(o.stock_quantity),
      category: o.product.category,
      brand: o.product.brand ?? "",
      description: o.product.description ?? "",
    });
    setEditImages([]);
    setEditExistingImages(
      (o.images ?? []).map((img) => ({
        file: null as unknown as File,
        preview: img.image_url,
        isPrimary: img.is_primary,
      })),
    );
  };

  const saveEdit = async () => {
    if (!editing) return;
    const clean = editForm.name.trim();
    if (!clean || !editForm.price || !Number(editForm.stock)) {
      toast.error("املأ اسم المنتج والسعر والكمية.");
      return;
    }
    setBusy(true);
    try {
      await merchantUpdateProduct(editing.product_id, {
        name: clean,
        description: editForm.description.trim() || null,
        brand: editForm.brand.trim() || null,
        category: editForm.category,
      });
      await merchantUpdateOffer(editing.id, {
        price: Number(editForm.price),
        stock_quantity: Number(editForm.stock),
      });

      // رفع الصور الجديدة (التي تحتوي على File) إن وجدت
      const newEditFiles = editExistingImages.map((i) => i.file).filter((f): f is File => !!f);
      if (newEditFiles.length) {
        await merchantAddOfferImages(editing.id, newEditFiles);
      }

      showSuccess("تم تحديث المنتج ✅");
      setEditing(null);
      setEditImages([]);
      setEditExistingImages([]);
      await qc.invalidateQueries({ queryKey: ["my-store-offers", store.data?.id] });
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };

  const removeEditImage = async (item: ImageUploaderItem) => {
    if (!editing || !item.id) return;
    try {
      await merchantRemoveOfferImage(item.id);
      setEditExistingImages((prev) => prev.filter((i) => i.id !== item.id));
      await qc.invalidateQueries({ queryKey: ["my-store-offers", store.data?.id] });
      showSuccess("تم حذف الصورة ✅");
    } catch (error) {
      showError(error, "feedback_upload_error");
    }
  };

  const setEditPrimaryImage = async (item: ImageUploaderItem) => {
    if (!editing || !item.id) return;
    try {
      await merchantSetPrimaryImage(item.id);
      setEditExistingImages((prev) => prev.map((i) => ({ ...i, isPrimary: i.id === item.id })));
      await qc.invalidateQueries({ queryKey: ["my-store-offers", store.data?.id] });
    } catch (error) {
      showError(error);
    }
  };

  const openImageManagement = (offer: OfferFull) => {
    setManagingImageOfferId(offer.id);
    setManagingImages(
      (offer.images ?? []).map((img) => ({
        id: img.id,
        file: null as unknown as File,
        preview: img.image_url,
        isPrimary: img.is_primary,
      })),
    );
  };

  const closeImageManagement = () => {
    setManagingImageOfferId(null);
    setManagingImages([]);
  };

  const removeManagingImage = async (item: ImageUploaderItem) => {
    if (!managingImageOfferId || !item.id) return;
    try {
      await merchantRemoveOfferImage(item.id);
      setManagingImages((prev) => prev.filter((i) => i.id !== item.id));
      await qc.invalidateQueries({ queryKey: ["my-store-offers", store.data?.id] });
      showSuccess("تم حذف الصورة ✅");
    } catch (error) {
      showError(error, "feedback_upload_error");
    }
  };

  const setManagingPrimaryImage = async (item: ImageUploaderItem) => {
    if (!managingImageOfferId || !item.id) return;
    try {
      await merchantSetPrimaryImage(item.id);
      setManagingImages((prev) => prev.map((i) => ({ ...i, isPrimary: i.id === item.id })));
      await qc.invalidateQueries({ queryKey: ["my-store-offers", store.data?.id] });
    } catch (error) {
      showError(error);
    }
  };

  const pendingCount =
    (reservations.data?.filter((r) => r.status === "pending").length ?? 0) +
    (orders.data?.filter((o) => o.order.status === "pending").length ?? 0);

  // الطلبات التي تحتاج إجراءً — تظهر في أعلى مساحة العمل
  const actionOrders = (orders.data ?? []).filter((o) => o.order.status === "pending");
  const actionReservations = (reservations.data ?? []).filter((r) => r.status === "pending");

  // ——— قائمة المنتجات: بحث/فلترة محليان (بلا استدعاءات إضافية) وعمليات سريعة ———
  const allOffers = offers.data ?? [];
  const lowCount = allOffers.filter((o) => stockLevel(o) === "low").length;
  const outCount = allOffers.filter((o) => stockLevel(o) === "out").length;
  const normalizedQuery = productQuery.trim().toLowerCase();
  const visibleOffers = allOffers.filter(
    (o) =>
      (productFilter === "all" || stockLevel(o) === productFilter) &&
      (!normalizedQuery ||
        o.product.name.toLowerCase().includes(normalizedQuery) ||
        (o.product.brand ?? "").toLowerCase().includes(normalizedQuery)),
  );

  const refreshOffers = () =>
    qc.invalidateQueries({ queryKey: ["my-store-offers", store.data?.id] });

  const changeStock = async (o: OfferFull, next: number) => {
    const clamped = Math.max(0, Math.min(9999, Math.floor(next)));
    if (rowBusyId || clamped === o.stock_quantity) return;
    setRowBusyId(o.id);
    try {
      // merchantUpdateOffer يجعل المنتج متوفرًا تلقائيًا عند كمية > 0؛
      // إن كان التاجر قد أخفاه عمدًا نعيد إخفاءه حتى لا يظهر دون قصد.
      const wasHidden = !o.is_available && o.stock_quantity > 0;
      await merchantUpdateOffer(o.id, { stock_quantity: clamped });
      if (wasHidden && clamped > 0) await merchantToggleAvailability(o.id, false);
      await refreshOffers();
    } catch {
      toast.error(t("studio_stock_failed"));
    } finally {
      setRowBusyId(null);
    }
  };

  const toggleOfferVisibility = async (o: OfferFull) => {
    if (rowBusyId) return;
    setRowBusyId(o.id);
    try {
      await merchantToggleAvailability(o.id, !o.is_available);
      await refreshOffers();
    } catch {
      toast.error(t("studio_toggle_failed"));
    } finally {
      setRowBusyId(null);
    }
  };

  return (
    <div className="space-y-5 px-4 pb-24 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-wide text-accent-ink">Arownd MERCHANT</p>
          <h1 className="text-h1">استوديو التاجر</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/settings"
            className="rounded-full bg-primary-soft p-2 text-accent-ink transition active:scale-95"
            aria-label="الإعدادات"
          >
            <Settings className="size-5" />
          </Link>
          <div className="rounded-full bg-primary-soft p-2 text-accent-ink-soft-foreground">
            <Store className="size-5" />
          </div>
        </div>
      </header>

      {/* بطاقة معلومات المتجر */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-soft">
            {store.data?.logo_url ? (
              <img
                src={store.data.logo_url}
                alt={`شعار ${store.data.name}`}
                className="size-full rounded-2xl object-cover"
              />
            ) : (
              <Store className="size-6 text-accent-ink" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-section">{store.data?.name}</p>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground flex items-center gap-1">
              {store.data?.commune ? (
                <>
                  <MapPin className="size-3 shrink-0 text-muted-foreground" />
                  {store.data.commune}
                </>
              ) : (
                "الموقع قيد الإعداد"
              )}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {(() => {
                const st = getStoreStatus(store.data?.opening_hours);
                return (
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      st.isOpen
                        ? "bg-success-soft text-success"
                        : "bg-neutral-200 text-neutral-500",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        st.isOpen ? "bg-success" : "bg-neutral-500",
                      )}
                    />
                    {st.isOpen ? "مفتوح الآن" : "مغلق حاليًا"}
                  </span>
                );
              })()}
              {store.data?.is_verified && (
                <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-accent-ink">
                  <ShieldCheck className="size-3" /> موثق
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link
            to="/studio/settings"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-soft py-2 text-xs font-bold text-accent-ink transition active:scale-95"
          >
            <Settings className="size-3.5" /> تخصيص المتجر
          </Link>
          <Link
            to="/stores/$storeId"
            params={{ storeId: store.data?.id ?? "" }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-soft py-2 text-xs font-bold text-accent-ink transition active:scale-95"
          >
            <Eye className="size-3.5" /> معاينة متجري
          </Link>
          {store.data?.latitude != null && store.data?.longitude != null && (
            <DirectionsButton
              lat={store.data.latitude}
              lng={store.data.longitude}
              label={store.data?.name ?? ""}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-primary-soft px-3 py-2 text-xs font-bold text-accent-ink"
            >
              <MapPin className="size-3.5" /> الموقع
            </DirectionsButton>
          )}
        </div>
      </section>

      {/* تنبيه المخزون: يظهر فقط عند وجود منتجات منخفضة/نافدة */}
      {lowCount + outCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setMode("offers");
            setProductFilter(outCount > 0 ? "out" : "low");
          }}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-start text-sm font-bold text-warning"
        >
          <span>{t("studio_low_stock_alert", { count: lowCount + outCount })}</span>
          <span className="shrink-0 rounded-full bg-warning px-3 py-1 text-xs text-white">
            {t("studio_low_stock_review")}
          </span>
        </button>
      )}

      {/* ملخص النشاط */}
      <section className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-border bg-card p-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-accent-ink">
            <Package className="size-4.5" />
          </span>
          <p className="mt-2 text-xl font-extrabold">{offers.data?.length ?? 0}</p>
          <p className="text-[10px] font-bold text-muted-foreground">المنتجات</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-accent-ink">
            <ShoppingBag className="size-4.5" />
          </span>
          <p className="mt-2 text-xl font-extrabold">
            {(orders.data?.filter((o) => o.order.status === "pending").length ?? 0) +
              (reservations.data?.filter((r) => r.status === "pending").length ?? 0)}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground">طلبات جديدة</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-accent-ink">
            <Eye className="size-4.5" />
          </span>
          <p className="mt-2 text-xl font-extrabold">
            {offers.data
              ? offers.data.reduce((sum, o) => sum + (o.product.view_count ?? 0), 0)
              : "—"}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground">المشاهدات</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-accent-ink">
            <Star className="size-4.5" />
          </span>
          <p className="mt-2 text-xl font-extrabold">
            {store.data?.rating ? Number(store.data.rating).toFixed(1) : "—"}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground">التقييم</p>
        </div>
      </section>

      {/* إكمال إعداد المتجر */}
      {(() => {
        const s = store.data;
        const items = [
          { label: "اسم المتجر", done: !!s?.name },
          { label: "صورة المتجر (الشعار)", done: !!s?.logo_url },
          { label: "إضافة أول منتج", done: (offers.data?.length ?? 0) > 0 },
          { label: "معلومات التواصل (الهاتف)", done: !!s?.phone },
        ];
        const done = items.filter((i) => i.done).length;
        const pct = Math.round((done / items.length) * 100);
        if (pct === 100) return null;
        return (
          <section className="rounded-2xl border border-accent-ink/25 bg-primary-soft/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold text-foreground">أكمل إعداد متجرك</h2>
              <span className="text-xs font-bold text-accent-ink">{pct}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/15">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <ul className="mt-3 space-y-1.5">
              {items.map((i) => (
                <li key={i.label} className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full",
                      i.done ? "bg-success text-white" : "border border-accent-ink/40 bg-card",
                    )}
                  >
                    {i.done && <Check className="size-2.5" />}
                  </span>
                  <span
                    className={
                      i.done ? "text-muted-foreground line-through" : "font-bold text-foreground"
                    }
                  >
                    {i.label}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <Link
                to="/studio/settings"
                className="flex-1 rounded-xl bg-primary py-2 text-center text-xs font-bold text-primary-foreground transition active:scale-95"
              >
                استكمال الإعداد
              </Link>
              <Link
                to="/stores/$storeId"
                params={{ storeId: s?.id ?? "" }}
                className="flex-1 rounded-xl border border-accent-ink/30 bg-card py-2 text-center text-xs font-bold text-accent-ink transition active:scale-95"
              >
                معاينة متجري
              </Link>
            </div>
          </section>
        );
      })()}

      {/* طلبات تحتاج إجراءً — أول ما يراه التاجر */}
      {(actionOrders.length > 0 || actionReservations.length > 0) && (
        <section className="space-y-2">
          <h2 className="px-1 text-section text-muted-foreground">يحتاج إجراءً الآن</h2>
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-danger/25 bg-card">
            {actionOrders.map((o) => (
              <Link
                key={o.order.id}
                to="/studio/orders/$orderId"
                params={{ orderId: o.order.id }}
                className="flex items-center gap-3 p-3.5 text-start transition active:bg-muted/40"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger">
                  <ShoppingBag className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-foreground">
                    طلب #{o.order.id.slice(0, 8)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {o.quantity} × {o.product_name}
                  </span>
                </span>
                <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
            {actionReservations.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setMode("orders")}
                className="flex w-full items-center gap-3 p-3.5 text-start transition active:bg-muted/40"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning">
                  <Clock className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-foreground">
                    حجز بانتظار التأكيد
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {r.offer?.product.name ?? "منتج"} · {r.quantity} قطعة
                  </span>
                </span>
                <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* زر الإجراء الأساسي */}
      <button
        onClick={() => setMode("offers")}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-bold text-primary-foreground shadow-soft transition active:scale-[0.98]"
      >
        <PackagePlus className="size-5" /> إضافة منتج
      </button>

      {/* قائمة إدارة المتجر */}
      <section className="space-y-2">
        <h2 className="px-1 text-section text-muted-foreground">إدارة المتجر</h2>
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          <button
            type="button"
            onClick={() => setMode("offers")}
            className="flex w-full items-center gap-3 p-3.5 text-start transition active:bg-neutral-100"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-accent-ink">
              <Package className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-foreground">منتجاتي</span>
              <span className="block text-xs text-muted-foreground">
                إضافة المنتجات وتعديلها وحذفها
              </span>
            </span>
            <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => setMode("orders")}
            className="flex w-full items-center gap-3 p-3.5 text-start transition active:bg-neutral-100"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-accent-ink">
              <ShoppingBag className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-foreground">الطلبات</span>
              <span className="block text-xs text-muted-foreground">
                إدارة الطلبات وتحديث حالاتها
              </span>
            </span>
            {pendingCount > 0 && (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
            <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
          </button>
          <Link
            to="/studio/settings"
            className="flex w-full items-center gap-3 p-3.5 text-start transition active:bg-neutral-100"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-accent-ink">
              <Store className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-foreground">معلومات المتجر</span>
              <span className="block text-xs text-muted-foreground">
                تعديل الاسم والوصف والصور والتصنيف
              </span>
            </span>
            <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
          </Link>
          <Link
            to="/studio/settings"
            className="flex w-full items-center gap-3 p-3.5 text-start transition active:bg-neutral-100"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-accent-ink">
              <Clock className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-foreground">الموقع وساعات العمل</span>
              <span className="block text-xs text-muted-foreground">إدارة الموقع وأوقات العمل</span>
            </span>
            <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
          </Link>
          <Link
            to="/stores/$storeId"
            params={{ storeId: store.data?.id ?? "" }}
            className="flex w-full items-center gap-3 p-3.5 text-start transition active:bg-neutral-100"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-accent-ink">
              <Eye className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-foreground">معاينة متجري</span>
              <span className="block text-xs text-muted-foreground">
                عرض الصفحة كما يراها العميل
              </span>
            </span>
            <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </div>
      </section>

      {/* تبويب المنتجات */}
      {mode === "offers" && (
        <section className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={refreshStock}
              disabled={busy}
              className="flex-1 rounded-2xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-50"
            >
              تحديث كل المنتجات اليوم
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 flex items-center gap-2 font-bold">
              <PackagePlus className="size-5 text-accent-ink" /> إضافة منتج في 30 ثانية
            </h2>
            <div className="grid gap-3">
              <input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="اسم المنتج"
                className="h-11 rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="السعر دج"
                  type="number"
                  min="0"
                  className="h-11 rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
                />
                <input
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  placeholder="الكمية"
                  type="number"
                  min="0"
                  className="h-11 rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <CategorySelect
                value={productForm.category}
                onChange={(category) => setProductForm({ ...productForm, category })}
              />
              <input
                value={productForm.brand}
                onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                placeholder="العلامة التجارية"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
              />
              <input
                value={productForm.sizes}
                onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })}
                placeholder="المقاسات: S, M, L"
                className="h-11 rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
              />
              <input
                value={productForm.colors}
                onChange={(e) => setProductForm({ ...productForm, colors: e.target.value })}
                placeholder="الألوان: أسود، أبيض"
                className="h-11 rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
              />
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="وصف المنتج"
                rows={2}
                className="rounded-xl border border-input bg-background px-3 py-2 outline-none transition focus:ring-2 focus:ring-primary/30"
              />
              <ImageUploader
                initialItems={[]}
                onChange={(items) => setImages(items.map((i) => i.file).filter(Boolean))}
                label="إضافة صور المنتج (حتى 10)"
              />
              <button
                onClick={addProduct}
                disabled={busy}
                className="rounded-2xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-50"
              >
                {busy ? "جارٍ الحفظ..." : "حفظ المنتج"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 font-bold">المنتجات الحالية</h2>

            <SideSheet
              open={!!editing}
              onOpenChange={(o) => {
                if (!o) requestCloseEdit();
              }}
              title={t("studio_edit_product_title")}
              description={t("studio_edit_product_desc")}
              footer={
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={busy}
                  className="btn-primary w-full py-3 disabled:opacity-50"
                >
                  {busy ? t("studio_saving") : t("studio_save_changes")}
                </button>
              }
            >
              <div className="grid gap-3">
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="اسم المنتج"
                  className="h-11 rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    placeholder="السعر دج"
                    type="number"
                    min="0"
                    className="h-11 rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    placeholder="الكمية"
                    type="number"
                    min="0"
                    className="h-11 rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <CategorySelect
                  value={editForm.category}
                  onChange={(category) => setEditForm({ ...editForm, category })}
                />
                <input
                  value={editForm.brand}
                  onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                  placeholder="العلامة التجارية"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="وصف المنتج"
                  rows={2}
                  className="rounded-xl border border-input bg-background px-3 py-2 outline-none transition focus:ring-2 focus:ring-primary/30"
                />
                <ImageUploader
                  initialItems={editExistingImages}
                  onChange={setEditExistingImages}
                  label="إدارة صور المنتج"
                  onRemove={removeEditImage}
                  onSetPrimary={setEditPrimaryImage}
                />
                {editImages.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {editImages.length} صورة جديدة سيتم رفعها
                  </p>
                )}
              </div>
            </SideSheet>

            {/* إدارة الصور لمنتج محدد */}
            <SideSheet
              open={!!managingImageOfferId}
              onOpenChange={(o) => {
                if (!o) closeImageManagement();
              }}
              title={t("studio_manage_images_title")}
              description={t("studio_manage_images_desc")}
            >
              <ImageUploader
                initialItems={managingImages}
                onChange={async (items) => {
                  const newFiles = items.filter((i) => i.file).map((i) => i.file);
                  if (newFiles.length && managingImageOfferId) {
                    try {
                      await merchantAddOfferImages(managingImageOfferId, newFiles);
                      await qc.invalidateQueries({
                        queryKey: ["my-store-offers", store.data?.id],
                      });
                      showSuccess("تم رفع الصور ✅");
                      closeImageManagement();
                    } catch (error) {
                      showError(error, "feedback_upload_error");
                    }
                    return;
                  }
                  setManagingImages(items);
                }}
                label="إدارة صور المنتج (حتى 10)"
                onRemove={removeManagingImage}
                onSetPrimary={setManagingPrimaryImage}
              />
            </SideSheet>

            <div className="mb-3 space-y-2">
              <input
                type="search"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder={t("studio_products_search_ph")}
                aria-label={t("studio_products_search_ph")}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
              />
              <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist">
                {(
                  [
                    { id: "all", label: t("studio_filter_all"), count: allOffers.length },
                    { id: "low", label: t("studio_filter_low"), count: lowCount },
                    { id: "out", label: t("studio_filter_out"), count: outCount },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={productFilter === f.id}
                    onClick={() => setProductFilter(f.id)}
                    className={cn(
                      "min-h-11 shrink-0 rounded-full border px-4 text-xs font-bold transition",
                      productFilter === f.id
                        ? "border-primary bg-primary text-accent-ink-foreground"
                        : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {t("studio_filter_label", { label: f.label, count: f.count })}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {visibleOffers.map((offer) => (
                <StudioProductRow
                  key={offer.id}
                  offer={offer}
                  busy={rowBusyId === offer.id}
                  onStockChange={(next) => void changeStock(offer, next)}
                  onToggle={() => void toggleOfferVisibility(offer)}
                  onEdit={() => startEdit(offer)}
                  onImages={() => openImageManagement(offer)}
                  onDelete={() => setPendingDelete(offer)}
                />
              ))}
              {!allOffers.length && (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  {t("studio_no_products")}
                </p>
              )}
              {allOffers.length > 0 && visibleOffers.length === 0 && (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  {t("studio_no_results")}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirmDiscard}
        title={t("studio_discard_title")}
        message={t("studio_discard_message")}
        confirmLabel={t("studio_discard_ok")}
        cancelLabel={t("studio_keep_editing")}
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          setEditing(null);
        }}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        title="حذف المنتج"
        message={`سيُحذف «${pendingDelete?.product.name ?? ""}» نهائيًا من متجرك ولن يظهر للعملاء بعد الآن. طلباتك السابقة تبقى محفوظة.`}
        confirmLabel="حذف نهائي"
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={async () => {
          if (!pendingDelete || deleting) return;
          setDeleting(true);
          try {
            await merchantDeleteOffer(pendingDelete.id);
            await qc.invalidateQueries({ queryKey: ["my-store-offers", store.data?.id] });
            showSuccess("تم حذف المنتج ✅");
            setPendingDelete(null);
          } catch (error) {
            showError(error);
          } finally {
            setDeleting(false);
          }
        }}
      />

      {mode === "orders" && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 font-bold">تأكيد الحجز</h2>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SQ-XXXX"
                className="h-11 flex-1 rounded-xl border bg-background px-3 outline-none transition focus:border-accent-ink focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={confirmReservation}
                className="rounded-xl bg-primary px-4 font-bold text-primary-foreground shadow-sm transition hover:brightness-95"
              >
                تأكيد
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 font-bold">الحجوزات</h2>
            <div className="space-y-2">
              {reservations.data?.map((r) => (
                <div key={r.id} className="rounded-2xl bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-bold text-accent-ink">{r.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.offer?.product?.name ?? "منتج محذوف"} · {r.quantity} وحدة
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[10px] font-bold",
                        r.status === "pending"
                          ? "bg-warning-soft text-warning"
                          : r.status === "collected"
                            ? "bg-success-soft text-success"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {r.status === "pending"
                        ? "في الانتظار"
                        : r.status === "collected"
                          ? "تم الاستلام"
                          : r.status === "cancelled"
                            ? "ملغي"
                            : "منتهي"}
                    </span>
                  </div>
                  {r.status === "pending" && (
                    <button
                      onClick={async () => {
                        try {
                          await merchantConfirmReservation(r.code);
                          showSuccess("تم تأكيد الاستلام ✅");
                          await qc.invalidateQueries({
                            queryKey: ["store-reservations", store.data?.id],
                          });
                        } catch (error) {
                          showError(error);
                        }
                      }}
                      className="mt-2 w-full rounded-xl bg-success-soft py-2 text-xs font-bold text-success transition hover:bg-success/25"
                    >
                      تأكيد الاستلام
                    </button>
                  )}
                </div>
              ))}
              {!reservations.data?.length && (
                <p className="text-sm text-muted-foreground">لا توجد حجوزات.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 font-bold">طلبات التوصيل</h2>
            {(() => {
              const soldTotal = (orders.data ?? []).reduce(
                (sum, i) => sum + i.unit_price * i.quantity,
                0,
              );
              const rate = store.data?.commission_rate ?? 7;
              const commission = Math.round((soldTotal * rate) / 100);
              return soldTotal > 0 ? (
                <div className="mb-3 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-neutral-100 p-3 text-center">
                    <p className="text-base font-bold">{formatDA(soldTotal)}</p>
                    <p className="text-[10px] text-muted-foreground">مبيعات المتجر</p>
                  </div>
                  <div className="rounded-2xl bg-neutral-100 p-3 text-center">
                    <p className="text-base font-bold">{formatDA(commission)}</p>
                    <p className="text-[10px] text-muted-foreground">عمولة Arownd ({rate}%)</p>
                  </div>
                  <div className="rounded-2xl bg-success-soft p-3 text-center">
                    <p className="text-base font-bold text-success">
                      {formatDA(soldTotal - commission)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">صافي المستحق</p>
                  </div>
                </div>
              ) : null;
            })()}
            <div className="space-y-2">
              {orders.data?.map((item) => (
                <div key={item.id} className="rounded-2xl bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">{item.order.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.order.commune} ·{" "}
                        {item.order.delivery_type === "home"
                          ? t("studio_delivery_home")
                          : t("studio_delivery_store")}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-foreground">
                        {item.product_name}
                        {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                      </p>
                    </div>
                    <OrderStatusBadge status={item.order.status} />
                  </div>
                  <div className="mt-2 flex gap-2">
                    {(["confirmed", "shipped", "delivered", "cancelled"] as const).map((status) => (
                      <button
                        key={status}
                        disabled={busyOrder === item.order.id}
                        onClick={async () => {
                          setBusyOrder(item.order.id);
                          try {
                            await merchantUpdateOrderStatus(item.order.id, status);
                            await qc.invalidateQueries({
                              queryKey: ["store-orders", store.data?.id],
                            });
                          } catch (err) {
                            toast.error(t("studio_status_update_failed"));
                            logNetError("studio:order-status", err);
                          } finally {
                            setBusyOrder(null);
                          }
                        }}
                        className="rounded-lg bg-neutral-100 px-2 py-1 text-[10px] font-bold transition hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                      >
                        {status === "confirmed"
                          ? t("studio_action_confirm")
                          : status === "shipped"
                            ? t("studio_action_ship")
                            : status === "delivered"
                              ? t("studio_action_deliver")
                              : t("studio_action_cancel")}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {!orders.data?.length && (
                <p className="text-sm text-muted-foreground">لا توجد طلبات بعد.</p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function AuthGate({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="space-y-4 px-4 pt-20 text-center">
      <Store className="mx-auto size-12 text-accent-ink" />
      <h1 className="text-2xl font-bold">لوحة التاجر</h1>
      <p className="text-sm text-muted-foreground">سجّل الدخول لعرض المخزون والحجوزات.</p>
      <button
        onClick={onLogin}
        className="rounded-2xl bg-primary px-8 py-3 font-bold text-primary-foreground"
      >
        دخول
      </button>
    </div>
  );
}

const CATEGORY_FIELD_CLS =
  "h-11 w-full rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30";

/**
 * منتقي تصنيف ثنائي المستوى: تصنيف رئيسي (أو تصنيف من «تصنيفات أخرى») ثم الفئة الفرعية.
 * ما يُخزَّن في `products.category` هو الفئة الفرعية، أو التصنيف الرئيسي إن لم تكن له فرعيات.
 */
function CategorySelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const resolved = resolveCategoryId(value);
  const main = parentOf(resolved)?.id ?? MAIN_CATEGORIES[0]!.id;
  const subs = childrenOf(main);
  const subValue = subs.some((c) => c.id === resolved) ? resolved : (subs[0]?.id ?? main);

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-2">
        <select
          value={main}
          aria-label="التصنيف الرئيسي"
          onChange={(e) => {
            const next = e.target.value;
            onChange(childrenOf(next)[0]?.id ?? next);
          }}
          className={CATEGORY_FIELD_CLS}
        >
          {MAIN_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
          <optgroup label="تصنيفات أخرى">
            {OTHER_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </optgroup>
        </select>
        <select
          value={subValue}
          aria-label="الفئة الفرعية"
          onChange={(e) => onChange(e.target.value)}
          className={CATEGORY_FIELD_CLS}
        >
          {subs.length === 0 ? (
            <option value={main}>لا توجد فئات فرعية</option>
          ) : (
            subs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))
          )}
        </select>
      </div>
      <p className="text-[11px] text-muted-foreground">تصنيف المنتج مستقل عن تصنيف متجرك.</p>
    </div>
  );
}
