import { useLocation, Link } from "@tanstack/react-router";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const items = [
    { to: "/", labelKey: "home", Icon: Home },
    { to: "/explore", labelKey: "explore", Icon: Search },
    { to: "/bag", labelKey: "cart", Icon: ShoppingBag },
    { to: "/profile", labelKey: "profile", Icon: User },
  ];

  return (
    <nav
      aria-label={t("aria_main_nav")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card"
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-stretch gap-1 px-[var(--margin)] pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, labelKey, Icon }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              preload="intent"
              activeOptions={{ exact: to === "/" }}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-16 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-medium transition-colors duration-200",
                isActive
                  ? "text-[var(--color-action-ink)]"
                  : "text-muted-foreground active:bg-muted",
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full",
                  isActive ? "bg-muted" : "",
                )}
                aria-hidden="true"
              >
                <Icon className="size-5" strokeWidth={isActive ? 2.4 : 2} />
              </span>
              <span className="w-full truncate text-center">{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
