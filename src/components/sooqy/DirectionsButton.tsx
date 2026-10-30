import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { geoErrorMessage, useGeo } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { InAppNavigation } from "./InAppNavigation";
import * as maplibregl from "maplibre-gl";

/**
 * زر «الاتجاهات» — يفتح تنقل داخل التطبيق (OSRM + MapLibre).
 * يطلب إذن الموقع إذا لزم الأمر.
 */
export function DirectionsButton({
  lat,
  lng,
  label,
  className,
  children,
  ariaLabel,
  mapRef,
}: {
  lat?: number | null;
  lng?: number | null;
  label: string;
  className?: string;
  children?: ReactNode;
  ariaLabel?: string;
  mapRef?: React.RefObject<maplibregl.Map | null>;
}) {
  const { pos, ask, locating } = useGeo();
  const [busy, setBusy] = useState(false);
  const [showNav, setShowNav] = useState(false);

  const handleOpen = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let userPos = pos;
      if (!userPos) {
        const res = await ask();
        if (res.pos) userPos = res.pos;
        else {
          toast.error(geoErrorMessage(res.reason));
          return;
        }
      }
      if (userPos && lat != null && lng != null) {
        setShowNav(true);
      } else if (lat != null && lng != null) {
        // fallback: open Google Maps if no user position
        const q = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(q, "_blank", "noopener,noreferrer");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => setShowNav(false);

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-busy={busy || locating}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void handleOpen();
        }}
        className={cn("transition active:scale-95", busy && "opacity-60", className)}
      >
        {children}
      </button>
      {showNav && mapRef && (
        <InAppNavigation
          map={mapRef.current}
          origin={pos ? { lng: pos.lng, lat: pos.lat } : null}
          destination={lat != null && lng != null ? { lng, lat, name: label } : null}
          onClose={handleClose}
        />
      )}
    </>
  );
}
