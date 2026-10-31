import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, ShoppingBag } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { useBag } from "@/lib/bag";
import { toggleFavorite, useFavorites } from "@/lib/favorites";
import { formatDA } from "@/lib/geo";
import type { ProductGroup } from "@/lib/sooqy";
import { cn } from "@/lib/utils";

const PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iMTAwMCIgdmlld0JveD0iMCAwIDgwMCAxMDAwIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjEwMDAiIGZpbGw9IiNGN0Y4RjUiLz48ZGVmcz48Y2lyY2xlIGlkPSJhIiBjeD0iNDAwIiBjeT0iNTAwIiByPSIxNDAiLz48bWFzayBpZD0iYiI+PHVzZSBocmVmPSIjYSIgLz48L21hc2s+PC9kZWZzPjpnIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0M2RjM2QiIgc3Ryb2tlLW9wYWNpdHk9IjAuMyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBtYXNrPSJ1cmwoI2IpIj48Y2lyY2xlIGN4PSI0MDAiIGN5PSI0ODAiIHI9IjE0MCIvPjxwYXRoIGQ9Ik00MDAgMzYwYTE2MCAxNjAgMCAxMCAzMjAgMCIgZmlsbD0ibm9uZSIvPjwvZz48L3N2Zz4=";

type Props = {
  group: ProductGroup;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

/**
 * بطاقة الاكتشاف الكبيرة — منتج واحد في كل مرة، مستوحاة من عرض المنشورات.
 * الصورة تملأ العرض، وأزرار السابق/التالي في منتصف الصورة عمودياً على جانبيها.
 */
export function DiscoveryCard({ group, canPrev, canNext, onPrev, onNext }: Props) {
  const { t } = useTranslation();
  const bag = useBag();
  const navigate = useNavigate();
  const { product, bestOffer, image, minPrice, available, totalStock, offers } = group;

  const [imageFailed, setImageFailed] = useState(false);
  const favs = useFavorites();
  const active = favs.products.includes(product.id);

  const level = available ? (totalStock <= 3 ? "low" : "in") : "out";
  const rating = offers.length ? Math.max(...offers.map((o) => Number(o.store.rating) || 0)) : 0;

  const src = image ?? PLACEHOLDER;

  const addToBag = () => {
    if (!bestOffer || level === "out") {
      toast.error(t("explore_product_unavailable"));
      return;
    }
    bag.add({
      offerId: bestOffer.id,
      quantity: 1,
      options: {},
      price: bestOffer.price,
      name: bestOffer.product.name,
      productId: product.id,
    });
    toast.success(t("product_added_to_bag"));
  };

  const buyNow = () => {
    if (!bestOffer || level === "out") {
      toast.error(t("explore_product_unavailable"));
      return;
    }
    const opts = (bestOffer.options ?? {}) as Record<string, unknown>;
    const hasMandatory =
      (Array.isArray(opts["sizes"]) && (opts["sizes"] as unknown[]).length > 0) ||
      (Array.isArray(opts["colors"]) && (opts["colors"] as unknown[]).length > 0);
    if (hasMandatory) {
      navigate({ to: "/products/$productId", params: { productId: product.id } });
      return;
    }
    bag.add({
      offerId: bestOffer.id,
      quantity: 1,
      options: {},
      price: bestOffer.price,
      name: bestOffer.product.name,
      productId: product.id,
    });
    toast.success(t("product_added_to_bag"));
    navigate({ to: "/checkout" });
  };

  const disabled = !bestOffer || level === "out";

  return (
    <article className="flex flex-col gap-2 max-h-[calc(100dvh-9rem)] overflow-hidden">
      {/* opening the product details page when tapping the image */}
      <a
        href={`/products/${product.id}`}
        className="block"
        onClick={(e) => {
          e.preventDefault();
          navigate({ to: "/products/$productId", params: { productId: product.id } });
        }}
      >
        <div className="relative w-full overflow-hidden rounded-3xl bg-neutral-100 dark:bg-neutral-800 aspect-[4/5] sm:aspect-[3/4] max-h-[48vh] group">
          {image ? (
            <img
              src={src}
              alt={t("product_image_alt", { name: product.name, n: 1 })}
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
              className="size-full object-cover object-center"
            />
          ) : (
            <div className="size-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
              <Star className="size-12 text-muted-foreground" />
            </div>
          )}

          {/* التنقل بين المنتجات — أعلى الصورة، منتظمان عمودياً (يسار = سابق، يمين = التالي) ولا يتبادلان الأدوار مع اتجاه اللغة */}
          {canPrev && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              aria-label={t("aria_prev")}
              className="absolute end-3 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
          {canNext && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              aria-label={t("aria_next")}
              className="absolute start-3 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="size-5" />
            </button>
          )}

          <button
            type="button"
            aria-label={active ? t("aria_favorite_remove") : t("aria_favorite_add")}
            aria-pressed={active}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite("products", product.id);
            }}
            className={cn(
              "absolute top-3 end-3 z-20 flex size-10 items-center justify-center rounded-full bg-card/90 backdrop-blur-sm transition-all duration-200 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground border border-border",
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className={cn(
                "transition-colors duration-200",
                active
                  ? "fill-accent-ink text-accent-ink"
                  : "fill-transparent text-muted-foreground",
              )}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>
        </div>
      </a>

      <div className="space-y-1.5">
        <h2 className="text-h3 font-bold text-foreground line-clamp-1">{product.name}</h2>
        {product.description && (
          <p className="line-clamp-1 text-body text-muted-foreground">{product.description}</p>
        )}
        {rating > 0 && (
          <div className="flex items-center gap-1.5">
            <Star className="size-3.5 fill-warning text-warning" />
            <span className="text-sm font-bold text-foreground">{rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">{t("product_store_rating")}</span>
          </div>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-h4 font-extrabold text-foreground">{formatDA(minPrice)}</span>
          {level === "out" && (
            <span className="rounded-lg bg-black/60 text-[10px] font-bold text-white px-2 py-0.5 backdrop-blur-sm">
              {t("stock_out")}
            </span>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addToBag();
            }}
            disabled={disabled}
            className={cn(
              "btn-primary w-full justify-center gap-2",
              disabled && "opacity-60 pointer-events-none",
            )}
          >
            <ShoppingBag className="size-5" />
            {disabled ? t("explore_product_unavailable") : t("product_add_to_bag")}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              buyNow();
            }}
            disabled={disabled}
            className={cn(
              "btn-secondary w-full justify-center gap-2",
              disabled && "opacity-60 pointer-events-none",
            )}
          >
            {t("product_buy_now")}
          </button>
        </div>
      </div>
    </article>
  );
}
