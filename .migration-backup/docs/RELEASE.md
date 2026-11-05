# Arownd — MVP release checklist

> **Project:** Arownd  
> **Owner:** byamyn  
> **Repository:** [byamyn/arownd-platform](https://github.com/byamyn/arownd-platform)  
> **Status:** Release gate template; every item requires evidence from the target release.

## 1. Release identity

- [ ] Confirm the release commit on `main`.
- [ ] Confirm the intended version and release notes.
- [ ] Confirm the Node.js runtime decision and align local, CI and Vercel environments.
- [ ] Confirm the Vercel project is linked to the intended repository and production branch.
- [ ] Confirm preview and production environment variables without exposing values.

## 2. Build and quality

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npm run ui:check`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run build:vercel` when validating the deployment artifact.
- [ ] Review GitHub Actions results and dependency audit findings.
- [ ] Test critical user journeys on supported mobile browsers.

## 3. Database and data protection

- [ ] Confirm migration history is synchronized with the target Supabase project.
- [ ] Take a backup and verify the recovery procedure before production migrations.
- [ ] Review RLS and RPC grants for shopper, merchant, administration and delivery-company roles.
- [ ] Test checkout, stock, reservations, wallet, COD and shipment invariants.
- [ ] Confirm idempotency for retryable sensitive operations.
- [ ] Verify account deletion and retention behavior against approved policy.

## 4. Security and operations

- [ ] Confirm privileged keys are server-only.
- [ ] Review authentication, CSRF, redirect and session behavior.
- [ ] Verify storage policies and private file access.
- [ ] Verify Sentry environment, release tagging and privacy-safe event capture.
- [ ] Confirm operational access and incident-response ownership.
- [ ] Confirm monitoring and rollback procedures.

## 5. Mobile release

- [ ] Verify Android application ID and signing configuration.
- [ ] Build and test the signed Android artifact on real devices.
- [ ] Verify iOS bundle identity and build on supported macOS/Xcode infrastructure.
- [ ] Test native auth callbacks, PKCE, deep links and push notifications on each platform.
- [ ] Confirm privacy disclosures and store metadata.

## 6. Product readiness

- [ ] Verify Arabic-first RTL flows and translation completeness.
- [ ] Verify light and dark themes.
- [ ] Verify loading, empty, error and success states.
- [ ] Test shopper, merchant and delivery-company workflows separately.
- [ ] Verify contact/support and report-handling processes.
- [ ] Confirm any pilot limitations are communicated clearly.

## 7. Go/no-go record

Record the release commit, test evidence, known issues, migration status, backup status, approver and decision. Do not mark a gate complete based only on the existence of code or configuration.

## 8. Verification boundary

This checklist is not evidence that a release is ready. Complete it against the exact release candidate and target environments.

---

## النسخة العربية | بوابة الإطلاق التجريبي

### مبدأ الإطلاق

لا يُعلن عن جاهزية Arownd للإنتاج اعتمادًا على نجاح البناء فقط. يجب التحقق من تدفقات المتسوق والتاجر وشركة التوصيل والإدارة، ومن صلاحيات قاعدة البيانات وسلامة العمليات المالية.

### قائمة التحقق

- [ ] مراجعة commit والفرع المستهدفين.
- [ ] نجاح TypeScript وESLint وUI checks وVitest وBuild.
- [ ] مراجعة migrations وسياسات RLS وRPC على مشروع الاختبار.
- [ ] اختبار إنشاء الطلب والمخزون والشحنات ومنع التكرار.
- [ ] اختبار الحجوزات والمحفظة وCOD والتسويات.
- [ ] التحقق من متغيرات البيئة دون كشف قيمها.
- [ ] مراجعة Sentry وسجلات الأخطاء والتنبيهات.
- [ ] اختبار Android وiOS على أجهزة فعلية عند شمول الإصدار لهما.
- [ ] التأكد من النسخ الاحتياطي وخطة الاستعادة.
- [ ] مراجعة الخصوصية والمتطلبات القانونية محليًا.
- [ ] توثيق ما اختُبر وما لم يُختبر، ومن وافق على الإطلاق.

### شرط التراجع

يجب أن تكون هناك خطة واضحة لإيقاف النشر أو الرجوع إلى إصدار مستقر، مع مراعاة أن تغييرات قاعدة البيانات قد تحتاج إجراءً تصحيحيًا مستقلًا ولا يمكن دائمًا عكسها آليًا.

**القرار:** لا يتم الإطلاق قبل إغلاق المخاطر الحرجة وتوثيق قبول المخاطر المتبقية.

