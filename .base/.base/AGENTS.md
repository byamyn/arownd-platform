## Backend (Supabase)
- 14 migration applied (latest: 202610200001_realtime.sql).
- Realtime: publication supabase_realtime includes notifications, orders, shipments, store_offers, products, reviews, reservations (replica identity full).
- Frontend hook: src/hooks/use-realtime.ts (useRealtimeSubscription) invalidates React Query caches on postgres_changes. Used in notifications, orders, orders.$orderId, delivery-dashboard, studio.shipments, admin.delivery-companies.
- Admin RLS: admin role reads/updates all profiles, user_roles, orders, stores, offers, products, reservations, reviews, notifications, delivery_companies, shipments, coverage areas, services, product images.
- Shipment status change triggers customer notification (notify_shipment_status).
- Direct Postgres (IPv6) unreachable from this env; use pooler IPv4:
  postgresql://postgres.nagzoafkitfsqlcwsdau:Amine.2004mohamed@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
- Apply migrations: `POOLER=...; supabase db push --db-url "$POOLER" --yes` then `DATABASE_URL="$POOLER" node scripts/apply-migrations.mjs`.
- Storage buckets: store-media, product-media, receipts.
- RLS: customers read approved delivery companies/coverage/services; insert shipments for own orders; merchants read shipments of own orders; delivery companies insert status logs/tracking; admins approve companies.

## SEO

- مكون `src/components/seo/SeoHead.tsx` يُستخدم في كل route لـ meta tags, Open Graph, Twitter Card, JSON-LD (Organization/WebSite/Product/Breadcrumb).
- Sitemap: `public/sitemap.xml` — يُ Serve من dist/client.
- robots.txt: `public/robots.txt` — يُ Serve من dist/client.
- OG image: `public/seo/og.svg` (default).
- canonical: يُستخدم window.location.origin كـ base.
- vercel.json: rewrite لـ /sitemap.xml و /robots.txt و /seo/*.
- build: `npm run build` (terser installed).

## إدارة الصور المتعددة (Product Images)

- جدول `product_images` يدعم صور متعددة لكل عرض (`offer_id`, `image_url`, `is_primary`).
- `src/components/sooqy/image-uploader.tsx` — مكون رفع صور متعددة مع معاينة، حذف، تحديد أساسي، وحد 10 صور.
- `src/lib/sooqy.ts` — دوال API: `merchantQuickAddProduct` (يقبل `File[]`)، `merchantAddOfferImages(offerId, files)`، `merchantRemoveOfferImage(imageId)`، `merchantSetPrimaryImage(imageId)`.
- `src/routes/studio.index.tsx` — زر "إدارة الصور" في بطاقة كل منتج يفتح نافذة إدارة الصور مع `ImageUploader` مرتبط بدوال API للحذف وتحديد الأساس وإضافة صور جديدة.