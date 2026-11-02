import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ReceiptText,
  RotateCcw,
  ShoppingBag,
  Upload,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { showError, showSuccess } from "@/lib/feedback";
import { useAuth } from "@/lib/auth";
import { useRealtimeSubscription } from "@/hooks/use-realtime";
import { formatDA } from "@/lib/geo";
import { formatDate, formatTime } from "@/lib/market";
import {
  fetchWalletTransactions,
  summarizeWallet,
  uploadImageToBucket,
  createReceiptSignedUrl,
  walletTopup,
  walletWithdraw,
  type WalletTxType,
} from "@/lib/sooqy";
import { PageHeader } from "@/components/sooqy/page-header";
import { EmptyState } from "@/components/sooqy/empty-state";
import { cn } from "@/lib/utils";
import { SeoHead } from "@/components/seo/SeoHead";

export const Route = createFileRoute("/wallet")({
  head: () => ({}),
  component: WalletPage,
});

type Tab = "all" | "topup" | "withdraw" | "pending" | "approved" | "rejected";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "topup", label: "الإيداعات" },
  { id: "withdraw", label: "السحوبات" },
  { id: "pending", label: "قيد المراجعة" },
  { id: "approved", label: "معتمدة" },
  { id: "rejected", label: "مرفوضة" },
];

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "قيد المراجعة", cls: "bg-warning-soft text-warning" },
  approved: { label: "معتمد", cls: "bg-success-soft text-success" },
  rejected: { label: "مرفوض", cls: "bg-danger-soft text-danger" },
};

const TYPE_META: Record<WalletTxType, { label: string; icon: typeof Wallet }> = {
  topup: { label: "شحن المحفظة", icon: ArrowDownLeft },
  withdraw: { label: "سحب رصيد", icon: ArrowUpRight },
  purchase: { label: "الدفع من المحفظة", icon: ShoppingBag },
  refund: { label: "استرداد", icon: RotateCcw },
};

const METHODS = [
  { id: "baridimob", label: "بريدي موب" },
  { id: "ccp", label: "البريد الجزائري (CCP)" },
  { id: "bank", label: "تحويل بنكي" },
];

const PRESETS = [500, 1000, 2000, 5000];
const MIN_AMOUNT = 100;

function WalletPage() {
  const { user, ready } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("all");
  const [showTopup, setShowTopup] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const [topupAmount, setTopupAmount] = useState("");
  const [topupMethod, setTopupMethod] = useState(METHODS[0].id);
  const [topupReceipt, setTopupReceipt] = useState<File | null>(null);
  const [busyTopup, setBusyTopup] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState(METHODS[0].id);
  const [withdrawNote, setWithdrawNote] = useState("");
  const [busyWithdraw, setBusyWithdraw] = useState(false);

  const txs = useQuery({
    queryKey: ["wallet"],
    queryFn: fetchWalletTransactions,
    enabled: !!user,
  });

  // تحديثات حية: اعتماد/رفض الإدارة يظهر فورًا (Supabase Realtime)
  useRealtimeSubscription({
    table: "wallet_transactions",
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    queryKeys: [["wallet"]],
    enabled: !!user,
  });

  if (!ready) return null;
  if (!user) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="flex size-20 items-center justify-center rounded-[var(--radius-card)] bg-primary-soft">
          <Wallet className="size-9 text-accent-ink" strokeWidth={1.6} />
        </span>
        <h1 className="text-h1 text-foreground">سجّل الدخول لفتح محفظتك</h1>
        <p className="max-w-xs text-body text-muted-foreground">
          شحن الرصيد وسجل العمليات ستظهر هنا بعد تسجيل الدخول.
        </p>
        <a href="/auth" className="btn-primary mt-2">
          دخول
        </a>
      </div>
    );
  }

  const list = txs.data ?? [];
  const summary = summarizeWallet(list);
  const pendingTransactions = list.filter((t) => t.status === "pending");
  const pendingCount = pendingTransactions.length;
  const pendingTopup = pendingTransactions
    .filter((t) => t.type === "topup")
    .reduce((sum, t) => sum + Math.max(0, t.amount), 0);
  const pendingWithdraw = pendingTransactions
    .filter((t) => t.type === "withdraw")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const filtered = list.filter((t) => {
    if (tab === "all") return true;
    if (tab === "topup") return t.type === "topup" || t.type === "refund";
    if (tab === "withdraw") return t.type === "withdraw" || t.type === "purchase";
    return t.status === tab;
  });

  const submitTopup = async () => {
    const amount = Math.round(Number(topupAmount));
    if (!amount || amount < MIN_AMOUNT) {
      toast.error(`أدخل مبلغًا صحيحًا (الحد الأدنى ${MIN_AMOUNT} دج).`);
      return;
    }
    if (!topupReceipt) {
      toast.error("أرفق صورة سند الدفع.");
      return;
    }
    setBusyTopup(true);
    try {
      const receiptUrl = await uploadImageToBucket(topupReceipt, "receipts");
      await walletTopup({
        amount,
        receiptUrl,
        method: topupMethod,
      });
      showSuccess("أُرسل طلب الشحن — سيُعتمد بعد مراجعة الإدارة.");
      setTopupAmount("");
      setTopupReceipt(null);
      setShowTopup(false);
      await qc.invalidateQueries({ queryKey: ["wallet"] });
    } catch (e) {
      showError(e);
    } finally {
      setBusyTopup(false);
    }
  };

  const submitWithdraw = async () => {
    const amount = Math.round(Number(withdrawAmount));
    if (!amount || amount < MIN_AMOUNT) {
      toast.error(`أدخل مبلغًا صحيحًا (الحد الأدنى ${MIN_AMOUNT} دج).`);
      return;
    }
    if (amount > summary.balance) {
      toast.error("المبلغ أكبر من رصيدك المتاح.");
      return;
    }
    setBusyWithdraw(true);
    try {
      await walletWithdraw({
        amount,
        method: withdrawMethod,
        note: withdrawNote.trim() || undefined,
      });
      showSuccess("أُرسل طلب السحب — سيُنفَّذ بعد مراجعة الإدارة.");
      setWithdrawAmount("");
      setWithdrawNote("");
      setShowWithdraw(false);
      await qc.invalidateQueries({ queryKey: ["wallet"] });
    } catch (e) {
      showError(e);
    } finally {
      setBusyWithdraw(false);
    }
  };

  return (
    <>
      <SeoHead
        title="المحفظة"
        description="اشحن رصيدك وتابع عمليات محفظتك في Arownd."
        keywords="المحفظة, شحن الرصيد, سحب, Arownd"
        ogType="website"
      />
      <div className="mx-auto max-w-xl space-y-4 px-4 pb-6 pt-5">
        <PageHeader
          title="المحفظة"
          subtitle="رصيدك وعملياتك المالية في مكان واحد"
          back="/profile"
        />

        {/* بطاقة الرصيد — تعرض الأرقام بعد تحميل بيانات Supabase فقط */}
        <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-primary p-5 text-primary-foreground  sm:p-6">
          <div className="pointer-events-none absolute -end-12 -top-16 size-44 rounded-full border-4 border-primary-foreground/10" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold opacity-80">الرصيد المتاح</p>
              {txs.isLoading ? (
                <div
                  className="mt-3 h-10 w-40 animate-pulse rounded-lg bg-primary-foreground/10"
                  aria-label="جارٍ تحميل الرصيد"
                />
              ) : txs.isError ? (
                <p className="mt-2 text-sm font-bold">تعذّر تحميل الرصيد</p>
              ) : (
                <p dir="ltr" className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                  {formatDA(summary.balance)}
                </p>
              )}
            </div>
            <span className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-card)] bg-primary-foreground/20 ring-1 ring-primary-foreground/15">
              <Wallet className="size-7" strokeWidth={1.8} />
            </span>
          </div>
          <p className="relative mt-4 text-caption font-semibold opacity-75">
            الرصيد محسوب من العمليات المعتمدة فقط
          </p>
          {!txs.isLoading && !txs.isError && (
            <div className="relative mt-4 grid grid-cols-2 gap-2 border-t border-primary-foreground/10 pt-3">
              <div className="rounded-[var(--radius-control)] bg-primary-foreground/5 px-3 py-2">
                <p className="text-caption font-bold opacity-70">إيداعات قيد المراجعة</p>
                <p dir="ltr" className="mt-1 text-sm font-extrabold">
                  {formatDA(pendingTopup)}
                </p>
              </div>
              <div className="rounded-[var(--radius-control)] bg-primary-foreground/5 px-3 py-2">
                <p className="text-caption font-bold opacity-70">سحوبات قيد المراجعة</p>
                <p dir="ltr" className="mt-1 text-sm font-extrabold">
                  {formatDA(pendingWithdraw)}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* الإجراءات */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setShowTopup((v) => !v);
              setShowWithdraw(false);
            }}
            className="btn-primary"
          >
            شحن الرصيد
          </button>
          <button
            onClick={() => {
              setShowWithdraw((v) => !v);
              setShowTopup(false);
            }}
            className="btn-secondary"
          >
            طلب سحب
          </button>
        </div>

        {/* نموذج الشحن */}
        {showTopup && (
          <div className="animate-fade-up space-y-3 rounded-[var(--radius-card)] border border-border bg-card p-4">
            <p className="text-sm font-extrabold text-foreground">شحن المحفظة</p>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">
                المبلغ (دج)
              </label>
              <input
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                placeholder={`الحد الأدنى ${MIN_AMOUNT} دج`}
                dir="ltr"
                className="w-full rounded-[var(--radius-control)] border border-input bg-background px-3 py-2.5 text-start outline-none transition focus:ring-2 focus:ring-primary/30"
              />
              <div className="mt-2 flex gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setTopupAmount(String(p))}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-bold transition",
                      topupAmount === String(p)
                        ? "border-accent-ink bg-primary text-accent-ink-foreground"
                        : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {p} دج
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">
                طريقة الدفع
              </label>
              <select
                value={topupMethod}
                onChange={(e) => setTopupMethod(e.target.value)}
                className="w-full rounded-[var(--radius-control)] border border-input bg-background px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-primary/30"
              >
                {METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-control)] border border-dashed border-border bg-background px-3 py-3 text-sm font-bold transition active:scale-[0.99]">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Upload className="size-4" />
                {topupReceipt ? "تم اختيار السند ✓" : "أرفق صورة سند الدفع *"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif"
                className="hidden"
                onChange={(e) => setTopupReceipt(e.target.files?.[0] ?? null)}
              />
            </label>
            <button onClick={submitTopup} disabled={busyTopup} className="btn-primary w-full">
              {busyTopup ? "جارٍ الإرسال..." : "إرسال طلب الشحن"}
            </button>
          </div>
        )}

        {/* نموذج السحب */}
        {showWithdraw && (
          <div className="animate-fade-up space-y-3 rounded-[var(--radius-card)] border border-border bg-card p-4">
            <p className="text-sm font-extrabold text-foreground">سحب رصيد</p>
            <p className="text-caption font-semibold text-muted-foreground">
              الرصيد المتاح للسحب: {formatDA(summary.balance)}
            </p>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">
                المبلغ (دج)
              </label>
              <input
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                placeholder={`الحد الأدنى ${MIN_AMOUNT} دج`}
                dir="ltr"
                className="w-full rounded-[var(--radius-control)] border border-input bg-background px-3 py-2.5 text-start outline-none transition focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">
                طريقة الاستلام
              </label>
              <select
                value={withdrawMethod}
                onChange={(e) => setWithdrawMethod(e.target.value)}
                className="w-full rounded-[var(--radius-control)] border border-input bg-background px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-primary/30"
              >
                {METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">
                بيانات الحساب (CCP / RIB / رقم بريدي موب)
              </label>
              <input
                value={withdrawNote}
                onChange={(e) => setWithdrawNote(e.target.value)}
                placeholder="مثال: CCP 0012345678 ..."
                className="w-full rounded-[var(--radius-control)] border border-input bg-background px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button onClick={submitWithdraw} disabled={busyWithdraw} className="btn-primary w-full">
              {busyWithdraw ? "جارٍ الإرسال..." : "إرسال طلب السحب"}
            </button>
          </div>
        )}

        {/* ملخص الحركة المالية من المعاملات المعتمدة فقط */}
        {!txs.isLoading && !txs.isError && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[var(--radius-card)] border border-border bg-card p-3.5">
              <div className="flex items-center gap-2 text-success">
                <ArrowDownLeft className="size-4" />
                <span className="text-caption font-bold text-muted-foreground">
                  إجمالي الإيداعات
                </span>
              </div>
              <p dir="ltr" className="mt-2 text-base font-extrabold text-foreground">
                {formatDA(summary.totalTopup)}
              </p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-border bg-card p-3.5">
              <div className="flex items-center gap-2 text-danger">
                <ArrowUpRight className="size-4" />
                <span className="text-caption font-bold text-muted-foreground">
                  إجمالي السحوبات
                </span>
              </div>
              <p dir="ltr" className="mt-2 text-base font-extrabold text-foreground">
                {formatDA(summary.totalWithdraw)}
              </p>
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-card px-4 py-3">
              <span className="text-xs font-bold text-muted-foreground">عمليات قيد المراجعة</span>
              <span className="text-sm font-extrabold text-foreground">{pendingCount}</span>
            </div>
          </div>
        )}

        {/* سجل المعاملات والفلاتر */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-foreground">سجل المعاملات</h2>
            <p className="mt-0.5 text-caption text-muted-foreground">
              كل الحركات المسجلة في محفظتك
            </p>
          </div>
          {!txs.isLoading && !txs.isError && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-caption font-bold text-muted-foreground">
              {filtered.length} عملية
            </span>
          )}
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
                tab === t.id
                  ? "border-accent-ink bg-primary text-accent-ink-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {txs.isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-[var(--radius-card)] border border-border bg-card"
              />
            ))}
          </div>
        )}

        {txs.isError && (
          <div className="rounded-[var(--radius-card)] border border-danger/30 bg-danger-soft p-4 text-center">
            <p className="text-sm font-bold text-foreground">تعذّر تحميل بيانات المحفظة</p>
            <p className="mt-1 text-xs text-muted-foreground">
              تحقق من اتصالك بالإنترنت ثم أعد المحاولة.
            </p>
            <button onClick={() => void txs.refetch()} className="btn-secondary mt-3">
              إعادة المحاولة
            </button>
          </div>
        )}

        {!txs.isLoading && !txs.isError && filtered.length === 0 && (
          <EmptyState
            Icon={Wallet}
            title={tab === "all" ? "لا توجد عمليات بعد" : "لا توجد عمليات في هذا القسم"}
            hint="عندما تشحن رصيدك أو تسحب أرباحك، ستظهر العمليات هنا مع حالتها لحظة بلحظة."
            action={
              tab === "all" ? (
                <button onClick={() => setShowTopup(true)} className="btn-primary">
                  اشحن رصيدك
                </button>
              ) : undefined
            }
          />
        )}

        <div className="space-y-3">
          {filtered.map((t) => {
            const st = STATUS[t.status] ?? {
              label: t.status,
              cls: "bg-muted text-muted-foreground",
            };
            const meta = TYPE_META[t.type] ?? { label: t.type, icon: Wallet };
            const Icon = meta.icon;
            const date = formatDate(t.created_at, undefined, {
              day: "numeric",
              month: "long",
            });
            const time = formatTime(t.created_at);
            const methodLabel = METHODS.find((m) => m.id === t.method)?.label ?? t.method;
            return (
              <div
                key={t.id}
                className="rounded-[var(--radius-card)] border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-card)]",
                      t.amount >= 0 ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{meta.label}</p>
                    <p className="truncate text-caption text-muted-foreground">
                      {date} · {time}
                      {methodLabel ? ` · ${methodLabel}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p
                      dir="ltr"
                      className={cn(
                        "text-sm font-extrabold",
                        t.amount >= 0 ? "text-success" : "text-danger",
                      )}
                    >
                      {t.amount >= 0 ? "+" : "−"}
                      {formatDA(Math.abs(t.amount))}
                    </p>
                    <span
                      className={cn(
                        "mt-1 inline-block rounded-full px-2 py-0.5 text-caption font-bold",
                        st.cls,
                      )}
                    >
                      {st.label}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-caption text-muted-foreground">
                  <span>
                    رقم المعاملة:{" "}
                    <b dir="ltr" className="font-mono">
                      {t.id.slice(0, 8).toUpperCase()}
                    </b>
                  </span>
                  {methodLabel && <span>{methodLabel}</span>}
                </div>
                {t.note && (
                  <p className="mt-2 rounded-[var(--radius-control)] bg-background px-3 py-2 text-caption font-semibold text-muted-foreground">
                    {t.note}
                  </p>
                )}
                {t.receipt_url && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const url = await createReceiptSignedUrl(t.receipt_url!);
                        window.location.assign(url);
                      } catch (error) {
                        showError(error);
                      }
                    }}
                    className="mt-2 flex items-center gap-1.5 text-xs font-bold text-accent-ink"
                  >
                    <ReceiptText className="size-3.5" />
                    عرض سند الدفع
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
