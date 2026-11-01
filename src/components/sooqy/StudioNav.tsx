import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Truck, Settings2, UserRound } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/studio", key: "studio_nav_overview", Icon: LayoutDashboard },
  { to: "/studio/shipments", key: "studio_nav_shipments", Icon: Truck },
  { to: "/studio/settings", key: "studio_nav_settings", Icon: Settings2 },
  { to: "/settings", key: "studio_nav_profile", Icon: UserRound },
] as const;

export function StudioNav() {
  const { pathname } = useLocation();
  const currentPath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const { t } = useTranslation();

  return (
    <nav aria-label={t("studio_nav_aria")} className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl items-stretch gap-1 px-1">
      {ITEMS.map(({ to, key, Icon }) => {
        const active = currentPath === to || (to === "/studio" && currentPath.startsWith("/studio/orders/"));
        return (
          <Link key={to} to={to} aria-current={active ? "page" : undefined} className={cn("group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition-colors", active ? "text-accent-ink" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <span className={cn("flex size-8 items-center justify-center rounded-xl transition-colors", active ? "bg-primary/15" : "group-active:bg-muted")}><Icon className="size-5 shrink-0" aria-hidden="true" /></span>
            <span>{t(key)}</span>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
