import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Camera, SlidersHorizontal, X, LayoutGrid, Layers } from "lucide-react";
import { toast } from "sonner";
import { translate, useTranslation } from "@/lib/i18n";

import { searchProducts, type SortBy } from "@/lib/sooqy";
import { profileFromFile, rankByVisual } from "@/lib/image-search";
import type { VisualProfile } from "@/lib/image-search";
import { DiscoveryCard } from "@/components/sooqy/explore-card";
import { SideSheet } from "@/components/sooqy/side-sheet";
import { ProductCard } from "@/components/sooqy/cards";
import { categoryLabel } from "@/lib/taxonomy";
import { formatDA } from "@/lib/geo";
import { EmptyState } from "@/components/sooqy/empty-state";

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
      { title: translate("explore_seo_title") },
      { name: "description", content: translate("explore_seo_description") },
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


  const [text, setText] = useState(s.q ?? "");
  const [committed, setCommitted] = useState(s.q ?? "");
  const [visual, setVisual] = useState<VisualProfile | null>(null);
  const [sort, setSort] = useState<SortBy>(s.sort ?? "newest");
  const [inStockOnly, setInStockOnly] = useState(s.stock ?? false);
  const [minText, setMinText] = useState(s.min != null ? String(s.min) : "");
  const [maxText, setMaxText] = useState(s.max != null ? String(s.max) : "");
  const [showFilters, setShowFilters] = useState(false);

  // Keep the existing filter controls aligned with URL state (refresh/back/forward).
  useEffect(() => {
    setSort(s.sort ?? "newest");
    setInStockOnly(s.stock ?? false);
    setMinText(s.min != null ? String(s.min) : "");
    setMaxText(s.max != null ? String(s.max) : "");
  }, [s.sort, s.stock, s.min, s.max]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigatingRef = useRef(false);
  const [mode, setMode] = useState<"cards" | "grid">(() => {
    try {
      return localStorage.getItem("sooqy:explore-mode") === "grid" ? "grid" : "cards";
    } catch {
      return "cards";
    }
  });
  const changeMode = (m: "cards" | "grid") => {
    setMode(m);
    try {
      localStorage.setItem("sooqy:explore-mode", m);
    } catch {
      /* التخزين غير متاح */
    }
  };
  const restoreRef = useRef<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const q = committed;
  const debouncedText = useDebounced(text, 400);
  useEffect(() => {
    const v = debouncedText.trim();
    setCommitted((prev) => (prev === v ? prev : v));
  }, [debouncedText]);

  useEffect(() => {
    if ((s.q ?? "") !== q) {
      navigate({ search: (prev) => ({ ...prev, q: q || undefined }), replace: true });
    }
  }, [q, navigate]);



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

  const min = minText !== "" && Number.isFinite(Number(minText)) ? Number(minText) : undefined;
  const max = maxText !== "" && Number.isFinite(Number(maxText)) ? Number(maxText) : undefined;
  const feedSig = JSON.stringify([q, s.cat, sort, inStockOnly, min, max, s.w, s.commune]);

  // أي تغيير في البحث/الفلاتر يعيد البطاقة إلى الأولى (سابقًا كان الفرز يترك فهرسًا قديمًا)
  const resetKey = `${feedSig}|${visual ? "v" : ""}`;
  const prevResetKey = useRef(resetKey);
  useEffect(() => {
    if (prevResetKey.current === resetKey) return;
    prevResetKey.current = resetKey;
    restoreRef.current = null;
    setCurrentIndex(0);
  }, [resetKey]);

  // استعادة موضع البطاقة الحالية عند العودة (نفس الفلاتر فقط)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("sooqy:explore-index");
      if (!raw) return;
      const saved = JSON.parse(raw) as { sig?: string; index?: number };
      if (saved.sig === feedSig && Number.isInteger(saved.index) && (saved.index as number) > 0) {
        restoreRef.current = saved.index as number;
      }
    } catch {
      /* تجاهل */
    }
    // مرة واحدة عند التحميل
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    rankByVisual(visual, items)
      .then((matches) => {
        const next = matches.map((m) => m.id);
        setVisualIds((prev) =>
          prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next,
        );
      })
      .catch(() => toast.error(t("explore_visual_failed")));
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

  useEffect(() => {
    const r = restoreRef.current;
    if (r == null) return;
    if (displayProducts.length > r) {
      setCurrentIndex(r);
      restoreRef.current = null;
    } else if (products.hasNextPage && !products.isFetchingNextPage) {
      void products.fetchNextPage();
    } else if (!products.isLoading && !products.hasNextPage) {
      restoreRef.current = null;
    }
  }, [displayProducts.length, products.hasNextPage, products.isFetchingNextPage, products.isLoading]);

  useEffect(() => {
    if (restoreRef.current != null) return;
    try {
      sessionStorage.setItem("sooqy:explore-index", JSON.stringify({ sig: feedSig, index: currentIndex }));
    } catch {
      /* تجاهل */
    }
  }, [feedSig, currentIndex]);

  const handleImagePick = useCallback((file: File) => {
    profileFromFile(file)
      .then((profile) => {
        setVisual(profile);
        setCurrentIndex(0);
      })
      .catch(() => toast.error(t("explore_visual_failed")));
  }, [t]);

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
        sort: sort !== "newest" ? sort : undefined,
        stock: inStockOnly ? true : undefined,
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
      <header className="sticky top-0 z-30 flex max-w-xl mx-auto w-full px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setCommitted(text.trim());
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
              onClick={() => { setText(""); setCommitted(""); }}
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
      </header>

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

      {/* شرائح الفلاتر النشطة + تبديل العرض */}
      <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-4 pt-3">
        <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {[
            s.cat
              ? { key: "cat", label: categoryLabel(s.cat), clear: () => navigate({ search: (p) => ({ ...p, cat: undefined }), replace: true }) }
              : null,
            min != null || max != null
              ? {
                  key: "price",
                  label: `${min != null ? formatDA(min) : "0"} – ${max != null ? formatDA(max) : "∞"}`,
                  clear: () => {
                    setMinText("");
                    setMaxText("");
                    navigate({ search: (p) => ({ ...p, min: undefined, max: undefined }), replace: true });
                  },
                }
              : null,
            inStockOnly
              ? {
                  key: "stock",
                  label: t("explore_chip_in_stock"),
                  clear: () => {
                    setInStockOnly(false);
                    navigate({ search: (p) => ({ ...p, stock: undefined }), replace: true });
                  },
                }
              : null,
            sort !== "newest"
              ? {
                  key: "sort",
                  label: t(`explore_sort_${sort}`),
                  clear: () => {
                    setSort("newest");
                    navigate({ search: (p) => ({ ...p, sort: undefined }), replace: true });
                  },
                }
              : null,
          ]
            .filter((c): c is NonNullable<typeof c> => c !== null)
            .map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.clear}
                aria-label={`${t("explore_remove_filter")}: ${c.label}`}
                className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-soft px-3 text-xs font-bold text-accent-ink"
              >
                {c.label}
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ))}
          {mode === "cards" && displayProducts.length > 0 && (
            <span className="flex min-h-9 shrink-0 items-center text-xs font-semibold text-muted-foreground">
              {t("explore_position", {
                index: currentIndex + 1,
                total: displayProducts.length,
                more: products.hasNextPage ? "+" : "",
              })}
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-1 rounded-xl border border-border bg-card p-1">
          {(
            [
              { id: "cards", label: t("explore_mode_cards"), Icon: Layers },
              { id: "grid", label: t("explore_mode_grid"), Icon: LayoutGrid },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-label={label}
              aria-pressed={mode === id}
              onClick={() => changeMode(id)}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg transition",
                mode === id ? "bg-primary text-accent-ink-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <main
        className={cn(
          "flex-1 px-4",
          current && mode === "cards" ? "overflow-hidden pb-4" : "overflow-y-auto pb-32",
        )}
      >
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
        {current && mode === "grid" && (
          <div className="mx-auto mt-3 max-w-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {displayProducts.map((g) => (
                <ProductCard key={g.product.id} g={g} />
              ))}
            </div>
            {products.hasNextPage && (
              <button
                type="button"
                onClick={() => void products.fetchNextPage()}
                disabled={products.isFetchingNextPage}
                className="btn-secondary w-full"
              >
                {products.isFetchingNextPage ? t("state_loading") : t("explore_load_more")}
              </button>
            )}
          </div>
        )}
        {current && mode === "cards" && (
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

      <SideSheet
          open={showFilters}
          onOpenChange={setShowFilters}
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
      </SideSheet>
    </div>
  );
}
