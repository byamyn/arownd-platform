# SOOQY — خارطة الطريق (Roadmap)

> هذا الملف يحدد **الأولويات الحقيقية** بناءً على حالة الكود الحالية، وليس قائمة أمنيات عامة.

## 0. الحالة الحالية (Baseline)

- ✅ الواجهة + TanStack Router/Start + Supabase
- ✅ صفحات العميل: بحث، منتج، متجر، خريطة، سلة، دفع، طلبات، حجوزات
- ✅ استوديو التاجر: إضافة منتج، تعديل، حذف، تبديل توفر، تحديث جماعي، حجوزات/طلبات
- ✅ صور متعددة للعروض (`product_images` + `ImageUploader`)
- ✅ توصيل: شركات، تغطية، شحنات، تتبع، لوحة admin
- ✅ SEO: SeoHead, sitemap, robots
- ✅ Sentry (اختياري عبر `VITE_SENTRY_DSN`)
- ✅ Capacitor Android
- ⚠️ في الإنتاج: migration `202610140001_beta_ready.sql` مطلوب لتفعيل RPC
- ⚠️ لا بيانات seed في الإنتاج (تطوير فقط)

---

## P0 — إكمال الإطلاق (قبل أي نشر عام)

1. **تطبيق migration Beta في بيئة Supabase الحيوية**
   - تفعيل RPC: `create_order`, `create_reservation`, `cancel_reservation`, `merchant_confirm_reservation`, `submit_review`, ...
   - إضافة أعمدة `commission_rate`, `commission_amount`, `view_count`, ...
   - التحقق من triggers الإشعارات.

2. **التحقق End-to-End للتدفقات الحرجة**
   - طلب مع توصيل (منزل/مكتب) + COD/BaridiMob
   - حجز واستلام (كود `SQ-XXXX` + countdown)
   - مراجعة (فقط بعد طلب مُسلَّم أو حجز مُستلم)
   - تبديل توفر التاجر + تحديث جماعي

3. **Hardening الأمان**
   - مراجعة RLS لكل جدول (قراءة عامة، كتابة مالك فقط)
   - التحقق من `has_role` وصلاحيات admin
   - التحقق من رفع الصور (bucket policies, حجم/نوع)

4. **البيئة والCI**
   - `.env` في Vercel (كل متغيرات Supabase)
   - `DATABASE_URL` (إذا كانت الهجرات تُطبَّق من CI)
   - GitHub Actions: `npm run test` + `npm run build` + `tsc --noEmit`

---

## P1 — جودة وتجربة (الأسبوع 1-3)

1. **اختبارات**
   - Unit tests لـ `sooqy.ts` (search, offers, orders) — حالياً 12 ملف/111 اختبار
   - Integration tests مع Supabase fake (`src/test/supabase-fake.ts`)
   - E2E (Playwright) للتدفقات الحرجة (اختياري)

2. **الأداء**
   - تحسين استعلامات Supabase (indexes, pagination)
   - تحسين صور (compression, responsive, CDN)
   - code-splitting already via Vite manualChunks

3. **UX/RTL**
   - تحسين mobile-first (touch targets, safe areas)
   - حالات empty/error/loading متسقة
   - إمكانية الوصول (a11y): labels, focus, keyboard

4. **البحث**
   - full-text search في Supabase (Postgres tsvector) أو فلترة محسّنة
   - بحث بالصور (`ImageSearchRow`) — تحسين/توسيع

---

## P2 — ميزات تجارية (الشهر 1-2)

1. **لوحة تحليلات التاجر**
   - مشاهدات المنتج (`incrementProductView`, `fetchMostViewedProducts`)
   - ملخص عمولة (`commission_rate`, `commission_amount`)
   - رسوم بيانية (recharts موجود)

2. **نظام التوصيل (Delivery)**
   - تتبع real-time (polling أو Supabase Realtime)
   - إشعارات حالة shipment
   - تقييم شركة التوصيل

3. **المراجعات (Reviews)**
   - moderations/admin
   - صور في المراجعات (اختياري)

4. **الإشعارات (Notifications)**
   - push notifications (Capacitor) — حالياً DB notifications
   - email/SMS (اختياري)

5. **الدفع**
   - تكامل BaridiMob (حالياً رفع وصل)
   - CIB/EDAHABIA (مستقبلاً)

---

## P3 — منصة/توسع (الشهر 3+)

1. **PWA متقدم**
   - offline cache (service worker)
   - install prompt
   - sync when online

2. **الجوال (Android)**
   - release APK (موجود `SooQy-v1.0.0.apk`)
   - push notifications
   - camera/gallery permissions

3. **Admin**
   - moderation panel كامل (stores, products, reviews, companies)
   - analytics platform

4. **Internationalization**
   - دعم لغات إضافية (حالياً عربي RTL)
   - توطين DZ (ولايات/بلديات)

5. **Scalability**
   - caching (Redis/Supabase)
   - CDN للصور
   - rate limiting

---

## 11. "Definition of Done" (لكل PR/ميزة)

- [ ] `npm run test` ناجح
- [ ] `npm run build` ناجح
- [ ] `npx tsc --noEmit` صفر أخطاء
- [ ] `check_preview` (أو manual smoke test) لا أخطاء
- [ ] RLS/Security reviewed (إن تأثرت البيانات)
- [ ] تحديث docs/ (إن تغيرت الميزات)
- [ ] commit + push

---

## 12. مخاطر/ملاحظات

- **بدون migration Beta**: RPCs مفقودة → طلبات/حجوزات/مراجعات لا تعمل في الإنتاج.
- **seed.sql**: للتطوير فقط؛ لا تطبق في production.
- **Google Maps API**: اختياري؛ الخريطة قد تعمل ببديل.
- **Sentry**: يتطلب `VITE_SENTRY_DSN`.
- **Capacitor**: requires build mobile config (`vite.mobile.config.ts`).
```

Need ensure write_file includes content; yes.<|end|><|start|> nodeName <|constrain|>write_file<|channel|>analysis <|constrain|>xml<|message|><rfl:parameter name="path">
docs/ROADMAP.md