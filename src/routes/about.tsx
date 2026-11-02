import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Compass, MapPin, Store, Truck, ShoppingBag, Eye, Users, Heart } from "lucide-react";
import { PageHeader } from "@/components/sooqy/page-header";
import { SeoHead } from "@/components/seo/SeoHead";
import { translate } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-extrabold">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Item({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-3 rounded-[var(--radius-card)] border border-border/60 bg-card p-4 ">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-primary-soft text-accent-ink">
        {icon}
      </div>
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-4 pb-24">
      <SeoHead
        title={translate("about_title")}
        description={translate("about_description")}
        alternates={{ ar: "/about", en: "/about" }}
      />
      <PageHeader title="حول Arownd" back="/" />

      <div className="mb-8 rounded-[var(--radius-card)] bg-primary p-6 text-center text-primary-foreground ">
        <Store className="mx-auto mb-3 size-12" />
        <h1 className="text-2xl font-extrabold">Arownd — اكتشف ما حولك</h1>
        <p className="mt-2 text-sm opacity-85">
          منصة جزائرية قيد التطوير والتوسع التدريجي
        </p>
      </div>

      <Section title="من نحن؟">
        <p>
          Arownd هي منصة رقمية جزائرية تهدف إلى تسهيل اكتشاف المتاجر والمحلات والمشاريع التجارية،
          وجمعها في تجربة تسوق واحدة تجمع بين الاستكشاف والشراء والوصول إلى المنتجات والخدمات
          بسهولة.
        </p>
        <p>
          نسعى إلى مساعدة أصحاب المتاجر والمشاريع الإلكترونية على تعزيز حضورهم الرقمي، والوصول إلى
          عملاء جدد، وعرض منتجاتهم ومعلومات متاجرهم بطريقة واضحة ومنظمة.
        </p>
      </Section>

      <Section title="ماذا تقدم Arownd؟">
        <Item
          icon={<Compass className="size-5" />}
          title="اكتشف المتاجر والمنتجات"
          desc="تتيح المنصة للمستخدمين استكشاف المتاجر والمحلات والمشاريع التجارية والتعرف على المنتجات التي تعرضها، مع العمل على تسهيل الوصول إلى الخيارات المناسبة لاحتياجاتهم."
        />
        <Item
          icon={<MapPin className="size-5" />}
          title="الوصول إلى المتاجر عبر الخريطة"
          desc="نطمح إلى جعل اكتشاف التجارة المحلية أكثر سهولة من خلال عرض مواقع المتاجر على الخريطة، بما يساعد المستخدمين على معرفة أماكنها والوصول إليها."
        />
        <Item
          icon={<Store className="size-5" />}
          title="أدوات لأصحاب المتاجر"
          desc="تهدف Arownd إلى توفير مساحة رقمية لأصحاب المتاجر لعرض منتجاتهم ومعلوماتهم، واستقبال الطلبات وإدارتها وفق الإمكانات المتاحة داخل المنصة."
        />
        <Item
          icon={<ShoppingBag className="size-5" />}
          title="تجربة طلب أكثر تنظيمًا"
          desc="نسعى إلى تسهيل التواصل بين المشتري والمتجر خلال مراحل الطلب، مع تطوير إمكانات متابعة الطلبات وحالاتها تدريجيًا."
        />
        <Item
          icon={<Truck className="size-5" />}
          title="التوصيل والخدمات المستقبلية"
          desc="نعمل على تطوير تصور يتيح للمتاجر التعامل مع شركات التوصيل المعتمدة من خلال المنصة، وإرسال طلبات الشحن ومتابعة حالاتها عند توفر هذه الإمكانات. كما ندرس إضافة خيارات دفع إلكترونية مستقبلًا وفق المتطلبات القانونية والتقنية والتعاقدية اللازمة."
        />
      </Section>

      <Section title="رؤيتنا">
        <p>
          أن تصبح Arownd منصة تساعد على ربط التجارة المحلية بالتسوق الرقمي، وتمنح المتاجر والمشاريع
          فرصة أفضل للظهور، وتوفر للمستخدمين تجربة أكثر سهولة في اكتشاف المنتجات والوصول إلى
          البائعين.
        </p>
      </Section>

      <Section title="من نخدم؟">
        <Item
          icon={<Eye className="size-5" />}
          title="المشترون"
          desc="لاكتشاف المتاجر والمنتجات والتسوق بسهولة."
        />
        <Item
          icon={<Store className="size-5" />}
          title="أصحاب المتاجر والمحلات"
          desc="لتعزيز حضورهم الرقمي والوصول إلى عملاء جدد."
        />
        <Item
          icon={<ShoppingBag className="size-5" />}
          title="أصحاب المشاريع الإلكترونية"
          desc="لعرض مشاريعهم ومنتجاتهم ضمن بيئة تجارية واحدة."
        />
        <Item
          icon={<Truck className="size-5" />}
          title="شركات التوصيل"
          desc="شركاء محتملون ضمن منظومة الشحن التي نطمح إلى تطويرها."
        />
      </Section>

      <Section title="التزامنا">
        <p>
          نؤمن بأن بناء منصة موثوقة يبدأ بالوضوح واحترام المستخدمين والعمل على تحسين التجربة
          باستمرار. لذلك نسعى إلى تطوير Arownd تدريجيًا، وتوضيح الخدمات المتاحة فعليًا، والإعلان عن
          الميزات الجديدة عندما تصبح جاهزة للاستخدام.
        </p>
      </Section>

      <div className="mt-10 rounded-[var(--radius-card)] border border-border/60 bg-card p-6 text-center ">
        <Heart className="mx-auto mb-3 size-8 text-accent-ink" />
        <p className="text-lg font-extrabold">Arownd — اكتشف ما حولك</p>
        <p className="mt-1 text-xs text-muted-foreground">منصة جزائرية قيد التطوير والتوسع التدريجي</p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link to="/terms" className="btn-secondary w-full">
          شروط الاستخدام
        </Link>
        <Link to="/privacy" className="btn-secondary w-full">
          سياسة الخصوصية
        </Link>
      </div>
    </div>
  );
}
