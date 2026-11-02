import React, { useCallback, useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import maplibreglWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "maplibre-gl/dist/maplibre-gl.css";
import { Minus, Plus, RotateCcw, Mountain, Layers3 } from "lucide-react";
import { MAP_COLORS, OSM_RASTER_FALLBACK } from "./map-style";
import { AROWND_VERSATILES_STYLE, VERSATILES_SOURCE_ID } from "./map-style-versatiles";
import type { LatLng } from "@/lib/geo";
import type { Store } from "@/lib/sooqy";
import { categoryEmoji } from "@/lib/taxonomy";

const C = MAP_COLORS;

function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

function gpuInfo(): string {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return "لا يوجد WebGL2";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "غير معروف";
    return renderer;
  } catch {
    return "تعذّر القراءة";
  }
}

const DEBUG = (() => {
  if (import.meta.env.DEV) return true;
  try {
    if (typeof window === "undefined") return false;
    if (/[?&]mapdebug/.test(window.location.search)) return true;
    return window.localStorage.getItem("sooqy:mapdebug") === "1";
  } catch {
    return false;
  }
})();

function dbg(...args: unknown[]) {
  if (DEBUG) console.log("[StoreMap]", ...args);
}

function createMarkerElement(emoji = "🛍️"): HTMLElement {
  const root = document.createElement("div");
  root.style.cssText =
    "display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;";

  const pill = document.createElement("div");
  pill.className = "arownd-pin-pill";
  pill.style.cssText = [
    "max-width:150px",
    "padding:4px 10px",
    "border-radius:9999px",
    "background:rgba(255,255,255,.97)",
    "border:1px solid #E2E8F0",
    "color:" + C.ink,
    "font-size:11.5px",
    "font-weight:700",
    "line-height:1.3",
    "white-space:nowrap",
    "overflow:hidden",
    "text-overflow:ellipsis",
    "box-shadow:0 6px 18px rgba(15,23,42,.16)",
    "opacity:0",
    "transform:translateY(4px) scale(.94)",
    "transition:opacity .18s ease, transform .18s ease",
    "pointer-events:none",
  ].join(";");

  const pin = document.createElement("div");
  pin.className = "arownd-pin-dot";
  pin.style.cssText =
    "display:flex;align-items:center;justify-content:center;border-radius:16px 16px 16px 5px;transform:rotate(-45deg);color:#172033;border:3px solid #fff;transition:transform .18s ease, box-shadow .18s ease, border-width .18s ease;";

  const glyph = document.createElement("span");
  glyph.textContent = emoji;
  glyph.style.cssText = "display:block;transform:rotate(45deg);";
  pin.append(glyph);
  pin.dataset["emoji"] = emoji;
  root.append(pill, pin);
  return root;
}

function applyMarkerStyle(el: HTMLElement, active: boolean, label = ""): HTMLElement {
  const pill = el.querySelector(".arownd-pin-pill") as HTMLElement | null;
  const pin = el.querySelector(".arownd-pin-dot") as HTMLElement | null;
  if (!pill || !pin) return el;

  if (label && pill.textContent !== label) pill.textContent = label;
  pill.style.opacity = active ? "1" : "0";
  pill.style.transform = active ? "translateY(0) scale(1)" : "translateY(4px) scale(.94)";
  pill.style.pointerEvents = active ? "auto" : "none";

  const size = active ? 36 : 28;
  const border = active ? 4 : 3;
  const shadow = active
    ? "0 10px 30px rgba(180,205,30,.38), 0 0 0 6px rgba(223,255,69,.26)"
    : "0 6px 18px rgba(15,23,42,.16)";
  pin.style.width = size + "px";
  pin.style.height = size + "px";
  pin.style.borderWidth = border + "px";
  pin.style.boxShadow = shadow;
  pin.style.background = active
    ? C.primaryDeep
    : `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`;
  pin.style.transform = active ? "rotate(-45deg) scale(1.12)" : "rotate(-45deg) scale(1)";
  pin.style.background = "#FFFFFF";
  pin.style.borderColor = active ? "#DFFF72" : "#FFFFFF";

  return el;
}

const StoreMapComponent = React.memo(
  React.forwardRef<
    maplibregl.Map | null,
    {
      center: LatLng;
      user?: LatLng | null;
      stores?: Store[];
      activeId?: string | null;
      onSelect?: (id: string | null) => void;
    }
  >(function StoreMapComponent({ center, user, stores = [], activeId, onSelect }, ref) {
    const mapRef = useRef<maplibregl.Map | null>(null);
    const initialCenterRef = useRef(center);
    const containerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
    const userMarkerRef = useRef<maplibregl.Marker | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [tilesWarn, setTilesWarn] = useState(false);
    const [usedFallback, setUsedFallback] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const [terrainEnabled, setTerrainEnabled] = useState(false);
    const [is3D, setIs3D] = useState(true);
    const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
    const usedFallbackRef = useRef(false);

    useEffect(() => {
      maplibregl.setWorkerUrl(maplibreglWorkerUrl);
      usedFallbackRef.current = false;
      if (DEBUG) dbg("عنوان الـ worker:", maplibreglWorkerUrl);
    }, []);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const cr = entry.contentRect;
          setContainerSize({ w: Math.round(cr.width), h: Math.round(cr.height) });
          if (mapRef.current && cr.width > 0 && cr.height > 0) {
            requestAnimationFrame(() => mapRef.current?.resize());
          }
        }
      });
      ro.observe(el);
      const cr = el.getBoundingClientRect();
      setContainerSize({ w: Math.round(cr.width), h: Math.round(cr.height) });
      return () => ro.disconnect();
    }, []);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      if (!hasWebGL2()) {
        setError("متصفحك لا يدعم WebGL2 — لا يمكن عرض الخريطة.");
        return;
      }
      if (el.clientWidth === 0 || el.clientHeight === 0) {
        dbg("تحذير: الحاوية بلا مقاس فعلي — الخريطة لن تظهر مهما كان الإعداد صحيحًا");
      }
      dbg("مقاس الحاوية:", el.clientWidth, "×", el.clientHeight);
      dbg("WebGL2:", hasWebGL2(), "· كرت الرسوميات:", gpuInfo());
      dbg("سياق آمن:", window.isSecureContext, "· متصل:", navigator.onLine);

      // إجبار العنصر على العرض الكامل (قد يكون محصوراً بـ Suspense/ClientOnly)
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.minWidth = "100%";
      el.style.minHeight = "100%";
      // تعيين ارتفاع أدنى للخريطة على الأجهزة المتحركة لضمان الرؤية
      if (el.clientWidth < 768) {
        el.style.minHeight = "400px";
      }

      const map = new maplibregl.Map({
        container: el,
        style: AROWND_VERSATILES_STYLE as maplibregl.StyleSpecification,
        center: [initialCenterRef.current.lng, initialCenterRef.current.lat] as [number, number],
        zoom: 13,
        attributionControl: { compact: true },
        dragRotate: true,
        touchPitch: true,
        pitch: 48,
        bearing: -12,
        maxPitch: 60,
        cooperativeGestures: true,
        maxZoom: 19,
        minZoom: 4,
        maxCanvasSize: [4096, 4096],
      });

      mapRef.current = map;
      if (typeof ref === "function") ref(map);
      else if (ref && typeof ref === "object") ref.current = map;

      // إجبار تغيير الحجم بعد إنشاء الخريطة (الحاوية قد تكون 1px أثناء Suspense)
      requestAnimationFrame(() => map.resize());

      map.on("style.load", () => {
        dbg("حدث style.load — النمط المتجهي حُمّل");
        setUsedFallback(usedFallbackRef.current);
        setTerrainEnabled(false);
        setTilesWarn(false);
        setMapReady(true);
        requestAnimationFrame(() => map.resize());
      });

      map.on("error", (e) => {
        const err = (
          e as unknown as { error?: { message?: string; url?: string; status?: number } }
        ).error;
        const msg = err?.message ?? String(e);
        const url = err?.url ?? "";
        console.error("[StoreMap] خطأ في الخريطة:", msg, url);
        // A terrain tile failure must never replace the working basemap.
        if (url.includes("elevation-tiles-prod")) {
          console.warn("[StoreMap] تعذّر تحميل بلاطات التضاريس؛ ستبقى الخريطة الأساسية متاحة.");
          try {
            map.setTerrain(null);
          } catch {
            // The style may already be changing.
          }
          setTerrainEnabled(false);
          return;
        }
        if (usedFallbackRef.current) return;
        if (
          url.includes("openfreemap.org/planet") ||
          url.includes("tiles.versatiles.org/tiles/osm") ||
          url.includes("tiles.versatiles.org/fonts") ||
          msg.includes("source") ||
          msg.includes("tile") ||
          msg.includes("Style")
        ) {
          console.warn(
            "[StoreMap] فشل تحميل البلاطات المتجهية — التحويل للنمط الاحتياطي (OSM نقطي)",
          );
          try {
            setMapReady(false);
            usedFallbackRef.current = true;
            setUsedFallback(true);
            map.setStyle(OSM_RASTER_FALLBACK as maplibregl.StyleSpecification);
            setTilesWarn(true);
          } catch (err2) {
            console.error("[StoreMap] فشل التحويل للـ fallback:", err2);
            setError("تعذّر عرض الخريطة بسبب مشكلة في مصدر البلاطات.");
          }
        }
      });

      map.on("load", () => {
        dbg("حدث load — الخريطة جاهزة");
        setMapReady(true);
        setTimeout(() => {
          try {
            if (!map.areTilesLoaded()) {
              setTilesWarn(true);
              dbg("tiles: لم تصل بلاطات بعد (areTilesLoaded=false)");
            } else {
              dbg("tiles: وصلت أول بلاطة بنجاح ✔");
            }
          } catch {
            /* ignore */
          }
        }, 7000);
      });

      map.on("idle", () => {
        const cw = Math.round(map.getCanvas().width);
        const ch = Math.round(map.getCanvas().height);
        dbg("حدث idle · canvas:", cw, "×", ch, "· loaded:", map.areTilesLoaded());
        if (cw < 100) {
          // العرض صغير جداً — إجبار resize
          requestAnimationFrame(() => map.resize());
        }
      });

      // مراقبة تغيير مقاس الحاوية فعلياً (ResizeObserver إضافي للخريطة نفسها)
      const roMap = new ResizeObserver(() => {
        if (mapRef.current) {
          const cw = mapRef.current.getCanvas().width;
          if (cw < 100) {
            requestAnimationFrame(() => mapRef.current!.resize());
          }
        }
      });
      roMap.observe(el);

      // فحص دوري احتياطي: إذا بقي العرض صغيراً بعد تحميل النمط، نعيد المحاولة
      const checkInterval = setInterval(() => {
        if (mapRef.current && mapRef.current.getCanvas().width < 100) {
          mapRef.current.resize();
        } else {
          clearInterval(checkInterval);
        }
      }, 500);
      setTimeout(() => clearInterval(checkInterval), 10000);

      map.on("data", (e) => {
        if (e.dataType === "source" && e.sourceId === VERSATILES_SOURCE_ID && e.isSourceLoaded) {
          dbg("وصلت بيانات البلاطات المتجهية ✔");
        }
      });

      return () => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current.clear();
        userMarkerRef.current?.remove();
        userMarkerRef.current = null;
        mapRef.current?.remove();
        mapRef.current = null;
        if (typeof ref === "function") ref(null);
        else if (ref && typeof ref === "object") ref.current = null;
        roMap.disconnect();
        clearInterval(checkInterval);
      };
    }, [attempt, ref]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;
      map.setCenter([center.lng, center.lat]);
    }, [center.lat, center.lng]);

    // Cluster store coordinates in a GeoJSON source. Detailed DOM pins are
    // mounted only at neighborhood zoom to keep wide-area views responsive.
    useEffect(() => {
      const map = mapRef.current;
      if (!mapReady || !map) return;

      const sourceId = "arownd-store-points";
      const clusterLayerId = "arownd-store-clusters";
      const countLayerId = "arownd-store-cluster-count";
      const pointLayerId = "arownd-store-unclustered";

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
          cluster: true,
          clusterMaxZoom: 13,
          clusterRadius: 56,
          clusterMinPoints: 2,
        });
      }
      if (!map.getLayer(clusterLayerId)) {
        map.addLayer({
          id: clusterLayerId,
          type: "circle",
          source: sourceId,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#B9D84B",
              10,
              "#8FBF3D",
              30,
              "#638F36",
            ],
            "circle-radius": ["step", ["get", "point_count"], 19, 10, 23, 30, 28],
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 3,
            "circle-opacity": 0.96,
          },
        });
      }
      if (!map.getLayer(countLayerId)) {
        map.addLayer({
          id: countLayerId,
          type: "symbol",
          source: sourceId,
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["to-string", ["get", "point_count_abbreviated"]],
            "text-font": ["Noto Sans Regular"],
            "text-size": 12,
            "text-allow-overlap": true,
          },
          paint: { "text-color": "#24311B" },
        });
      }
      if (!map.getLayer(pointLayerId)) {
        map.addLayer({
          id: pointLayerId,
          type: "circle",
          source: sourceId,
          filter: ["!", ["has", "point_count"]],
          maxzoom: 14,
          paint: {
            "circle-radius": 5,
            "circle-color": "#DFFF72",
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 2,
          },
        });
      }

      const onClusterClick = (event: maplibregl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(event.point, { layers: [clusterLayerId] });
        const feature = features[0];
        if (!feature) return;
        const clusterId = Number(feature.properties?.["cluster_id"]);
        const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
        const coordinates = (feature.geometry as { coordinates: [number, number] }).coordinates;
        void source
          .getClusterExpansionZoom(clusterId)
          .then((zoom) => {
            map.easeTo({
              center: coordinates,
              zoom: Math.min(zoom + 0.35, 17),
              duration: 520,
            });
          })
          .catch((clusterError: unknown) => {
            dbg("تعذّر توسيع مجموعة المتاجر:", clusterError);
          });
      };
      const onClusterEnter = () => {
        map.getCanvas().style.cursor = "pointer";
      };
      const onClusterLeave = () => {
        map.getCanvas().style.cursor = "";
      };
      map.on("click", clusterLayerId, onClusterClick);
      map.on("mouseenter", clusterLayerId, onClusterEnter);
      map.on("mouseleave", clusterLayerId, onClusterLeave);

      const features = stores.flatMap((store) => {
        const item = store as Store & {
          latitude?: number | null;
          longitude?: number | null;
          category?: string | null;
        };
        if (
          typeof item.latitude !== "number" ||
          typeof item.longitude !== "number" ||
          !Number.isFinite(item.latitude) ||
          !Number.isFinite(item.longitude) ||
          Math.abs(item.latitude) > 90 ||
          Math.abs(item.longitude) > 180
        ) {
          return [];
        }
        return [
          {
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [item.longitude, item.latitude],
            },
            properties: {
              id: String(store.id),
              name: store.name ?? "",
              category: item.category ?? "",
            },
          },
        ];
      });
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features,
      });

      const renderDetailMarkers = () => {
        const visibleIds = new Set<string>();
        if (map.getZoom() >= 14) {
          stores.forEach((store) => {
            const item = store as Store & {
              latitude?: number | null;
              longitude?: number | null;
              category?: string | null;
            };
            const id = String(store.id);
            if (
              typeof item.latitude !== "number" ||
              typeof item.longitude !== "number" ||
              !Number.isFinite(item.latitude) ||
              !Number.isFinite(item.longitude) ||
              Math.abs(item.latitude) > 90 ||
              Math.abs(item.longitude) > 180
            ) {
              return;
            }
            visibleIds.add(id);
            let marker = markersRef.current.get(id);
            if (!marker) {
              const el = createMarkerElement(categoryEmoji(item.category));
              marker = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([
                item.longitude,
                item.latitude,
              ]);
              el.addEventListener("click", () => onSelect?.(id));
              marker.addTo(map);
              markersRef.current.set(id, marker);
            } else {
              marker.setLngLat([item.longitude, item.latitude]);
              const glyph = marker.getElement().querySelector(".arownd-pin-dot span");
              if (glyph) glyph.textContent = categoryEmoji(item.category);
            }
            applyMarkerStyle(marker.getElement(), activeId === id, String(store.name ?? ""));
          });
        }
        markersRef.current.forEach((marker, id) => {
          if (!visibleIds.has(id)) {
            marker.remove();
            markersRef.current.delete(id);
          }
        });
      };
      renderDetailMarkers();
      map.on("zoomend", renderDetailMarkers);
      return () => {
        map.off("click", clusterLayerId, onClusterClick);
        map.off("mouseenter", clusterLayerId, onClusterEnter);
        map.off("mouseleave", clusterLayerId, onClusterLeave);
        map.off("zoomend", renderDetailMarkers);
      };
    }, [stores, activeId, mapReady, onSelect]);

    useEffect(() => {
      const map = mapRef.current;
      if (!mapReady || !map) return;
      if (userMarkerRef.current) userMarkerRef.current.remove();
      if (!user) return;
      const el = document.createElement("div");
      el.style.cssText =
        "width:14px;height:14px;border-radius:9999px;background:#2563EB;border:2px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,.22),0 6px 16px rgba(37,99,235,.3);animation:arownd-pulse 1.8s ease-in-out infinite;";
      userMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([user.lng, user.lat])
        .addTo(map);
    }, [user, mapReady]);

    const zoomBy = useCallback((delta: number) => {
      const map = mapRef.current;
      if (!map) return;
      map.easeTo({ zoom: map.getZoom() + delta, duration: 280 });
    }, []);

    const recenter = useCallback(() => {
      const map = mapRef.current;
      if (!map) return;
      map.flyTo({ center: [center.lng, center.lat], zoom: 14, duration: 600 });
    }, [center.lat, center.lng]);

    if (error) {
      return (
        <div className="relative size-full flex flex-col items-center justify-center gap-3 text-center px-4 bg-[#F8FAFC]">
          <div className="text-base font-bold text-[#111827]">{error}</div>
          <div className="text-xs text-[#64748B]">كرت الرسوميات: {gpuInfo()}</div>
          <button
            onClick={() => {
              setError(null);
              setAttempt((a) => a + 1);
            }}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#DFFF45] px-4 py-2 text-sm font-bold text-[#17191C] shadow-soft"
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }

    return (
      <div className="relative size-full" style={{ width: "100%", height: "100%" }}>
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={{ width: "100%", height: "100%" }}
        />
        {DEBUG && containerSize.w === 0 && containerSize.h === 0 && (
          <div className="absolute end-2 top-2 z-10 rounded-md bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-900 shadow-soft">
            الحاوية 0×0 — تحقق من ارتفاع المسار (bottom-16 + calc(100vh-4rem))
          </div>
        )}
        {tilesWarn && !usedFallback && (
          <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-[#334155] shadow-soft ring-1 ring-[#E2E8F0]">
            لم تصل بلاطات الخريطة بعد — قد يستغرق بضع ثوانٍ أو يظهر عند تحريك الخريطة
          </div>
        )}
        {usedFallback && (
          <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-900 shadow-soft ring-1 ring-amber-200">
            تم التحويل لنمط OSM احتياطيًا (بلاطات متجهية غير متاحة مؤقتًا)
          </div>
        )}
        <div className="absolute bottom-4 start-4 z-10 flex flex-col gap-2">
          <button
            onClick={() => zoomBy(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#111827] shadow-soft ring-1 ring-[#E2E8F0] transition hover:bg-white active:scale-95"
            aria-label="تكبير"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            onClick={() => zoomBy(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#111827] shadow-soft ring-1 ring-[#E2E8F0] transition hover:bg-white active:scale-95"
            aria-label="تصغير"
          >
            <Minus className="h-5 w-5" />
          </button>
          <button
            onClick={recenter}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#111827] shadow-soft ring-1 ring-[#E2E8F0] transition hover:bg-white active:scale-95"
            aria-label="العودة لمركز الخريطة"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={!mapReady}
            onClick={() => {
              const map = mapRef.current;
              if (!map || !mapReady) return;
              const next3D = !is3D;
              map.easeTo({ pitch: next3D ? 48 : 0, duration: 520 });
              setIs3D(next3D);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#111827] shadow-soft ring-1 ring-[#E2E8F0] transition hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={is3D ? "التحويل إلى العرض المسطح" : "التحويل إلى العرض ثلاثي الأبعاد"}
            aria-pressed={is3D}
            title={is3D ? "عرض ثنائي الأبعاد" : "عرض ثلاثي الأبعاد"}
          >
            <Layers3 className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={!mapReady || usedFallback}
            onClick={() => {
              const map = mapRef.current;
              if (!map || !mapReady || usedFallback) return;
              try {
                if (terrainEnabled) {
                  map.setTerrain(null);
                  setTerrainEnabled(false);
                } else {
                  map.setTerrain({ source: "arownd-terrain-dem", exaggeration: 1 });
                  setTerrainEnabled(true);
                }
              } catch (terrainError) {
                console.warn("[StoreMap] تعذّر تفعيل التضاريس ثلاثية الأبعاد:", terrainError);
              }
            }}
            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-soft ring-1 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${terrainEnabled ? "bg-[#DFFF72] text-[#202A25] ring-[#C6E62E]" : "bg-white/95 text-[#111827] ring-[#E2E8F0] hover:bg-white"}`}
            aria-label={
              terrainEnabled ? "إيقاف التضاريس ثلاثية الأبعاد" : "إظهار التضاريس ثلاثية الأبعاد"
            }
            aria-pressed={terrainEnabled}
            title="التضاريس ثلاثية الأبعاد"
          >
            <Mountain className="h-5 w-5" />
          </button>
        </div>
        <style>{`
        @keyframes arownd-pulse {
          0% { box-shadow: 0 0 0 0 rgba(37,99,235,.45), 0 6px 16px rgba(37,99,235,.3); }
          70% { box-shadow: 0 0 0 10px rgba(37,99,235,0), 0 6px 16px rgba(37,99,235,.3); }
          100% { box-shadow: 0 0 0 0 rgba(37,99,235,0), 0 6px 16px rgba(37,99,235,.3); }
        }
      `}</style>
      </div>
    );
  }),
);

StoreMapComponent.displayName = "StoreMap";

export default StoreMapComponent;
