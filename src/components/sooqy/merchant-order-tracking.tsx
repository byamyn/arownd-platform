import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchMerchantOrderTracking, merchantUpdateOrderTracking, type MerchantTrackingStatus } from "@/lib/sooqy";
import { formatDate } from "@/lib/market";
import { showError, showSuccess } from "@/lib/feedback";
import { ErrorState } from "@/components/sooqy/error-state";

const steps: { status: MerchantTrackingStatus; label: string }[] = [
  { status: "preparing", label: "قيد تجهيز الطلب" },
  { status: "ready_for_dispatch", label: "جاهز للتسليم للمندوب" },
  { status: "out_for_delivery", label: "خرج للتوصيل" },
  { status: "delivered", label: "تم التسليم" },
];

export function MerchantOrderTracking({ merchantOrderId, onCompleted }: { merchantOrderId: string; onCompleted: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const query = useQuery({
    queryKey: ["merchant-order-tracking", merchantOrderId],
    queryFn: () => fetchMerchantOrderTracking(merchantOrderId),
  });
  const events = query.data ?? [];
  const last = events.at(-1)?.status;
  const nextIndex = last ? steps.findIndex((step) => step.status === last) + 1 : 0;
  const next = steps[nextIndex];

  return (
    <section className="space-y-3 rounded-[var(--radius-card)] border border-border bg-background p-4">
      <div>
        <h3 className="font-bold text-foreground">تحديث تتبع التوصيل</h3>
        <p className="mt-1 text-xs text-muted-foreground">سجّل مراحل تجهيز الطلب وتوصيله ليتمكن العميل من متابعتها.</p>
      </div>
      {query.isError ? <ErrorState scope="merchant-order-tracking" error={query.error} onRetry={() => query.refetch()} /> : (
        <ol className="space-y-2">
          {steps.map((step) => {
            const event = events.find((item) => item.status === step.status);
            return <li key={step.status} className={event ? "text-sm font-semibold text-foreground" : "text-sm text-muted-foreground"}>
              {event ? "✓ " : "○ "}{step.label}
              {event && <p className="ms-5 text-xs font-normal text-muted-foreground">{formatDate(event.created_at)}{event.note ? " — " + event.note : ""}</p>}
            </li>;
          })}
        </ol>
      )}
      {next ? <button type="button" disabled={saving || query.isLoading || query.isError}
        onClick={async () => {
          setSaving(true);
          try {
            await merchantUpdateOrderTracking(merchantOrderId, next.status);
            await query.refetch();
            await onCompleted();
            showSuccess("تم تحديث تتبع الطلب");
          } catch (error) { showError(error); }
          finally { setSaving(false); }
        }}
        className="min-h-[var(--control-height-compact)] w-full rounded-[var(--radius-control)] bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
        {saving ? "جارٍ الحفظ..." : "تحديث الحالة: " + next.label}
      </button> : <p className="rounded-xl bg-primary-soft p-3 text-sm font-semibold">اكتمل توصيل الطلب.</p>}
    </section>
  );
}
