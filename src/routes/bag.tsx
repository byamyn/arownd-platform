import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, ShoppingBag, Store, Trash2 } from "lucide-react";
import { bagItemKey, useBag } from "@/lib/bag";
import { translate, useTranslation } from "@/lib/i18n";
import { evaluateBag } from "@/lib/bag-check";
import { formatDA } from "@/lib/geo";
import { getOffersByIds, primaryImage } from "@/lib/sooqy";
import { QtyStepper } from "@/components/sooqy/qty-stepper";
import { EmptyState } from "@/components/sooqy/empty-state";
import { ErrorState } from "@/components/sooqy/error-state";
import { AppShell } from "@/components/sooqy/app-shell";
import { SectionHeader } from "@/components/sooqy/section-header";
import { StickyActionBar } from "@/components/sooqy/sticky-action-bar";
import { ConfirmDialog } from "@/components/sooqy/confirm-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/bag")({
  head: () => ({
    meta: [
      { title: translate("bag_title") },
      { name: "description", content: translate("bag_description") },
    ],
  }),
  component: BagPage,
});

function BagPage() {
  const bag = useBag();
  const { t, lang } = useTranslation();
  const [confirmClear, setConfirmClear] = useState(false);
  const ids = bag.items.map((i) => i.offerId);
  const offers = useQuery({
    queryKey: ["bag-offers", ids],
    queryFn: () => getOffersByIds(ids),
    enabled: ids.length > 0,
  });

  // مصدر واحد للحقيقة: نفس التقييم المستخدَم في صفحة الدفع.
  const evaluation = evaluateBag(bag.items, offers.data, lang);
  const rows = evaluation.rows;

  // التجميع حسب المتجر
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = r.offer?.store.name ?? t("bag_other_store");
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  const subtotal = evaluation.subtotal;
  // رسوم التوصيل النهائية يحددها كل متجر بعد مراجعة الطلب؛ لا نعرض تقديراً مضللاً.
  const delivery = null;
  const total = subtotal;
  const blocked = evaluation.hasBlocking;

  return (
    <AppShell className="pb-[calc(11.5rem+env(safe-area-inset-bottom))]">
      <div className="space-y-4 pt-6">
        {/* رأس الصفحة: العنوان + إفراغ السلة */}
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-h1 text-foreground">{t("bag_heading")}</h1>
          {bag.items.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="btn-danger-small flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Trash2 className="size-3.5" /> {t("bag_clear")}
            </button>
          )}
        </div>

        {offers.isError && bag.items.length > 0 && (
          <ErrorState scope="bag:offers" error={offers.error} onRetry={() => offers.refetch()} />
        )}

        {bag.items.length === 0 && (
          <EmptyState
            Icon={ShoppingBag}
            title={t("bag_empty_title")}
            hint={t("bag_empty_hint")}
            action={
              <Link to="/explore" className="btn-primary">
                {t("bag_browse")}
              </Link>
            }
          />
        )}

        {/* تنبيه صريح: لماذا لا يمكن إتمام الطلب الآن */}
        {blocked && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-2xl border border-danger bg-danger-soft p-3.5"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
            <div className="min-w-0 text-sm">
              <p className="font-bold text-danger">{t("bag_issues_title")}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-danger/90">
                {evaluation.blockingCount === 1
                  ? t("bag_issue_one")
                  : t("bag_issue_many", { count: evaluation.blockingCount })}{" "}
                {t("bag_issue_hint")}
              </p>
            </div>
          </div>
        )}

        {/* المجموعات حسب المتجر */}
        {[...groups.entries()].map(([storeName, items]) => (
          <section key={storeName} className="space-y-2">
            <SectionHeader
              title={
                <span className="flex items-center gap-1.5">
                  <Store className="size-4 text-accent-ink" />
                  {storeName}
                </span>
              }
            />
            <div className="space-y-2">
              {items.map((r) => {
                const image = r.offer ? primaryImage(r.offer.images) : null;
                const name = r.offer?.product.name ?? r.item.name ?? t("bag_item_removed");
                const priceChanged = r.issues.find((i) => i.kind === "price_changed");
                const otherVariantQuantity = bag.items.reduce(
                  (sum, item) =>
                    item.offerId === r.item.offerId &&
                    bagItemKey(item) !== bagItemKey(r.item)
                      ? sum + item.quantity
                      : sum,
                  0,
                );
                const availableForLine = Math.max(
                  1,
                  (r.offer?.stock_quantity ?? 10) - otherVariantQuantity,
                );
                const lineMax = Math.max(r.item.quantity, Math.min(10, availableForLine));
                const quantityBlocked =
                  !!r.issue && r.issue.kind !== "over_stock";
                return (
                  <div
                    key={bagItemKey(r.item)}
                    className={
                      "card-premium flex gap-3 p-3 " + (r.issue ? "!border-danger/50" : "")
                    }
                  >
                    {r.offer ? (
                      <Link
                        to="/products/$productId"
                        params={{ productId: r.offer.product_id }}
                        className="size-20 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-muted"
                      >
                        {image && (
                          <img
                            src={image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover"
                          />
                        )}
                      </Link>
                    ) : (
                      <div className="size-20 shrink-0 animate-pulse rounded-[var(--radius-control)] bg-muted" />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="line-clamp-1 text-sm font-semibold">{name}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {r.offer?.store.name} {Object.values(r.item.options).join(" · ")}
                      </p>
                      <p key={r.item.quantity} className="animate-pop text-price text-accent-ink">
                        {formatDA((r.offer?.price ?? 0) * r.item.quantity)}
                      </p>
                      {priceChanged && (
                        <p className="text-caption font-medium text-warning">
                          {priceChanged.message}
                        </p>
                      )}
                      {r.issue && (
                        <p className="text-caption font-semibold text-danger">{r.issue.message}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        aria-label={t("bag_remove_aria")}
                        onClick={() => {
                          const removed = r.item;
                          bag.remove(bagItemKey(removed));
                          toast(t("bag_removed_toast", { name }), {
                            action: { label: t("bag_undo"), onClick: () => bag.add(removed) },
                          });
                        }}
                        className="flex size-11 items-center justify-center rounded-full transition hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[var(--scale-pressed)]"
                      >
                        <Trash2 className="size-4 text-danger" />
                      </button>
                      <QtyStepper
                        value={r.item.quantity}
                        onChange={(v) => bag.setQty(bagItemKey(r.item), v)}
                        max={lineMax}
                        disabled={quantityBlocked}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {bag.items.length > 0 && (
          <Link to="/explore" className="btn-ghost w-full py-1.5 text-sm">
            {t("bag_continue_shopping")}
          </Link>
        )}

        {/* ملخص الطلب */}
        {bag.items.length > 0 && (
          <div className="card-premium space-y-2 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("bag_subtotal")}</span>
              <b className="text-foreground">{formatDA(subtotal)}</b>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("bag_shipping")}</span>
              {delivery != null ? (
                <b className="text-foreground">{formatDA(delivery)}</b>
              ) : (
                <span className="text-xs text-muted-foreground">{t("bag_shipping_pending")}</span>
              )}
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-bold text-foreground">{t("bag_total")}</span>
              <b className="text-price text-accent-ink">{formatDA(total)}</b>
            </div>
          </div>
        )}
      </div>

      {/* شريط متابعة الطلب — ثابت أسفل الشاشة */}
      {bag.items.length > 0 && (
        <StickyActionBar>
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-semibold text-muted-foreground">
              {t("bag_cta_items", { count: bag.count })}
            </span>
            <b className="text-section text-accent-ink">{formatDA(total)}</b>
          </div>
          {blocked ? (
            <p className="mt-2 rounded-[var(--radius-control)] bg-danger-soft px-3 py-2 text-center text-xs font-bold text-danger">
              {t("bag_checkout_blocked")}
            </p>
          ) : offers.isLoading || !evaluation.loaded ? (
            <button type="button" disabled className="btn-primary mt-3 w-full opacity-60">
              {t("state_loading")}
            </button>
          ) : offers.isError ? (
            <button type="button" disabled className="btn-primary mt-3 w-full opacity-60">
              {t("checkout_verify_failed_short")}
            </button>
          ) : (
            <Link to="/checkout" className="btn-primary mt-3 w-full">
              {t("bag_checkout_cta")} <ArrowLeft className="size-4" />
            </Link>
          )}
        </StickyActionBar>
      )}

      <ConfirmDialog
        open={confirmClear}
        title={t("bag_empty_confirm_title")}
        message={t("bag_empty_confirm_message")}
        confirmLabel={t("bag_empty_confirm_ok")}
        cancelLabel={t("bag_cancel")}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          bag.clear();
          setConfirmClear(false);
        }}
      />
    </AppShell>
  );
}
