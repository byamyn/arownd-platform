# Arownd

### اكتشف ما حولك · Discover What's Around You

منصة تجارة محلية واكتشاف منتجات في الجزائر، تجمع المتسوقين والتجار وشركات التوصيل في تجربة واحدة.

> **Project:** Arownd  
> **Owner:** byamyn  
> **Repository:** [byamyn/arownd-platform](https://github.com/byamyn/arownd-platform)  
> **Status:** MVP قيد التحضير للإطلاق التجريبي

## المالك وإدارة المشروع | Project Owner

راجع [OWNER.md](./OWNER.md) للتعرّف على مالك المشروع، والرؤية، وحوكمة المستودع، وسياسة المساهمات والملكية الفكرية.

## نظرة عامة

تساعد Arownd المتسوقين على اكتشاف المتاجر والمنتجات والعروض المحلية، وتمنح التجار أدوات لإدارة المتجر والمنتجات والمخزون والطلبات، وتوفر لشركات التوصيل مساحة لإدارة بياناتها وشحناتها وتتبعها.

الأدوار الأساسية:
- **المتسوق:** التصفح والبحث والمقارنة والسلة والطلبات والحجوزات.
- **التاجر:** إدارة المتجر والمنتجات والعروض والمخزون والطلبات.
- **شركة التوصيل:** إدارة ملف الشركة والتغطية والشحنات والتتبع.
- **إدارة المنصة:** وظائف تشغيلية وإشرافية وفق صلاحيات الخادم.

وجود وظيفة في المستودع لا يعني أنها اجتازت اختبارًا تشغيليًا أو أنها جاهزة للإنتاج. راجع وثائق التشغيل والقيود قبل الإطلاق.

## التقنيات

| المجال | التقنية |
|---|---|
| اللغة | TypeScript |
| الواجهة | React 19 |
| البناء | Vite 8 |
| إطار التطبيق والتنقل | TanStack Start وTanStack Router |
| جلب البيانات | TanStack Query |
| التصميم | Tailwind CSS 4، Radix UI، Lucide |
| النماذج والتحقق | React Hook Form وZod |
| الخلفية وقاعدة البيانات | Supabase وPostgreSQL |
| المصادقة والصلاحيات | Supabase Auth وRLS |
| الملفات | Supabase Storage |
| الخرائط | MapLibre وLeaflet |
| الرسوم البيانية | Recharts |
| مراقبة الأخطاء | Sentry |
| الاختبارات | Vitest وTesting Library |
| الاستضافة | Vercel |
| تطبيقات الهاتف | Capacitor |

**إصدار Node.js المعتمد للمشروع هو 26.x.** يجب استخدامه محليًا وفي CI وبيئة بناء Vercel. المصدر المرجعي هو `package.json`، مع مطابقة إعدادات GitHub Actions وVercel له. لا تغيّر الإصدار أو lockfile بشكل منفصل.

## بنية المستودع

~~~text
arownd-platform/
├── .github/workflows/       # CI وعمليات Android
├── android/                 # مشروع Android الأصلي
├── api/                     # نقطة تشغيل Vercel
├── docs/                    # وثائق المشروع
├── ios/                     # مشروع iOS الأصلي
├── public/                  # الأصول العامة وPWA
├── scripts/                 # أدوات الفحص والصيانة
├── src/                     # تطبيق الويب
├── supabase/migrations/     # هجرات قاعدة البيانات
├── package.json
├── capacitor.config.json
├── vercel.json
└── README.md
~~~

### وحدات أساسية

- src/lib/sooqy.ts: خدمات بيانات أساسية؛ الاسم القديم محفوظ للتوافق.
- src/lib/delivery.ts: منطق شركات التوصيل والشحنات.
- src/lib/auth.tsx: سياق المصادقة والجلسة.
- src/lib/bag.tsx وsrc/lib/bag-check.ts: السلة والتحقق من عناصرها.
- src/lib/i18n.ts وsrc/lib/dictionaries/: الترجمة والقواميس.
- src/styles.css: رموز التصميم والأنماط الأساسية.

لا تغيّر أسماء ملفات أو معرفات SooQy القديمة دون تتبع الاستيرادات والتخزين والتوافق.

## البدء محليًا

ثبّت Node.js 26.x قبل تثبيت الاعتماديات:

~~~bash
node --version
git clone https://github.com/byamyn/arownd-platform.git
cd arownd-platform
npm ci
cp .env.example .env
npm run dev
~~~

يجب أن يعرض `node --version` إصدارًا رئيسيًا 26. أضف إعدادات Supabase المطلوبة إلى ملف البيئة المحلي. لا ترفع .env إلى Git.

## الأمان والبيانات

- لا تضع SUPABASE_SERVICE_ROLE_KEY أو DATABASE_URL في كود المتصفح أو أي ملف عام.
- المفتاح العام لا يغني عن سياسات RLS.
- لا تعتمد على الواجهة لفرض الصلاحيات؛ تحقق منها في الخادم وقاعدة البيانات.
- العمليات الحساسة مثل الطلب والحجز والمحفظة يجب أن تستخدم RPC أو معاملات ذرّية مع idempotency خادمي.
- لا تعدّل الهجرات المطبقة سابقًا؛ أنشئ migration جديدة لكل تغيير.
- خذ نسخة احتياطية قابلة للاستعادة قبل تغييرات الإنتاج.
- اختبر RLS لكل دور: متسوق، تاجر، إدارة، وشركة توصيل.

## أوامر الفحص

~~~bash
npx tsc --noEmit
npm run lint
npm run ui:check
npm test
npm run build
~~~

نجاح الأوامر لا يغني عن اختبار تدفقات الاستخدام الفعلية أو صلاحيات قاعدة البيانات. وثّق دائمًا ما تم اختباره وما لم يتم اختباره.

## الهوية ونظام التصميم

- Lime Signal: #C6F135
- Dark: #0A0A0A
- Light: #F5F5F5
- البطاقات الفاتحة: أبيض
- الخطوط: Inter وIBM Plex Sans Arabic
- العربية وRTL أولًا، مع دعم LTR والوضعين الفاتح والداكن.

راجع [دليل نظام الواجهة](./docs/UI_SYSTEM.md).

## قواعد التطوير

- استخدم مفاتيح الترجمة بدل النصوص الثابتة الجديدة في JSX.
- استخدم CSS logical properties مثل ms-, me-, ps-, pe-.
- صمّم حالات التحميل والفراغ والخطأ والنجاح.
- لا تعرض نجاحًا قبل تأكيد الخادم.
- لا تستخدم alert أو confirm الأصليتين؛ استخدم مكونات التطبيق المعتمدة.
- لا تكرر منطق الأسعار والسلة؛ استخدم pickBestOffer() وevaluateBag().
- أضف Vitest tests للتغييرات المنطقية.
- حافظ على ملفات التوافق القديمة.
- لا تغيّر الوثائق القانونية أو بيانات حقوق الغير دون مراجعة موثقة.

## مركز الوثائق | Documentation Hub

ابدأ من [مركز الوثائق الثنائي اللغة](./docs/README.md) للوصول إلى الأدلة الهندسية والتشغيلية.

Start with the [bilingual documentation hub](./docs/README.md) for engineering and operational guides.

## خريطة الوثائق

| الوثيقة | الغرض |
|---|---|
| [Architecture](./docs/ARCHITECTURE.md) | خريطة معمارية التطبيق وحدود التشغيل |
| [Database](./docs/DATABASE.md) | إجراءات Supabase وRLS وRPC والهجرات |
| [Security](./docs/SECURITY.md) | ضوابط الأمان ومراجعة الإطلاق |
| [Development](./docs/DEVELOPMENT.md) | إعداد بيئة التطوير والفحوصات |
| [Release](./docs/RELEASE.md) | قائمة جاهزية الإطلاق التجريبي |
| [UI System](./docs/UI_SYSTEM.md) | الهوية البصرية وقواعد الواجهة |
| [Account deletion policy](./docs/account-deletion-and-retention-policy.md) | خط أساس لسياسة الحذف والاحتفاظ؛ يتطلب مراجعة قانونية |
| [Account deletion audit](./docs/account-deletion-audit.md) | ملاحظات فنية تاريخية يجب إعادة التحقق منها |
| [Android signing](./docs/android-release-signing.md) | إرشادات توقيع Android |
| [Native runtime assessment](./docs/mobile/CAPACITOR_NATIVE_RUNTIME_ASSESSMENT.md) | مخاطر تكامل Capacitor |
| [Native app identity](./docs/mobile/NATIVE_APP_IDENTITY.md) | معرف التطبيق وcallback |
| [Moderation operations](./docs/moderation-operations.md) | تشغيل بلاغات المحتوى |
| [VersaTiles prototype](./docs/maps/versatiles-prototype.md) | سجل نموذج خرائط تجريبي |
| [Brand assets](./public/brand/README.md) | الأصول البصرية العامة |

## الترخيص وحقوق الملكية

يتضمن المستودع LICENSE وملفًا باسم PROPRIETARY_LICENSE.md. (مع نقطة نهائية في اسم الملف). لا تُحذف هذه الملفات أو يعاد تحرير شروطها دون مراجعة قانونية. ملف الترخيص التفصيلي يذكر صاحب حقوق باسم قانوني؛ يجب التحقق من تطابق بيانات صاحب الحقوق مع مستندات الملكية قبل أي تعديل قانوني أو نشر.

ملكية حساب/مستودع GitHub موثقة هنا باسم byamyn. هذا المعرّف وحده لا يثبت قانونيًا ملكية كل مساهمة أو مكوّن تابع لطرف ثالث. تظل تراخيص الأطراف الخارجية وحقوق المساهمين محفوظة.

---

**Arownd — Built with purpose.**

---

## English — Project overview

### Discover What's Around You

**Arownd** is an Algeria-focused local commerce and discovery platform connecting shoppers, merchants, and delivery companies through one experience.

**Platform roles**
- **Shoppers** discover nearby stores, compare products and offers, manage their bag, and follow orders.
- **Merchants** manage stores, products, offers, inventory, and incoming orders.
- **Delivery partners** manage company profiles, service coverage, assigned shipments, and delivery progress.
- **Platform administrators** oversee trusted operational and moderation workflows.

### Technology baseline

| Layer | Standard |
|---|---|
| Application | React 19, TypeScript 5.8, TanStack Start and Router |
| Build and styling | Vite 8, Tailwind CSS 4, Radix UI, Lucide |
| Data and validation | TanStack Query, React Hook Form, Zod |
| Backend | Supabase Auth, PostgreSQL, RLS, Storage, Realtime |
| Maps and charts | MapLibre, Leaflet, Recharts |
| Quality and hosting | Vitest, Sentry, Vercel |
| Runtime | Node.js 26.x |

### Engineering principles

- Arabic-first, RTL-first product experience with translation-key parity.
- Enforce authorization in trusted server code and PostgreSQL RLS; never rely on UI visibility.
- Keep privileged credentials server-side.
- Use atomic, idempotent server operations for orders, reservations, and wallet movements.
- Treat database migrations as append-only.
- Preserve compatibility identifiers and existing domain services.
- Document verified facts separately from assumptions and pending checks.

### Documentation map

Start with [Architecture](./docs/ARCHITECTURE.md), then review [Development](./docs/DEVELOPMENT.md), [Database](./docs/DATABASE.md), [Security](./docs/SECURITY.md), and [Release](./docs/RELEASE.md). Product UI standards live in [UI System](./docs/UI_SYSTEM.md).

### Quality gates

```bash
npx tsc --noEmit
npm run lint
npm run ui:check
npm test
npm run build
```

A passing local check is not a substitute for production-like workflow, authorization, native-device, and recovery testing.

**Arownd — Built with purpose.**

