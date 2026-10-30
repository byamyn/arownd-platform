import { Link } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";
import { MapPin, Navigation, ImageOff } from "lucide-react";
import { formatDA, formatKm, getStoreStatus } from "@/lib/geo";
import type { OfferFull, ProductGroup, Store } from "@/lib/sooqy";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { OpenBadge, VerifiedBadge } from "./badges";
import { DirectionsButton } from "./DirectionsButton";
import { RatingStars } from "./rating-stars";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/market";

/** صورة افتراضية فاخرة — ظل ناعم مع أيقونة منتَج */
const PRODUCT_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGN0Y4RjUiLz48ZGVmcz48Y2lyY2xlIGlkPSJhIiBjeD0iMTAwIiByPSIzMCIvPjxtYXNrIGlkPSJiIj48dXNlIGhcmWs9IiNhIi8+PC9tYXNrPjwvZGVmcz48ZyBmaWxsPSJub25lIiBzdHJva2U9IiNDNkYzNkIiIHN0cm9rZS1vcGFjaXR5PSIwLjMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgbWFzaz0idXJsKCNiKSI+PGNpcmNsZSBjeD0iMTAwIiBjeT0iOSAiIHI9IjMwIi8+PHBhdGggZD0iTTEwMCA4MGExNiAxNiAwIDEwMCAzMiIgZmlsbD0ibm9uZSIvPjwvZz48L3N2Zz4=";

/** صورة افتراضية للمتاجر — أيقونة متجر بسيطة */
const STORE_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlMmU4ZjAiLz48ZyBmaWxsPSJub25lIiBzdHJva2U9IiNDNkYzNkIiIHN0cm9rZS1vcGFjaXR5PSIwLjMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iNzAiIHk9Ijc1IiB3aWR0aD0iNjAiIGhlaWdodD0iNTAiIHJ4PSI0Ii8+PHBhdGggZD0iTTgwIDc1di0xMGgyMHYxMCIvPHJlY3QgeD0iODAiIHk9IjEyNSIgd2lkdGg9IjE2IiBoZWlnaHQ9IjMwIiBieD0iMiIvPjxyZWN0IHg9IjEwNCIgeT0iMTI1IiB3aWR0aD0iMTYiIGhlaWdodD0iMzAiIHJ4PSIyIi8+PC9nPjwvc3ZnPg==";

/* ═══════════════ زر المفضلة ═══════════════ */
export function FavoriteButton({
  kind,
  id,
}: {
  kind: "products" | "stores";
  id: string;
}) {
  const { t } = useTranslation();
  const active = isFavorite(kind, id);

  return (
    <button
      type="button"
      aria-label={active ? t("aria_favorite_remove") : t("aria_favorite_add")}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(kind, id);
      }}
      className={cn(
        "flex size-8 items-center justify-center rounded-full backdrop-blur transition-all duration-200 active:scale-90",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-card/80 text-muted-foreground border border-border",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className={cn(
          "transition-colors",
          active ? "fill-accent-ink text-accent-ink" : "fill-transparent text-muted-foreground",
        )}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  );
}

export function ProductCard({ g }: { g: ProductGroup }) {
  const { t } = useTranslation();
  const level = g.available ? (g.totalStock <= 3 ? "low" : "in") : "out";
  const rating = g.offers.length
    ? Math.max(...g.offers.map((o) => Number(o.store.rating) || 0))
    : 0;
  // نفس مصدر الحقيقة الذي تستخدمه صفحة المنتج — لا حساب مستقل.
  const best = g.bestOffer;
  const discountPct = Math.max(
    0, ...g.offers.map((o) => o.old_price && o.old_price > o.price
      ? Math.round(((o.old_price - o.price) / o.old_price) * 100) : 0),
  );
  const discount = discountPct > 0;

  const priceToShow = best?.price !== undefined ? best.price : g.minPrice;

  return (
    <Link
      to="/products/$productId" params={{ productId: g.product.id }}
      preload="intent"
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl bg-card transition-all duration-200",
        "border border-transparent", level === "out"
          ? "opacity-70 cursor-not-allowed pointer-events-none"
          : "border-border hover:border-primary/20 hover:shadow-lift",
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        {g.image ? (
          <img
            src={g.image} alt={g.product.name} loading="lazy" decoding="async"
            onError={(e) => { (e.currentTarget as any).src = PRODUCT_PLACEHOLDER; }}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <img
            src={PRODUCT_PLACEHOLDER} alt={t("product_placeholder")} loading="lazy"
            className="size-full object-cover"
          />
        )}
        <FavoriteButton kind="products" id={g.product.id} />
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <p className="text-sm line-clamp-2 text-text truncate">{g.product.name}</p>
        <div className="flex items-center gap-1">
          <RatingStars rating={rating} size="size-3" showValue />
        </div>
        <p className="text-h4 text-accent-ink">
          {priceToShow !== undefined ? formatDA(priceToShow) : formatDA(0)}
        </p>
        {discount && (
          <span className="rounded-full bg-danger-soft px-1.5 py-0.5 text-[11px] font-bold text-danger">
            -{discountPct}%
          </span>
        )}
        {level === "out" && (
          <span className="rounded-lg bg-black/60 text-[10px] font-bold text-white px-2 py-0.5 backdrop-blur-sm">
            نفد
          </span>
        )}
      </div>
    </Link>
  );
}

export function StoreCard({ s, distance }: { s: Store; distance?: number | null }) {
  const logoUrl = s.logo_url ?? s.cover_url ?? STORE_PLACEHOLDER;

  return (
    <div className="flex items-center rounded-lg border border-border p-3 hover:border-primary/20 transition-colors">
      <img
        src={logoUrl}
        alt={s.name}
        loading="lazy"
        className="w-6 h-6 rounded-md object-cover"
      />
      <span className="ml-2 text-sm text-text">{s.name}</span>
      {distance !== undefined && (
        <span className="ml-auto text-xs text-muted-foreground">
          {distance} كم
        </span>
      )}
    </div>
  );
}

export function StoreMiniCard({ s, distance }: { s: Store; distance?: number | null }) {
  const logoUrl = s.logo_url ?? s.cover_url ?? STORE_PLACEHOLDER;

  return (
    <div className="flex items-center rounded-lg border border-border p-2 hover:border-primary/20 transition-colors">
      <img
        src={logoUrl}
        alt={s.name}
        loading="lazy"
        className="w-5 h-5 rounded-md object-cover"
      />
      <span className="ml-2 text-xs text-text truncate">{s.name}</span>
      {distance !== undefined && (
        <span className="ml-auto text-[9px] text-muted-foreground">
          {distance} كم
        </span>
      )}
    </div>
  );
}

export function OfferCard({ offer }: { offer: OfferFull }) {
  const productImage = offer.images?.[0]?.image_url ?? PRODUCT_PLACEHOLDER;

  return (
    <div className="flex items-center rounded-lg border border-border p-3 hover:border-primary/20 transition-colors">
      <img
        src={productImage}
        alt={offer.product.name}
        loading="lazy"
        className="w-6 h-6 object-cover rounded-md"
      />
      <div className="ml-3 flex-1 min-w-0">
        <p className="text-sm line-clamp-1 text-text truncate">{offer.product.name}</p>
        <p className="text-[10px] font-bold text-accent">
          {offer.price !== undefined ? formatMoney(offer.price) : formatMoney(0)}
        </p>
      </div>
    </div>
  );
}