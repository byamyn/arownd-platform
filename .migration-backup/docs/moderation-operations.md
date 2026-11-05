# Arownd — Content report operations

> **Project:** Arownd  
> **Owner:** byamyn  
> **Repository:** [byamyn/arownd-platform](https://github.com/byamyn/arownd-platform)  
> **Status:** Operational runbook; verify current schema and role permissions before executing SQL.

## Scope and limitations

The application records authenticated user reports in public.content_reports. This workflow must not be described as automated moderation unless content hiding/removal, account restrictions, review tooling, and an accountable response process are implemented and tested.

The earlier implementation notes describe a queue reviewed through the Supabase Dashboard SQL Editor by an authorized project operator. Re-check current RLS and schema before running any query.

## Review pending reports

Use an authorized, audited operator session in the Supabase SQL Editor:

~~~sql
select
  id,
  reporter_id,
  target_type,
  target_id,
  reason,
  details,
  status,
  created_at
from public.content_reports
where status = 'pending'
order by created_at asc;
~~~

Limit access to reporter identity and report details. Do not disclose reporter information to the reported account unless a documented legal or operational requirement applies.

## Record a review decision

The following statements are examples from the earlier runbook, not a replacement for a reviewed moderation RPC or a current schema contract. Confirm allowed status values, audit fields, and permissions before executing them.

Mark a report under review:

~~~sql
update public.content_reports
set status = 'under_review',
    reviewed_at = now()
where id = '<report-uuid>'
  and status = 'pending';
~~~

Record an outcome:

~~~sql
update public.content_reports
set status = 'actioned',
    reviewed_at = now(),
    review_note = '<brief internal decision>'
where id = '<report-uuid>'
  and status in ('pending', 'under_review');
~~~

Use dismissed only when the report does not establish a policy violation. Keep notes factual and minimize personal data.

## Outstanding operational requirements

- Assign a responsible reviewer and response-time target.
- Define escalation, appeal, and retention procedures.
- Add safe content visibility/removal controls where required.
- Use a trusted server-side authorization model for moderation actions.
- Test with separate reporter and target accounts.
- Audit every moderation decision and restrict access to sensitive reports.

## Safety

Do not expose privileged SQL access or service-role credentials to the client. Do not run the example updates against production until the current schema, RLS, and audit requirements are verified.

---

## النسخة العربية | تشغيل بلاغات المحتوى

### النطاق
تسجل المنصة بلاغات المستخدمين في `public.content_reports` وفق ملاحظات التنفيذ السابقة. لا ينبغي وصف النظام بأنه moderation آلي ما لم تكن أدوات إخفاء المحتوى وإزالته وتقييد الحسابات والمراجعة والاستئناف مطبقة ومختبرة.

### مراجعة البلاغات
استخدم جلسة مشغل مخولة ومدققة في Supabase Dashboard. تحقق من المخطط وRLS وقيم status الحالية قبل تنفيذ أي SQL. قلل الوصول إلى هوية المبلّغ وتفاصيل البلاغ، ولا تكشفها للحساب المبلّغ عنه دون سبب قانوني أو تشغيلي موثق.

### تسجيل القرار
أمثلة SQL الموجودة في القسم الإنجليزي أمثلة تاريخية وليست عقدًا مضمونًا للمخطط الحالي. تحقق من قيم الحالات وحقول التدقيق والصلاحيات قبل تنفيذها، ويفضل اعتماد RPC موثوق للقرارات الحساسة.

### متطلبات تشغيلية
- تعيين مسؤول مراجعة ومدة استجابة.
- تحديد التصعيد والاستئناف والاحتفاظ.
- توفير ضوابط آمنة لإخفاء المحتوى أو إزالته عند الحاجة.
- تسجيل كل قرار وتقييد الوصول إلى البلاغات الحساسة.
- اختبار البلاغ بحسابين منفصلين: المبلّغ والحساب المستهدف.

**تحذير:** لا تكشف صلاحيات SQL الإدارية أو service-role credentials للعميل، ولا تنفذ أمثلة التحديث على الإنتاج قبل التحقق من المخطط وRLS.

