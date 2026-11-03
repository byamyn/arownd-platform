# Account deletion implementation notes

## Current application behavior

The Settings screen currently opens a prefilled email request. It does not delete the authenticated account or its associated data, and it is not by itself a complete in-app plus external web deletion flow.

## Database dependency audit

A read-only inspection of the live Supabase foreign-key graph found deletion blockers that make a direct Auth user deletion unsafe to implement as a one-line Admin API call:

- `public.merchant_order_cod_collections.collected_by` references `auth.users.id` with `ON DELETE RESTRICT`.
- `public.stores.owner_id` cascades from the user, but `public.merchant_orders.store_id` references stores with `ON DELETE RESTRICT`. A merchant account with merchant orders can therefore prevent its store (and user) from being deleted.
- `public.merchant_order_cod_collections.merchant_order_id` and `order_id` both use `ON DELETE RESTRICT`, so collection records can prevent deletion of related merchant orders or customer orders.
- Other account-linked records such as profiles, reviews, reservations, notifications, push tokens, and wallet transactions currently have cascading user references. Products created by the user use `ON DELETE SET NULL`.

## Required product and legal decisions before implementation

1. Define which transaction, collection, tax, fraud, and dispute records must be retained under applicable law and for how long.
2. Decide how to anonymize personal identifiers in retained orders and collection records without corrupting audit history.
3. Define what happens when a merchant has open orders, reservations, shipments, or COD collections. The system must not silently delete or orphan active transactions.
4. Make the `collected_by` reference nullable or replace it with a non-identifying audit actor where appropriate, while preserving the collection record.
5. Design a verified deletion-request flow that works both inside the app and from a public web page, with request status, completion tracking, and a documented retention exception.
6. Test deletion using separate customer, merchant, and delivery-company accounts in a non-production environment before enabling it in production.

## Safety rule

Do not deploy an Edge Function that immediately calls `auth.admin.deleteUser` until the retention and foreign-key blockers above have been addressed. A failed delete or an over-broad cascade could damage order and accounting history.

## Verification boundary

The schema inspection was read-only. No production migration, user deletion, or other data mutation was performed as part of this audit.
