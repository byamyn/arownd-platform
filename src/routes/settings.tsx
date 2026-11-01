import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Bell,
  FileText,
  Eye,
  EyeOff,
  Globe,
  HelpCircle,
  Info,
  LogOut,
  Monitor,
  Moon,
  Shield,
  Sun,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { showError, showSuccess } from "@/lib/feedback";
import { supabase } from "@/integrations/supabase/client";
import { unregisterMyPushDevices } from "@/lib/push-notifications";
import { useAuth } from "@/lib/auth";
import { fetchMyProfile, fetchMyAccountType, setMyProfileVisibility } from "@/lib/sooqy";
import { useTheme, type Theme } from "@/lib/theme";
import { PageHeader } from "@/components/sooqy/page-header";
import { MenuCard, MenuRow, SectionTitle } from "@/components/sooqy/list-menu";
import { ConfirmDialog } from "@/components/sooqy/confirm-dialog";
import { BottomSheet } from "@/components/sooqy/bottom-sheet";
import { SideSheet } from "@/components/sooqy/side-sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "الإعدادات — Arownd" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [signingOut, setSigningOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const profile = useQuery({ queryKey: ["my-profile"], queryFn: fetchMyProfile, enabled: !!user });
  const accountType = useQuery({ queryKey: ["my-account-type", user?.id], queryFn: fetchMyAccountType, enabled: !!user });
  const [visibilityBusy, setVisibilityBusy] = useState(false);
  const changeVisibility = async () => {
    if (!profile.data || visibilityBusy) return;
    setVisibilityBusy(true);
    try {
      await setMyProfileVisibility(!profile.data.is_public);
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
      showSuccess(!profile.data.is_public ? "أصبح ملفك الشخصي عاماً" : "أصبح ملفك الشخصي خاصاً");
    } catch (error) {
      showError(error);
    } finally {
      setVisibilityBusy(false);
    }
  };
  const [showSecurity, setShowSecurity] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const themeLabel = theme === "system" ? "نظام" : theme === "dark" ? "داكن" : "فاتح";

  const signOut = async () => {
    if (signingOut) return;
    try {
      setSigningOut(true);
      // Best-effort cleanup: do not block sign-out if the device is offline.
      try {
        await unregisterMyPushDevices();
      } catch (pushError) {
        console.warn("[push] could not detach device before sign-out", pushError);
      }
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await qc.invalidateQueries();
      navigate({ to: "/" });
    } catch (error) {
      showError(error);
    } finally {
      setSigningOut(false);
    }
  };

  const changePassword = async () => {
    if (savingPassword) return;
    if (newPassword.length < 8) {
      toast.error("كلمة المرور يجب ألا تقل عن 8 أحرف.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين.");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showSuccess("تم تغيير كلمة المرور.");
      setNewPassword("");
      setConfirmPassword("");
      setShowSecurity(false);
    } catch (e) {
      showError(e);
    } finally {
      setSavingPassword(false);
    }
  };

  // لا توجد واجهة خادم لحذف المستخدم من العميل؛ الطلب يُرسل للدعم عبر البريد
  // المذكور في سياسة الخصوصية، ولا نُظهر نجاح حذف لم يحدث.
  const requestAccountDeletion = () => {
    const subject = encodeURIComponent("طلب حذف حساب Arownd");
    const body = encodeURIComponent(
      `أرغب في حذف حسابي وبياناتي نهائيًا.\nالبريد المسجّل: ${user?.email ?? ""}`,
    );
    window.location.href = `mailto:app.sooqy@gmail.com?subject=${subject}&body=${body}`;
    setConfirmDelete(false);
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-6 pt-4">
        <PageHeader title="الإعدادات" back="/profile" />
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-body text-muted-foreground">يرجى تسجيل الدخول للوصول إلى الإعدادات</p>
          <Link to="/auth" className="btn-primary mt-4 w-full">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  const name = (user.user_metadata?.["full_name"] as string | undefined) ?? "مستخدم Arownd";
  const email = user.email ?? "";
  const initial = (email || "؟").slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 pb-6 pt-4">
      <PageHeader title="الإعدادات" subtitle="خصّص تجربتك في Arownd" back="/profile" />

      {/* بطاقة الحساب */}
      <div className="card-premium flex items-center gap-4 p-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-accent-ink ring-2 ring-primary/40">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-h3 text-foreground">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
        <Link
          to="/profile"
          className="flex min-h-11 shrink-0 items-center rounded-full bg-primary-soft px-4 text-sm font-bold text-accent-ink"
        >
          تعديل
        </Link>
      </div>

      {/* ظهور الملف الشخصي للحسابات الشخصية فقط */}
      {accountType.data === "personal" && (
      <section className="space-y-2">
        <SectionTitle>ظهور الملف الشخصي</SectionTitle>
        <MenuCard>
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-bold text-foreground">الملف الشخصي العام</p>
              <p className="mt-1 text-sm text-muted-foreground">تحكم فيما إذا كان بإمكان الآخرين مشاهدة ملفك</p>
              <p className="mt-2 text-xs font-semibold text-muted-foreground">{profile.data?.is_public ? "ظاهر للآخرين" : "خاص"}</p>
            </div>
            <button type="button" onClick={() => void changeVisibility()} disabled={visibilityBusy || profile.isLoading || !profile.data} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border px-4 text-sm font-bold text-foreground disabled:opacity-50">
              {profile.data?.is_public ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {visibilityBusy ? "جارٍ الحفظ..." : profile.data?.is_public ? "جعله خاصاً" : "جعله عاماً"}
            </button>
          </div>
          {profile.data?.is_public && <div className="px-4 pb-3"><Link to="/profile" search={{ public_id: user.id }} className="text-sm font-bold text-accent-ink">معاينة الملف الشخصي العام</Link></div>}
        </MenuCard>
      </section>
      )}

      {/* مجموعة: الحساب */}
      <section className="space-y-2">
        <SectionTitle>الحساب</SectionTitle>
        <MenuCard>
          <MenuRow
            icon={Shield}
            label="الأمان وتسجيل الدخول"
            hint="تغيير كلمة المرور"
            onClick={() => setShowSecurity(true)}
          />
        </MenuCard>
      </section>

      {/* مجموعة: تفضيلات التطبيق */}
      <section className="space-y-2">
        <SectionTitle>تفضيلات التطبيق</SectionTitle>
        <MenuCard>
          <MenuRow icon={Bell} label="الإشعارات" hint="طلباتك وحصريات متجرك" to="/notifications" />
          <MenuRow icon={Globe} label="اللغة" hint="العربية" soon />
          <MenuRow
            icon={Moon}
            label="المظهر"
            hint={themeLabel}
            onClick={() => setShowTheme(true)}
          />
        </MenuCard>
      </section>

      {/* مجموعة: المساعدة والخصوصية */}
      <section className="space-y-2">
        <SectionTitle>المساعدة والخصوصية</SectionTitle>
        <MenuCard>
          <MenuRow icon={HelpCircle} label="المساعدة والدعم" to="/help" />
          <MenuRow icon={FileText} label="الشروط وسياسة الخصوصية" to="/terms" />
          <MenuRow icon={Info} label="حول Arownd" to="/about" />
        </MenuCard>
      </section>

      {/* مجموعة: الإجراءات */}
      <section className="space-y-2">
        <SectionTitle>الإجراءات</SectionTitle>
        <MenuCard>
          <MenuRow
            icon={LogOut}
            label={signingOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
            onClick={() => void signOut()}
          />
          <MenuRow
            icon={Trash2}
            label="طلب حذف الحساب"
            hint="يُرسل الطلب إلى الدعم"
            danger
            onClick={() => setConfirmDelete(true)}
          />
        </MenuCard>
      </section>

      {/* أسفل الصفحة */}
      <p className="pt-2 text-center text-xs text-muted-foreground">Arownd · الإصدار التجريبي</p>

      <ConfirmDialog
        open={confirmDelete}
        title="طلب حذف الحساب"
        message="سيُفتح بريدك لإرسال طلب حذف حسابك وبياناتك إلى فريق الدعم. يُنفَّذ الحذف نهائيًا بعد التحقق من الطلب ولا يمكن التراجع عنه."
        confirmLabel="إرسال الطلب"
        tone="danger"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={requestAccountDeletion}
      />
      {/* الأمان: تغيير كلمة المرور */}
      <SideSheet
        open={showSecurity}
        onOpenChange={(o) => {
          setShowSecurity(o);
          if (!o) {
            setNewPassword("");
            setConfirmPassword("");
          }
        }}
        title="الأمان وتسجيل الدخول"
        description="اختر كلمة مرور جديدة لحسابك (8 أحرف على الأقل)."
        footer={
          <button
            type="button"
            onClick={() => void changePassword()}
            disabled={savingPassword}
            className="btn-primary w-full py-3 disabled:opacity-50"
          >
            {savingPassword ? "جارٍ الحفظ..." : "تغيير كلمة المرور"}
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="new-password"
              className="mb-1 block text-xs font-bold text-muted-foreground"
            >
              كلمة المرور الجديدة
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              dir="ltr"
              className="h-12 w-full rounded-xl border border-input bg-background px-3 text-start outline-none transition focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1 block text-xs font-bold text-muted-foreground"
            >
              تأكيد كلمة المرور
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              dir="ltr"
              className="h-12 w-full rounded-xl border border-input bg-background px-3 text-start outline-none transition focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </SideSheet>
      {/* نافذة اختيار المظهر — Modal مركّز في وسط الشاشة */}
      <BottomSheet
        open={showTheme}
        onClose={() => setShowTheme(false)}
        title="المظهر"
        subtitle="اختر نمط العرض المفضّل لديك"
        modal
        width={320}
        footer={
          <button
            type="button"
            onClick={() => setShowTheme(false)}
            className="btn-secondary w-full"
          >
            إلغاء
          </button>
        }
      >
        <div className="space-y-2">
          {(
            [
              { value: "light", label: "فاتح", icon: Sun },
              { value: "dark", label: "داكن", icon: Moon },
              { value: "system", label: "نظام", icon: Monitor },
            ] as {
              value: Theme;
              label: string;
              icon: React.ComponentType<{ className?: string }>;
            }[]
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setTheme(opt.value);
                setShowTheme(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",
                theme === opt.value
                  ? "bg-primary text-accent-ink-foreground"
                  : "border border-border bg-background text-foreground",
              )}
            >
              <opt.icon className="size-4.5 shrink-0" />
              <span>{opt.label}</span>
              {theme === opt.value && (
                <span aria-hidden className="ms-auto">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
