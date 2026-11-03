import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, Sparkles, Store, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchMyStore } from "@/lib/sooqy";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function StudioNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
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
    { to: "/profile", key: "profile", Icon: User },
  ] as const;
  const isStoreActive = !!store.data?.id && currentPath === `/stores/${store.data.id}`;

  const navClass = (active: boolean) =>
    cn(
      "flex min-h-[var(--nav-height)] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-control)] px-0.5 text-[11px] leading-tight font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      active ? "text-[var(--color-action-ink)]" : "text-muted-foreground active:bg-muted",
    );

  const iconClass = (active: boolean) =>
    cn("flex size-9 items-center justify-center rounded-full", active ? "bg-muted" : "");

  return (
    <nav
      aria-label={t("studio_nav_aria")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-muted md:hidden"
    >
      <div className="mx-auto flex h-[var(--nav-height)] w-full max-w-7xl items-stretch gap-0 px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, key, Icon }) => {
          const active = currentPath === to;
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={navClass(active)}
            >
              <span className={iconClass(active)} aria-hidden="true">
                <Icon className="size-5 shrink-0" />
              </span>
              <span className="w-full text-center whitespace-normal break-words line-clamp-2">
                {t(key)}
              </span>
            </Link>
          );
        })}
        {store.data?.id ? (
          <Link
            to="/stores/$storeId"
            params={{ storeId: store.data.id }}
            aria-current={isStoreActive ? "page" : undefined}
            className={navClass(isStoreActive)}
          >
            <span className={iconClass(isStoreActive)} aria-hidden="true">
              <Store className="size-5 shrink-0" />
            </span>
            <span className="w-full text-center whitespace-normal break-words line-clamp-2">
              {t("studio_nav_store")}
            </span>
          </Link>
        ) : (
          <Link
            to="/studio"
            aria-current={currentPath === "/studio" ? "page" : undefined}
            className={navClass(currentPath === "/studio")}
          >
            <span className={iconClass(currentPath === "/studio")} aria-hidden="true">
              <Store className="size-5 shrink-0" />
            </span>
            <span className="w-full text-center whitespace-normal break-words line-clamp-2">
              {t("studio_nav_store")}
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
