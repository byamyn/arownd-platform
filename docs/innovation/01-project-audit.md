# 01 — فحص المستودع (Project Audit)

## 1. الهوية والمكدس التقني
- **الاسم (BRAND.md):** Arownd — «Discover What's Around You.» / «اكتشف ما حولك.»
- **اسم المنتج المعتمد:** Arownd. بعض المسارات والمعرّفات التقنية القديمة محفوظة للتوافق ولا تمثل الاسم التجاري.
- **المكدس:** Vite 8 + React 19 + TanStack Start/Router + Tailwind 4 + TypeScript 5.8 + Supabase (Postgres + RLS + Storage + Auth) + Capacitor 8 (Android).
- **اللغات:** ar/en (i18n 10 مجموعات قاموس) — `src/lib/dictionaries/*`.
- **PWA:** `public/sw.js`, `public/manifest*.json`, `src/lib/pwa.ts`, `src/components/sooqy/PwaPrompt.tsx`.
- **SEO:** `src/components/seo/SeoHead.tsx` (meta/OG/Twitter/JSON-LD/canonical/hreflang), `public/sitemap.xml`, `public/robots.txt`.
- **الخط (Arownd):** Inter + Noto Sans Arabic (`BRAND.md`).
- **الخط السابق:** IBM Plex Sans Arabic/Tajawal (`README.md` master prompt).

## 2. المسارات (src/routes) — 31 route
العميل:
- `/` (index) — الرئيسية: وصل حديثًا، منتجات قد تعجبك، اختيار ولاية (localStorage).
- `/explore` — بحث/فلاتر (تصنيف، ولاية، commune، متوفر، ترتيب، radius).
- `/products/$productId` — صفحة المنتج + مقارنة عروض المتاجر + حجز/استلام + مراجعات.
- `/stores`, `/stores/$storeId` — المتاجر/بوتيك + عروض.
- `/map` — خريطة (MapLibre + GPS).
- `/bag`, `/checkout` — سلة + دفع COD/BaridiMob + 58 ولاية + communes + توصيل home/desk + شركة توصيل.
- `/favorites`, `/notifications`, `/orders`, `/orders/$orderId`, `/wallet`.
- `/profile`, `/settings`, `/auth`, `/auth/callback`.

التاجر (Studio):
- `/studio` (لوحة)، `/studio/settings`, `/studio/orders/$orderId`, `/studio/shipments`.

الإدارة:
- `/admin` (index), `/admin/delivery-companies`, `/delivery-dashboard`, `/delivery-register`.

صفحات ثابتة:
- `/about`, `/help`, `/privacy`, `/terms`.

## 3. قدرات backend (Supabase)
- **19 migration** في `supabase/migrations/` (schema + RLS + RPC + indexes + wallet + delivery companies + realtime + notifications).
- **جداول (من types/README):** profiles, user_roles, stores, products, store_offers, product_images, reservations, orders, order_items, wilayas, reviews, notifications, shipments, delivery_companies, delivery_coverage_areas, wallet*.
- **RPC (من sooqy.ts):** create_reservation, cancel_reservation, merchant_confirm_reservation, merchant_confirm_all_stock, create_order, link_order_shipment, submit_review, increment_product_view, get_most_viewed_products, become_merchant, merchant_* (images), category_stats.
- **RLS:** سياسات قراءة عامة للمتاجر المعتمدة/العروض المتوفرة؛ صلاحيات merchant/admin.
- **Storage buckets:** store-media, product-media, receipts (signed URLs).
- **العمولة:** لا تفرض Arownd أي عمولة على الطلبات أو الحجوزات؛ قيمة العمولة في قاعدة البيانات صفر.

## 4. ميزات «الحقيقة» (Truth Layer)
- `pickBestOffer()` — مصدر واحد للسعر (`src/lib/sooqy.ts`).
- `evaluateBag()` — تقييم سلة/دفع (`src/lib/bag-check.ts`).
- localStorage آمن (try/catch) + مزامنة تبويبات.
- `ProductGroup.bestOffer` → minPrice مشتق.

## 5. إمكانات إضافية
- **بحث صور:** `src/lib/image-search.ts`, `src/components/sooqy/ImageSearch*.tsx`.
- **مراجعات موثّقة:** submit_review RPC (فقط بعد طلب مُسلَّم أو حجز مُستلَم).
- **مشاهدات منتجات:** increment_product_view + get_most_viewed_products.
- **توصيل:** 58 ولاية + communes، home/desk، COD + BaridiMob (رفع وصل)، شركة توصيل + شحنات.
- **محفظة (wallet):** route + migration 202610220003/04.
- **إشعارات realtime:** `src/hooks/use-realtime.ts`, migration 202610200001.
- **أخطاء/مراقبة:** Sentry web (`src/utils/sentry.ts`, AppErrorBoundary), diagnostics route.

## 6. الاختبارات
- **174 اختبار** في 17 ملفًا (`src/test/*`).
- تشغيل في بيئة sandbox (2026-10-22): **142 passed / 32 failed (timeouts)**.
  - الفشل: `src/test/journey.test.tsx` (28) + `src/test/shop-truth.test.tsx` (4) — timeouts 5s (likely بيئة/شبكة/Supabase).
  - النجاح: i18n-parity, market, locale, geo, search, taxonomy, image-search, pwa, conn, db-sync, reviews, merchant-upgrade, app-routing, legacy-compat.
- **Build:** لم يُشغّل في هذا التقييم (حسب قواعد D2 — check_preview فقط). [TODO: run npm run build before submission].
- **TypeScript:** `npx tsc --noEmit` غير مشغّل هنا [TODO].

## 7. ما لا يوجد (مهم لـ «مشروع مبتكر»)
- **لا كيان قانوني (SARL/SPA) مذكور** — «projet innovant» يخص حاملي مشروع قبل إنشاء الشركة، لكن الترقية لـ «startup» تتطلب شركة.
- **لا فريق مسمّى** (CV) — TODO.
- **لا prototype evidence** (فيديو ≤4 min / APK link / موقع) — TODO (التطبيق موجود but لا link موثّق).
- **لا بيانات سوق** (TAM/SAM/SOM) — TODO (فرضيات).
- **لا IP** (براءة/علامة/حقوق تأليف) — TODO (أو «لا يوجد»).
- **لا pitch deck** (سننشئ محتوى في 08).
- **لا إيرادات/مستخدمون/ traction** موثّقة — TODO.
- **معرّفات تقنية قديمة:** بقيت بعض المسارات والمفاتيح الداخلية لأسباب التوافق، ولا تمثل الاسم التجاري.

## 8. مراجع ملفات
- `src/routes/*`, `src/lib/sooqy.ts`, `src/lib/bag-check.ts`, `src/lib/market.ts`, `src/lib/geo.ts`, `src/lib/i18n.ts`, `src/lib/dictionaries/*`
- `supabase/migrations/*`, `public/manifest*.json`, `public/sw.js`, `src/components/seo/SeoHead.tsx`
- `AGENTS.md`, `BRAND.md`, `README.md`