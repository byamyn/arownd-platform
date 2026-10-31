import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Link, useLocation } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useBag } from "@/lib/bag";

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
  return { ms, label: `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` };
}

/** عناصر التنقل السفلية — دون شريط استلام ثابت أعلى الشاشة */
export function DynamicIsland() {
  const { t } = useTranslation();
  const { count } = useBag();
  const { pathname } = useLocation();

  const hideBag =
    pathname.startsWith("/bag") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/studio");

  return (
    <>
      {count > 0 && !hideBag && (
        <div className="fixed inset-x-0 bottom-20 z-30 flex justify-center px-4 pb-safe">
          <Link
            to="/bag"
            className="flex animate-fade-up items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-pop transition-all duration-200 hover:shadow-lift hover:brightness-105 active:scale-[0.98]"
          >
            <ShoppingBag className="size-4" />
            {t("bag_items_count", { count })}
          </Link>
        </div>
      )}
    </>
  );
}
