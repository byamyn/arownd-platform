import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Truck } from "lucide-react";
import { toast } from "sonner";
import { showError, showSuccess } from "@/lib/feedback";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { registerDeliveryCompany } from "@/lib/delivery";
import type { Database } from "@/integrations/supabase/types";
import { PageHeader } from "@/components/sooqy/page-header";
import { cn } from "@/lib/utils";
import { normalizePhone } from "@/lib/sooqy";

export const Route = createFileRoute("/delivery-register")({
  head: () => ({
    meta: [
      { title: "تسجيل شركة توصيل — Arownd" },
      {
        name: "description",
        content:
          "سجّل شركة التوصيل الخاصة بك في Arownd لاستقبال طلبات الشحن من المتاجر وإدارة التوصيلات.",
      },
    ],
  }),
  component: DeliveryRegisterPage,
});

function DeliveryRegisterPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  if (!ready) return null;

  if (!user) {
    return (
      <div className="space-y-4 px-4 pt-16 text-center">
        <Truck className="mx-auto size-12 text-accent-ink" />
        <h1 className="text-2xl font-bold">تحتاج لدخول الحساب</h1>
        <p className="text-sm text-muted-foreground">
          لتسجيل شركة توصيل، يجب أن تكون مسجلاً الدخول أولاً.
        </p>
        <Link
          to="/auth"
          search={{ redirect: "/delivery-register" }}
          className="inline-block bg-primary min-h-[var(--control-height)] rounded-full px-6 py-3 font-bold text-primary-foreground"
        >
          دخول
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || busy) return;
    if (!companyName.trim() || !contactPhone.trim()) {
      toast.error("يرجى ملء اسم الشركة ورقم الهاتف على الأقل.");
      return;
    }
    // شركة التوصيل قد تسجّل هاتفًا ثابتًا (021…) أو جوالًا: نقبل 9–10 أرقام تبدأ بـ 0
    if (!/^0\d{8,9}$/.test(normalizePhone(contactPhone.trim()))) {
      toast.error("رقم الهاتف غير صالح — أدخل رقمًا جزائريًا يبدأ بـ 0 (جوال أو ثابت).");
      return;
    }
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        user_id: user.id,
        company_name: companyName.trim(),
        contact_phone: normalizePhone(contactPhone.trim()),
      };
      if (contactName.trim()) payload["contact_name"] = contactName.trim();
      if (email.trim()) payload["email"] = email.trim();
      if (licenseNumber.trim()) payload["license_number"] = licenseNumber.trim();
      await registerDeliveryCompany(
        payload as Database["public"]["Tables"]["delivery_companies"]["Insert"],
      );
      showSuccess(
        "تم إرسال طلب تسجيل الشركة. سيتم مراجعته واعتماده من قبل المنصة قبل تفعيل الحساب.",
      );
      navigate({ to: "/", replace: true });
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 px-4 pb-32 pt-5">
      <PageHeader title="تسجيل شركة توصيل" subtitle="انضم إلى شبكة التوصيل في Arownd" back="/" />

      <section className="rounded-[var(--radius-card)] bg-card p-5  space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="size-5 text-accent-ink" />
          <h2 className="font-bold">بيانات الشركة</h2>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="اسم الشركة التجاري"
            aria-label="اسم الشركة التجاري"
            autoComplete="organization"
            className="h-[var(--control-height)] w-full rounded-[var(--radius-control)] border border-input bg-background px-3 outline-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="اسم الشخص المسؤول (اختياري)"
            aria-label="اسم الشخص المسؤول (اختياري)"
            autoComplete="name"
            className="h-[var(--control-height)] w-full rounded-[var(--radius-control)] border border-input bg-background px-3 outline-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          <input
            required
            type="tel"
            inputMode="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="رقم هاتف الشركة (مطلوب)"
            aria-label="رقم هاتف الشركة (مطلوب)"
            autoComplete="tel"
            className="h-[var(--control-height)] w-full rounded-[var(--radius-control)] border border-input bg-background px-3 outline-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني (اختياري)"
            aria-label="البريد الإلكتروني (اختياري)"
            autoComplete="email"
            className="h-[var(--control-height)] w-full rounded-[var(--radius-control)] border border-input bg-background px-3 outline-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          <input
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="رقم السجل التجاري / الرخصة (اختياري)"
            aria-label="رقم السجل التجاري / الرخصة (اختياري)"
            className="h-[var(--control-height)] w-full rounded-[var(--radius-control)] border border-input bg-background px-3 outline-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />

          <p className="text-xs text-muted-foreground leading-relaxed">
            بعد التسجيل، ستظهر شركتك في قائمة الشركات المتاحة للمتاجر، ولكن لن يتم قبول طلبات الشحن
            حتى يتم اعتماد حسابك من قبل إدارة المنصة.
          </p>

          <button
            type="submit"
            disabled={busy}
            className={cn(
              "w-full bg-primary min-h-[var(--control-height)] rounded-full px-6 py-3 font-bold text-primary-foreground transition disabled:opacity-50",
              busy && "cursor-not-allowed",
            )}
          >
            {busy ? "جارٍ الإرسال..." : "إرسال طلب التسجيل"}
          </button>
        </form>
      </section>

      <div className="text-center text-xs text-muted-foreground">
        لديك حساب بالفعل؟{" "}
        <Link to="/" className="text-accent-ink font-bold hover:underline">
          العودة إلى الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
