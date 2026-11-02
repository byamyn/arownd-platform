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
import { InAppNavigation } from "@/components/sooqy/InAppNavigation";
import { RatingStars } from "@/components/sooqy/rating-stars";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

const StoreMap = lazy(() => import("@/components/sooqy/StoreMap"));

type Sort = "near" | "rating";

export function MapPage() {
  const { pos, locating, ask } = useGeo();
  const { t } = useTranslation();
  const [active, setActive] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sort, setSort] = useState<Sort>("near");
  const [showFilters, setShowFilters] = useState(false);
  const [navigationOrigin, setNavigationOrigin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<{
    lat: number;
    lng: number;
    name?: string;
  } | null>(null);
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
    <div className="fixed inset-0 bottom-[var(--nav-height)] z-0 h-[calc(100dvh-var(--nav-height))]">
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
        <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-border bg-card px-4">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("map_search_placeholder")}
            aria-label={t("map_search_label")}
            className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
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
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => {
              setOnlyOpen(false);
              setOnlyVerified(false);
            }}
            className={cn(
              "min-h-11 shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition",
              !onlyOpen && !onlyVerified
                ? "border-accent-ink bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground",
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
              "min-h-11 shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition",
              onlyOpen
                ? "border-accent-ink bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground",
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
              "min-h-11 shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition",
              onlyVerified
                ? "border-accent-ink bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground",
            )}
          >
            {t("map_verified")}
          </button>
          <button
            onClick={() => setShowFilters(true)}
            className="icon-btn shrink-0"
            aria-label={t("filter")}
          >
            <Filter className="size-4" />
          </button>
        </div>
        {!stores.isLoading && !stores.isError && list.length === 0 && (
          <div className="card-premium mt-2 p-3 text-center text-xs text-muted-foreground">
            {q.trim() || onlyOpen || onlyVerified ? t("map_no_match") : t("map_no_stores")}
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
            "icon-btn rounded-full border border-border bg-card",
            (onlyOpen || onlyVerified || sort !== "near") &&
              "border-accent-ink bg-primary text-primary-foreground",
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
            "icon-btn rounded-full border border-border bg-card",
            locating && "animate-pulse",
          )}
        >
          <Crosshair className="size-5" />
        </button>
      </div>

      {sel && !navigationTarget && (
        <div className="card-premium absolute inset-x-3 bottom-3 z-[1000] animate-fade-up p-4 sm:inset-x-5 sm:bottom-5">
          <button
            aria-label={t("close")}
            onClick={() => setActive(null)}
            className="icon-btn absolute top-3 end-3 rounded-full"
          >
            <X className="size-4" />
          </button>
          <div className="flex gap-3">
            <div className="size-[72px] shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-muted">
              {sel.cover_url && (
                <img src={sel.cover_url} alt="" className="size-full object-cover" />
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="line-clamp-1 pe-8 text-body font-bold text-foreground">{sel.name}</p>
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
            <button
              type="button"
              onClick={async () => {
                let start = pos;
                if (!start) {
                  const result = await ask();
                  start = result.pos;
                  if (!start) {
                    toast.error(geoErrorMessage(result.reason));
                    return;
                  }
                }
                setNavigationOrigin({ lat: start.lat, lng: start.lng });
                setNavigationTarget({
                  lat: Number(sel.latitude),
                  lng: Number(sel.longitude),
                  name: sel.name,
                });
              }}
              className="btn-primary !h-11 text-sm"
            >
              <Navigation className="size-4" />
              {t("map_directions")}
            </button>
          </div>
        </div>
      )}

      {navigationTarget && (
        <InAppNavigation
          map={mapRef.current}
          origin={navigationOrigin}
          destination={navigationTarget}
          onClose={() => {
            setNavigationTarget(null);
            setNavigationOrigin(null);
          }}
        />
      )}

      {showFilters && (
        <div
          className="absolute inset-0 z-[1100] flex items-end bg-[var(--color-overlay-scrim)]"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="w-full animate-fade-up rounded-t-[var(--radius-sheet)] border-t border-border bg-card p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
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
                    "flex min-h-11 w-full items-center justify-between rounded-[var(--radius-control)] border px-4 py-3 text-sm font-semibold transition",
                    sort === o.id
                      ? "border-accent-ink bg-primary-soft text-accent-ink-soft-foreground"
                      : "border-border bg-card text-foreground",
                  )}
                >
                  {o.label}
                  <span
                    className={cn(
                      "size-4 rounded-full border-2 transition",
                      sort === o.id ? "border-accent-ink bg-primary" : "border-border",
                    )}
                  />
                </button>
              ))}
              <button
                onClick={() => setOnlyOpen(!onlyOpen)}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between rounded-[var(--radius-control)] border px-4 py-3 text-sm font-semibold transition",
                  onlyOpen
                    ? "border-accent-ink bg-primary-soft text-accent-ink-soft-foreground"
                    : "border-border bg-card text-foreground",
                )}
              >
                {t("map_open_only")}
                <span
                  className={cn(
                    "size-4 rounded-full border-2 transition",
                    onlyOpen ? "border-accent-ink bg-primary" : "border-border",
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
