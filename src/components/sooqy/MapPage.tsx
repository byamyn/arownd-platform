import { ClientOnly, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useState, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { Crosshair, Filter, Navigation, Search, X } from "lucide-react";
import { toast } from "sonner";
import { ALGIERS, formatKm, geoErrorMessage, isOpenNow, useGeo } from "@/lib/geo";
import { fetchNearStores } from "@/lib/sooqy";
import { OpenBadge, VerifiedBadge } from "@/components/sooqy/badges";
import { ErrorState } from "@/components/sooqy/error-state";
import { DirectionsButton } from "@/components/sooqy/DirectionsButton";
import { RatingStars } from "@/components/sooqy/rating-stars";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

const StoreMap = lazy(() => import("@/components/sooqy/StoreMap"));

type Sort = "near" | "rating";

export function MapPage() {
  const { pos, denied, locating, ask } = useGeo();
  const { t } = useTranslation();
  const [active, setActive] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sort, setSort] = useState<Sort>("near");
  const [showFilters, setShowFilters] = useState(false);
  const [center, setCenter] = useState(ALGIERS);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const stores = useQuery({
    queryKey: ["near-stores", null, pos?.lat, pos?.lng],
    queryFn: () => fetchNearStores(null, pos?.lat, pos?.lng),
  });

  let list = stores.data ?? [];
  if (q.trim()) list = list.filter((s) => s.name.includes(q.trim()));
  if (onlyOpen) list = list.filter((s) => isOpenNow(s.opening_hours));
  if (onlyVerified) list = list.filter((s) => s.is_verified);
  if (sort === "near") list = [...list].sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));
  else list = [...list].sort((a, b) => Number(b.rating) - Number(a.rating));

  const sel = list.find((s) => s.id === active) ?? stores.data?.find((s) => s.id === active);

  return (
    <div className="fixed inset-0 bottom-16 z-0 h-[calc(100vh-4rem)]">
      <ClientOnly fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
          <StoreMap
            ref={mapRef}
            center={pos && center === ALGIERS ? pos : center}
            user={pos}
            stores={list}
            activeId={active}
            onSelect={setActive}
          />
        </Suspense>
      </ClientOnly>

      <div className="absolute inset-x-3 top-3 z-[1000] sm:inset-x-5 sm:top-5">
        <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-card/95 px-4 shadow-[0_12px_40px_rgba(15,23,42,.13)] backdrop-blur-xl ring-1 ring-black/[0.04]">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("map_search_placeholder")}
            aria-label={t("map_search_label")}
            className="h-[54px] min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label={t("clear_search")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="text-sm font-extrabold tracking-tight text-foreground">
              {t("map_title")}
            </p>
            <p
              className="mt-0.5 text-[11px] font-medium text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              {stores.isLoading
                ? t("map_loading")
                : denied
                  ? t("map_location_hint")
                  : t("map_store_count", { count: list.length })}
            </p>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/80 bg-card/90 text-[11px] font-bold text-foreground shadow-sm">
            {list.length}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => {
              setOnlyOpen(false);
              setOnlyVerified(false);
            }}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-xs font-bold shadow-sm transition",
              !onlyOpen && !onlyVerified
                ? "border-primary bg-primary text-[#17191C]"
                : "border-border/80 bg-card/90 text-foreground backdrop-blur",
            )}
          >
            {t("map_all_stores")}
          </button>
          <button
            onClick={() => {
              setOnlyOpen(!onlyOpen);
              setOnlyVerified(false);
            }}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-xs font-bold shadow-sm transition",
              onlyOpen
                ? "border-primary bg-primary text-[#17191C]"
                : "border-border/80 bg-card/90 text-foreground backdrop-blur",
            )}
          >
            {t("map_open_now")}
          </button>
          <button
            onClick={() => {
              setOnlyVerified(!onlyVerified);
              setOnlyOpen(false);
            }}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-xs font-bold shadow-sm transition",
              onlyVerified
                ? "border-primary bg-primary text-[#17191C]"
                : "border-border/80 bg-card/90 text-foreground backdrop-blur",
            )}
          >
            {t("map_verified")}
          </button>
          <button
            onClick={() => setShowFilters(true)}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/80 bg-card/90 text-foreground shadow-sm backdrop-blur"
            aria-label={t("filter")}
          >
            <Filter className="size-4" />
          </button>
        </div>
        {!stores.isLoading && !stores.isError && list.length === 0 && (
          <div className="mt-2 rounded-xl border border-border bg-card/95 p-3 text-center text-xs text-muted-foreground shadow-soft">
            {q.trim() || onlyOpen || onlyVerified
              ? t("map_no_match")
              : t("map_no_stores")}
          </div>
        )}
      </div>

      {stores.isError && (
        <div className="absolute inset-x-4 top-32 z-[1000]">
          <ErrorState scope="map:stores" error={stores.error} onRetry={() => stores.refetch()} />
        </div>
      )}

      <div className="absolute top-40 end-3 z-[1000] flex flex-col gap-2 sm:top-44 sm:end-5">
        <button
          aria-label={t("filter")}
          onClick={() => setShowFilters(true)}
          className={cn(
            "flex size-11 items-center justify-center rounded-full border border-white/70 bg-card/95 text-foreground shadow-[0_8px_24px_rgba(15,23,42,.16)] backdrop-blur-xl",
            (onlyOpen || onlyVerified || sort !== "near") && "border-primary bg-primary text-[#17191C]",
          )}
        >
          <Filter className="size-5" />
        </button>
        <button
          aria-label={t("map_my_location")}
          aria-busy={locating}
          onClick={async () => {
            const { pos: found, reason: why } = pos ? { pos, reason: null } : await ask();
            if (!found) {
              toast.error(geoErrorMessage(why));
              return;
            }
            setCenter({ lat: found.lat, lng: found.lng });
            setActive(null);
            toast.success(t("map_location_found"));
          }}
          className={cn(
            "flex size-11 items-center justify-center rounded-full border border-white/70 bg-card/95 text-foreground shadow-[0_8px_24px_rgba(15,23,42,.16)] backdrop-blur-xl",
            locating && "animate-pulse",
          )}
        >
          <Crosshair className="size-5" />
        </button>
      </div>

      {sel && (
        <div className="absolute inset-x-3 bottom-3 z-[1000] animate-fade-up rounded-[26px] border border-white/70 bg-card/95 p-4 shadow-[0_18px_55px_rgba(15,23,42,.2)] backdrop-blur-xl ring-1 ring-black/[0.04] sm:inset-x-5 sm:bottom-5">
          <button
            aria-label={t("close")}
            onClick={() => setActive(null)}
            className="absolute top-3 end-3 flex size-8 items-center justify-center rounded-full bg-neutral-100 text-muted-foreground"
          >
            <X className="size-4" />
          </button>
          <div className="flex gap-3">
            <div className="size-[72px] shrink-0 overflow-hidden rounded-2xl bg-muted ring-1 ring-black/5">
              {sel.cover_url && (
                <img src={sel.cover_url} alt="" className="size-full object-cover" />
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="line-clamp-1 pe-8 text-[15px] font-extrabold tracking-tight text-foreground">
                {sel.name}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <OpenBadge open={isOpenNow(sel.opening_hours)} />
                {sel.is_verified && <VerifiedBadge />}
              </div>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                {Number(sel.rating) > 0 && (
                  <RatingStars rating={Number(sel.rating)} size="size-3" showValue />
                )}
                {sel.commune}
                {sel.distance != null && (
                  <span className="font-bold text-ink">{formatKm(sel.distance)}</span>
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Link
              to="/stores/$storeId"
              params={{ storeId: sel.id }}
              className="btn-secondary !h-11 text-sm"
            >
              {t("map_view_store")}
            </Link>
            <DirectionsButton
              lat={sel.latitude}
              lng={sel.longitude}
              label={sel.name}
              className="btn-primary !h-11 text-sm"
              mapRef={mapRef}
            >
              <Navigation className="size-4" />
              {t("map_directions")}
            </DirectionsButton>
          </div>
        </div>
      )}

      {showFilters && (
        <div
          className="absolute inset-0 z-[1100] flex items-end bg-black/30"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="w-full animate-fade-up rounded-t-3xl border-t border-border bg-card p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-300" />
            <h2 className="text-lg font-extrabold tracking-tight text-foreground">{t("filter")}</h2>
            <div className="mt-4 space-y-2">
              {(
                [
                  { id: "near", label: t("map_nearest") },
                  { id: "rating", label: t("map_top_rated") },
                ] as const
              ).map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSort(o.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition",
                    sort === o.id
                      ? "border-accent-ink bg-primary-soft text-accent-ink-soft-foreground"
                      : "border-border bg-card text-foreground",
                  )}
                >
                  {o.label}
                  <span
                    className={cn(
                      "size-4 rounded-full border-2 transition",
                      sort === o.id ? "border-accent-ink bg-primary" : "border-neutral-300",
                    )}
                  />
                </button>
              ))}
              <button
                onClick={() => setOnlyOpen(!onlyOpen)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition",
                  onlyOpen
                    ? "border-accent-ink bg-primary-soft text-accent-ink-soft-foreground"
                    : "border-border bg-card text-foreground",
                )}
              >
                {t("map_open_only")}
                <span
                  className={cn(
                    "size-4 rounded-full border-2 transition",
                    onlyOpen ? "border-accent-ink bg-primary" : "border-neutral-300",
                  )}
                />
              </button>
            </div>
            <button onClick={() => setShowFilters(false)} className="btn-primary mt-5 w-full">
              {t("apply")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
