import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Bell,
  Camera,
  CalendarDays,
  FileText,
  Heart,
  HelpCircle,
  MapPin,
  Package,
  Pencil,
  Phone,
  Shield,
  Store,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import {
  fetchMyOrders,
  fetchMyReservations,
  fetchMyProfile,
  fetchMyRoles,
  fetchMyStore,
  fetchSchemaSupport,
  isValidDzPhone,
  normalizePhone,
  updateMyProfile,
  uploadImageToBucket,
} from "@/lib/sooqy";
import { WilayaButton, WilayaSelect, wilayasQuery } from "@/components/sooqy/WilayaSelect";
import { PageHeader } from "@/components/sooqy/page-header";
import { MenuCard, MenuRow, SectionTitle } from "@/components/sooqy/list-menu";
import { AppShell } from "@/components/sooqy/app-shell";
import { SideSheet } from "@/components/sooqy/side-sheet";
import { SeoHead } from "@/components/seo/SeoHead";
import { ErrorState } from "@/components/sooqy/error-state";

export const Route = createFileRoute("/profile")({
  head: () => ({}),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["my-profile"], queryFn: fetchMyProfile, enabled: !!user });
  const orders = useQuery({ queryKey: ["my-orders"], queryFn: fetchMyOrders, enabled: !!user });
  const reservations = useQuery({ queryKey: ["my-reservations"], queryFn: fetchMyReservations, enabled: !!user });
  const myStore = useQuery({ queryKey: ["my-store"], queryFn: fetchMyStore, enabled: !!user });
  // user_roles يقبل عدة صفوف لكل مستخدم (customer/merchant/admin) —
  // نقرأها كمصفوفة؛ الاستعلام بـ.single() كان يفشل بخطأ 406 عند أكثر من صف
  const roleQuery = useQuery({
    queryKey: ["my-role", user?.id],
    queryFn: fetchMyRoles,
    enabled: !!user,
  });
  const isAdmin = roleQuery.data?.includes("admin") ?? false;
  const wilayas = useQuery(wilayasQuery);
  const favorites = useFavorites();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilayaId, setWilayaId] = useState<number | null>(null);
  const [commune, setCommune] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // عندما يbecome Merchant، يتحول ملفه الشخصي مباشرة إلى استوديو التاجر
  useEffect(() => {
    if (!ready || !user) return;
    if (myStore.isLoading) return;
    if (myStore.data) {
      navigate({ to: "/studio" });
    }
  }, [ready, user, myStore.data, myStore.isLoading, navigate]);
  const [editing, setEditing] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // تعبئة النموذج من بيانات الحساب والملف — مرة واحدة
  useEffect(() => {
    // لا نغلق التحميل قبل اكتمال استعلام الملف الشخصي؛ وإلا قد تبقى
    // حقول الهاتف والولاية والبلدية فارغة إذا وصل الملف بعد أول render.
    if (loaded || !user || !profile.isFetched) return;
    setFullName(
      profile.data?.full_name ?? (user.user_metadata?.["full_name"] as string | undefined) ?? "",
    );
    if (profile.data) {
      setPhone(profile.data.phone ?? "");
      setWilayaId(profile.data.wilaya_id);
      setCommune(profile.data.commune ?? "");
      setAvatarPreview(profile.data.avatar_url ?? null);
    }
    setLoaded(true);
  }, [user, profile.data, profile.isFetched, loaded]);

  if (!ready) return null;
  if (!user) {
    return (
      <AppShell className="pb-24 pt-6">
        <PageHeader title="الملف الشخصي" subtitle="حسابك وبياناتك في مكان واحد" />
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-soft text-accent-ink">
            <User className="size-7" />
          </span>
          <p className="mt-3 text-body font-bold text-foreground">سجّل الدخول لتخصيص ملفك</p>
          <p className="mt-1 text-sm text-muted-foreground">
            تابع طلباتك ومفضلتك وإعدادات حسابك في مكان واحد
          </p>
          <Link to="/auth" className="btn-primary mt-4 w-full">
            تسجيل الدخول
          </Link>
        </div>
      </AppShell>
    );
  }

  const name = (user.user_metadata?.["full_name"] as string | undefined) ?? "";
  const displayName = name || (user.email ?? "مستخدم Arownd");
  const initial = (user.email ?? "؟").slice(0, 1).toUpperCase();
  const favCount = favorites.products.length + favorites.stores.length;

  const save = async () => {
    const cleanName = fullName.trim();
    if (!cleanName) {
      toast.error("اكتب اسمك الكامل.");
      return;
    }
    const p = normalizePhone(phone.trim());
    if (p && !isValidDzPhone(p)) {
      toast.error("رقم الهاتف غير صالح — يجب أن يبدأ بـ 05 أو 06 أو 07.");
      return;
    }
    setBusy(true);
    try {
      let avatarUrl: string | null | undefined = undefined;
      let avatarSkipped = false;
      if (avatar) {
        avatarUrl = await uploadImageToBucket(avatar, "store-media");
        // القاعدة غير مهاجَرة (عمود avatar_url مفقود) — لا تخزين صامت بلا نتيجة
        const support = await fetchSchemaSupport();
        avatarSkipped = !support.avatar;
      }
      await updateMyProfile({
        full_name: cleanName,
        phone: p,
        wilaya_id: wilayaId,
        commune: commune.trim(),
        ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
      });
      // مزامنة الاسم مع auth metadata ليظهر في حسابي فورًا
      await supabase.auth.updateUser({ data: { full_name: cleanName } });
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
      if (avatarSkipped) {
        toast.warning("حُفظت بياناتك، لكن الصورة الشخصية تحتاج تحديث قاعدة البيانات.");
      } else {
        toast.success("تم حفظ الملف الشخصي ✅");
      }
      setEditing(false);
      navigate({ to: "/settings" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر الحفظ.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SeoHead
        title="الملف الشخصي — Arownd"
        description="عدّل اسمك ورقم هاتفك وولايتك في منصة Arownd."
        keywords="الملف الشخصي, حساب, Arownd"
        ogType="website"
      />
      <AppShell className="space-y-5 pb-24 pt-6">
        <PageHeader
          title="الملف الشخصي"
          subtitle="حسابك وبياناتك في مكان واحد"
          action={
            isAdmin ? (
              <Link
                to="/admin"
                aria-label="لوحة الإدارة"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-soft transition hover:bg-amber-600 active:scale-95"
              >
                <Shield className="size-4.5" />
              </Link>
            ) : undefined
          }
        />

        {profile.isError && (
          <ErrorState scope="profile" error={profile.error} onRetry={() => profile.refetch()} />
        )}

        {/* بطاقة الهوية: غلاف + صورة متداخلة + بيانات + إحصاءات سريعة */}
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <div className="h-20 bg-gradient-to-br from-primary via-primary/70 to-primary-soft" />
          <div className="px-5 pb-5">
            <div className="-mt-10 flex items-end justify-between gap-3">
              <div className="relative shrink-0">
                <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-primary-soft ring-4 ring-card">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="صورتك الشخصية"
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-extrabold text-accent-ink">
                      {(displayName || initial).trim()[0]}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -end-1 flex size-8 items-center justify-center rounded-full bg-primary text-accent-ink-foreground shadow-soft ring-2 ring-card transition active:scale-95"
                  aria-label="تغيير الصورة الشخصية"
                >
                  <Camera className="size-4" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setAvatar(f);
                    setAvatarPreview((old) => {
                      if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
                      return f ? URL.createObjectURL(f) : (profile.data?.avatar_url ?? null);
                    });
                  }}
                  className="hidden"
                />
              </div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-bold text-accent-ink-foreground shadow-soft transition active:scale-95"
              >
                <Pencil className="size-4" /> تعديل
              </button>
            </div>

            <div className="mt-3 min-w-0">
              <h2 className="truncate text-xl font-extrabold text-foreground">{displayName}</h2>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {profile.data?.phone && (
                <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                  <Phone className="size-3.5 text-muted-foreground" />
                  <span dir="ltr">{profile.data.phone}</span>
                </span>
              )}
              {(profile.data?.commune || profile.data?.wilaya_id != null) && (
                <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  <span className="truncate">
                    {profile.data.commune ?? ""}
                    {profile.data.commune && profile.data.wilaya_id != null ? "، " : ""}
                    {wilayas.data?.find((w) => w.id === profile.data?.wilaya_id)?.name_ar ??
                      (profile.data.wilaya_id != null
                        ? String(profile.data.wilaya_id).padStart(2, "0")
                        : "")}
                  </span>
                </span>
              )}
              {profile.data?.is_phone_verified && (
                <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-bold text-success">
                  <BadgeCheck className="size-3.5" /> هاتف موثّق
                </span>
              )}
              {myStore.data && (
                <span className="flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-accent-ink">
                  <Store className="size-3.5" /> تاجر
                </span>
              )}
              {isAdmin && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  <Shield className="size-3.5" /> مدير
                </span>
              )}
            </div>
          </div>
        </section>

        {/* نشاط الحساب — وصول مباشر إلى أهم الوجهات */}
        <section className="space-y-2" aria-label="نشاط الحساب">
          <SectionTitle>نشاطك</SectionTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
            { to: "/orders", Icon: Package, label: "طلباتي", value: orders.data?.length ?? 0 },
            { to: "/reservations", Icon: CalendarDays, label: "حجوزاتي", value: reservations.data?.length ?? 0 },
            { to: "/favorites", Icon: Heart, label: "المفضلة", value: favCount },
            { to: "/wallet", Icon: Wallet, label: "المحفظة", value: null },
          ].map(({ to, Icon, label, value }) => (
            <Link
              key={to}
              to={to}
              className="card-premium flex min-h-24 flex-col items-center justify-center gap-1 p-3 text-center"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-accent-ink">
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <span className="text-xs font-bold text-foreground">{label}</span>
              {value !== null && (
                <span className="text-lg font-extrabold leading-none text-foreground">
                  {to === "/orders"
                    ? orders.isLoading
                      ? "…"
                      : orders.isError
                        ? "—"
                        : value
                    : value}
                </span>
              )}
            </Link>
            ))}
          </div>
        </section>

        {/* إدارة الحساب — مجموعات مرتبة */}
        <section className="space-y-2">
          <SectionTitle>إدارة الحساب</SectionTitle>
          <MenuCard>
            <MenuRow
              icon={User}
              label="البيانات الشخصية"
              hint="الاسم، الهاتف، الولاية والبلدية"
              onClick={() => setEditing(true)}
            />
            <MenuRow
              icon={Bell}
              label="الإشعارات"
              hint="طلباتك وحصريات متجرك"
              to="/notifications"
            />
          </MenuCard>
        </section>

        {/* الدعم والمعلومات القانونية */}
        <section className="space-y-2">
          <SectionTitle>الدعم والمعلومات</SectionTitle>
          <MenuCard>
            <MenuRow icon={HelpCircle} label="المساعدة والدعم" to="/help" />
            <MenuRow icon={FileText} label="الشروط وسياسة الخصوصية" to="/terms" />
          </MenuCard>
        </section>

        <div className="pt-1">
          <p className="pt-3 text-center text-xs text-muted-foreground">
            Arownd · الإصدار التجريبي
          </p>
        </div>

        {/* نموذج تعديل الملف — لوحة جانبية بدل نموذج في أسفل الصفحة */}
        <SideSheet
          open={editing}
          onOpenChange={setEditing}
          title="تعديل الملف الشخصي"
          description="الاسم والهاتف والموقع الذي تُحسب عليه التوصيل والعروض القريبة."
          footer={
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {busy ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </button>
          }
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="profile-full-name"
                className="mb-1 block text-xs font-bold text-muted-foreground"
              >
                الاسم الكامل *
              </label>
              <input
                id="profile-full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: أحمد بن يوسف"
                autoComplete="name"
                className="h-12 w-full rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label
                htmlFor="profile-phone"
                className="mb-1 block text-xs font-bold text-muted-foreground"
              >
                رقم الهاتف
              </label>
              <input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XX XX XX XX"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                className="h-12 w-full rounded-xl border border-input bg-background px-3 text-start outline-none transition focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="mb-1 block text-xs font-bold text-muted-foreground">الولاية</span>
                <WilayaButton
                  value={wilayaId}
                  onChange={setWilayaId}
                  allLabel="اختر الولاية"
                  className="w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-commune"
                  className="mb-1 block text-xs font-bold text-muted-foreground"
                >
                  البلدية
                </label>
                <input
                  id="profile-commune"
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  placeholder="مثال: باب الزوار"
                  autoComplete="address-level2"
                  className="h-12 w-full rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        </SideSheet>
      </AppShell>
    </>
  );
}
