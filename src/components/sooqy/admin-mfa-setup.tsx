import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type TotpEnrollment = {
  id: string;
  totp: {
    qr_code: string;
    secret: string;
  };
};

export function AdminMfaSetup() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const refreshFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    const active = data.totp.find((factor) => factor.status === "verified");
    setVerified(Boolean(active));
    setVerifiedFactorId(active?.id ?? null);
  };

  useEffect(() => {
    let active = true;
    void supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setMessage("تعذر التحقق من حالة المصادقة الثنائية.");
      } else {
        const verifiedFactor = data.totp.find((factor) => factor.status === "verified");
        setVerified(Boolean(verifiedFactor));
        setVerifiedFactorId(verifiedFactor?.id ?? null);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const beginEnrollment = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Arownd admin",
      });
      if (error) throw error;
      const enrollment = data as TotpEnrollment;
      setFactorId(enrollment.id);
      setQrCode(enrollment.totp.qr_code);
      setSecret(enrollment.totp.secret);
    } catch {
      setMessage("تعذر بدء إعداد المصادقة الثنائية. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };

  const verifyExistingFactor = async () => {
    if (!verifiedFactorId || code.replace(/\s/g, "").length !== 6 || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: verifiedFactorId,
        code: code.replace(/\s/g, ""),
      });
      if (error) throw error;
      setCode("");
      setMessage("تم تأكيد المصادقة الثنائية لهذه الجلسة.");
    } catch {
      setMessage("رمز التحقق غير صحيح أو انتهت صلاحيته. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };

  const verifyEnrollment = async () => {
    if (!factorId || code.replace(/\s/g, "").length !== 6 || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.replace(/\s/g, ""),
      });
      if (error) throw error;
      await refreshFactors();
      setQrCode(null);
      setSecret(null);
      setFactorId(null);
      setCode("");
      setMessage("تم تفعيل المصادقة الثنائية لهذا الحساب.");
    } catch {
      setMessage("رمز التحقق غير صحيح أو انتهت صلاحيته. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-[var(--radius-card)] border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-foreground">المصادقة الثنائية للإدارة</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            أضف رمز تحقق من تطبيق مصادقة لحماية حساب الإدارة.
          </p>
        </div>
        <span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-bold text-warning">
          {loading ? "جارٍ الفحص" : verified ? "مفعّلة" : "غير مفعّلة"}
        </span>
      </div>

      {!loading && !verified && !factorId && (
        <button
          type="button"
          onClick={() => void beginEnrollment()}
          disabled={busy}
          className="btn-primary w-full disabled:opacity-50"
        >
          {busy ? "جارٍ التجهيز..." : "إعداد المصادقة الثنائية"}
        </button>
      )}

      {!loading && verified && verifiedFactorId && (
        <div className="space-y-2">
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-foreground">رمز المصادقة لتأكيد هذه الجلسة</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              dir="ltr"
              className="min-h-12 w-full rounded-[var(--radius-control)] border border-input bg-background px-3 text-center text-lg tracking-[0.4em]"
              aria-label="رمز المصادقة المكون من ستة أرقام"
            />
          </label>
          <button
            type="button"
            onClick={() => void verifyExistingFactor()}
            disabled={busy || code.length !== 6}
            className="btn-primary w-full disabled:opacity-50"
          >
            {busy ? "جارٍ التحقق..." : "تأكيد الدخول الآمن"}
          </button>
        </div>
      )}

      {qrCode && factorId && (
        <div className="space-y-3 rounded-[var(--radius-control)] border border-border p-3">
          <p className="text-sm text-foreground">
            امسح رمز QR باستخدام تطبيق مصادقة، ثم أدخل الرمز المكوّن من 6 أرقام.
          </p>
          <img src={qrCode} alt="رمز إعداد المصادقة الثنائية" className="mx-auto size-48 bg-white p-2" />
          {secret && (
            <p className="break-all text-center text-xs text-muted-foreground" dir="ltr">
              المفتاح اليدوي: {secret}
            </p>
          )}
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-foreground">رمز التحقق</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              dir="ltr"
              className="min-h-12 w-full rounded-[var(--radius-control)] border border-input bg-background px-3 text-center text-lg tracking-[0.4em]"
              aria-label="رمز المصادقة المكون من ستة أرقام"
            />
          </label>
          <button
            type="button"
            onClick={() => void verifyEnrollment()}
            disabled={busy || code.length !== 6}
            className="btn-primary w-full disabled:opacity-50"
          >
            {busy ? "جارٍ التحقق..." : "تأكيد وتفعيل"}
          </button>
        </div>
      )}

      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    </section>
  );
}
