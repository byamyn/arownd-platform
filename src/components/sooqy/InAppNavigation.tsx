import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import { X, Navigation, RotateCcw, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKm } from "@/lib/geo";

interface InAppNavigationProps {
  map: maplibregl.Map | null;
  origin: { lng: number; lat: number } | null;
  destination: { lng: number; lat: number; name?: string } | null;
  onClose: () => void;
}

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

export function InAppNavigation({ map, origin, destination, onClose }: InAppNavigationProps) {
  const [routeCoords, setRouteCoords] = useState<maplibregl.LngLat[] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const routeLayerRef = useRef<string | null>(null);
  const sourceId = "navigation-route";
  const layerId = "navigation-route-layer";

  const fetchRoute = useCallback(async () => {
    if (!origin || !destination) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${OSRM_BASE}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(url);
      const data: any = await res.json();
      if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("لم يتم العثور على مسار");
      const r = data.routes[0];
      setDistance(r.distance / 1000);
      setDuration(r.duration / 60);
      const coords: maplibregl.LngLat[] = [];
      r.geometry.coordinates.forEach((c: [number, number]) => coords.push(new maplibregl.LngLat(c[0], c[1])));
      setRouteCoords(coords);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل تحميل المسار");
    } finally {
      setLoading(false);
    }
  }, [origin, destination]);

  // Add/remove route layer on map
  useEffect(() => {
    if (!map || !routeCoords) {
      if (map && routeLayerRef.current) {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
        routeLayerRef.current = null;
      }
      return;
    }
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
      generateId: true,
    } as maplibregl.SourceSpecification);
    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "primary",
        "line-width": 4,
        "line-opacity": 0.8,
      },
    });
    routeLayerRef.current = layerId;
    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      routeLayerRef.current = null;
    };
  }, [map, routeCoords]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  useEffect(() => {
    if (!destination) return;
    onClose();
  }, [destination, onClose]);

  if (!destination) return null;

  return null;
}