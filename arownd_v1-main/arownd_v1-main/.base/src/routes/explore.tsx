import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Camera, SlidersHorizontal, X, ShoppingBag } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useBag } from "@/lib/bag";
import { searchProducts, type SortBy } from "@/lib/sooqy";
import { profileFromFile, rankByVisual } from "@/lib/image-search";
import type { VisualProfile } from "@/lib/image-search";
import { DiscoveryCard } from "@/components/sooqy/explore-card";
import { BottomSheet } from "@/components/sooqy/bottom-sheet";
import { EmptyState } from "@/components/sooqy/empty-state";
import { ArowndBrand } from "@/components/sooqy/logo";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

type Search = {
  q?: string | undefined;
  cat?: string | undefined;
  w?: number | undefined;
  stock?: boolean | undefined;
  min?: number | undefined;
  max?: number | undefined;
  sort?: SortBy | undefined;
  commune?: string | undefined;
};

export const Route = createFileRoute("/explore")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    cat: typeof s["cat"] === "string" ? s["cat"] : undefined,
    w: s["w"] != null && !Number.isNaN(Number(s["w"])) ? Number(s["w"]) : undefined,
    stock: s["stock"] === true || s["stock"] === "true" ? true : undefined,
    min: s["min"] != null && !Number.isNaN(Number(s["min"])) ? Number(s["min"]) : undefined,
    max: s["max"] != null && !Number.isNaN(Number(s["max"])) ? Number(s["max"]) : undefined,
    sort: ["cheapest", "nearest", "rating", "newest"].includes(String(s["sort"]))
      ? (s["sort"] as SortBy)
      : undefined,
    commune: typeof s["commune"] === "string" ? s["commune"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "اكتشف — SooQy" },
      { name: "description", content: "استكشف المنتجات واشترِ مباشرة من بطاقة المنتج." },
    ],
  }),
  component: Explore,
});

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

function Explore() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/explore" });
  const { t } = useTranslation();
  const bag = useBag();

  const [text, setText] = useState(s.q ?? "");
  const [visual, setVisual] = useState<VisualProfile | null>(null);
  const [sort, setSort] = useState<SortBy>("newest");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minText, setMinText] = useState(s.min != null ? String(s.min) : "");
  const [maxText, setMaxText] = useState(s.max != null ? String(s.max) : "");
  const [showFilters, setShowFilters] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigatingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const q = useDebounced(text, 300);

  useEffect(() => {
    if ((s.q ?? "") !== q) {
      navigate({ search: (prev) => ({ ...prev, q: q || undefined }), replace: true });
    }
  }, [q, navigate]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [q, visual]);

  // استعادة موضع التمرير عند العودة
  useEffect(() => {
    const saved = sessionStorage.getItem("sooqy:explore-scroll");
    if (saved) {
      const y = Number(saved);
      if (y > 0) window.scrollTo(0, y);
      sessionStorage.removeItem("sooqy:explore-scroll");
    }
  }, []);

  useEffect(() => {
    const save = () => sessionStorage.setItem("sooqy:explore-scroll", String(window.scrollY));
    window.addEventListener("beforeunload", save);
    window.addEventListener("pagehide", save);
    return () => {
      save();
      window.removeEventListener("beforeunload", save);
      window.removeEventListener("pagehide", save);
    };
  }, []);

  const min = minText ? Number(minText) : undefined;
  const max = maxText ? Number(maxText) : undefined;

  const products = useInfiniteQuery({
    queryKey: ["explore-feed", q, s.cat, sort, inStockOnly, min, max, s.w, s.commune],
    queryFn: ({ pageParam }) =>
      searchProducts({
        query: q || undefined,
        category: s.cat ?? null,
        wilaya: s.w ?? null,
        inStockOnly,
        ...(min != null ? { minPrice: min } : {}),
        ...(max != null ? { maxPrice: max } : {}),
        sortBy: sort,
        limit: PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
  });

  const all = (products.data?.pages ?? []).flat();
  const allIdsKey = all.map((g) => g.product.id).join(",");

  const [visualIds, setVisualIds] = useState<string[]>([]);
  useEffect(() => {
    if (!visual) {
      setVisualIds((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    const items = all.map((g) => ({ id: g.product.id, url: g.image }));
    rankByVisual(visual, items).then((matches) => {
      const next = matches.map((m) => m.id);
      setVisualIds((prev) =>
        prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next,
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visual, allIdsKey]);

  const displayProducts =
    visualIds.length > 0
      ? all.filter((g) => visualIds.includes(g.product.id)).sort(
          (a, b) => visualIds.indexOf(a.product.id) - visualIds.indexOf(b.product.id),
        )
      : all;

  const current = displayProducts[currentIndex];

  const isLast = currentIndex >= Math.max(0, displayProducts.length - 1);

  useEffect(() => {
    if (isLast && products.hasNextPage && !products.isFetchingNextPage && !navigatingRef.current) {
      products.fetchNextPage();
    }
  }, [isLast, products.hasNextPage, products.isFetchingNextPage, products.fetchNextPage]);

  const handleImagePick = useCallback((file: File) => {
    profileFromFile(file)
      .then((profile) => {
        setVisual(profile);
        setCurrentIndex(0);
      })
      .catch(() => {
        // ignore
      });
  }, []);

  const clearVisual = useCallback(() => {
    setVisual(null);
    setCurrentIndex(0);
  }, []);

  const goPrev = useCallback(() => {
    if (currentIndex <= 0 || navigatingRef.current) return;
    navigatingRef.current = true;
    setCurrentIndex((i) => i - 1);
    setTimeout(() => (navigatingRef.current = false), 250);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (navigatingRef.current) return;
    if (currentIndex >= displayProducts.length - 1) {
      if (!products.hasNextPage || products.isFetchingNextPage) return;
      navigatingRef.current = true;
      products.fetchNextPage().then(() => {
        setCurrentIndex((i) => i + 1);
        setTimeout(() => (navigatingRef.current = false), 250);
      });
      return;
    }
    navigatingRef.current = true;
    setCurrentIndex((i) => i + 1);
    setTimeout(() => (navigatingRef.current = false), 250);
  }, [currentIndex, displayProducts.length, products.hasNextPage, products.isFetchingNextPage, products.fetchNextPage]);

  const applyFilters = () => {
    const min = minText ? Number(minText) : undefined;
    const max = maxText ? Number(maxText) : undefined;
    if (
      (min != null && Number.isNaN(min)) ||
      (max != null && Number.isNaN(max))
    )
      return;
    navigate({
      search: (prev) => ({
        ...prev,
        min: min != null && min >= 0 ? min : undefined,
        max: max != null && max > 0 ? max : undefined,
      }),
      replace: true,
    });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSort("newest");
    setInStockOnly(false);
    setMinText("");
    setMaxText("");
    navigate({ search: {}, replace: true });
    setShowFilters(false);
  };

  const isLoading = products.isLoading;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-3.5 bg-background border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <ArowndBrand className="h-10 w-auto shrink-0" />
        </Link>
        <button
          type="button"
          aria-label={t("bag_title")}
          onClick={() => navigate({ to: "/bag" })}
          className="relative flex size-10 items-center justify-center rounded-full bg-card text-foreground transition active:scale-95"
        >
          <ShoppingBag className="size-5" />
          {bag.count > 0 && (
            <span className="absolute -right-1 -top-1 z-10 size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {bag.count}
            </span>
          )}
        </button>
      </header>

      <div className="sticky top-0 z-30 flex max-w-xl mx-auto px-4 pb-2 pt-1">
        <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // البحث يتم عبر debounce + navigate
              }
            }}
            placeholder={t("explore_search_placeholder")}
            aria-label={t("explore_search_placeholder")}
            className="h-10 flex-1 bg-transparent text-body outline-none placeholder:text-muted"
          />
          {text && (
            <button
              type="button"
              aria-label={t("explore_clear_search")}
              onClick={() => setText("")}
              className="text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          <input
            id="explore-visual-picker"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImagePick(f);
            }}
          />
          <label
            htmlFor="explore-visual-picker"
            aria-label={t("explore_camera")}
            title={t("explore_camera")}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition active:scale-95"
          >
            <Camera className="size-4.5" />
          </label>
          <button
            type="button"
            aria-label={t("aria_filters")}
            aria-expanded={showFilters}
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full transition",
              showFilters
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
            )}
          >
            <SlidersHorizontal className="size-4.5" />
          </button>
        </div>
      </div>

      {visual && (
        <div className="max-w-xl mx-auto px-4 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-bold text-warning">
            <Camera className="size-3.5" /> {t("explore_visual_search_active")}
          </div>
          <button
            type="button"
            aria-label={t("explore_clear_visual")}
            onClick={clearVisual}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <main className={cn("flex-1 px-4", current ? "overflow-hidden pb-4" : "overflow-y-auto pb-32")}>
        {isLoading && !current && (
          <div className="max-w-xl mx-auto mt-10 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[560px] overflow-hidden rounded-3xl border border-border bg-card">
                <div className="aspect-[4/5] animate-pulse bg-neutral-200" />
                <div className="p-4 space-y-2">
                  <div className="h-5 w-3/4 animate-pulse rounded-full bg-neutral-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded-full bg-neutral-200" />
                  <div className="h-5 w-full animate-pulse rounded-full bg-neutral-200" />
                  <div className="h-10 w-full animate-pulse rounded-full bg-neutral-200" />
                  <div className="h-10 w-3/4 animate-pulse rounded-full bg-neutral-200" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && !current && (
          <div className="max-w-xl mx-auto mt-10 text-center">
            <EmptyState
              Icon={Search}
              title={t("explore_empty_title")}
              hint={t("explore_empty_hint")}
            />
          </div>
        )}
        {current && (
          <article className="sticky top-14 z-20 max-w-xl mx-auto w-full">
            <DiscoveryCard
              group={current}
              canPrev={currentIndex > 0}
              canNext={currentIndex < displayProducts.length - 1 || products.hasNextPage}
              onPrev={goPrev}
              onNext={goNext}
            />
          </article>
        )}
        {!isLoading && products.isFetchingNextPage && (
          <div className="px-4 text-center text-muted-foreground">
            {t("state_loading")}
          </div>
        )}
        {!isLoading && !products.hasNextPage && displayProducts.length > 0 && (
          <div className="px-4 text-center text-muted-foreground">
            {t("explore_no_more")}
          </div>
        )}
        <div ref={sentinelRef} className="h-24" />
      </main>

      {showFilters && (
        <BottomSheet
          open
          onClose={() => setShowFilters(false)}
          title={t("explore_filter")}
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 btn-secondary"
              >
                {t("explore_clear_filters")}
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="flex-1 btn-primary"
              >
                {t("explore_apply")}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-caption-sm text-muted-foreground mb-2">{t("explore_sort_label")}</p>
              <div className="grid grid-cols-2 gap-2">
                {(["newest", "cheapest", "nearest", "rating"] as SortBy[]).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setSort(o)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm font-bold transition",
                      sort === o
                        ? "border-primary bg-primary-soft text-primary-soft-foreground"
                        : "border-border bg-card text-foreground",
                    )}
                  >
                    {t(`explore_sort_${o}`)}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              {t("explore_in_stock_only")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-caption-sm text-muted-foreground">{t("explore_from")}</span>
                <input
                  type="number"
                  min={0}
                  value={minText}
                  onChange={(e) => setMinText(e.target.value)}
                  className="input-base"
                />
              </label>
              <label className="space-y-1">
                <span className="text-caption-sm text-muted-foreground">{t("explore_to")}</span>
                <input
                  type="number"
                  min={0}
                  value={maxText}
                  onChange={(e) => setMaxText(e.target.value)}
                  className="input-base"
                />
              </label>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
