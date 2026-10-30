import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BellRing,
  Check,
  ChevronLeft,
  CreditCard,
  Home,
  MapPin,
  PackageCheck,
  RotateCcw,
  Share2,
  ShoppingBag,
  Truck,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useBag } from "@/lib/bag";
import { translate, useTranslation } from "@/lib/i18n";
import { evaluateBag } from "@/lib/bag-check";
import { track } from "@/lib/analytics";
import { formatDA } from "@/lib/geo";
import {
  createOrderWithDelivery,
  getOffersByIds,
  isValidDzPhone,
  normalizePhone,
  primaryImage,
} from "@/lib/sooqy";
import { getShippingFee, type DeliveryType } from "@/lib/shipping";
import { fetchApprovedDeliveryCompanies } from "@/lib/delivery";
import { WilayaSelect } from "@/components/sooqy/WilayaSelect";
import { PageHeader } from "@/components/sooqy/page-header";
import { AppShell } from "@/components/sooqy/app-shell";
import { StickyActionBar } from "@/components/sooqy/sticky-action-bar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: translate("checkout_title") },
      { name: "description", content: translate("checkout_description") },
    ],
  }),
  component: CheckoutPage,
});

type PaymentMethod = "cod" | "baridimob";
const STEP_KEYS = ["checkout_step_items", "checkout_step_address", "checkout_step_delivery", "checkout_step_payment"] as const;

function CheckoutPage() {
  const { user, ready } = useAuth();
  const bag = useBag();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<OrderSnapshot | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("home");
  const [wilayaId, setWilayaId] = useState<number | null>(null);
  const [commune, setCommune] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [deliveryCompanyId, setDeliveryCompanyId] = useState<string | null>(null);
  const deliveryCompanies = useQuery({
    queryKey: ["delivery-companies"],
    queryFn: fetchApprovedDeliveryCompanies,
    enabled: deliveryType === "home",
  });
  const [fullName, setFullName] = useState(user?.user_metadata?.["full_name"] ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (bag.items.length > 0) track("begin_checkout", { count: bag.items.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const offers = useQuery({
    queryKey: ["checkout-offers", bag.items],
    queryFn: () => getOffersByIds(bag.items.map((i) => i.offerId)),
    enabled: bag.items.length > 0,
  });
  const rows = bag.items.map((item) => ({
    ...item,
    offer: offers.data?.find((offer) => offer.id === item.offerId),
  }));
  // نفس التقييم المستخدَم في السلة — مصدر واحد للحقيقة.
  const evaluation = evaluateBag(bag.items, offers.data, lang);
  const subtotal = evaluation.subtotal;
  const shippingFee = wilayaId ? getShippingFee(wilayaId, deliveryType) : 0;
  const total = subtotal + shippingFee;

  // منتجات لم تعد متوفرة: محذوفة من المتجر، أو غير متاحة، أو كميتها غير كافية
  const problems = evaluation.rows.filter((r) => r.issue);
  // تغيّر السعر — تحذير غير حاجب: العميل يرى السعر الجديد قبل التأكيد.
  const priceChanges = evaluation.rows.filter((r) =>
    r.issues.some((i) => i.kind === "price_changed"),
  );

  const stepValid: Record<number, boolean> = {
    0: bag.items.length > 0 && !!offers.data && problems.length === 0,
    1: !!wilayaId && !!commune.trim() && !!fullName.trim() && isValidDzPhone(phone.trim()),
    2: true,
    3: deliveryType === "desk" || !!address.trim(), // عنوان التوصيل مطلوب عند التوصيل للمنزل
  };

  if (!ready) return null;
  if (!user) {
    return (
      <div className="space-y-4 px-4 pt-16 text-center">
        <PackageCheck className="mx-auto size-12 text-accent-ink" />
        <h1 className="text-h1 text-foreground">{t("checkout_login_required")}</h1>
        <p className="text-sm text-muted-foreground">{t("checkout_login_hint")}</p>
        <Link to="/auth" search={{ redirect: "/checkout" }} className="btn-primary w-full py-2">
          دخول
        </Link>
      </div>
    );
  }
  if (bag.items.length === 0 && !orderId) {
    return (
      <div className="space-y-4 px-4 pt-16 text-center">
        <PackageCheck className="mx-auto size-12 text-accent-ink" />
        <h1 className="text-h1 text-foreground">{t("checkout_empty_title")}</h1>
        <Link to="/explore" className="btn-primary w-full py-2">
          تصفّح المنتجات
        </Link>
      </div>
    );
  }

  const placeOrder = async () => {
    if (submitting) return; // منع إنشاء طلبات مكررة عند النقر المتكرر
    if (!stepValid[3]) {
      toast.error(t("checkout_fill_required"));
      return;
    }
    setSubmitting(true);
    try {
      const id = await createOrderWithDelivery(
        bag.items,
        deliveryType,
        wilayaId!,
        commune.trim(),
        paymentMethod,
        null, // لا وصل دفع — الدفع عند الاستلام فقط حاليًا
        { fullName: fullName.trim(), phone: normalizePhone(phone.trim()), address: address.trim() },
        deliveryCompanyId ?? undefined,
      );
      setOrderId(id);
      // لقطة الطلب تُلتقط قبل إفراغ السلة — تغذّي شاشة الإغلاق (إعادة الطلب، التقييم).
      setSnapshot({
        orderId: id,
        total,
        itemCount: bag.items.length,
        storeName: rows.find((r) => r.offer)?.offer?.store.name ?? null,
        productId: rows.find((r) => r.offer)?.offer?.product.id ?? null,
        items: bag.items.map((i) => ({
          offerId: i.offerId,
          quantity: i.quantity,
          options: i.options,
        })),
      });
      bag.clear();
      qc.clear();
      track("place_order", { total, paymentMethod, deliveryType, wilayaId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("checkout_send_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (orderId) {
    return (
      <SuccessScreen
        orderId={orderId}
        snapshot={snapshot}
        onReorder={() => {
          // «اطلب مجددًا» — نعيد العناصر نفسها إلى السلة بنقرة واحدة.
          snapshot?.items.forEach((i) => bag.add(i));
          toast.success(t("close_reorder"));
          navigate({ to: "/bag" });
        }}
      />
    );
  }

  const goNext = () => {
    if (!stepValid[step]) {
      toast.error(
        step === 0
          ? offers.isLoading
            ? t("checkout_verifying")
            : offers.isError
              ? t("checkout_verify_failed")
              : t("checkout_out_of_stock")
          : step === 1
            ? isValidDzPhone(phone.trim())
              ? t("checkout_address_required")
              : t("checkout_phone_invalid")
            : deliveryType === "home"
              ? t("checkout_address_detail_required")
              : t("checkout_fill_required_short"),
      );
      return;
    }
    if (step === 3) {
      placeOrder();
    } else {
      setStep(step + 1);
      // قفزة فورية لأعلى النموذج عند الانتقال بين الخطوات (لا تمرير ناعم)
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  return (
    <AppShell className="space-y-5 pb-32 pt-5">
      <PageHeader title={t("checkout_heading")} subtitle={t("checkout_subtitle")} />

      {/* شريط التقدم */}
      <div className="flex items-center gap-1.5">
        {STEP_KEYS.map((key, i) => (
          <div key={key} className="flex-1">
            <button
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={cn(
                "flex w-full items-center gap-1.5 rounded-full px-2 py-1.5 text-[11px] font-bold transition",
                i === step
                  ? "bg-primary text-accent-ink-foreground"
                  : i < step
                    ? "bg-primary/15 text-accent-ink"
                    : "bg-neutral-100 text-neutral-400",
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full text-[9px]",
                  i < step ? "bg-primary text-accent-ink-foreground" : "bg-background/60",
                )}
              >
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>
              <span className="hidden min-w-0 truncate sm:inline">{t(key)}</span>
            </button>
          </div>
        ))}
      </div>

      {step === 0 && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShoppingBag className="size-5 text-accent-ink" />
            <h2 className="text-section text-foreground">{t("checkout_your_items", { count: bag.count })}</h2>
          </div>
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.offerId} className="flex gap-3 rounded-2xl bg-background p-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {row.offer && primaryImage(row.offer.images) && (
                    <img
                      src={primaryImage(row.offer.images)!}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold">
                    {row.offer?.product.name ?? "..."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.offer?.store.name} · {t("checkout_quantity", { count: row.quantity })}
                  </p>
                </div>
                <p className="text-sm font-bold">
                  {formatDA((row.offer?.price ?? 0) * row.quantity)}
                </p>
              </div>
            ))}
          </div>
          {offers.isLoading && (
            <p className="mt-3 text-xs text-muted-foreground">{t("checkout_verifying_short")}</p>
          )}
          {offers.isError && (
            <button
              type="button"
              onClick={() => offers.refetch()}
              className="mt-3 w-full rounded-xl bg-danger-soft py-2 text-xs font-bold text-danger"
            >
              {t("checkout_verify_failed_short")}
            </button>
          )}
          {problems.length > 0 && (
            <div className="mt-3 rounded-2xl bg-danger-soft p-3 text-xs font-semibold leading-relaxed text-danger">
              {t("checkout_problems_title")}
              <ul className="mt-1 list-inside list-disc">
                {problems.map((p) => (
                  <li key={p.item.offerId}>
                    {p.offer ? `${p.offer.product.name} — ${p.issue?.message}` : p.issue?.message}
                  </li>
                ))}
              </ul>
              {t("checkout_problems_hint")}
            </div>
          )}
          {priceChanges.length > 0 && (
            <div className="mt-3 rounded-2xl bg-warning-soft p-3 text-xs font-semibold leading-relaxed text-warning">
              {t("checkout_price_changed_title")}
              <ul className="mt-1 list-inside list-disc">
                {priceChanges.map((p) => (
                  <li key={p.item.offerId}>
                    {p.offer?.product.name ?? p.item.name} —{" "}
                    {p.issues.find((i) => i.kind === "price_changed")?.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link
            to="/bag"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-accent-ink"
          >
            {t("checkout_edit_bag")} <ChevronLeft className="size-3.5" />
          </Link>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4 rounded-3xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-accent-ink" />
            <h2 className="text-section text-foreground">{t("checkout_address_heading")}</h2>
          </div>
          <WilayaSelect value={wilayaId} onChange={setWilayaId} required className="h-12 w-full" />
          <input
            value={commune}
            onChange={(e) => setCommune(e.target.value)}
            placeholder={t("checkout_commune_placeholder")}
            required
            className="h-12 w-full rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
          />
          <div className="space-y-3 rounded-2xl bg-background p-3">
            <p className="text-xs font-bold text-muted-foreground">{t("checkout_buyer_data")}</p>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("checkout_name_placeholder")}
              required
              className="h-12 w-full rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("checkout_phone_placeholder")}
              required
              inputMode="tel"
              className="h-12 w-full rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4 rounded-3xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <Truck className="size-5 text-accent-ink" />
            <h2 className="text-section text-foreground">{t("checkout_delivery_heading")}</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                {
                  id: "home",
                  label: t("checkout_delivery_home"),
                  icon: <Home className="size-5" />,
                  fee: wilayaId ? getShippingFee(wilayaId, "home") : null,
                },
                {
                  id: "desk",
                  label: "استلام من المكتب",
                  icon: <MapPin className="size-5" />,
                  fee: 0,
                },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setDeliveryType(option.id)}
                className={cn(
                  "rounded-2xl border p-3 text-sm font-bold transition",
                  deliveryType === option.id
                    ? "border-accent-ink bg-primary-soft text-accent-ink-soft-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {option.icon}
                {option.label}
                <span className="mt-1 block text-[11px] font-medium opacity-70">
                  {option.fee == null
                    ? "يُحدد حسب الولاية"
                    : option.fee === 0
                      ? "مجاني"
                      : formatDA(option.fee)}
                </span>
              </button>
            ))}
          </div>
          {deliveryType === "home" && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  شركة التوصيل (اختياري)
                </label>
                <select
                  value={deliveryCompanyId ?? ""}
                  onChange={(e) => setDeliveryCompanyId(e.target.value || null)}
                  className="h-12 w-full rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">— اختر شركة توصيل —</option>
                  {deliveryCompanies.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
                {deliveryCompanies.isLoading && (
                  <p className="text-xs text-muted-foreground">جارٍ تحميل الشركات...</p>
                )}
                {deliveryCompanies.data?.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    لا توجد شركات توصيل معتمدة حالياً.
                  </p>
                )}
              </div>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="عنوان التوصيل التفصيلي (مطلوب للتوصيل للمنزل)"
                rows={3}
                className="w-full rounded-xl border bg-background px-3 py-2 outline-none transition focus:border-accent-ink focus:ring-2 focus:ring-primary/30"
              />
            </>
          )}
          <p className="flex items-start gap-2 rounded-2xl bg-primary-soft/70 p-3 text-xs leading-relaxed text-muted-foreground">
            <Truck className="mt-0.5 size-4 shrink-0 text-accent-ink" />
            رسوم التوصيل تُحسب حسب الولاية وتظهر شفافة في الملخص أسفل الشاشة.
          </p>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-3 rounded-3xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-accent-ink" />
            <h2 className="text-section text-foreground">طريقة الدفع</h2>
          </div>
          {(
            [
              { id: "cod", label: "الدفع عند الاستلام", icon: CreditCard, soon: false },
              { id: "baridimob", label: "BaridiMob (بريدي موب)", icon: Upload, soon: true },
            ] as const
          ).map(({ id, label, icon: Icon, soon }) => (
            <button
              key={id}
              type="button"
              disabled={soon}
              aria-disabled={soon}
              onClick={() => {
                if (soon) {
                  toast.info(t("checkout_payment_soon_toast"));
                  return;
                }
                setPaymentMethod(id);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border p-3 text-right transition",
                soon
                  ? "cursor-not-allowed border-dashed border-border bg-neutral-200 opacity-70"
                  : paymentMethod === id
                    ? "border-accent-ink bg-primary-soft"
                    : "border-border bg-card",
              )}
            >
              <span className="flex items-center gap-2 font-bold">
                <Icon className="size-4" />
                {label}
              </span>
              {soon ? (
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                  {t("checkout_soon")}
                </span>
              ) : paymentMethod === id ? (
                <Check className="size-4 text-accent-ink" />
              ) : null}
            </button>
          ))}
          <div className="flex w-full items-center justify-between rounded-2xl border border-dashed p-3 text-right opacity-60">
            <span className="flex items-center gap-2 font-bold">
              <CreditCard className="size-4" />
              {t("checkout_payment_card")}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold">{t("checkout_soon")}</span>
          </div>
          <p className="rounded-2xl bg-primary-soft/70 p-3 text-xs leading-relaxed text-muted-foreground">
            متاح حاليًا <span className="font-bold text-foreground">الدفع عند الاستلام</span> فقط.
            الدفع عبر بريدي موب والبطاقة قيد التطوير وسيُفعّل بعد اختباره.
          </p>
        </section>
      )}

      {/* الملخص الدائم + زر المتابعة */}
      <StickyActionBar>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-muted-foreground">
              {step < 3 ? t("checkout_total_label") : t("checkout_final_total_label")}
            </p>
            <p className="text-price text-accent-ink">
              {formatDA(total)}
              {step >= 1 && wilayaId && (
                <span className="mr-1 text-[11px] font-medium text-muted-foreground">
                  ({t("checkout_delivery_cost", { cost: formatDA(shippingFee) })})
                </span>
              )}
            </p>
          </div>
          <button
            disabled={submitting}
            onClick={goNext}
            className="flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground transition disabled:opacity-45 active:scale-[0.98]"
          >
            {submitting ? t("checkout_sending") : step === 3 ? t("checkout_confirm_order") : t("checkout_next")}
          </button>
        </div>
      </StickyActionBar>
    </AppShell>
  );
}

/**
 * لقطة الطلب — تُحفظ قبل إفراغ السلة، وتغذّي شاشة الإغلاق.
 */
type OrderSnapshot = {
  orderId: string;
  total: number;
  itemCount: number;
  storeName: string | null;
  productId: string | null;
  items: { offerId: string; quantity: number; options: Record<string, string> }[];
};

function SuccessScreen({
  orderId,
  snapshot,
  onReorder,
}: {
  orderId: string;
  snapshot: OrderSnapshot | null;
  onReorder: () => void;
}) {
  const trackCode = orderId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const { t } = useTranslation();

  const share = async () => {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/orders/${orderId}` : orderId;
    const text = `${t("checkout_success_title")} — ${trackCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success(t("close_copied"));
    } catch {
      // ألغى المستخدم المشاركة — لا نُظهر خطأ.
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center gap-4 px-6 py-10 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-success-soft text-4xl">
        <PackageCheck className="size-10 text-success" />
      </div>
      <div>
        <h1 className="text-h1 text-foreground">{t("checkout_success_title")}</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t("checkout_success_hint")}
        </p>
      </div>

      {/* رمز التتبع */}
      <div className="w-full max-w-xs rounded-2xl bg-card py-4">
        <p className="text-[11px] opacity-70 text-muted-foreground">{t("checkout_tracking_code")}</p>
        <p className="font-mono text-2xl font-bold tracking-[0.3em] text-accent-ink">{trackCode}</p>
      </div>

      {/* ملخّص الطلب — المتجر والقطع والإجمالي */}
      {snapshot && (
        <div className="w-full max-w-xs space-y-2 rounded-2xl border border-border bg-card p-4 text-start">
          {snapshot.storeName && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{t("close_store")}</span>
              <span className="font-bold text-foreground">{snapshot.storeName}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{t("close_items_count", { count: snapshot.itemCount })}</span>
            <span className="font-bold text-foreground">{formatDA(snapshot.total)}</span>
          </div>
          <p className="flex items-start gap-1.5 pt-1 text-[11px] leading-relaxed text-muted-foreground">
            <BellRing className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {t("close_notify_note")}
          </p>
        </div>
      )}

      {/* إجراءات الإغلاق */}
      <div className="grid w-full max-w-xs grid-cols-2 gap-2">
        <Link to="/orders" className="btn-primary">
          <PackageCheck className="size-4" /> {t("checkout_track_order")}
        </Link>
        <button type="button" onClick={onReorder} className="btn-secondary">
          <RotateCcw className="size-4" /> {t("close_reorder")}
        </button>
      </div>

      {/* طلب التقييم — الاحترام يصنع الولاء */}
      {snapshot?.productId && (
        <Link
          to="/products/$productId"
          params={{ productId: snapshot.productId }}
          className="w-full max-w-xs rounded-2xl border border-border bg-card p-3 transition active:scale-[0.98]"
        >
          <p className="text-sm font-bold text-foreground">{t("close_rate_cta")}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{t("close_rate_hint")}</p>
        </Link>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={share}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition active:scale-95"
        >
          <Share2 className="size-3.5" /> {t("close_share")}
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition active:scale-95"
        >
          {t("checkout_continue_shopping")}
        </Link>
      </div>
    </div>
  );
}
