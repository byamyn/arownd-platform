# Arownd — Supabase backend

This directory contains the version-controlled Supabase configuration, Edge Functions, seed data, and database migrations for Arownd.

## Local development

1. Install the Supabase CLI.
2. Copy `.env.example` to `.env` and configure the local application environment.
3. Start the local Supabase stack:

```bash
supabase start
```

4. To recreate the **local** database from the repository migrations and seed data:

```bash
supabase db reset
```

5. Open the local Supabase Studio:

```bash
supabase studio
```

## Database migrations

- Store schema changes as new, timestamped SQL files in `supabase/migrations/`.
- Review every migration before applying it.
- `supabase db reset` resets the local development database; it does not update the hosted project.
- `supabase db push` applies pending migrations to the linked remote project. Run it only after explicit approval and a review of the migration plan.

Do not commit local Supabase CLI state from `supabase/.temp/`, credentials, or private environment files.

## Main areas

The schema supports Arownd's local-commerce workflows, including customer profiles and roles, stores and products, offers, orders and merchant suborders, shipping and delivery companies, notifications, reviews, reservations, and related audit/security records.

The authoritative schema history is the ordered set of SQL files in `migrations/`.
