import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/sooqy/page-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { showError } from "@/lib/feedback";
import { translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/delete-account")({
  head: () => ({ meta: [{ title: translate("delete_seo_title") }] }),
  component: DeleteAccountPage,
});

type DeletionRequest = {
  id: string;
  status: "pending" | "under_review" | "blocked" | "completed" | "rejected";
  requested_at: string;
  updated_at: string;
  resolved_at: string | null;
  retention_note: string | null;
};

const statusLabels: Record<DeletionRequest["status"], string> = {
  pending: "قيد الانتظار",
  under_review: "قيد المراجعة",
  blocked: "متوقف مؤقتًا",
  completed: "اكتمل",
  rejected: "لم تتم الموافقة",
};

function DeleteAccountPage() {
  const { user, ready } = useAuth();
  const { t, lang } = useTranslation();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const requests = useQuery({
    queryKey: ["account-deletion-requests", user?.id],
    enabled: !!user,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_deletion_requests")
        .select("id,status,requested_at,updated_at,resolved_at,retention_note")
        .eq("user_id", user!.id)
        .order("requested_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as DeletionRequest[];
    },
  });

  const submitRequest = async () => {
    if (!user || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("request_account_deletion");
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["account-deletion-requests", user.id] });
      toast.success("تم تسجيل طلب حذف الحساب. يمكنك متابعة حالته هنا.");
    } catch (error) {
      showError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const hasOpenRequest = requests.data?.some((request) =>
    ["pending", "under_review", "blocked"].includes(request.status),
  );

  const cancelRequest = async (requestId: string) => {
    if (!user || submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("cancel_account_deletion_request", {
        _request_id: requestId,
      });
      if (error) throw error;
      if (!data) throw new Error("لا يمكن إلغاء الطلب بعد بدء التنفيذ.");
      await queryClient.invalidateQueries({ queryKey: ["account-deletion-requests", user.id] });
    } catch (error) {
      showError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-page mx-auto max-w-xl space-y-5 pb-8 pt-4">
      <PageHeader title="حذف الحساب" subtitle="إدارة طلب حذف حساب Arownd" back="/settings" />

      <section className="rounded-[var(--radius-card)] border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="size-5" />
          </span>
          <div>
            <h2 className="font-bold text-foreground">طلب حذف الحساب والبيانات</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              يمكنك تقديم الطلب من التطبيق أو من هذه الصفحة على الويب. سيتحقق فريق Arownd من
              الطلب، ويراجع الطلبات النشطة والسجلات التي يجب الاحتفاظ بها قانونيًا، ثم يحذف أو
              يزيل هوية البيانات التي لا يلزم الاحتفاظ بها.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-muted/60 p-3 text-sm leading-6 text-muted-foreground">
          <p className="font-semibold text-foreground">قبل الإرسال</p>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            <li>لا يؤدي إرسال الطلب إلى حذف فوري أو تلقائي للحساب.</li>
            <li>قد يتأخر إتمام الطلب عند وجود طلبات أو شحنات أو تحصيلات أو نزاع مفتوح.</li>
            <li>قد تُحفظ المستندات المحاسبية التي يفرض القانون الاحتفاظ بها، مع تقليل البيانات الشخصية غير اللازمة.</li>
            <li>لن نطلب منك كلمة المرور أو رمز التحقق عبر البريد.</li>
          </ul>
          <Link to="/privacy" className="mt-2 inline-flex font-bold text-accent-ink">
            اقرأ سياسة الخصوصية
          </Link>
        </div>
      </section>

      {!ready ? (
        <p className="text-sm text-muted-foreground">جارٍ التحقق من حالة تسجيل الدخول...</p>
      ) : !user ? (
        <section className="rounded-[var(--radius-card)] border border-border bg-card p-4">
          <p className="text-sm leading-6 text-muted-foreground">
            لإرسال طلب إلكتروني ومتابعة حالته، سجّل الدخول إلى حسابك. هذه الصفحة متاحة أيضًا
            خارج التطبيق من متصفح الويب.
          </p>
          <Link to="/auth" className="btn-primary mt-4 inline-flex w-full justify-center">
            تسجيل الدخول للمتابعة
          </Link>
          <a
            href="mailto:arownddz@gmail.com?subject=%D8%B7%D9%84%D8%A8%20%D8%AD%D8%B0%D9%81%20%D8%AD%D8%B3%D8%A7%D8%A8%20Arownd"
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border px-4 text-sm font-bold text-foreground"
          >
            لا أستطيع الدخول إلى حسابي — تواصل مع الدعم
          </a>
        </section>
      ) : (
        <>
          <section className="rounded-[var(--radius-card)] border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">الحساب المطلوب حذفه</p>
            <p className="mt-1 font-semibold text-foreground" dir="ltr">{user.email}</p>
            <button
              type="button"
              onClick={() => void submitRequest()}
              disabled={submitting || requests.isLoading || !!requests.error || !!hasOpenRequest}
              className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "جارٍ تسجيل الطلب..." : hasOpenRequest ? "لديك طلب قيد المعالجة" : "إرسال طلب حذف الحساب"}
            </button>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              يتطلب إرسال الطلب تسجيل الدخول. لا يتم حذف الحساب قبل مراجعة الالتزامات والسجلات المطلوبة.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-bold text-foreground">حالة طلباتك</h2>
            {requests.isLoading ? (
              <p className="text-sm text-muted-foreground">جارٍ تحميل الطلبات...</p>
            ) : requests.error ? (
              <div className="space-y-3 rounded-xl border border-destructive/30 p-3 text-sm">
                <div className="flex items-start gap-2 text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>خدمة تسجيل الطلبات غير مفعّلة حاليًا على الخادم. لم يتم إرسال طلبك.</span>
                </div>
                <a href="mailto:arownddz@gmail.com?subject=%D8%B7%D9%84%D8%A8%20%D8%AD%D8%B0%D9%81%20%D8%AD%D8%B3%D8%A7%D8%A8%20Arownd" className="inline-flex min-h-10 items-center font-bold text-accent-ink underline">
                  إرسال طلب الحذف إلى الدعم
                </a>
              </div>
            ) : requests.data?.length ? (
              requests.data.map((request) => (
                <article key={request.id} className="rounded-[var(--radius-card)] border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    {request.status === "completed" ? (
                      <CheckCircle2 className="size-4 text-green-600" />
                    ) : (
                      <Clock3 className="size-4 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-foreground">{statusLabels[request.status]}</span>
                    <span className="ms-auto text-xs text-muted-foreground">
                      {new Date(request.requested_at).toLocaleDateString("ar-DZ")}
                    </span>
                  </div>
                  {request.retention_note && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{request.retention_note}</p>
                  )}
                  {["pending", "under_review", "blocked"].includes(request.status) && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void cancelRequest(request.id)}
                      className="btn-secondary mt-3 w-full disabled:opacity-50"
                    >
                      {submitting ? "جارٍ التنفيذ..." : "إلغاء طلب الحذف"}
                    </button>
                  )}
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                لا توجد طلبات حذف مسجلة لهذا الحساب.
              </p>
            )}
          </section>
        </>
      )}
      <p className="text-xs leading-5 text-muted-foreground">
        للاستفسارات أو إذا تعذر عليك الوصول إلى الحساب: arownddz@gmail.com
      </p>
    </div>
  );
}
