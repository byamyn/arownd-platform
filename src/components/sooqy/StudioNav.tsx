import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Truck, Settings2, UserRound } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/studio", key: "studio_nav_overview", Icon: LayoutDashboard },
  { to: "/studio/shipments", key: "studio_nav_shipments", Icon: Truck },
  { to: "/studio/settings", key: "studio_nav_settings", Icon: Settings2 },
  { to: "/profile", key: "studio_nav_profile", Icon: UserRound },
] as const;

export function StudioNav() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  return (
    <nav aria-label={t("studio_nav_aria")} className="sticky top-[4.25rem] z-20 -mx-1 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card/95 p-1 shadow-sm backdrop-blur sm:mx-0 sm:gap-2 sm:p-1.5">
      {ITEMS.map(({ to, key, Icon }) => {
        const active = pathname === to || (to === "/studio" && pathname.startsWith("/studio/orders/"));
        return (
          <Link key={to} to={to} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition-colors sm:flex-1 sm:px-4 sm:text-sm", active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
