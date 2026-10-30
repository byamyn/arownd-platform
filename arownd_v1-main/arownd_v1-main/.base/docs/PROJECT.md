# SOOQY — نظرة عامة على المشروع

## 1. ما هو SOOQY؟

**SOOQY** منصة تجارة محلية (ويب + PWA + تطبيق Android) موجهة للسوق الجزائري.  
الفكرة الأساسية: مساعدة المشتري على **العثور على المنتج، مقارنة الأسعار، التحقق من التوفر، الحجز/الاستلام أو الطلب مع توصيل** قبل خروجه من المنزل، مع تمكين التاجر من **إدارة متجره ومخزونه** من هاتفه.

- **المستودع:** `yaso33/sooqy-app-new`
- **المنصة:** Vite + React 19 + TypeScript + TanStack Start/Router + Tailwind CSS 4
- **الخلفية:** Supabase (PostgreSQL + Auth + Storage + RPC)
- **الجوال:** Capacitor (Android)
- **النشر:** Vercel (ويب) + APK (جوال)

---

## 2. Stack التقني

| طبقة | التقنية |
|------|---------|
| الواجهة | React 19, TypeScript 5.8 |
| التوجيه | TanStack Router (ملف `src/routeTree.gen.ts` مُولَّد) |
| Start/SSR | TanStack Start |
| الحالة/البيانات | TanStack Query |
| التصميم | Tailwind CSS 4, Radix UI, lucide-react |
| الخلفية | Supabase JS SDK |
| الخرائط | MapLibre GL, Leaflet / react-leaflet |
| الجوال | Capacitor 8 |
| الاختبارات | Vitest + Testing Library |
| المراقبة | Sentry (`src/utils/sentry.ts`) |
| البناء | Vite 8, terser |

---

## 3. بنية المشروع

```text
src/
  routes/          # صفحات TanStack Router
  components/      # مكونات UI (sooqy, ui, seo)
  lib/             # طبقة البيانات (sooqy.ts, delivery.ts, auth, bag, geo)
  integrations/    # عميل Supabase + الأنواع
  utils/           # diagnostics, sentry
  test/            # fixtures لـ Supabase fake
supabase/
  migrations/      # هجرات قاعدة البيانات
  seed.sql         # بيانات تطوير محلية فقط
scripts/           # أدوات DB, build, cleanup
docs/              # توثيق المشروع (هذا المجلد)
```

### 3.1 طبقة البيانات

- `src/lib/sooqy.ts` — API الرئيسي للمنصة (قراءة/كتابة Supabase):
  - المتاجر وال produits: `fetchNearStores`, `searchProducts`, `searchStores`, `getProduct`, `getProductComparisonOffers`, `getStore`, `getStoreOffers`
  - الحجوزات: `createReservation`, `cancelReservation`, `fetchMyReservations`
  - الطلبات: `createOrderWithDelivery`, `fetchMyOrders`, `fetchOrder`
  - المراجعات: `fetchReviews`, `submitReview`
  - الإشعارات: `fetchMyNotifications`, `markNotificationsRead`
  - التاجر: `merchantCreateStore`, `merchantQuickAddProduct`, `merchantToggleAvailability`, `merchantUpdateOffer`, `merchantDeleteOffer`, `merchantConfirmReservation`, ...
  - صور متعددة: `merchantAddOfferImages`, `merchantRemoveOfferImage`, `merchantSetPrimaryImage`
  - الملف الشخصي: `fetchMyProfile`, `updateMyProfile`
  - Admin: `adminFetchStores`, `adminSetVerified`
- `src/lib/delivery.ts` — شركات التوصيل، التغطية، الشحنات، التتبع
- `src/lib/auth.tsx`, `src/lib/bag.tsx`, `src/lib/geo.ts`, `src/lib/favorites.ts`

### 3.2 المكونات

- `src/components/sooqy/` — بطاقات، badges، empty/error states، image uploader، category tiles، review section
- `src/components/seo/SeoHead.tsx` — meta/OG/Twitter/JSON-LD
- `src/components/ui/` — مكونات Radix/shadcn

---

## 4. صفحات التطبيق (Routes)

### 4.1 عامة/عميل
- `/` — الصفحة الرئيسية
- `/explore` — البحث والاستكشاف
- `/category/$catId` — فئة
- `/products/$productId` — منتج + مقارنة محلات + حجز/استلام
- `/stores/`, `/stores/$storeId` — قائمة/صفحة متجر
- `/map` — خريطة المتاجر
- `/bag`, `/checkout` — سلة/دفع
- `/favorites`, `/orders/`, `/orders/$orderId` — مفضلة/طلبات
- `/notifications`, `/profile`, `/settings`, `/account`
- `/auth`, `/auth_/callback` — المصادقة

### 4.2 تاجر
- `/studio/` — استوديو التاجر (لوحة تحكم، إضافة منتج، إدارة صور، حجوزات/طلبات)
- `/studio/settings`, `/studio/shipments`

### 4.3 توصيل/Admin
- `/delivery-register`, `/delivery-dashboard`
- `/admin/`, `/admin/delivery-companies`

### 4.4 معلوماتية
- `/about`, `/help`, `/terms`, `/privacy`

---

## 5. قاعدة البيانات (Supabase)

### 5.1 الجداول الأساسية
`profiles`, `user_roles`, `stores`, `products`, `store_offers`, `product_images`, `reviews`, `reservations`, `orders`, `order_items`, `wilayas`, `delivery_companies`, `delivery_coverage_areas`, `delivery_services`, `shipments`, `shipment_status_logs`, `shipment_tracking`, `notifications`

### 5.2 الهجرات (Migrations)
```text
202610070001_initial_schema.sql
202610080001_security_fixes.sql
202610090001_runtime.sql
202610100001_auto_verified_stores.sql
202610110001_notifications.sql
202610120001_product_views.sql
202610130001_store_socials_avatar.sql
202610140001_beta_ready.sql
202610150001_offer_delete_safety.sql
202610160001_taxonomy.sql
202610170001_delivery_companies.sql
```

### 5.3 ملاحظة تشغيلية مهمة
قاعدة Supabase الحيوية قد تحتوي **الجداول فقط**. لتفعيل RPC (create_order, create_reservation, submit_review, ...) يجب تطبيق:
```bash
node scripts/apply-migrations.mjs --only=202610140001
```
أو لصق `supabase/migrations/202610140001_beta_ready.sql` في SQL Editor.  
هذا الملف idempotent (آمن للتكرار).

### 5.4 الصور المتعددة (Product Images)
- جدول `product_images` (`offer_id`, `image_url`, `is_primary`)
- مكون `src/components/sooqy/image-uploader.tsx` (معاينة، حذف، تحديد أساسي، حد 10 صور)
- API: `merchantQuickAddProduct(files)`, `merchantAddOfferImages`, `merchantRemoveOfferImage`, `merchantSetPrimaryImage`

### 5.5 التخزين (Storage)
- Buckets: `store-media`, `product-media`, `receipts`
- رفع الصور عبر `uploadImageToBucket(file, bucketName)`

---

## 6. متغيرات البيئة (.env)

انظر `.env.example`. الأهم:
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_PROJECT_ID=...
DATABASE_URL=...   # لتطبيق الهجرات
VITE_GOOGLE_MAPS_API_KEY=...  # اختياري
VITE_SENTRY_DSN=...            # اختياري
```

---

## 7. التشغيل، البناء، الاختبار

```bash
npm i
npm run dev          # خادم التطوير
npm run build        # بناء الإنتاج
npm run test         # Vitest (آخر تشغيل: 111 اختبار ناجح)
npm run lint
npm run format
```

Supabase محلي:
```bash
npm run db:start
npm run db:reset
npm run db:push
npm run db:studio
```

جوال:
```bash
npm run build:mobile
npm run mobile
```

Vercel:
```bash
npm run build:vercel
```

---

## 8. SEO

- `src/components/seo/SeoHead.tsx` في كل route (meta, OG, Twitter, JSON-LD)
- `public/sitemap.xml`, `public/robots.txt`
- `public/seo/og.svg` (صورة OG افتراضية)
- `vercel.json` لإعادة كتابة `/sitemap.xml`, `/robots.txt`, `/seo/*`

---

## 9. الحالة الحالية (مختصر)

- ✅ `tsc --noEmit` = صفر أخطاء (بعد إصلاحات الأنواع)
- ✅ `npm run build` ينجح
- ✅ `npm run test` (آخر تشغيل) 111 اختبار ناجح
- ✅ push إلى `origin/main` (commit `db15e3c`)
- ⚠️ في الإنتاج: تطبيق migration `202610140001_beta_ready.sql` مطلوب لتفعيل RPC
- ⚠️ لا بيانات تجريبية في الإنتاج؛ `seed.sql` للتطوير فقط

---

## 10. ملاحظات صيانة

- AGENTS.md يحتوي قواعد/ملاحظات المشروع (SEO، صور متعددة، ...)
- لا تُعيد scaffolding المشروع؛ عدّل الملفات مباشرة.
- `routeTree.gen.ts` مُولَّد — لا تحرره يدوياً.
- قبل "تم" شغّل `check_preview` (أو `npm run build` + `npm run test`).
```

Then ROADMAP. Need real future plans. Let's create.<|end|><|start|> nodeName <|constrain|>write_file<|channel|>analysis <|constrain|>xml<|message|><rfl:parameter name="path">
docs/ROADMAP.md