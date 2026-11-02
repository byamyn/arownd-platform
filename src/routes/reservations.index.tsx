import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Archive, ArrowLeft, CalendarDays, Clock3, Store, XCircle } from "lucide-react";
import { showError, showSuccess } from "@/lib/feedback";
import { useAuth } from "@/lib/auth";
import { archiveMyActivity, cancelMyReservation, fetchMyReservations } from "@/lib/sooqy";
import { formatDA } from "@/lib/geo";
import { formatDate } from "@/lib/market";
import { EmptyState } from "@/components/sooqy/empty-state";
import { ErrorState } from "@/components/sooqy/error-state";
import { ConfirmDialog } from "@/components/sooqy/confirm-dialog";

export const Route = createFileRoute("/reservations/")({
  head: () => ({}),
  component: ReservationsPage,
});

type ReservationTab = "all" | "active" | "ended" | "cancelled";
type PendingConfirmation = { title: string; message: string; action: () => Promise<void> };

function isExpired(reservation: { status: string; expires_at: string }) {
  return (
    reservation.status === "expired" ||
    (reservation.status === "pending" && new Date(reservation.expires_at).getTime() <= Date.now())
  );
}

function canArchive(reservation: { status: string; expires_at: string }) {
  return (
    ["collected", "cancelled", "expired"].includes(reservation.status) || isExpired(reservation)
  );
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
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [confirmationBusy, setConfirmationBusy] = useState(false);
  const reservations = useQuery({
    queryKey: ["my-reservations"],
    queryFn: fetchMyReservations,
    enabled: !!user,
  });

  const runPendingConfirmation = async () => {
    if (!pendingConfirmation || confirmationBusy) return;
    setConfirmationBusy(true);
    try {
      await pendingConfirmation.action();
      setPendingConfirmation(null);
    } catch (error) {
      showError(error);
    } finally {
      setConfirmationBusy(false);
    }
  };

  if (!ready) return null;
  if (!user) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <CalendarDays className="size-10 text-accent-ink" />
        <h1 className="text-h1 text-foreground">حجوزاتي</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          سجّل الدخول لمتابعة حجوزاتك وإدارتها.
        </p>
        <Link to="/auth" search={{ redirect: "/reservations" }} className="btn-primary">
          تسجيل الدخول
        </Link>
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
    <main className="space-y-4 px-4 pb-6 pt-5">
      <header className="flex items-center gap-3">
        <Link to="/profile" aria-label="العودة إلى الملف الشخصي" className="icon-btn">
          <ArrowLeft className="size-5 rtl:rotate-180" />
        </Link>
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
            className={`min-h-[var(--control-height-compact)] shrink-0 rounded-full border px-4 text-sm font-semibold transition ${tab === item.id ? "border-accent-ink bg-primary text-accent-ink-foreground" : "border-border bg-card text-muted-foreground"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {reservations.isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-[var(--radius-card)] border border-border bg-card"
            />
          ))}
        </div>
      )}
      {reservations.isError && (
        <ErrorState
          scope="reservations"
          error={reservations.error}
          onRetry={() => reservations.refetch()}
        />
      )}
      {!reservations.isLoading && !reservations.isError && filtered.length === 0 && (
        <EmptyState
          Icon={CalendarDays}
          title={tab === "all" ? "لا توجد حجوزات بعد" : "لا توجد حجوزات في هذا القسم"}
          hint="عندما تحجز منتجًا من أحد المتاجر، سيظهر هنا."
          action={
            <Link to="/explore" className="btn-primary">
              اكتشف المنتجات
            </Link>
          }
        />
      )}

      <div className="space-y-3">
        {filtered.map((reservation) => {
          const archivable = canArchive(reservation);
          const expired = isExpired(reservation);
          const status = reservationStatus(reservation);
          const statusStyle =
            reservation.status === "cancelled"
              ? "bg-danger-soft text-danger"
              : reservation.status === "collected"
                ? "bg-success-soft text-success"
                : expired
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary-soft text-accent-ink";
          return (
            <article
              key={reservation.id}
              className="relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-card "
            >
              <div className="absolute inset-y-0 start-0 w-1 bg-primary" />
              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-extrabold text-foreground">
                      {reservation.offer?.product?.name ?? "منتج محجوز"}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Store className="size-3.5" />
                      {reservation.store?.name ?? "المتجر"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-caption font-bold ${statusStyle}`}
                  >
                    {status}
                  </span>
                </div>

                <div className="rounded-[var(--radius-card)] border border-dashed border-primary/40 bg-primary-soft p-4 text-center">
                  <p className="text-caption font-semibold text-muted-foreground">رمز الحجز</p>
                  <p
                    className="mt-1 font-mono text-3xl font-black tracking-[0.18em] text-foreground"
                    dir="ltr"
                  >
                    {reservation.code}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[var(--radius-card)] bg-background p-3">
                    <p className="text-caption text-muted-foreground">الكمية</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{reservation.quantity}</p>
                  </div>
                  <div className="rounded-[var(--radius-card)] bg-background p-3">
                    <p className="text-caption text-muted-foreground">سعر الوحدة</p>
                    <p className="mt-1 text-sm font-extrabold text-accent-ink">
                      {reservation.offer?.price != null ? formatDA(reservation.offer.price) : "—"}
                    </p>
                  </div>
                  <div className="flex items-start gap-2 rounded-[var(--radius-card)] bg-background p-3">
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-caption text-muted-foreground">تاريخ الحجز</p>
                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {formatDate(reservation.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-[var(--radius-card)] bg-background p-3">
                    <Clock3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-caption text-muted-foreground">انتهاء الصلاحية</p>
                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {expired ? "انتهت الصلاحية" : formatDate(reservation.expires_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {reservation.status === "pending" && !expired && (
                  <button
                    type="button"
                    disabled={cancellingId === reservation.id}
                    onClick={() =>
                      setPendingConfirmation({
                        title: "إلغاء الحجز",
                        message: "هل تريد إلغاء هذا الحجز؟ ستُعاد الكمية إلى مخزون المتجر.",
                        action: async () => {
                          setCancellingId(reservation.id);
                          try {
                            await cancelMyReservation(reservation.id);
                            await queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
                            showSuccess("تم إلغاء الحجز بنجاح.");
                          } finally {
                            setCancellingId(null);
                          }
                        },
                      })
                    }
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border border-danger/30 bg-danger-soft px-3 text-sm font-bold text-danger transition hover:bg-danger/15 disabled:opacity-50"
                  >
                    <XCircle className="size-4" />
                    {cancellingId === reservation.id ? "جارٍ الإلغاء..." : "إلغاء الحجز"}
                  </button>
                )}
                {archivable && (
                  <button
                    type="button"
                    onClick={() =>
                      setPendingConfirmation({
                        title: "إخفاء الحجز من السجل",
                        message: "هل تريد إخفاء هذا الحجز من سجلك؟ سيبقى محفوظًا في قاعدة البيانات.",
                        action: async () => {
                          await archiveMyActivity("reservation", reservation.id);
                          await queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
                          showSuccess("تم إخفاء الحجز من سجلك.");
                        },
                      })
                    }
                    className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border border-border text-sm font-semibold text-muted-foreground transition hover:bg-muted"
                  >
                    <Archive className="size-4" /> إخفاء من السجل
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <ConfirmDialog
        open={pendingConfirmation !== null}
        title={pendingConfirmation?.title ?? ""}
        message={pendingConfirmation?.message ?? ""}
        confirmLabel="تأكيد"
        cancelLabel="إلغاء"
        busy={confirmationBusy}
        onConfirm={runPendingConfirmation}
        onCancel={() => setPendingConfirmation(null)}
      />
    </main>
  );
}
