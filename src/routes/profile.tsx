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
  Eye,
  EyeOff,
  HelpCircle,
  MapPin,
  Package,
  Pencil,
  Phone,
  Shield,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { showError, showSuccess } from "@/lib/feedback";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import {
  fetchMyOrders,
  fetchMyReservations,
  fetchMyProfile,
  fetchPublicProfile,
  fetchMyRoles,
  fetchSchemaSupport,
  isValidDzPhone,
  normalizePhone,
  updateMyProfile,
  setMyProfileVisibility,
  uploadImageToBucket,
} from "@/lib/sooqy";
import { WilayaButton, WilayaSelect, wilayasQuery } from "@/components/sooqy/WilayaSelect";
import { PageHeader } from "@/components/sooqy/page-header";
import { MenuCard, MenuRow, SectionTitle } from "@/components/sooqy/list-menu";
import { AppShell } from "@/components/sooqy/app-shell";
import { SideSheet } from "@/components/sooqy/side-sheet";
import { SeoHead } from "@/components/seo/SeoHead";
import { ErrorState } from "@/components/sooqy/error-state";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/profile")({
  validateSearch: (s: Record<string, unknown>): { setup?: boolean; public_id?: string } => ({
    setup: s["setup"] === "1" || s["setup"] === true || s["setup"] === "true",
    public_id: typeof s["public_id"] === "string" ? s["public_id"] : undefined,
  }),
  head: () => ({}),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, ready } = useAuth();
  const { t } = useTranslation();
  const { setup, public_id } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["my-profile"], queryFn: fetchMyProfile, enabled: !!user && !public_id });
  const publicProfile = useQuery({
    queryKey: ["public-profile", public_id],
    queryFn: () => fetchPublicProfile(public_id!),
    enabled: !!public_id,
  });
  const orders = useQuery({ queryKey: ["my-orders"], queryFn: fetchMyOrders, enabled: !!user && !public_id });
  const reservations = useQuery({
    queryKey: ["my-reservations"],
    queryFn: fetchMyReservations,
    enabled: !!user && !public_id,
  });
  // user_roles يقبل عدة صفوف لكل مستخدم (customer/merchant/admin) —
  // نقرأها كمصفوفة؛ الاستعلام بـ.single() كان يفشل بخطأ 406 عند أكثر من صف
  const roleQuery = useQuery({
    queryKey: ["my-role", user?.id],
    queryFn: fetchMyRoles,
    enabled: !!user && !public_id,
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
  const [visibilityBusy, setVisibilityBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // يبقى الملف الشخصي متاحًا للتاجر أيضًا؛ الانتقال إلى الاستوديو إجراء اختياري.
  const [editing, setEditing] = useState(false);
  const [setupOpened, setSetupOpened] = useState(false);
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

  // بعد تأكيد البريد نفتح نموذج استكمال الملف الشخصي مباشرةً، دون المرور بصفحة الحساب العامة.
  useEffect(() => {
    if (!setup || setupOpened || !user || !loaded || profile.isLoading) return;
    setEditing(true);
    setSetupOpened(true);
  }, [setup, setupOpened, user, loaded, profile.isLoading]);

  if (!ready) return null;
  if (public_id) {
    if (publicProfile.isLoading) {
      return (
        <AppShell className="space-y-4 pb-24 pt-6">
          <PageHeader title={t("profile_public_title")} />
          <div className="h-44 animate-pulse rounded-3xl bg-muted" />
        </AppShell>
      );
    }
    if (publicProfile.isError) {
      return (
        <AppShell className="space-y-4 pb-24 pt-6">
          <PageHeader title={t("profile_public_title")} />
          <ErrorState scope="profile:public" error={publicProfile.error} onRetry={() => publicProfile.refetch()} />
        </AppShell>
      );
    }
    if (!publicProfile.data) {
      return (
        <AppShell className="space-y-4 pb-24 pt-6">
          <PageHeader title={t("profile_public_title")} />
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <User className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-3 font-bold text-foreground">{t("profile_public_unavailable")}</p>
          </div>
        </AppShell>
      );
    }
    const publicName = publicProfile.data.full_name?.trim() || t("profile_public_default_name");
    const publicInitial = publicName.slice(0, 1).toUpperCase();
    const publicWilaya = wilayas.data?.find((w) => w.id === publicProfile.data?.wilaya_id)?.name_ar;
    return (
      <>
        <SeoHead title={publicName} description={t("profile_public_description")} noindex />
        <AppShell className="space-y-5 pb-24 pt-6">
          <PageHeader title={t("profile_public_title")} subtitle={t("profile_public_subtitle")} />
          <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <div className="h-24 bg-gradient-to-br from-primary via-primary/70 to-primary-soft" />
            <div className="px-5 pb-6">
              <div className="-mt-11 flex size-22 items-center justify-center overflow-hidden rounded-full bg-primary-soft ring-4 ring-card">
                {publicProfile.data.avatar_url ? (
                  <img src={publicProfile.data.avatar_url} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-3xl font-extrabold text-accent-ink">{publicInitial}</span>
                )}
              </div>
              <h1 className="mt-4 text-xl font-extrabold text-foreground">{publicName}</h1>
              {(publicProfile.data.commune || publicWilaya) && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  {[publicProfile.data.commune, publicWilaya].filter(Boolean).join(t("profile_location_separator"))}
                </p>
              )}
              <p className="mt-4 text-xs text-muted-foreground">{t("profile_public_privacy_note")}</p>
            </div>
          </section>
        </AppShell>
      </>
    );
  }
  if (!user) {
    return (
      <AppShell className="pb-24 pt-6">
        <PageHeader title={t("profile_hub_title")} subtitle={t("profile_hub_subtitle")} />
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-soft text-accent-ink">
            <User className="size-7" />
          </span>
          <p className="mt-3 text-body font-bold text-foreground">{t("profile_signin_title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("profile_signin_hint")}
          </p>
          <Link to="/auth" className="btn-primary mt-4 w-full">
            {t("profile_login_action")}
          </Link>
        </div>
      </AppShell>
    );
  }

  const name = (user.user_metadata?.["full_name"] as string | undefined) ?? "";
  const displayName = name || t("profile_default_name");
  const initial = displayName.slice(0, 1).toUpperCase();
  const favCount = favorites.products.length + favorites.stores.length;

  const changeVisibility = async () => {
    setVisibilityBusy(true);
    try {
      await setMyProfileVisibility(!(profile.data?.is_public ?? false));
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
      showSuccess(t((profile.data?.is_public ?? false) ? "profile_visibility_private" : "profile_visibility_public"));
    } catch (e) {
      showError(e);
    } finally {
      setVisibilityBusy(false);
    }
  };

  const save = async () => {
    const cleanName = fullName.trim();
    if (!cleanName) {
      toast.error(t("profile_name_required"));
      return;
    }
    const p = normalizePhone(phone.trim());
    if (p && !isValidDzPhone(p)) {
      toast.error(t("profile_phone_invalid"));
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
        toast.warning(t("profile_saved_schema_warning"));
      } else {
        showSuccess(t("profile_saved"));
      }
      setEditing(false);
      if (setup) {
        navigate({ to: "/", replace: true });
      } else {
        navigate({ to: "/settings" });
      }
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SeoHead
        title={t("profile_seo_title")}
        description={t("profile_seo_description")}
        keywords={t("profile_seo_keywords")}
        ogType="website"
      />
      <AppShell className="space-y-5 pb-24 pt-6">
        <PageHeader
          title={t("profile_hub_title")}
          subtitle={t("profile_hub_subtitle")}
          showLanguageToggle
          action={
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link
                  to="/admin"
                  aria-label={t("profile_admin_dashboard")}
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-soft transition hover:bg-amber-600 active:scale-95"
                >
                  <Shield className="size-4.5" />
                </Link>
              )}
            </div>
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
                      alt={t("profile_avatar_alt")}
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
                  aria-label={t("profile_change_avatar")}
                >
                  <Camera className="size-4" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif"
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
                <Pencil className="size-4" /> {t("profile_edit_button")}
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
                    {profile.data.commune && profile.data.wilaya_id != null ? t("profile_location_separator") : ""}
                    {wilayas.data?.find((w) => w.id === profile.data?.wilaya_id)?.name_ar ??
                      (profile.data.wilaya_id != null
                        ? String(profile.data.wilaya_id).padStart(2, "0")
                        : "")}
                  </span>
                </span>
              )}
              {profile.data?.is_phone_verified && (
                <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-bold text-success">
                  <BadgeCheck className="size-3.5" /> {t("profile_phone_verified")}
                </span>
              )}
              {isAdmin && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  <Shield className="size-3.5" /> {t("profile_admin_role")}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-foreground">{t("profile_visibility_title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("profile_visibility_hint")}</p>
              <p className="mt-2 text-xs font-semibold text-muted-foreground">
                {t(profile.data?.is_public ? "profile_visibility_public" : "profile_visibility_private")}
              </p>
            </div>
            <button
              type="button"
              onClick={changeVisibility}
              disabled={visibilityBusy || profile.isLoading || !profile.data}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border px-4 text-sm font-bold text-foreground transition hover:bg-muted disabled:opacity-50"
            >
              {profile.data?.is_public ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {visibilityBusy ? t("profile_saving") : t(profile.data?.is_public ? "profile_make_private" : "profile_make_public")}
            </button>
          </div>
          {profile.data?.is_public && (
            <Link
              to="/profile"
              search={{ public_id: user.id }}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-soft px-4 text-sm font-bold text-accent-ink"
            >
              <Eye className="size-4" />
              {t("profile_preview_public")}
            </Link>
          )}
        </section>

        {/* نشاط الحساب — وصول مباشر إلى أهم الوجهات */}
        <section className="space-y-2" aria-label={t("profile_activity")}>
          <SectionTitle>{t("profile_activity")}</SectionTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { to: "/orders", Icon: Package, label: t("profile_orders"), value: orders.data?.length ?? 0 },
              {
                to: "/reservations",
                Icon: CalendarDays,
                label: t("profile_reservations"),
                value: reservations.data?.length ?? 0,
              },
              { to: "/favorites", Icon: Heart, label: t("profile_favorites"), value: favCount },
              { to: "/wallet", Icon: Wallet, label: t("profile_wallet"), value: null },
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
          <SectionTitle>{t("profile_account_management")}</SectionTitle>
          <MenuCard>
            <MenuRow
              icon={User}
              label={t("profile_personal_data")}
              hint={t("profile_personal_data_hint")}
              onClick={() => setEditing(true)}
            />
            <MenuRow
              icon={Bell}
              label={t("profile_notifications")}
              hint={t("profile_notifications_hint")}
              to="/notifications"
            />
          </MenuCard>
        </section>

        {/* الدعم والمعلومات القانونية */}
        <section className="space-y-2">
          <SectionTitle>{t("profile_support_info")}</SectionTitle>
          <MenuCard>
            <MenuRow icon={HelpCircle} label={t("profile_help_support")} to="/help" />
            <MenuRow icon={FileText} label={t("profile_terms_privacy")} to="/terms" />
          </MenuCard>
        </section>

        <div className="pt-1">
          <p className="pt-3 text-center text-xs text-muted-foreground">
            Arownd · {t("profile_beta_footer")}
          </p>
        </div>

        {/* نموذج تعديل الملف — لوحة جانبية بدل نموذج في أسفل الصفحة */}
        <SideSheet
          open={editing}
          onOpenChange={setEditing}
          title={t("profile_edit_title")}
          description={t("profile_edit_description")}
          footer={
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {busy ? t("profile_saving") : t("profile_save_changes")}
            </button>
          }
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="profile-full-name"
                className="mb-1 block text-xs font-bold text-muted-foreground"
              >
                {t("profile_full_name_label")} *
              </label>
              <input
                id="profile-full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("profile_full_name_placeholder")}
                autoComplete="name"
                className="h-12 w-full rounded-xl border border-input bg-background px-3 outline-none transition focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label
                htmlFor="profile-phone"
                className="mb-1 block text-xs font-bold text-muted-foreground"
              >
                {t("profile_phone_label")}
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
                <span className="mb-1 block text-xs font-bold text-muted-foreground">{t("profile_wilaya_label")}</span>
                <WilayaButton
                  value={wilayaId}
                  onChange={setWilayaId}
                  allLabel={t("profile_select_wilaya")}
                  className="w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-commune"
                  className="mb-1 block text-xs font-bold text-muted-foreground"
                >
                  {t("profile_commune_label")}
                </label>
                <input
                  id="profile-commune"
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  placeholder={t("profile_commune_placeholder")}
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
