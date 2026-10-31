import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  BarChart3,
  Building2,
  Mail,
  ChevronDown,
  ClipboardCheck,
  LogIn,
  PackageCheck,
  PlusCircle,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Timer,
  Truck,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/sooqy/page-header";
import { SeoHead } from "@/components/seo/SeoHead";
import { translate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "مساعدة والأسئلة الشائعة — Arownd" },
      {
        name: "description",
        content: "كل ما تحتاج معرفته عن Arownd: الحساب، المتاجر، الحجوزات، الطلبات والدفع.",
      },
      { property: "og:title", content: "مساعدة والأسئلة الشائعة — Arownd" },
      { property: "og:description", content: "كل ما تحتاج معرفته عن Arownd." },
    ],
  }),
  component: HelpPage,
});

type Tab = "user" | "merchant" | "delivery" | "faq";

const TABS: { id: Tab; label: string }[] = [
  { id: "user", label: "المستخدم" },
  { id: "merchant", label: "التاجر" },
  { id: "delivery", label: "شركات التوصيل" },
  { id: "faq", label: "أسئلة شائعة" },
];

function HelpPage() {
  const [tab, setTab] = useState<Tab>("user");
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-4 px-4 pt-5">
      <SeoHead
        title={translate("help_title")}
        description={translate("help_description")}
        alternates={{ ar: "/help", en: "/help" }}
      />
      <PageHeader title="مساعدة والأسئلة الشائعة" subtitle="كل ما يمكنك فعله في Arownd" />

      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="tablist"
        aria-label="أقسام المساعدة"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-2xl py-2.5 text-sm font-bold transition",
              tab === t.id
                ? "bg-primary text-accent-ink-foreground shadow-soft"
                : "bg-card text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "user" && <UserSection />}
      {tab === "merchant" && <MerchantSection />}
      {tab === "delivery" && <DeliveryPartnerSection />}
      {tab === "faq" && <FaqSection open={open} onToggle={setOpen} />}

      <QuickLinks />
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-accent-ink">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function UserSection() {
  return (
    <div className="space-y-3">
      <FeatureCard
        icon={<LogIn className="size-5" />}
        title="الدخول إلى حسابك"
        desc="سجّل الدخول ببريدك الإلكتروني لعرض حجوزاتك وطلباتك في أي وقت، والخروج متاح بنقرة."
      />
      <FeatureCard
        icon={<Timer className="size-5" />}
        title="الحجز من المحل"
        desc="احجز المنتج من أقرب محل واستلمه خلال المهلة المحددة — احجز واستلم بدون دفع مسبق."
      />
      <FeatureCard
        icon={<PackageCheck className="size-5" />}
        title="تتبع طلباتك مباشرة"
        desc="شريط التنبيهات أعلى الشاشة يعرض طلبك النشط مع عدّاد تنازلي لحين الاستلام."
      />
      <FeatureCard
        icon={<Sparkles className="size-5" />}
        title="الترقية إلى تاجر"
        desc="من صفحة حسابك يمكنك التحول إلى تاجر وفتح متجرك الخاص بنقرة واحدة."
      />
      <Link
        to="/profile"
        className="block rounded-2xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground shadow-soft"
      >
        اذهب إلى حسابي
      </Link>
    </div>
  );
}

function MerchantSection() {
  return (
    <div className="space-y-3">
      <FeatureCard
        icon={<Store className="size-5" />}
        title="فتح متجرك"
        desc="أنشئ متجرك بالاسم والهاتف والولاية والعنوان وساعات العمل — جاهز في دقائق."
      />
      <FeatureCard
        icon={<PlusCircle className="size-5" />}
        title="إضافة منتج بسرعة"
        desc="أضف منتجًا بالاسم والسعر والكمية والفئة والمقاسات والألوان وصورة واحدة."
      />
      <FeatureCard
        icon={<RefreshCw className="size-5" />}
        title="إدارة المخزون"
        desc="بدّل توفر أي منتج بنقرة، أو حدّث مخزونك كاملًا في نبضة الصباح."
      />
      <FeatureCard
        icon={<ClipboardCheck className="size-5" />}
        title="تأكيد الحجوزات"
        desc="أدخل رمز الحجز (SQ-XXXX) لتأكيد استلام العميل، أو أكّد مباشرة من قائمة الحجوزات."
      />
      <FeatureCard
        icon={<Truck className="size-5" />}
        title="متابعة الطلبات"
        desc="حدّث حالة طلبات التوصيل: تأكيد، شحن، تسليم أو إلغاء."
      />
      <FeatureCard
        icon={<BarChart3 className="size-5" />}
        title="لوحة الإحصائيات"
        desc="اعرف عدد منتجاتك وحجوزاتك المعلقة وطلباتك في نظرة واحدة."
      />
      <Link
        to="/studio"
        className="block rounded-2xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground shadow-soft"
      >
        افتح استوديو التاجر
      </Link>
    </div>
  );
}

function DeliveryPartnerSection() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fields = [
      ["اسم الشركة", "company"],
      ["اسم الشخص المسؤول", "contact"],
      ["رقم الهاتف", "phone"],
      ["البريد الإلكتروني", "email"],
      ["ولايات ومناطق التغطية", "coverage"],
      ["تفاصيل الخدمات والإمكانات", "details"],
    ] as const;
    const body = fields
      .map(([label, name]) => `${label}: ${String(formData.get(name) ?? "").trim()}`)
      .join("\\n");
    const subject = encodeURIComponent("طلب شراكة توصيل مع Arownd");
    window.location.href = `mailto:arounddz@gmail.com?subject=${subject}&body=${encodeURIComponent(body)}`;
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary";

  return (
    <section className="space-y-4 rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-accent-ink">
          <Building2 className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold">انضم كشريك توصيل إلى Arownd</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            هذا القسم مخصص لشركات ومؤسسات التوصيل الراغبة في التقدم لإبرام عقد شراكة مع Arownd
            لتقديم خدمات التوصيل لعملائنا.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/70 p-3">
        <p className="text-sm font-semibold">كيف تبدأ الشراكة؟</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          أرسل بيانات شركتك ومناطق التغطية والخدمات التي تقدمها. سيصل طلبك إلى فريق Arownd لمراجعته
          والتواصل معك لمناقشة تفاصيل التعاون والعقد.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold">اسم شركة التوصيل *</span>
          <input
            name="company"
            required
            maxLength={120}
            className={inputClass}
            placeholder="الاسم التجاري للشركة"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold">اسم الشخص المسؤول *</span>
          <input
            name="contact"
            required
            maxLength={100}
            className={inputClass}
            placeholder="الاسم واللقب"
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold">رقم الهاتف *</span>
            <input
              name="phone"
              type="tel"
              required
              maxLength={30}
              className={inputClass}
              placeholder="05 / 06 / 07 ..."
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold">البريد الإلكتروني *</span>
            <input
              name="email"
              type="email"
              required
              maxLength={160}
              className={inputClass}
              placeholder="company@example.com"
            />
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold">ولايات ومناطق التغطية *</span>
          <input
            name="coverage"
            required
            maxLength={300}
            className={inputClass}
            placeholder="مثال: الجزائر، البليدة، بومرداس..."
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold">نبذة عن الخدمات وإمكانات التوصيل</span>
          <textarea
            name="details"
            rows={4}
            maxLength={1500}
            className={inputClass}
            placeholder="نوع خدمات التوصيل، حجم العمليات، وأي معلومات تساعدنا على تقييم طلبكم..."
          />
        </label>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-soft"
        >
          <Mail className="size-4" />
          إرسال طلب الشراكة عبر البريد
        </button>
      </form>
      <p className="text-center text-xs text-muted-foreground">
        أو راسلنا مباشرة على{" "}
        <a href="mailto:arounddz@gmail.com" className="font-semibold text-accent-ink underline">
          arounddz@gmail.com
        </a>
      </p>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        عند الضغط على الإرسال، سيفتح تطبيق البريد في جهازك برسالة مجهزة بالبيانات المدخلة. لن يُرسل
        الطلب تلقائيًا؛ يجب مراجعة الرسالة ثم الضغط على إرسال من تطبيق البريد.
      </p>
    </section>
  );
}

const FAQS = [
  {
    q: "كيف أطلب منتجًا؟",
    a: "ابحث عن المنتج، اختر المحل الأنسب، ثم أضفه إلى السلة. من السلة انتقل إلى الدفع، أدخل عنوانك وولايتك، اختر طريقة الدفع وأكّد الطلب.",
  },
  {
    q: "ما طرق الدفع المتاحة؟",
    a: "حاليًا الدفع عند الاستلام فقط (نقدًا عند وصول الطلب أو استلامه). الدفع عبر BaridiMob (بريدي موب) والدفع الإلكتروني بالبطاقة قادمان قريبًا.",
  },
  {
    q: "كم تبلغ رسوم التوصيل؟",
    a: "تختلف حسب الولاية وطريقة التوصيل، وتظهر بوضوح في صفحة الدفع قبل تأكيد الطلب.",
  },
  {
    q: "كيف أحجز منتجًا من المحل؟",
    a: "في صفحة المنتج اختر المحل القريب واضغط زر الحجز. ستحصل على رمز حجز، وتستلم المنتج من المحل خلال المهلة المحددة.",
  },
  {
    q: "كيف ألغي حجزًا؟",
    a: "من صفحة حسابي، قسم الحجوزات، اضغط زر إلغاء بجانب الحجز المعلق.",
  },
  {
    q: "كيف أصبح تاجرًا على Arownd؟",
    a: "من حسابك اضغط بطاقة الترقية، ثم افتح متجرك من استوديو التاجر وأضف منتجاتك.",
  },
  {
    q: "كيف أدير متجري؟",
    a: "من استوديو التاجر يمكنك إضافة المنتجات، تحديث المخزون، تأكيد الحجوزات برمز، ومتابعة الطلبات.",
  },
];

function FaqSection({ open, onToggle }: { open: number | null; onToggle: (i: number) => void }) {
  return (
    <div className="space-y-2">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="overflow-hidden rounded-2xl bg-card shadow-soft">
            <button
              onClick={() => onToggle(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 p-4 text-start"
            >
              <span className="text-sm font-bold">{f.q}</span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            {isOpen && (
              <div className="animate-fade-up px-4 pb-4">
                <p className="text-xs leading-relaxed text-muted-foreground">{f.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function QuickLinks() {
  const links = [
    { to: "/profile", label: "حسابي", icon: <User className="size-5" /> },
    { to: "/studio", label: "استوديو التاجر", icon: <Store className="size-5" /> },
    { to: "/bag", label: "سلتي", icon: <ShoppingBag className="size-5" /> },
    { to: "/explore", label: "البحث", icon: <Search className="size-5" /> },
  ] as const;
  return (
    <div className="space-y-2">
      <h2 className="font-bold">روابط سريعة</h2>
      <div className="grid grid-cols-2 gap-2">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="flex items-center gap-2 rounded-2xl bg-card p-3 text-sm font-bold shadow-soft"
          >
            <span className="text-accent-ink">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
