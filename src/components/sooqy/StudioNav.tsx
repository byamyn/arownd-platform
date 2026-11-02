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
      "flex min-h-16 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-medium transition-colors duration-200",
      active ? "text-[var(--color-action-ink)]" : "text-muted-foreground active:bg-muted",
    );

  const iconClass = (active: boolean) =>
    cn("flex size-9 items-center justify-center rounded-full", active ? "bg-muted" : "");

  return (
    <nav
      aria-label={t("studio_nav_aria")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-muted md:hidden"
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-stretch gap-1 px-[var(--margin)] pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, key, Icon }) => {
          const active = currentPath === to;
          return (
            <Link key={to} to={to} aria-current={active ? "page" : undefined} className={navClass(active)}>
              <span className={iconClass(active)} aria-hidden="true">
                <Icon className="size-5 shrink-0" />
              </span>
              <span className="w-full truncate text-center">{t(key)}</span>
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
            <span className="w-full truncate text-center">{t("studio_nav_store")}</span>
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
            <span className="w-full truncate text-center">{t("studio_nav_store")}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
