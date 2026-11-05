# Arownd — Database and Supabase guide

> **Project:** Arownd  
> **Owner:** byamyn  
> **Repository:** [byamyn/arownd-platform](https://github.com/byamyn/arownd-platform)  
> **Status:** Engineering guide; the migration history is authoritative for repository-managed schema changes.

## 1. Source of truth

Database changes are tracked in `supabase/migrations/`. The repository tree currently contains 68 SQL migration files. This count describes the checked-in history; it does not prove which migrations have been applied to a particular Supabase project.

The configured Supabase project reference in `supabase/config.toml` is a project identifier, not a credential.

Do not infer the live schema from the migration folder alone. Before production operations, compare the repository migration history with the target project's migration state and actual schema.

## 2. Change workflow

1. Inspect the current schema and all related migrations.
2. Define the intended data model, constraints, indexes and lifecycle behavior.
3. Add a new timestamped SQL file under `supabase/migrations/`.
4. Never edit, rename or delete an already-applied migration.
5. Include least-privilege RLS policies for every affected table and role.
6. Use RPCs/transactions for multi-step sensitive operations.
7. Add server-side idempotency for operations that may be retried.
8. Test allowed and denied access for shopper, merchant, platform administration and delivery-company roles.
9. Verify rollback/recovery strategy and take a restorable backup before production changes.

## 3. Authorization requirements

RLS is a security boundary, not a UI feature. For each table, document:

- Which roles may select, insert, update and delete.
- How the authenticated user is associated with the row.
- Whether a merchant must own the related store.
- Whether a delivery company is assigned to the shipment or delivery record.
- Which operations are reserved for trusted RPCs or server-side code.
- Whether a policy permits access to related records through joins or helper functions.

Do not grant broad table access simply because a client screen needs the data. Prefer narrow policies and narrowly scoped RPC functions.

## 4. Sensitive transaction domains

Give additional review to:

- Checkout and order creation.
- Merchant suborders and stock reservation/release.
- Reservations and expiry handling.
- Wallet balances, ledger entries and settlements.
- Cash-on-delivery collections.
- Shipment creation, assignment and status transitions.
- Account deletion and preservation of legally required transaction evidence.

Multi-row updates must be atomic where partial completion could create inconsistent orders, inventory, balances or shipment state. Use server-enforced idempotency keys for retryable requests.

## 5. Required migration review checklist

- [ ] New migration file; no historical migration edited.
- [ ] Foreign keys and delete behavior reviewed.
- [ ] Unique constraints and indexes reviewed.
- [ ] RLS enabled where required.
- [ ] SELECT/INSERT/UPDATE/DELETE policies reviewed independently.
- [ ] Shopper, merchant, admin and delivery-company access tested.
- [ ] RPC execution grants are least-privilege.
- [ ] SECURITY DEFINER functions use a safe fixed search_path and explicit authorization checks.
- [ ] Transaction boundaries and idempotency reviewed.
- [ ] Tests cover both authorized and unauthorized cases.
- [ ] Backup and recovery plan confirmed before production deployment.

## 6. Local commands

The scripts currently defined in `package.json` include:

```bash
npm run db:start
npm run db:stop
npm run db:reset
npm run db:push
npm run db:studio
```

Use destructive local reset commands only against the intended local development environment. Confirm the linked Supabase project before any remote push or production operation.

## 7. Credential safety

- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL` to browser code.
- Never commit real credentials to Git.
- Do not paste credentials into issues, pull requests, logs or chat.
- A publishable/anonymous key is expected to be public and does not replace RLS.
- Use trusted server-side secrets only for operations that require elevated access.

## 8. Verification boundary

This guide does not enumerate every current table, policy or RPC and does not certify the live database. Generate a schema/policy inventory from the current migrations and verify it against the target Supabase project before production changes.

---

## النسخة العربية | دليل قاعدة البيانات

### مصدر الحقيقة

تُدار تغييرات قاعدة البيانات عبر ملفات SQL الجديدة داخل `supabase/migrations/`. عدد الملفات في المستودع لا يثبت أن جميعها طُبّقت على مشروع Supabase المستهدف؛ يجب مقارنة سجل الهجرات بالمخطط الفعلي قبل أي تغيير إنتاجي.

### مسار التغيير الآمن

1. افحص المخطط الحالي والهجرات ذات الصلة.
2. أنشئ migration جديدًا ولا تعدّل الهجرات القديمة.
3. أضف قيود العلاقات والفهارس وسياسات RLS اللازمة.
4. اختبر صلاحيات المتسوق والتاجر والإدارة وشركة التوصيل، بما في ذلك حالات الرفض.
5. استخدم RPC ومعاملات ذرّية للعمليات متعددة الخطوات.
6. أضف idempotency من جهة الخادم للطلبات القابلة لإعادة المحاولة.
7. خذ نسخة احتياطية قابلة للاستعادة قبل تغييرات الإنتاج.

### المجالات الحساسة

إنشاء الطلب، حجز المخزون، الحجوزات، المحفظة والتسويات، تحصيل الدفع عند الاستلام، إنشاء الشحنات وتغيير حالتها، وحذف الحساب. لا تسمح بعمليات جزئية قد تترك الطلب أو المخزون أو الرصيد في حالة غير متسقة.

### الأمان

لا تضع `SUPABASE_SERVICE_ROLE_KEY` أو `DATABASE_URL` في كود المتصفح أو Git. المفتاح العام لا يغني عن RLS. يجب تقييد صلاحيات RPC والتحقق الصريح من هوية المستخدم وملكيته للسجل.

**حدود الوثيقة:** هذا الدليل لا يحصي كل الجداول والسياسات والدوال الحالية، ولا يؤكد حالة قاعدة البيانات الحية.

