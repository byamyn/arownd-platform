import { useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { WifiOff } from "lucide-react";
import { useOnline } from "@/lib/conn";

/** لافتة انقطاع الاتصال — أنيقة وواضحة */
export function ConnectionBanner() {
  const online = useOnline();
  const queryClient = useQueryClient();
  const wasOffline = useRef(false);

  const { t } = useTranslation();

  useEffect(() => {
    if (online) {
      if (wasOffline.current) {
        wasOffline.current = false;
        void queryClient.invalidateQueries();
      }
    } else {
      wasOffline.current = true;
    }
  }, [online, queryClient]);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-3 pt-[max(0.5rem,env(safe-area-inset-top))]"
    >
      <div className="animate-fade-up flex items-center gap-2 rounded-full bg-warning px-4 py-2 text-xs font-bold text-warning-foreground ">
        <WifiOff className="size-4 shrink-0" aria-hidden />
        <span>{t("offline_banner")}</span>
      </div>
    </div>
  );
}
