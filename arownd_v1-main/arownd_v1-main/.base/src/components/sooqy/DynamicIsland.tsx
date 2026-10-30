import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { Clock, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useBag } from "@/lib/bag";
import { fetchMyOrders, fetchMyReservations } from "@/lib/sooqy";

export function useCountdown(to: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!to) return null;
  const ms = Math.max(0, new Date(to).getTime() - now);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { ms, label: `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` };
}

/** شريط إشعارات علوي أنيق — لحظات الاستلام والتوصيل */
export function DynamicIsland() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { count } = useBag();
  const { pathname } = useLocation();
  const res = useQuery({ queryKey: ["my-reservations"], queryFn: fetchMyReservations, enabled: !!user, refetchInterval: 60000 });
  const orders = useQuery({ queryKey: ["my-orders"], queryFn: fetchMyOrders, enabled: !!user });
  const active = res.data?.find(r => r.status === "pending" && new Date(r.expires_at).getTime() > Date.now());
  const shipping = orders.data?.find(o => o.status === "confirmed" || o.status === "shipped");
  const cd = useCountdown(active?.expires_at ?? null);

  const hideBag = pathname.startsWith("/bag") || pathname.startsWith("/checkout") || pathname.startsWith("/studio");

  return (
    <>
      {(active || shipping) && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[env(safe-area-inset-top)]">
          <Link
            to="/profile"
            className="pointer-events-auto mt-2 flex animate-fade-up items-center gap-2.5 rounded-full border border-border/50 bg-primary-soft px-4 py-2 text-xs text-accent-ink shadow-lift"
          >
            {active ? (
              <>
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/20 text-accent-ink">
                  <Clock className="size-3.5" />
                </span>
                <span className="font-mono font-bold tracking-widest text-accent-ink">
                  {active.code}
                </span>
                <span className="opacity-70">{t("pickup_within")}</span>
                <span className="font-mono font-bold tabular-nums text-accent-ink">{cd?.label}</span>
              </>
            ) : (
              <>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/10">
                  {shipping!.status === "shipped" ? <Truck className="size-3.5 text-success" /> : <PackageCheck className="size-3.5 text-success" />}
                </span>
                <span className="font-bold">
                  {shipping!.status === "shipped" ? t("order_on_way") : t("order_confirmed")}
                </span>
                <span className="opacity-60">{t("track_now")}</span>
              </>
            )}
          </Link>
        </div>
      )}

      {count > 0 && !hideBag && (
        <div className="fixed inset-x-0 bottom-20 z-30 flex justify-center px-4 pb-safe">
          <Link to="/bag" className="flex animate-fade-up items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-pop transition-all duration-200 hover:shadow-lift hover:brightness-105 active:scale-[0.98]">
            <ShoppingBag className="size-4" />
            {t("bag_items_count", { count })}
          </Link>
        </div>
      )}
    </>
  );
}