# Arownd content-report operations

## Scope

The application lets authenticated users submit one report per target. Reports are stored in
`public.content_reports`; the reporter cannot read or change the moderation queue. The queue is
intended for review by the project owner through the Supabase Dashboard SQL Editor.

This initial implementation records reports. It does **not** automatically hide or remove content,
suspend accounts, or provide an in-app moderator console. Do not describe moderation as fully
automated or complete until those controls and a documented response process are implemented.

## Review pending reports

Run this query in the Supabase SQL Editor using an owner-level session:

```sql
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
```

Inspect the referenced content and any relevant context before taking action. Avoid sharing
reporter identity or report details with the reported account.

## Record a review decision

When a report is being investigated:

```sql
update public.content_reports
set status = 'under_review',
    reviewed_at = now()
where id = '<report-uuid>'
  and status = 'pending';
```

After the review, record the outcome:

```sql
update public.content_reports
set status = 'actioned',
    reviewed_at = now(),
    review_note = '<brief internal decision>'
where id = '<report-uuid>'
  and status in ('pending', 'under_review');
```

Use `dismissed` instead of `actioned` when the report does not establish a policy violation.
Keep internal notes factual and avoid copying unnecessary personal data.

## Operational requirements still outstanding

- Establish a response-time target and assign a responsible reviewer.
- Add user blocking and ensure blocked users cannot continue direct interactions.
- Add content visibility/removal controls for products and stores, not only review status.
- Add an authenticated moderator workflow with a trusted server-side role model before exposing
  moderation actions in the client.
- Define an appeal path and retention period for reports.
- Test the flow with separate reporter and target accounts before public release.
