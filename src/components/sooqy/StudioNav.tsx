import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, Sparkles, Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchMyStore } from "@/lib/sooqy";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function StudioNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { t, isRTL } = useTranslation();
  const store = useQuery({
    queryKey: ["my-store"],
    queryFn: fetchMyStore,
    enabled: !!user,
  });
  const currentPath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const items = [
    { to: "/", key: "home", Icon: Home },
    { to: "/explore", key: "explore", Icon: Search },
    { to: "/latest", key: "studio_nav_latest", Icon: Sparkles },
  ] as const;
  const isStoreActive = !!store.data?.id && currentPath === `/stores/${store.data.id}`;

  return (
    <nav aria-label={t("studio_nav_aria")} className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className={cn("mx-auto flex w-full max-w-2xl items-stretch gap-1 px-1", isRTL ? "flex-row-reverse" : "")}>
        {items.map(({ to, key, Icon }) => {
          const active = currentPath === to;
          return (
            <Link key={to} to={to} aria-current={active ? "page" : undefined} className={cn("group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition-colors", active ? "text-accent-ink" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <span className={cn("flex size-8 items-center justify-center rounded-xl transition-colors", active ? "bg-primary/15" : "group-active:bg-muted")}><Icon className="size-5 shrink-0" aria-hidden="true" /></span>
              <span>{t(key)}</span>
            </Link>
          );
        })}
        {store.data?.id ? (
          <Link to="/stores/$storeId" params={{ storeId: store.data.id }} aria-current={isStoreActive ? "page" : undefined} className={cn("group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition-colors", isStoreActive ? "text-accent-ink" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <span className={cn("flex size-8 items-center justify-center rounded-xl", isStoreActive ? "bg-primary/15" : "group-active:bg-muted")}><Store className="size-5 shrink-0" aria-hidden="true" /></span>
            <span>{t("studio_nav_store")}</span>
          </Link>
        ) : (
          <Link to="/studio" aria-current={currentPath === "/studio" ? "page" : undefined} className="group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold text-muted-foreground">
            <span className="flex size-8 items-center justify-center rounded-xl"><Store className="size-5 shrink-0" aria-hidden="true" /></span>
            <span>{t("studio_nav_store")}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
