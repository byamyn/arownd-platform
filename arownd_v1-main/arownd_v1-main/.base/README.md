# Arownd — اكتشف ما حولك

> **Discover What's Around You.** · **اكتشف ما حولك.**

Arownd هي منصة تجارة محلية واكتشاف منتجات (ويب + PWA + Android) مبنية لسوق الجزائر:
تسوّق من متاجر موثّقة، قارن الأسعار بين محلات متعددة، احجز واستلم من المحل،
واطلب توصيلًا إلى المنزل — le tout en arabe et en français-compatible i18n (ar/en).

- **المستودع:** `sooqy-app` (الاسم (legacy) داخل الكود والـ SEO)
- **العلامة (Brand):** Arownd — انظر [`BRAND.md`](./BRAND.md)
- **الحالة:** MVP إنتاجي (Web + PWA + Android عبر Capacitor)، Supabase backend

---

## 📋 نظرة عامة

Arownd تربط **المتسوق** و **التاجر** و **شركة التوصيل** في منصة واحدة:

- **المتسوق:** بحث/استكشاف، صفحات منتجات مع مقارنة عروض المتاجر، سلة، دفع (COD / BaridiMob)،
  تتبع طلبات، مفضلة، مراجعات موثّقة، إشعارات.
- **تاجر (Studio):** لوحة تحكم على الهاتف، تبديل توفر السلعة بنقرة، إضافة منتج في 30 ثانية،
  إدارة صور متعددة، سجل حجوزات (كود `SQ-XXXX`)، شحنات.
- **إدارة:** لوحة admin، شركات توصيل، تغطية communes، محفظة.
- **توصيل:** 58 ولاية + بلديات، home/desk، COD + رفع وصل BaridiMob، شركة توصيل + شحنات.

### الميزات الأساسية

- 🔎 **بحث واستكشاف** — فلاتر (تصنيف، ولاية، commune، متوفر، ترتيب، radius)، تبديل منتجات/متاجر/خريطة.
- 📍 **خريطة المتاجر** — MapLibre + GPS، بطاقة سفلية (drawer).
- 🛒 **سلة + دفع** — `evaluateBag()` تقييم واحد (missing/unavailable/out_of_stock/price_changed/over_stock)،
  58 ولاية، communes، توصيل home/desk، COD/BaridiMob (رفع وصل).
- 🏪 **صفحة متجر (بوتيك)** — غلاف، شعار، شارة موثّق، ساعات عمل، عروض مصنّفة.
- 📦 **منتج + مقارنة عروض** — `pickBestOffer()` مصدر واحد للسعر، شارة توفر حية، تاريخ آخر تأكيد.
- 🔖 **احجز واستلم** — كود `SQ-XXXX` (3 ساعات)، خصم مخزون فوري.
- ⭐ **مراجعات موثّقة** — `submit_review` RPC (فقط بعد طلب مُسلَّم أو حجز مُستلَم).
- 👁️ **مشاهدات منتجات** — `increment_product_view` + `get_most_viewed_products`.
- 🖼️ **بحث بالصورة** — `src/lib/image-search.ts` + `ImageSearch`.
- 💳 **محفظة** — route + migrations (wallet).
- 🔔 **إشعارات realtime** — `src/hooks/use-realtime.ts`.
- 🌐 **i18n ar/en** — 10 مجموعات قاموس، صيغ جمع عربية، فحص parity آلي.
- 📱 **PWA** — manifest (maskable, id/scope), SW (network-first data, cache-first assets, update prompt).
- 🤖 **Android** — Capacitor 8.
- 🔍 **SEO** — `SeoHead` (meta/OG/Twitter/JSON-LD/canonical/hreflang)، sitemap.xml، robots.txt.
- 🛡️ **Sentry** — ErrorBoundary + رسائل مترجمة.
- ♿ **WCAG** — تباين 4.5:1 (قراءة) / 3:1 (تركيز) في الوضعين.

---

## 🧱 المكدس التقني

| الطبقة | التقنية |
|---|---|
| Build / SSR | Vite 8 + TanStack Start/Router (file-based routing) |
| UI | React 19 + Tailwind CSS 4 + Radix UI + lucide-react |
| Language | TypeScript 5.8 (strict) |
| Backend | Supabase (Postgres + RLS + Storage + Auth) |
| Mobile | Capacitor 8 (Android) |
| Maps | MapLibre GL + react-leaflet + OSRM (in-app nav) |
| State/Data | TanStack Query, react-hook-form + zod |
| Charts | recharts |
| Monitoring | Sentry |
| Tests | Vitest + Testing Library + jsdom |

---

## 📁 هيكل المشروع (أبرز المجلدات)

```
sooqy-app/
├── src/
│   ├── routes/            # TanStack file-based routes (30+)
│   ├── components/sooqy/  # مكتبة مكونات مشتركة (phone-first)
│   ├── components/seo/    # SeoHead
│   ├── lib/               # sooqy.ts, bag-check.ts, market.ts, i18n, dictionaries/
│   ├── integrations/supabase/
│   ├── hooks/
│   ├── styles/
│   └── test/
├── supabase/migrations/   # 19 migration (schema + RLS + RPC)
├── public/                # manifest, sw.js, sitemap, robots, icons, logos
├── api/                   # Vercel serverless entry
├── scripts/               # apply-migrations, build-mobile, bundle-server-for-vercel, ...
├── android/               # Capacitor Android project
├── docs/innovation/       # حزمة تأهيل «مشروع مبتكر»
├── BRAND.md               # دليل الهوية
└── DEPLOY-VERCEL.md       # دليل النشر
```

---

## 🚀 البدء السريع

### المتطلبات

- Node.js **22.x** (انظر `package.json` engines)
- npm
- حساب Supabase (project + database)

### التثبيت

```sh
git clone <repo-url>
cd sooqy-app
npm install
cp .env.example .env
# عدّل .env بقيم Supabase الخاصة بك
```

### متغيرات البيئة

انظر [`.env.example`](./.env.example). الحد الأدنى:

| المتغير | ملاحظة |
|---|---|
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | **مطلوب** |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` | **مطلوب** |
| `SUPABASE_SERVICE_ROLE_KEY` | دوال الخادم فقط (تجاوز RLS) |
| `DATABASE_URL` | لتطبيق الهجرات (محلي) |
| `VITE_GOOGLE_MAPS_API_KEY` | اختياري (الخريطة) |

> قيم Supabase تُدمج وقت البناء داخل حزمة المتصفح — أضفها قبل النشر.

### قاعدة البيانات

```sh
# تطبيق جميع الهجرات
node scripts/apply-migrations.mjs

# (اختياري) بيانات تطوير
node scripts/apply-migrations.mjs --seed

# تنظيف بيانات seed من قاعدة حيوية
node scripts/cleanup-demo-data.mjs --dry-run
```

أو الصق `supabase/migrations/202610140001_beta_ready.sql` في SQL Editor (idempotent).

### التشغيل (تطوير)

```sh
npm run dev          # http://localhost:5173
npm run build        # بناء إنتاج
npm run preview      # معاينة
npm run lint         # eslint
npm run format       # prettier
```

---

## 🗄️ قاعدة البيانات (Supabase)

- **19 migration** في `supabase/migrations/` (schema + RLS + RPC + indexes + wallet + delivery + realtime + notifications).
- جداول: `profiles`, `user_roles`, `stores`, `products`, `store_offers`, `product_images`,
  `reservations`, `orders`, `order_items`, `wilayas`, `reviews`, `notifications`, `shipments`,
  `delivery_companies`, `delivery_coverage_areas`, `wallet*`.
- RPC: `create_reservation`, `cancel_reservation`, `merchant_confirm_reservation`,
  `merchant_confirm_all_stock`, `create_order`, `link_order_shipment`, `submit_review`,
  `increment_product_view`, `get_most_viewed_products`, `become_merchant`, `merchant_*` (images),
  `category_stats`.
- RLS: قراءة عامة للمتاجر المعتمدة/العروض المتوفرة؛ صلاحيات merchant/admin.
- Storage buckets: `store-media`, `product-media`, `receipts` (signed URLs).
- عمولة: `stores.commission_rate` (افتراضي 7%) + `orders.commission_amount` (يُحتسب في `create_order`).

---

## 🧪 الاختبارات

```sh
npm run test         # vitest run (non-watch)
npm run test:watch   # وضع المراقبة
npx tsc --noEmit     # فحص الأنواع
```

الاختبارات تغطي: i18n parity, market, locale, geo, search, taxonomy, image-search, pwa, conn,
db-sync, reviews, merchant-upgrade, app-routing, sooqy, journey, shop-truth.

> ملاحظة: ملفان غير مكتملان من جلسة سابقة (`src/routes/wallet.tsx`,
> `src/routes/studio.orders.$orderId.tsx`) يستدعيان دوال غير موجودة في `src/lib/sooqy.ts` —
> بناء إنتاجي يفشل بسببهما. خادم التطوير والمعاينة يعملان بشكل طبيعي.

---

## ☁️ النشر (Vercel)

النشر على Vercel موثّق بالكامل في [`DEPLOY-VERCEL.md`](./DEPLOY-VERCEL.md).

TL;DR:

```sh
npm run build:vercel   # vite build + bundle server for vercel
```

- Build Command: `npm run build:vercel`
- Output Directory: `dist/client`
- أضف متغيرات Supabase في Vercel (Production/Preview/Development).
- `vercel.json` يضبط كل شيء تلقائيًا.

---

## 📱 تطبيق الموبايل (Android / Capacitor)

```sh
npm run build:mobile   # vite build --config vite.mobile.config.ts
npm run mobile         # node scripts/build-mobile.mjs
npx cap sync android
npx cap open android
```

- Config: [`capacitor.config.ts`](./capacitor.config.ts)
- Android project: `android/`

---

## 🌐 PWA

- `public/manifest.webmanifest` + `public/manifest.json` (مطابقان) — أيقونات فعلية + `maskable` + `id`/`scope`.
- `public/sw.js` — Service Worker: network-first للتنقّل/البيانات، cache-first للأصول، إشعار تحديث.
- `src/lib/pwa.ts` + `src/components/sooqy/PwaPrompt.tsx` — تسجيل SW + زر التثبيت + شريط «يتوفر تحديث».
- `src/test/pwa.test.ts` — يفحص وجود كل أيقونة في الـ manifest.

---

## 🌍 التدويل (i18n)

- `src/lib/locale.ts` — تحليل بادئة المسار (`/ar/...`, `/en/...`)، الكوكي، `Accept-Language`.
- `src/server.ts` — يزيل بادئة اللغة قبل معالجة الطلب، يعيد توجيه `/` إلى لغة المتصفح/الكوكي (307).
- `src/lib/i18n.ts` — `useTranslation()` للمكوّنات، `translate()` لوسوم الميتا، `t(key, lang, values)`.
- `src/lib/dictionaries/` — 10 مجموعات (`shared`, `home`, `explore`, `product`, `commerce`, `ui`, `studio`, `pages`).
- `src/test/i18n-parity.test.ts` — فحص آلي لتوازن المفاتيح وصيغ الجمع.
- **قاعدة:** لا نص عربي داخل JSX — استخدم `t("key")` وأضف المفتاح في `src/lib/dictionaries/`.

---

## 🔍 SEO

- `src/components/seo/SeoHead.tsx` — meta tags, Open Graph, Twitter Card, JSON-LD (Organization/WebSite/Product/Breadcrumb).
- `SeoHead` يقرأ المسار من الراوتر (`useLocation`) — يعمل صحيحًا أثناء SSR؛ يولّد `canonical`
  مع بادئة اللغة و`hreflang` (ar/en/x-default) تلقائيًا.
- `public/sitemap.xml` — يُServe من dist/client، يحتوي `xhtml:link` للبدائل اللغوية.
- `public/robots.txt` — يُServe من dist/client.
- OG image: `public/seo/og.svg` (default).
- canonical: `https://sooqy.app/{lang}{path}`.
- `vercel.json`: rewrite لـ `/sitemap.xml` و `/robots.txt` و `/seo/*`.

---

## 🎨 الهوية (Brand)

- **الاسم:** Arownd (داخل الشعار: "arownd" أحرف صغيرة).
- **الرسالة:** Discover What's Around You. / اكتشف ما حولك.
- **الألوان:** lime `#C6F36B` (accent)، أسود داكن `#0B0F0C`، أبيض `#FFFFFF`، رمادي `#B0B6AE`.
- **الخطوط:** Inter (EN) + Noto Sans Arabic (AR) via Google Fonts.
- **الشعار:** `public/2994.svg` (فاتح) / `public/2995.svg` (داكن) / `public/favicon.svg`.
- **المكون:** `src/components/sooqy/logo.tsx` (`ArowndLogo`, `ArowndBrand`).
- التفاصيل: [`BRAND.md`](./BRAND.md).

> ⚠️ **ملاحظة هوية:** المستودع (`sooqy-app`) يستخدم اسم «SOOQY» في الكود والـ SEO والـ env vars
> والـ Supabase، بينما العلامة now Arownd. وحّد الاسم قبل أي ترشح/نشر (انظر `docs/innovation/13-identity-unification.md`).

---

## ⚠️ قيود معروفة

- `src/routes/wallet.tsx` و `src/routes/studio.orders.$orderId.tsx` غير مكتملان (دوال مفقودة في `src/lib/sooqy.ts`).
- بناء إنتاجي محلي (`npm run build`) يفشل بسبب الملفين أعلاه؛ خادم التطوير/المعاينة يعملان.
- بعض الاختبارات (journey/shop-truth) قد تأخذ وقتًا (timeouts) في بيئة sandbox.
- هوية غير موحدة (Arownd vs SOOQY) — انظر أعلاه.

---

## 📚 وثائق إضافية

- [`AGENTS.md`](./AGENTS.md) — قواعد المشروع والاتفاقيات (للمساهمين والوكلاء).
- [`BRAND.md`](./BRAND.md) — دليل الهوية.
- [`DEPLOY-VERCEL.md`](./DEPLOY-VERCEL.md) — النشر على Vercel.
- [`docs/innovation/`](./docs/innovation/) — حزمة تأهيل «مشروع مبتكر» (Arownd).

---

## 🤝 المساهمة

1. اقرأ `AGENTS.md` (conventions, i18n rules, truth layer).
2. لا تكتب نصًا عربيًا داخل JSX — استخدم `t("key")`.
3. استخدم `pickBestOffer()` / `evaluateBag()` كمصادر حقيقة (لا تكرر منطق السعر/السلة).
4. شغّل `npm run test` و `npx tsc --noEmit` قبل PR.

---

## 📄 الترخيص

لم يُحدَّد بعد (no LICENSE file). جميع الحقوق محفوظة لفريق Arownd.
