import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Archive, CalendarDays, Clock3, Store, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { archiveMyActivity, cancelMyReservation, fetchMyReservations } from "@/lib/sooqy";
import { formatDA } from "@/lib/geo";
import { formatDate } from "@/lib/market";
import { EmptyState } from "@/components/sooqy/empty-state";
import { ErrorState } from "@/components/sooqy/error-state";

export const Route = createFileRoute("/reservations/")({
  head: () => ({}),
  component: ReservationsPage,
});

type ReservationTab = "all" | "active" | "ended" | "cancelled";

function isExpired(reservation: { status: string; expires_at: string }) {
  return reservation.status === "expired" ||
    (reservation.status === "pending" && new Date(reservation.expires_at).getTime() <= Date.now());
}

function canArchive(reservation: { status: string; expires_at: string }) {
  return ["collected", "cancelled", "expired"].includes(reservation.status) || isExpired(reservation);
}

function reservationStatus(reservation: { status: string; expires_at: string }) {
  if (isExpired(reservation)) return "منتهي";
  if (reservation.status === "pending") return "نشط";
  if (reservation.status === "collected") return "تم الاستلام";
  if (reservation.status === "cancelled") return "ملغى";
  return reservation.status;
}

function ReservationsPage() {
  const { user, ready } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ReservationTab>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const reservations = useQuery({
    queryKey: ["my-reservations"],
    queryFn: fetchMyReservations,
    enabled: !!user,
  });

  if (!ready) return null;
  if (!user) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <CalendarDays className="size-10 text-accent-ink" />
        <h1 className="text-h1 text-foreground">حجوزاتي</h1>
        <p className="max-w-xs text-sm text-muted-foreground">سجّل الدخول لمتابعة حجوزاتك وإدارتها.</p>
        <Link to="/auth" search={{ redirect: "/reservations" }} className="btn-primary">تسجيل الدخول</Link>
      </div>
    );
  }

  const all = reservations.data ?? [];
  const filtered = all.filter((r) => {
    if (tab === "active") return r.status === "pending" && !isExpired(r);
    if (tab === "ended") return r.status === "collected" || isExpired(r);
    if (tab === "cancelled") return r.status === "cancelled";
    return true;
  });

  const tabs: { id: ReservationTab; label: string }[] = [
    { id: "all", label: "الكل" },
    { id: "active", label: "نشطة" },
    { id: "ended", label: "منتهية" },
    { id: "cancelled", label: "ملغاة" },
  ];

  return (
    <main className="space-y-4 px-4 pb-24 pt-5">
      <header className="flex items-center gap-3">
        <Link to="/profile" aria-label="العودة إلى الملف الشخصي" className="icon-btn">‹</Link>
        <div>
          <h1 className="text-h1 text-foreground">حجوزاتي</h1>
          <p className="text-xs text-muted-foreground">تابع حجوزاتك وحالة الاستلام</p>
        </div>
      </header>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${tab === item.id ? "border-accent-ink bg-primary text-accent-ink-foreground" : "border-border bg-card text-muted-foreground"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {reservations.isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl border border-border bg-card" />)}
        </div>
      )}
      {reservations.isError && (
        <ErrorState scope="reservations" error={reservations.error} onRetry={() => reservations.refetch()} />
      )}
      {!reservations.isLoading && !reservations.isError && filtered.length === 0 && (
        <EmptyState
          Icon={CalendarDays}
          title={tab === "all" ? "لا توجد حجوزات بعد" : "لا توجد حجوزات في هذا القسم"}
          hint="عندما تحجز منتجًا من أحد المتاجر، سيظهر هنا."
          action={<Link to="/explore" className="btn-primary">اكتشف المنتجات</Link>}
        />
      )}

      <div className="space-y-3">
        {filtered.map((reservation) => {
          const archivable = canArchive(reservation);
          const expired = isExpired(reservation);
          const status = reservationStatus(reservation);
          const statusStyle = reservation.status === "cancelled"
            ? "bg-danger-soft text-danger"
            : reservation.status === "collected"
              ? "bg-success-soft text-success"
              : expired
                ? "bg-muted text-muted-foreground"
                : "bg-primary-soft text-accent-ink";
          return (
            <article key={reservation.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{reservation.offer?.product?.name ?? "منتج محجوز"}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Store className="size-3.5" /> {reservation.store?.name ?? "المتجر"}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyle}`}>{status}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-background p-3 text-xs">
                <div>
                  <span className="text-muted-foreground">رمز الحجز</span>
                  <p className="mt-1 font-bold text-foreground" dir="ltr">{reservation.code}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">الكمية</span>
                  <p className="mt-1 font-bold text-foreground">{reservation.quantity}</p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CalendarDays className="size-3.5" /> {formatDate(reservation.created_at)}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock3 className="size-3.5" /> {expired ? "انتهت الصلاحية" : formatDate(reservation.expires_at)}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{reservation.offer?.price != null ? "سعر الوحدة" : ""}</span>
                {reservation.offer?.price != null && <b className="text-sm font-extrabold text-accent-ink">{formatDA(reservation.offer.price)}</b>}
              </div>
              {reservation.status === "pending" && !expired && (
                <button
                  type="button"
                  disabled={cancellingId === reservation.id}
                  onClick={async () => {
                    if (!window.confirm("هل تريد إلغاء هذا الحجز؟ ستُعاد الكمية إلى مخزون المتجر.")) return;
                    setCancellingId(reservation.id);
                    try {
                      await cancelMyReservation(reservation.id);
                      await queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
                      toast.success("تم إلغاء الحجز بنجاح.");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "تعذر إلغاء الحجز.");
                    } finally {
                      setCancellingId(null);
                    }
                  }}
                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3 text-sm font-semibold text-danger transition hover:bg-danger/15 disabled:opacity-50"
                >
                  <XCircle className="size-4" />
                  {cancellingId === reservation.id ? "جارٍ الإلغاء..." : "إلغاء الحجز"}
                </button>
              )}
              {archivable && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm("هل تريد إخفاء هذا الحجز من سجلك؟ سيبقى محفوظًا في قاعدة البيانات.")) return;
                    try {
                      await archiveMyActivity("reservation", reservation.id);
                      await queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
                      toast.success("تم إخفاء الحجز من سجلك.");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "تعذر إخفاء الحجز.");
                    }
                  }}
                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground transition hover:bg-muted"
                >
                  <Archive className="size-4" /> إخفاء من السجل
                </button>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
