import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bell, Star } from "lucide-react";
import { useGeo } from "@/lib/geo";
import { searchProducts, searchStores } from "@/lib/sooqy";
import { MAIN_CATEGORIES } from "@/lib/taxonomy";
import { ProductCard, StoreRailCard } from "@/components/sooqy/cards";
import { SearchField } from "@/components/sooqy/search-field";
import { SectionHeader, SeeAllLink } from "@/components/sooqy/section-header";
import { ProductGridSkeleton } from "@/components/sooqy/skeleton";
import { EmptyState } from "@/components/sooqy/empty-state";
import { ErrorState } from "@/components/sooqy/error-state";
import { Reveal } from "@/components/sooqy/reveal";
import { ArowndBrand } from "@/components/sooqy/logo";
import { SeoHead } from "@/components/seo/SeoHead";
import { WilayaButton } from "@/components/sooqy/WilayaSelect";
import { translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: translate("home_seo_title") },
      { name: "description", content: translate("home_seo_description") },
      { property: "og:title", content: translate("home_seo_title") },
      { property: "og:description", content: translate("home_seo_short") },
    ],
  }),
  component: Home,
});

function Home() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { pos } = useGeo();
  const changeWilaya = (v: number | null) => {
    setWilaya(v);
    try {
      if (v == null) localStorage.removeItem("sooqy:wilaya");
      else localStorage.setItem("sooqy:wilaya", String(v));
    } catch {
      /* التخزين غير متاح */
    }
  };
  const [wilaya, setWilaya] = useState<number | null>(null);

  useEffect(() => {
    try {
      const n = Number(localStorage.getItem("sooqy:wilaya"));
      if (Number.isInteger(n) && n >= 1 && n <= 58) setWilaya(n);
    } catch {
      /* التخزين غير متاح (وضع خاص) — نتجاهل */
    }
  }, []);

  const trending = useInfiniteQuery({
    queryKey: ["trending", wilaya, pos?.lat],
    queryFn: ({ pageParam = 0 }) =>
      searchProducts({ wilaya, pos, sortBy: "newest", limit: 20, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length * 20 : undefined,
  });
  const topRatedProducts = useQuery({
    queryKey: ["top-rated-products", wilaya, pos?.lat, pos?.lng],
    queryFn: () => searchProducts({ wilaya, pos, sortBy: "rating", limit: 10 }),
  });
  const nearbyStores = useQuery({
    queryKey: ["home-nearby-stores", wilaya, pos?.lat, pos?.lng],
    queryFn: () =>
      searchStores({
        wilaya,
        lat: pos?.lat ?? null,
        lng: pos?.lng ?? null,
        sortBy: pos ? "nearest" : "rating",
        limit: 10,
      }),
  });
  const stores = nearbyStores.data ?? [];
  const goSearch = () => {
    const term = q.trim();
    void navigate({ to: "/explore", search: term ? { q: term } : {} });
  };
  const products = (trending.data?.pages ?? []).flat();
  const topRated = topRatedProducts.data ?? [];

  return (
    <>
      <SeoHead
        title={t("home_seo_title")}
        description={t("home_seo_description")}
        keywords={t("home_seo_keywords")}
        ogType="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Arownd",
          url: "https://arownd.app",
          description: t("home_seo_short"),
          inLanguage: lang === "ar" ? "ar-DZ" : "en",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://arownd.app/explore?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <div className="space-y-6 px-4 pt-0">
        <header className="sticky top-0 z-30 -mx-4 flex items-center justify-between gap-3 bg-background/95 px-4 py-2 backdrop-blur-md">
          <ArowndBrand />
          <div className="flex items-center gap-2">
            <WilayaButton
              value={wilaya}
              onChange={changeWilaya}
              allLabel={t("home_all_wilayas")}
            />
            <Link to="/notifications" aria-label={t("home_notifications")} className="icon-btn">
              <Bell className="size-5" />
            </Link>
          </div>
        </header>

        {/* الهيرو: عنوان + بحث بارز */}
        <section className="rounded-3xl border border-border bg-gradient-to-br from-primary-soft via-card to-card p-4 shadow-soft">
          <h1 className="text-display text-foreground">{t("home_hero_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("home_hero_sub")}</p>
          <SearchField
            className="mt-4"
            value={q}
            onChange={setQ}
            onSearch={goSearch}
            placeholder={t("home_search_placeholder")}
          />
        </section>

        {/* التصنيفات */}
        <section className="space-y-2" aria-label={t("home_browse_categories")}>
          <SectionHeader title={t("home_browse_categories")} />
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {MAIN_CATEGORIES.map((c) => (
              <Link
                key={c.id}
                to="/category/$catId"
                params={{ catId: c.id }}
                className="card-premium flex min-h-11 shrink-0 items-center gap-2 !rounded-full px-4 py-2 text-sm font-semibold text-foreground"
              >
                <span aria-hidden="true">{c.emoji}</span>
                {c.label}
              </Link>
            ))}
          </div>
        </section>

        {/* متاجر قريبة منك */}
        {(nearbyStores.isLoading || stores.length > 0) && (
          <section className="space-y-2">
            <SectionHeader
              title={t("home_nearby_stores")}
              subtitle={
                pos
                  ? t("home_nearby_by_location")
                  : wilaya
                    ? t("home_nearby_by_wilaya")
                    : undefined
              }
              action={<SeeAllLink to="/stores">{t("home_explore_stores")}</SeeAllLink>}
            />
            {nearbyStores.isLoading && <ProductGridSkeleton count={2} />}
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {stores.map((st, i) => (
                <Reveal key={st.id} index={i}>
                  <StoreRailCard s={st} distance={st.distance ?? undefined} />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* وصل حديثًا — أحدث المنتجات */}
        <section className="space-y-2">
          <SectionHeader title={t("home_new_arrivals")} action={<SeeAllLink to="/explore" />} />
          {trending.isLoading && <ProductGridSkeleton count={6} />}
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {products.slice(0, 12).map((g, i) => (
              <Reveal key={g.product.id} index={i}>
                <div className="w-64 shrink-0">
                  <ProductCard g={g} />
                </div>
              </Reveal>
            ))}
          </div>
          {trending.isError && (
            <ErrorState
              scope="home:trending"
              error={trending.error}
              onRetry={() => trending.refetch()}
            />
          )}
          {!trending.isLoading && products.length === 0 && (
            <EmptyState
              Icon={Star}
              title={t("home_no_products")}
              hint={t("home_no_products_hint")}
            />
          )}
          {trending.hasNextPage && !trending.isFetchingNextPage && (
            <div className="mt-3 text-center">
              <button
                onClick={() => trending.fetchNextPage()}
                className="btn-secondary w-full py-2"
                disabled={trending.isFetchingNextPage}
              >
                {t("home_new_arrivals")}
              </button>
            </div>
          )}
        </section>

        {/* منتجات قد تعجبك — الأعلى تقييماً */}
        <section className="space-y-2">
          <SectionHeader title={t("home_might_like")} action={<SeeAllLink to="/explore" />} />
          {topRatedProducts.isLoading && <ProductGridSkeleton count={6} />}
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {topRated.slice(0, 12).map((g, i) => (
              <Reveal key={g.product.id} index={i}>
                <div className="w-64 shrink-0">
                  <ProductCard g={g} />
                </div>
              </Reveal>
            ))}
          </div>
          {topRatedProducts.isError && (
            <ErrorState
              scope="home:top-rated"
              error={topRatedProducts.error}
              onRetry={() => topRatedProducts.refetch()}
            />
          )}
          {!topRatedProducts.isLoading && topRated.length === 0 && (
            <EmptyState
              Icon={Star}
              title={t("home_no_products")}
              hint={t("home_no_products_hint")}
            />
          )}
        </section>
      </div>
    </>
  );
}
