import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Bell, Lock, Package, Tag, CalendarCheck, Info, Trash2, CheckCircle2, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRealtimeSubscription } from "@/hooks/use-realtime";
import { fetchMyNotifications, markNotificationsRead, markNotificationRead, deleteNotification } from "@/lib/sooqy";
import { formatDateTime } from "@/lib/market";
import { EmptyState } from "@/components/sooqy/empty-state";
import { cn } from "@/lib/utils";
import { SeoHead } from "@/components/seo/SeoHead";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  head: () => ({}),
  component: NotificationsPage,
});

const TYPE_ICON = {
  order: Package,
  offer: Tag,
  reservation: CalendarCheck,
  system: Info,
  info: Info,
} as const;

type NotificationData = {
  order_id?: string;
  reservation_id?: string;
  offer_id?: string;
  store_id?: string;
  product_id?: string;
  status?: string;
  [key: string]: unknown;
};

function navigateForNotification(navigate: ReturnType<typeof useNavigate>, n: { type: string; data: NotificationData }) {
  const d = n.data as NotificationData;
  switch (n.type) {
    case "order":
      if (d.order_id) navigate({ to: "/orders/$orderId", params: { orderId: d.order_id } });
      else navigate({ to: "/orders" });
      break;
    case "reservation":
      if (d.reservation_id) navigate({ to: "/orders/$orderId", params: { orderId: d.reservation_id } });
      else navigate({ to: "/orders" });
      break;
    case "offer":
      if (d.offer_id) navigate({ to: "/products/$productId", params: { productId: d.offer_id } });
      else if (d.store_id) navigate({ to: "/stores/$storeId", params: { storeId: d.store_id } });
      else navigate({ to: "/" });
      break;
    case "system":
    case "info":
    default:
      // لا يوجد توجيه افتراضي للإشعارات العامة
      break;
  }
}

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchMyNotifications,
    enabled: !!user,
  });

  // تحديثات حية: إشعارات جديدة (Supabase Realtime)
  useRealtimeSubscription({
    table: "notifications",
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    queryKeys: [["notifications"]],
    enabled: !!user,
  });

  const markAll = async () => {
    await markNotificationsRead();
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteNotification(id);
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("تم حذف الإشعار");
    } catch {
      toast.error("فشل الحذف");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClick = (n: { type: string; data: unknown; read: boolean; id: string }) => {
    if (!n.read) handleMarkRead(n.id);
    navigateForNotification(navigate, { type: n.type, data: n.data as NotificationData });
  };

  return (
    <>
      <SeoHead
        title="الإشعارات"
        description="Stay updated on your orders, reservations and store offers."
        keywords="الإشعارات, SOOQY"
        ogType="website"
      />
      <div className="px-4 pt-4">
        <header className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <button onClick={() => router.history.back()} aria-label="رجوع" className="icon-btn">
              <ArrowRight className="size-5" />
            </button>
            <h1 className="text-h2 text-foreground">الإشعارات</h1>
          </div>
          {q.data && q.data.some((n) => !n.read) && (
            <button onClick={markAll} className="text-sm font-bold text-accent-ink">
              قراءة الكل
            </button>
          )}
        </header>

        {!user && (
          <EmptyState
            Icon={Lock}
            title="سجّل الدخول لعرض إشعاراتك"
            hint="تظهر إشعارات طلباتك وحجوزاتك بعد تسجيل الدخول."
            action={
              <Link to="/auth" className="btn-small">
                تسجيل الدخول
              </Link>
            }
          />
        )}

        {user && q.isLoading && (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        )}

        {user && q.data && q.data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="flex size-20 items-center justify-center rounded-3xl bg-primary-soft">
              <Bell className="size-9 text-accent-ink" strokeWidth={1.6} />
            </span>
            <h2 className="mt-5 text-h3 text-foreground">لا توجد إشعارات بعد</h2>
            <p className="mt-2 max-w-xs text-body text-muted-foreground">
              عندما تصلك تحديثات عن طلباتك أو عروض جديدة من المتاجر، ستظهر هنا.
            </p>
            <Link to="/" className="btn-small mt-6">
              تصفح المنتجات
            </Link>
          </div>
        )}

        {user && q.data && q.data.length > 0 && (
          <div className="space-y-2 py-4">
            {q.data.map((n) => {
              const Icon = TYPE_ICON[n.type as keyof typeof TYPE_ICON] ?? Info;
              const isExpanded = expandedId === n.id;
              const d = n.data as NotificationData;

              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-3 transition cursor-pointer",
                    n.read ? "border-border bg-card" : "border-accent-ink/30 bg-primary-soft/40",
                    isExpanded && "ring-2 ring-primary/30",
                  )}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setExpandedId(isExpanded ? null : n.id);
                  }}
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-accent-ink-soft-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {formatDateTime(n.created_at)}
                    </p>
                    {/* Data preview for debugging - can be removed */}
                    {isExpanded && d && Object.keys(d).length > 0 && (
                      <div className="mt-2 text-[10px] text-muted-foreground font-mono">
                        {JSON.stringify(d)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(isExpanded ? null : n.id);
                        }}
                        className="icon-btn size-8 p-1 opacity-0 group-hover:opacity-100 transition"
                        aria-label={isExpanded ? "إخفاء الخيارات" : "خيارات"}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                      {isExpanded && (
                        <div className="flex items-center gap-1">
                          {!n.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkRead(n.id);
                              }}
                              className="icon-btn size-8 p-1 text-accent-ink"
                              aria-label="تعيين كمقروء"
                            >
                              <CheckCircle2 className="size-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(n.id, e)}
                            disabled={deletingId === n.id}
                            className="icon-btn size-8 p-1 text-destructive"
                            aria-label="حذف الإشعار"
                          >
                            {deletingId === n.id ? (
                              <span className="size-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}