# Arownd — Account deletion technical audit

> **Project:** Arownd  
> **Owner:** byamyn  
> **Repository:** [byamyn/arownd-platform](https://github.com/byamyn/arownd-platform)  
> **Status:** Historical technical findings; revalidate against current migrations and live schema before implementation.

## Purpose

This document records database and product risks identified during an earlier read-only review. It is not proof that the same schema or UI behavior remains unchanged on the current deployment.

## Previously identified database dependencies

The earlier inspection reported these deletion blockers:

- public.merchant_order_cod_collections.collected_by referenced auth.users.id with ON DELETE RESTRICT.
- public.stores.owner_id cascaded from the user, while public.merchant_orders.store_id used ON DELETE RESTRICT.
- public.merchant_order_cod_collections.merchant_order_id and order_id used restrictive references.
- Other account-linked records included profiles, reviews, reservations, notifications, push tokens, wallet transactions, and products with differing delete behaviors.

These observations must be checked against the latest migrations and the actual Supabase schema before acting.

## Required decisions

1. Define transaction, tax, accounting, fraud, and dispute records that must be retained, with legal review.
2. Define how personal identifiers may be anonymized without corrupting transaction and audit history.
3. Block final deletion while active orders, reservations, shipments, collections, or unsettled obligations remain unresolved.
4. Preserve financial and operational history; do not use broad cascades to make account deletion succeed.
5. Provide a verified request flow with status tracking and documented retention exceptions.
6. Test customer, merchant, and delivery-company deletion cases in a non-production environment.

## Safety boundary

Do not call an administrative Auth deletion operation until the current foreign-key graph, retention obligations, ownership transfers, and anonymization behavior have been reviewed. Never expose service-role credentials to the client.

## Verification boundary

The original inspection was described as read-only. This document does not claim that the current production database has been re-inspected or modified.
