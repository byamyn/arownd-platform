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
import { useAuth } from "@/lib/auth";
import { useRealtimeSubscription } from "@/hooks/use-realtime";
import { formatDA } from "@/lib/geo";
import { formatDate, formatTime } from "@/lib/market";
import {
  fetchWalletTransactions,
  summarizeWallet,
  uploadImageToBucket,
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

type Tab = "all" | "pending" | "approved" | "rejected";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "الكل" },
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
        <span className="flex size-20 items-center justify-center rounded-3xl bg-primary-soft">
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
  const filtered = tab === "all" ? list : list.filter((t) => t.status === tab);
  const pendingCount = list.filter((t) => t.status === "pending").length;

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
      toast.success("أُرسل طلب الشحن — سيُعتمد بعد مراجعة الإدارة.");
      setTopupAmount("");
      setTopupReceipt(null);
      setShowTopup(false);
      await qc.invalidateQueries({ queryKey: ["wallet"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر إرسال طلب الشحن.");
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
      await walletWithdraw({ amount, method: withdrawMethod, note: withdrawNote.trim() || undefined });
      toast.success("أُرسل طلب السحب — سيُنفَّذ بعد مراجعة الإدارة.");
      setWithdrawAmount("");
      setWithdrawNote("");
      setShowWithdraw(false);
      await qc.invalidateQueries({ queryKey: ["wallet"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر إرسال طلب السحب.");
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
      <div className="mx-auto max-w-xl space-y-4 px-4 pb-24 pt-5">
        <PageHeader title="المحفظة" subtitle="رصيدك وعملياتك المالية في مكان واحد" back="/profile" />

        {/* بطاقة الرصيد */}
        <div className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold opacity-80">الرصيد المتاح</p>
              <p dir="ltr" className="mt-1 text-3xl font-extrabold">
                {formatDA(summary.balance)}
              </p>
            </div>
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15">
              <Wallet className="size-7" />
            </span>
          </div>
          <p className="mt-2 text-[11px] font-semibold opacity-70">
            يُحتسب من العمليات المعتمدة · المعلّقة في انتظار مراجعة الإدارة
          </p>
        </div>

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
          <div className="animate-fade-up space-y-3 rounded-2xl border border-border bg-card p-4">
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
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-start outline-none transition focus:ring-2 focus:ring-primary/30"
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
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-primary/30"
              >
                {METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-dashed border-border bg-background px-3 py-3 text-sm font-bold transition active:scale-[0.99]">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Upload className="size-4" />
                {topupReceipt ? "تم اختيار السند ✓" : "أرفق صورة سند الدفع *"}
              </span>
              <input
                type="file"
                accept="image/*"
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
          <div className="animate-fade-up space-y-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-extrabold text-foreground">سحب رصيد</p>
            <p className="text-[11px] font-semibold text-muted-foreground">
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
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-start outline-none transition focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">
                طريقة الاستلام
              </label>
              <select
                value={withdrawMethod}
                onChange={(e) => setWithdrawMethod(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-primary/30"
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
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button onClick={submitWithdraw} disabled={busyWithdraw} className="btn-primary w-full">
              {busyWithdraw ? "جارٍ الإرسال..." : "إرسال طلب السحب"}
            </button>
          </div>
        )}

        {/* إحصاءات سريعة */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-extrabold text-foreground">{pendingCount}</p>
            <p className="text-[10px] font-bold text-muted-foreground">قيد المراجعة</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-extrabold text-success" dir="ltr">
              {formatDA(summary.totalTopup)}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground">إجمالي الإيداعات</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-extrabold text-danger" dir="ltr">
              {formatDA(summary.totalWithdraw)}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground">إجمالي السحوبات</p>
          </div>
        </div>

        {/* التبويبات */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
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
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        )}

        {!txs.isLoading && filtered.length === 0 && (
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
              cls: "bg-neutral-200 text-neutral-600",
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
              <div key={t.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                      t.amount >= 0 ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{meta.label}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
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
                      className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold", st.cls)}
                    >
                      {st.label}
                    </span>
                  </div>
                </div>
                {t.note && (
                  <p className="mt-2 rounded-xl bg-background px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                    {t.note}
                  </p>
                )}
                {t.receipt_url && (
                  <a
                    href={t.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1.5 text-xs font-bold text-accent-ink"
                  >
                    <ReceiptText className="size-3.5" />
                    عرض سند الدفع
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
