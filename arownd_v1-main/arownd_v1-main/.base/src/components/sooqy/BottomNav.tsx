import { useLocation } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Compass, Home, Package, Search, ShoppingBag, User } from "lucide-react";
import { useBag } from "@/lib/bag";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
export function BottomNav() {
  const { pathname } = useLocation();
  const { count } = useBag();
  const { t, isRTL } = useTranslation();
  const items = [
    { to: "/", labelKey: "home", icon: Home },
    { to: "/explore", labelKey: "explore", icon: Search },
    { to: "/bag", labelKey: "cart", icon: ShoppingBag },
    { to: "/profile", labelKey: "profile", icon: User },
  ];

  return (
    <nav
      aria-label={t("aria_main_nav")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/80 backdrop-blur"
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-2el items-stretch px-1",
          "pb-[env(safe-area-inset-bottom)]",
          isRTL ? "flex-row-reverse" : "",
        )}
      >
        {items.map(({ to, labelKey, icon: Icon }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              preload="intent"
              activeOptions={{ exact: to === "/" }}
              className="group relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
              activeProps={{ "aria-current": "page" }}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-md transition-colors duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "group-active:bg-muted/30 text-muted-foreground",
                )}
                aria-hidden="true"
              >
                <Icon
                  className={cn(
                    "size-5 transition-colors duration-200",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                  strokeWidth={isActive ? 2.4 : 2}
                />
              </span>
              <span
                className={cn(
                  "w-full truncate px-0.5 text-center text-[10px] font-semibold transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {t(labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}