# SOOQY Backend (Supabase) — حالة الإكمال

## الحالة
✅ **14 هجرة مطبّقة** على قاعدة البيانات (West EU / Ireland):
`20261007` … `202610200001_realtime.sql`

## الجداول
profiles, user_roles, stores, products, store_offers, product_images, reviews, reservations, orders, order_items, wilayas, categories, notifications, delivery_companies, delivery_coverage_areas, delivery_services, shipments, shipment_status_logs, shipment_tracking.

## Storage Buckets
- `store-media` (public read, owner upload/update/delete)
- `product-media` (public read, owner upload/update/delete)
- `receipts` (owner read/upload/delete)

## RPCs (SECURITY DEFINER)
- `create_order`, `create_reservation`, `cancel_reservation`, `submit_review`
- `become_merchant`, `merchant_confirm_reservation`, `merchant_confirm_all_stock`
- `increment_product_view`, `get_most_viewed_products`, `category_stats`
- `link_order_shipment` (جديد — ربط طلب بشحنة)
- `notify_shipment_status` (trigger — إشعار العميل عند تغيّر حالة الشحنة)

## RLS (ملخص)
- **العملاء:** قراءة شركات التوصيل المعتمدة + مناطق التغطية + الخدمات؛ إدراج شحنات لطلباتهم؛ قراءة/تحديث إشعاراتهم.
- **المتاجر:** CRUD على متاجر/منتجات/عروض/صور； قراءة شحنات طلبات متجرهم.
- **شركات التوصيل:** قراءة/تحديث بياناتها؛ قراءة/تحديث شحناتها؛ إدراج سجلات الحالة ونقاط التتبع.
- **المدراء:** قراءة/تعديل جميع الجداول (profiles, user_roles, orders, stores, offers, products, reservations, reviews, notifications, delivery_companies, shipments, coverage areas, services, product images) (has_role admin).

## Admin creation (manual)
- لا توجد آلية `become_admin` في الواجهة (بشكل مقصود — أمان).
- لتعيين مدير: في Supabase Dashboard → SQL Editor:
  ```sql
  insert into public.user_roles (user_id, role) values ('<USER_UUID>', 'admin') on conflict do nothing;
  ```
- **Anon:** قراءة stores/products/offers/images/wilayas/categories (public).

## الاتصال (من هذه البيئة)
- Direct Postgres (IPv6) غير reachable → استخدم **pooler IPv4**:
  `postgresql://postgres.nagzoafkitfsqlcwsdau:Amine.2004mohamed@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`

## تطبيق هجرات جديدة
```bash
POOLER="postgresql://postgres.nagzoafkitfsqlcwsdau:Amine.2004mohamed@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
supabase db push --db-url "$POOLER" --yes
DATABASE_URL="$POOLER" node scripts/apply-migrations.mjs
```

## التحقق
- `supabase migration list --db-url "$POOLER"` → 14 applied.
- `public.schema_migrations` → 14 صف.
- Realtime publication: notifications, orders, shipments, store_offers, products, reviews, reservations (replica identity full).
- Frontend: `src/hooks/use-realtime.ts` (`useRealtimeSubscription`) invalidates React Query caches on `postgres_changes`. Used in notifications, orders, orders.$orderId, delivery-dashboard, studio.shipments, admin.delivery-companies.
- `npm run test` (111 passed) + `npm run build` + `npx tsc --noEmit` (0 errors).
