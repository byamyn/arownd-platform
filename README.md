# Arownd

### اكتشف ما حولك · Discover What's Around You

منصة تجارة محلية واكتشاف منتجات في الجزائر، تجمع المتسوقين والتجار وشركات التوصيل في تجربة واحدة.

> **Project:** Arownd  
> **Owner:** byamyn  
> **Repository:** [byamyn/arownd-platform](https://github.com/byamyn/arownd-platform)  
> **Status:** MVP قيد التحضير للإطلاق التجريبي

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

إصدارات الأدوات الفعلية تُحسم من package.json وpackage-lock.json. يوجد اختلاف بين إصدار Node المحدد في package.json ومعيار Node 22 المعتمد في خطة المشروع؛ يجب حسم هذا التعارض قبل توحيد بيئات التطوير والنشر.

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

راجع package.json أولًا لتحديد إصدار Node الفعلي. لا تغيّر إصدار Node أو lockfile بشكل منفصل.

~~~bash
git clone https://github.com/byamyn/arownd-platform.git
cd arownd-platform
npm ci
cp .env.example .env
npm run dev
~~~

أضف إعدادات Supabase المطلوبة إلى ملف البيئة المحلي. لا ترفع .env إلى Git.

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
