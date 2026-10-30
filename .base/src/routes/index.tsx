import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bell, Star, MapPin } from "lucide-react";
import { useGeo } from "@/lib/geo";
import { searchProducts } from "@/lib/sooqy";
import { ProductCard } from "@/components/sooqy/cards";
import { ProductGridSkeleton } from "@/components/sooqy/skeleton";
import { EmptyState } from "@/components/sooqy/empty-state";
import { ErrorState } from "@/components/sooqy/error-state";
import { Reveal } from "@/components/sooqy/reveal";
import { ArowndBrand } from "@/components/sooqy/logo";
import { SeoHead } from "@/components/seo/SeoHead";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SOOQY — السوق الجزائري في جيبك" },
      {
        name: "description",
        content:
          "SOOQY سوق جزائري: شاهد السلعة قبل الخروج، اكتشف المنتجات والمتاجر القريبة، قارن الأسعار، احجز أو اطلب التوصيل إلى 58 ولاية.",
      },
      { property: "og:title", content: "SOOQY — السوق الجزائري في جيبك" },
      { property: "og:description", content: "شاهد السلعة قبل الخروج للبحث عنها." },
    ],
  }),
  component: Home,
});

function Home() {
  const { pos } = useGeo();
  const [wilaya, setWilaya] = useState<number | null>(null);

  useEffect(() => {
    const w = localStorage.getItem("sooqy:wilaya");
    if (w) setWilaya(Number(w));
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
  const products = (trending.data?.pages ?? []).flat();
  const topRated = topRatedProducts.data ?? [];

  return (
    <>
      <SeoHead
        title="SOOQY — السوق الجزائري في جيبك"
        description="SOOQY سوق جزائري: شاهد السلعة قبل الخروج، اكتشف المنتجات والمتاجر القريبة، قارن الأسعار، احجز أو اطلب التوصيل إلى 58 ولاية."
        keywords="سوق جزائري, منتجات الجزائر, متاجر الجزائر, توصيل الجزائر, SOOQY"
        ogType="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "SOOQY",
          url: "https://sooqy.app",
          description: "سوق جزائري: شاهد السلعة قبل الخروج للبحث عنها.",
          inLanguage: "ar-DZ",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://sooqy.app/explore?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <div className="space-y-6 px-4 pt-4">
        <header className="flex items-center justify-between gap-3 px-4 py-4">
          <ArowndBrand />
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const w = prompt("أدخل رقم الولاية (مثل 16 للجزائر):");
                if (w) {
                  const nw = Number(w);
                  if (!isNaN(nw)) {
                    setWilaya(nw);
                    localStorage.setItem("sooqy:wilaya", String(nw));
                  }
                }
              }}
              className="icon-btn"
              aria-label="تحديد الولاية"
            >
              <MapPin className="size-5" />
            </button>
            <Link to="/notifications" aria-label="الإشعارات" className="icon-btn">
              <Bell className="size-5" />
            </Link>
          </div>
        </header>

        {/* وصل حديثًا — أحدث المنتجات */}
        <section className="space-y-2">
          <h2 className="text-h3 text-foreground">وصل حديثًا</h2>
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
              title="لا توجد منتجات حديثة"
              hint="ستظهر المنتجات الجديدة عند توفرها."
            />
          )}
          {trending.hasNextPage && !trending.isFetchingNextPage && (
            <div className="mt-3 text-center">
              <button
                onClick={() => trending.fetchNextPage()}
                className="btn-secondary w-full py-2"
                disabled={trending.isFetchingNextPage}
              >
                تحميل المزيد
              </button>
            </div>
          )}
        </section>

        {/* منتجات قد تعجبك — الأعلى تقييماً */}
        <section className="space-y-2">
          <h2 className="text-h3 text-foreground">منتجات قد تعجبك</h2>
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
              title="لا توجد منتجات حالياً"
              hint="ستظهر المنتجات الأعلى تقييماً عند توفرها."
            />
          )}
        </section>
      </div>
    </>
  );
}
