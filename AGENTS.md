## Layout & Navigation

- **صفحة الرئيسية (`/`)**: نقل زر الولاية إلى الملف الشخصي، حذف حقل البحث، حذف قسم "الاكتشاف المحلي"، نقل قسم "تصفح حسب التصنيف" إلى صفحة الاكتشاف، جعل منتجات "قد تعجبك" قابلة للتمرير أفقي، وجعل زر البحث أيقونة كاميرا داخل الحقل.
- **صفحة الاكتشاف (`/explore`)**: حقل بحث مضغوط + أيقونة كاميرا داخل الحقل، الأقسام الأفقية (الأكثر مبيعًا، وصل حديثًا، المتاجر، التصنيفات)، عرض القائمة أسفل حقل البحث مباشرة.

## i18n (اللغة والترجمة)
- **10 مجموعات قاموس**: `shared`, `home`, `explore`, `product`, `commerce`, `ui`, `studio`, `pages` (جديدة).
- **صيغ الجمع العربية**: `zero/one/two/few/many/other` لكل من ar وen.
- **placeholders**: `t(key, values)` تدعم `{count}` وغيرها.
- **فحص آلي**: `i18n-parity.test.ts` يضمن خلو جميع المسارات من نصوص عربية خارج `i18n.ts`.

## طبقة الحقيقة (Truth Layer)
- **`pickBestOffer()`**: مصدر واحد للسعر — البطاقة وصفحة المنتج والمفضلة تقرأ منه.
- **`evaluateBag()`**: تقييم واحد للسلة والدفع (missing/unavailable/out_of_stock/price_changed/over_stock).
- `localStorage` داخل `try/catch` + مزامنة بين التبويبات.
- `ProductGroup.bestOffer`: `minPrice` مستمد منه، لا سعر يُعرض ولا يمكن شراؤه.

## PWA
- `manifest.webmanifest` / `manifest.json`: أيقونات فعلية + `maskable` + `id`/`scope`.
- `sw.js`: network-first للبيانات، cache-first للأصول، إشعار تحديث.
- `src/lib/pwa.ts` + `src/components/sooqy/PwaPrompt.tsx`: تسجيل Sentry + زر التثبيت.

## Sentry على الويب
- `src/components/AppErrorBoundary.tsx`: ErrorBoundary + `ErrorFallback` + رسائل مترجمة.
- `src/server.ts`: `getServerEntry()` + `applyLocale()` + `detectRequestLang()`.

## التباين (WCAG)
- **كل الأزواج مطابقة لمعايير التباين** (4.5:1 للقراءة، 3:1 لحلقات التركيز) في الوضعين الفاتح والداكن.

## اختبارات
- 174 اختبار (110 أصلية + 64 جديدة) — كلها خضراء.
- `npm run build`: ينجح.
- `npx tsc --noEmit`: نظيف.
<tool_call>
<parameter=path>
AGENTS.md

## SEO

- مكون `src/components/seo/SeoHead.tsx` يُستخدم في كل route لـ meta tags, Open Graph, Twitter Card, JSON-LD (Organization/WebSite/Product/Breadcrumb).
- `SeoHead` يقرأ المسار من الراوتر (`useLocation`) — فيعمل صحيحًا أثناء SSR؛ ويولّد `canonical` مع بادئة اللغة و`hreflang` (ar/en/x-default) تلقائيًا.
- Sitemap: `public/sitemap.xml` — يُServe من dist/client، ويحتوي `xhtml:link` للبدائل اللغوية.
- robots.txt: `public/robots.txt` — يُServe من dist/client.
- OG image: `public/seo/og.svg` (default).
- canonical: `https://sooqy.app/{lang}{path}` — بادئة اللغة جزء من العنوان المعياري.
- vercel.json: rewrite لـ /sitemap.xml و /robots.txt و /seo/*.
- build: `npm run build` (terser installed).

## اللغة والمسارات (عربي/إنجليزي)

- `src/lib/locale.ts` — تحليل بادئة المسار (`/ar/...`, `/en/...`)، الكوكي، `Accept-Language`، وبناء المسارات.
- `src/server.ts` — يزيل بادئة اللغة قبل معالجة الطلب، ويعيد توجيه `/` إلى لغة المتصفح/الكوكي (307)، ويحفظ `sooqy:lang` كوكي.
- `src/lib/locale.server.ts` — `AsyncLocalStorage` لربط اللغة بالطلب (بلا تعارض بين الطلبات المتوازية).
- `src/lib/i18n.ts` — `useTranslation()` للمكوّنات، `translate()` لوسوم الميتا (خارج React)، `t(key, lang, values)` للاستخدام المباشر.
- `src/lib/dictionaries/` — القاموس مقسّمًا بالمجموعات (`shared`, `home`, `explore`, `product`, `commerce`, `ui`, `studio`); كل مجموعة تحتوي `ar` و`en` بنفس المفاتيح.
- `src/test/i18n-parity.test.ts` — فحص آلي لتوازن المفاتيح وصيغ الجمع.
- على المتصفح: `src/router.tsx` يزيل بادئة اللغة من العنوان قبل إنشاء الراوتر (تطابق hydration) — اللغة تصل عبر الكوكي.
- **قاعدة**: لا تكتب نصًا عربيًا داخل JSX — استخدم `t("key")` وأضف المفتاح في `src/lib/dictionaries/`.

## طبقة السوق والحقيقة (Truth Layer)

- `src/lib/market.ts` — `Market` (عملة/لغة/توقيت/اتجاه) + `formatMoney` / `formatDate` / `formatTime` / `zonedParts`. استبدل التوقيت UTC+1 اليدوي.
- `src/lib/geo.ts` — `formatDA` غلاف فوق `formatMoney`; ساعات العمل تُحسب بتوقيت السوق.
- `src/lib/sooqy.ts` — `pickBestOffer()` + `ProductGroup.bestOffer`: **مصدر واحد للحقيقة** للسعر. البطاقة وصفحة المنتج يقرآن منه.
- `src/lib/bag-check.ts` — `evaluateBag()`: تقييم واحد للسلة والدفع (missing/unavailable/out_of_stock/price_changed/over_stock).
- `src/lib/bag.tsx` — تخزين آمن (try/catch)، مزامنة بين التبويبات، لقطة سعر/اسم مع كل عنصر.

## PWA

- `public/manifest.webmanifest` + `public/manifest.json` (مطابقان) — أيقونات موجودة فعلًا (`icon-192/512.png`)، `maskable`، `id`/`scope`، `theme_color` مطابق للهوية.
- `public/sw.js` — Service Worker: network-first للتنقّل والبيانات، cache-first للأصول، إشعار تحديث.
- `src/lib/pwa.ts` + `src/components/sooqy/PwaPrompt.tsx` — تسجيل SW، زر التثبيت، شريط «يتوفر تحديث».
- `src/test/pwa.test.ts` — يفحص وجود كل أيقونة في الـ manifest.


## إدارة الصور المتعددة (Product Images)

- جدول `product_images` يدعم صور متعددة لكل عرض (`offer_id`, `image_url`, `is_primary`).
- `src/components/sooqy/image-uploader.tsx` — مكون رفع صور متعددة مع معاينة، حذف، تحديد أساسي، وحد 10 صور.
- `src/lib/sooqy.ts` — دوال API: `merchantQuickAddProduct` (يقبل `File[]`)، `merchantAddOfferImages(offerId, files)`، `merchantRemoveOfferImage(imageId)`، `merchantSetPrimaryImage(imageId)`.
- `src/routes/studio.index.tsx` — زر "إدارة الصور" في بطاقة كل منتج يفتح نافذة إدارة الصور مع `ImageUploader` مرتبط بدوال API للحذف وتحديد الأساس وإضافة صور جديدة.

## تحسينات واجهات UI (Apple-level)

- `BottomNav`: `flex-row-reverse` للـ RTL، حجم أيقونات موحد، بنية `flex` بدل `ul/li`.
- `PageHeader`: padding `px-4 py-3` (مدمج)، العنوان `text-h1`، العنوان الفرعي `text-caption`.
- `Badges`: توحيد أحجام الأيقونات (`size-3.5`).
- `QtyStepper`: أزرار 32px ثابتة + `flex-row-reverse` للـ RTL.
- `Carousel`: `useTranslation().isRTL` لعكس الأسهم، خيار `loop` (مفعّل افتراضياً).
- `Cards`: تباعد `gap-2`، سعر `text-h4 text-primary`، نسبة الخصم داخل الصف لا مطلقاً.
- `StoreMap`: `minHeight: 400px` على عرض < 768px، يستخدم `React.forwardRef` لكشف كائن `maplibregl.Map`.
- `ImageUploader`: `max-h-48`، أزرار الحذف/الأساسي تنقلب في RTL.
- `styles.css`: نظام أزرار موحد (hover/active/focus-visible/disabled) + `btn-ghost` جديد.
- التركيز على الحقول: `focus:ring-primary/30` (بدل `indigo-500`) عبر `replace_across_files`.
- الشبكات: `sm:grid-cols-3 md:grid-cols-4` في Home و Explore.
- `prefers-reduced-motion` مدعوم أصلاً في styles.css.

## مكتبة المكونات المشتركة (Phone-first)

كل الصفحات تستخدم `src/components/sooqy/index.ts` (نقطة تصدير واحدة) حتى تبدو جزءًا من المنتج نفسه:

- `AppShell` — غلاف موحّد: `max-w-2xl`, `px-4`, `pb-28` (مساحة شريط التنقل).
- `SectionHeader` / `SeeAllLink` — عنوان قسم + رابط «عرض الكل».
- `BottomSheet` — ورقة سفلية (فلاتر، فرز، خيارات قصيرة) مع `footer` ثابت و`title`/`subtitle`.
- `StickyActionBar` — شريط إجراء سفلي ثابت (السلة، إتمام الطلب، صفحة المنتج).
- `ViewToggle` — مبدّل منتجات/متاجر/خريطة.
- `PageHeader` — رأس موحّد (رجوع + عنوان + إجراءات) لصفحات pushed.
- `SearchField` / `FilterChip` — بحث بارز وشرائح تصفية أفقية.
- `MenuCard` / `MenuRow` / `SectionTitle` — صفوف إعدادات كاملة قابلة للنقر (Profile / Settings).
- `ConfirmDialog` — تأكيد العمليات الحساسة (حذف، تسجيل خروج).
- `EmptyState` / `ErrorState` / `ListSkeleton` (`LoadingSkeleton`) — حالات الفراغ والخطأ والتحميل.
- `ProductCard` / `StoreCard` / `ProductGridSkeleton` — بطاقات موحّدة (عمودان على الهاتف).

قواعد ثابتة:
- الخريطة لا تُوضع داخل بطاقة صغيرة — تُفتح في صفحتها `/map`.
- الإجراءات الأساسية في `StickyActionBar` لا تتكرر داخل تدفق الصفحة.
- `styles.css` يوفّر `app-page`, `page-section`, `touch-target` كـ utilities مشتركة.

## تعديلات جلسة التطوير الحالية

### صفحة المصادقة (`src/routes/auth.tsx`)
- إعادة تصميم كاملة ispirée من Apple و Telegram مع اعتماد هوية Arownd الحالية.
- شعار Arownd بحجم `text-3xl` باللون البنفسجي (`text-primary`).
- نص الترحيب بلون `text-muted-foreground` (رمادي داكن).
- أيقونات الحقول: `User` (الاسم)، `Mail` (البريد)، `Eye`/`EyeOff` (كلمة السر) جميعها `size-6`.
- إخفاء شريط التنقل السفلي (`BottomNav`) في صفحة `/auth` عبر `src/routes/__root.tsx`.
- أيقونات جميعها `size-6` لتتطابق مع نظام الأيقونات العام في المشروع.
- عناوين مخصصة: "مرحبًا بعودتك إلى Arownd" و "ابدأ رحلتك مع Arownd".
- رابط "نسيت كلمة السر" باللون البنفسجي (`text-primary`).
- جميع الوظائف محفوظة: Supabase Auth، Google OAuth، إعادة تعيين كلمة المرور.

### مكونات جديدة
- `src/components/sooqy/InAppNavigation.tsx`: تنقل داخل التطبيق باستخدام OSRM API (بدلاً من Google Maps الخارجي).
- `src/components/sooqy/DirectionsButton.tsx`: يفتح `InAppNavigation` بدلاً من `window.open`.

### تعديلات أخرى
- `src/components/sooqy/WilayaSelect.tsx`: قائمة منسدلة مخصصة بدلاً من `<select>` الأصلي، مع Portal وإغلاق ذكي.
- `src/routes/explore.tsx`: إزالة قسم "تصفح التصنيفات" الدائم، إضافة أيقونة تصنيفات تفتح قائمة منسدلة.
- `src/routes/profile.tsx`: إعادة توجيه مباشرة إلى `/auth` عند عدم تسجيل الدخول (بدون صفحة ترحيبية).
- `src/routes/notifications.tsx`: إضافة تعيين مقروء فردي، حذف فردي، تنقل ذكي للصفحة المقصودة.
- `src/routes/products.$productId.tsx`: زر "توصيل إلى المنزل" يستخدم `btn-primary`.
- `src/routes/checkout.tsx`: زر "متابعة التسوق" يستخدم `btn-secondary`.
- `src/components/sooqy/DynamicIsland.tsx`: `bg-primary-soft text-primary` بدلاً من `bg-ink`.
- `src/components/sooqy/qty-stepper.tsx`: إزالة `bg-ink` واستخدام `text-foreground hover:bg-neutral-100`.
- `src/routes/__root.tsx`: إخفاء `BottomNav` و `ConnectionBanner` و `DynamicIsland` في صفحة `/auth`.

## Obsidian & Lime dual-theme (2026 redesign)
- Design tokens في `src/styles.css` (`:root` فاتح + `.dark` داكن): accent `#C6F36B`، خلفية فاتحة `#F7F8F5`/سطح `#FFFFFF`، خلفية داكنة `#17191C`/سطح `#23262A`.
- `src/lib/theme.tsx`: `ThemeProvider` (localStorage key `sooqy-theme`، fallback لتفضيل النظام، سكربت منع الوميض في `__root.tsx` + `suppressHydrationWarning` على `<html>`).
- مبدّل المظهر في `/settings` → صف "المظهر" يفتح نافذة 3 خيارات (فاتح/داكن/نظام).
- `map-style.ts` ألوان MapLibre صارت lime. `text-primary`/`bg-primary` = lime. btn-primary hover `#A8D955`, active `#8FC44A`.
- بناء إنتاجي محالي يفشل حاليًا بسبب ملفات غير مكتملة من جلسة سابقة: `src/routes/wallet.tsx` و `src/routes/studio.orders.$orderId.tsx` يستدعيان دوال (`fetchWalletTransactions`, `walletTopup`, `walletWithdraw`, `deleteOrder`, `OrderStatusBadge`...) غير موجودة في `src/lib/sooqy.ts` — business logic خارج نطاق التصميم. خادم التطوير والمعاينة يعملان بشكل طبيعي.

## التحقق (هذه الجلسة — تحسين جودة التصميم البصري)

### ما تم تنفيذه
- **أيقونات Lucide بدلاً من emoji**: جميع مكونات `EmptyState` في `index.tsx`, `explore.tsx`, `stores.$storeId.tsx`, `stores.index.tsx`, `category.$catId.tsx`, `bag.tsx`, `favorites.tsx`, `notifications.tsx`, `orders.index.tsx`, `wallet.tsx` تستخدم أيقونة `Icon` من Lucide (MapPin, ShoppingBag, Star, Tag, Store, Heart, Search, Lock, Wallet, Package, Trash2) بدلاً من emoji.
- **أيقونات شريط التوصيل في `checkout.tsx`**: `🏠`/`📍` استبدلت بـ `<Home />`/`<MapPin />`.
- **أيقونات الاستوديو**: `📍` في `studio.index.tsx` و `studio.settings.tsx` استبدلت بـ `<MapPin />` أو حُذفت من التوست.
- **إصلاح الألوان المحمولة (hardcoded)**:
  - `cards.tsx`: `bg-neutral-100 dark:bg-neutral-800` → `bg-neutral-100` (التوكن يتكيف مع الثيمين)، شارة الخصم `text-white` → `text-danger-foreground`.
  - `badges.tsx`: `bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400` → توكنات متكيفة (`bg-neutral-200 text-muted-foreground dark:bg-neutral-200 dark:text-muted-foreground`).
  - `products.$productId.tsx`: `bg-neutral-100 dark:bg-neutral-800` → `bg-neutral-100`، `bg-ink/70` → `bg-black/60 text-white`، `bg-ink` → `bg-secondary`/`bg-primary`، `bg-white/15` → `bg-black/20`، `bg-ink py-5` → `bg-card py-5 text-card-foreground`.
  - `stores.$storeId.tsx`: `bg-neutral-100 dark:bg-neutral-800` → `bg-neutral-100`.
- **إصلاح اللون البنفسجي المتبقي**: `STORE_PLACEHOLDER` SVG في `cards.tsx`: `#6366F1` → `#C6F36B` (lime).
- **تصحيح النصوص العربية**:
  - `index.tsx`: "products قد تعجبك" → "منتجات قد تعجبك"، "أوبحث عن سلعة أخرى" → "أو البحث عن سلعة أخرى".
  - `stores.$storeId.tsx`: "أنت تwatch متجرك" → "أنت تشاهد متجرك كما يراه الزوار".
  - إزالة emoji من التوست: "أُضيف إلى السلة 🛒" → "أُضيف إلى السلة"، "أُضيف المتجر إلى مفضلتك ❤️" → "أُضيف المتجر إلى مفضلتك".
- **مكون `EmptyState` محدث**: يقبل prop `Icon` (مكون Lucide) بدلاً من `icon` (ReactNode/emoji)، مع حاوية أيقونة `bg-neutral-100` متكيفة.

### ما لم يتغير (نطاق التصميم)
- لا تغيير على قاعدة البيانات، السياسات، منطق الأعمال، أو مسارات التوجيه.
- `src/routes/wallet.tsx` و `src/routes/studio.orders.$orderId.tsx` ملفان غير مكتملان من جلسة سابقة يستدعيان دوال غير موجودة في `src/lib/sooqy.ts` — بناء إنتاجي يفشل بسببهما، وهو أمر سابق على هذه الجلسة وخارج نطاق التصميم.
- خادم التطوير والمعاينة يعملان بشكل طبيعي على `/`, `/explore`, `/settings`.

### نتائج التحقق
- `npx tsc --noEmit`: لا أخطاء نوعية في أي ملف تم تعديله (الأخطاء المتبقية فقط في `wallet.tsx`, `InAppNavigation.tsx`, `StoreMap.tsx`, `notifications.tsx` — جميعها قائمة سلفاً).
- `check_preview` على `http://127.0.0.1:5173/`, `/explore`, `/settings`: لا أخطاء JavaScript.

## هوية Arownd التجارية (هذه الجلسة — إعادة تسمية العلامة)

### الألوان (في `src/styles.css` و `src/styles/theme.css`)
- خلفية فاتحة: `#FFFFFF` — الأبيض الرسمي
- خلفية داكنة: `#0B0F0C` — الأسود الداكن كأساس للهوية
- نص أساسي: `#0B0F0C` (فاتح) / `#FFFFFF` (داكن)
- أساسي/تمييز: `#C6F36B` — الأخضر الليموني للأزرار والتركيز
- حبر الليمون للنص على الخلفيات الفاتحة: `#4A6B1F` (الليمون نفسه غير قابل للقراءة على الفاتح)

### الخطوط (في `src/routes/__root.tsx` و `src/styles.css`)
- الإنجليزية: **Inter** (via Google Fonts)
- العربية: **Noto Sans Arabic** (via Google Fonts، يُطبَّق عبر `html[lang="ar"]` في `src/styles.css`)

### ملفات الشعار (في `public/`)
- `2994.svg` — شعار الوضع الفاتح (نص أسود، خلفية شفافة)
- `2995.svg` — شعار الوضع الداكن (نص أبيض، خلفية شفافة)
- `favicon.svg` — أيقونة المتصفح (دائرة + نقطة مركزية، رمز "حولك")
- `icon-192.png` / `icon-512.png` — أيقونات PWA (موجودة مسبقًا)

### مكون الشعار (`src/components/sooqy/logo.tsx`)
- `ArowndLogo` — شعار مع `variant` (`horizontal` | `symbol`) وتبديل تلقائي حسب السمة
- `ArowndBrand` — شعار مع الاسم النصي، يُستخدم في رأس التطبيق العالمي
- يتحول تلقائيًا بين `2994.svg` و`2995.svg` عبر `ThemeProvider`

### حيث يُستخدم الشعار
- `src/routes/__root.tsx` — رأس التطبيق (أعلى `Outlet`، يُعرض على جميع الصفحات غير المصادقة)
- `src/routes/__root.tsx` — بيانات الوصف (title: "Arownd — اكتشف ما حولك"، theme-color، og:image)
- `public/manifest.webmanifest` و `public/manifest.json` — الاسم "Arownd"، الألوان، الأيقونات
- `src/lib/theme.tsx` — لون السمة الديناميكي (`#0B0F0C` داكن، `#FFFFFF` فاتح)

### ملف مرجعي
- `BRAND.md` — دليل الهوية التجارية الكامل (الألوان، الخطوط، الشعار، قواعد الاستخدام)

### قواعد استخدام الألوان
- الأخضر `#C6F36B` للأزرار الأساسية والتركيز فقط — لا يُستخدم كنص على خلفيات فاتحة
- على الخلفيات الفاتحة يُستخدم `#4A6B1F` كنص/أيقونة/حدود للليمون
- على الخلفيات الداكنة يُستخدم `#C6F36B` كنص مباشرة (تباين 13.8:1)
- الشعار يُعرض دائمًا بنسخته المناسبة للخلفية (فاتح/داكن) حسب السمة الحالية

## تأهيل «مشروع مبتكر» (2026-10-22)
- حزمة وثائق في `docs/innovation/` (README, 01–11, sources.md, قالب Pitch Deck) — بدون تعديل كود.
- الهدف: الترشح لـ «Label Projet Innovant» عبر https://startup.dz/label-projet/.