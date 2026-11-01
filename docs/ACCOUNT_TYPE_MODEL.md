# Arownd account type model

## Identity is not authorization

`profiles.account_type` records one workspace identity:

- `personal`: the default account.
- `merchant`: set by the authenticated `create_my_store()` transaction together with the merchant capability and store record.
- `delivery_company`: set when the authenticated user submits a delivery-company application.

Authorization remains separate:

- `user_roles` continues to grant capabilities such as `merchant` and `admin`.
- Admin is not an account type and remains an independent role.
- A delivery-company application does not grant operational shipment access. Existing approval state (`delivery_companies.is_approved`) and delivery RLS continue to control that access.
- Selecting an account type in the signup UI only selects the onboarding destination; it never grants a role.

## Mutual exclusion

Merchant onboarding and delivery-company registration lock the user's profile row and reject the opposite business identity. Merchant store creation is a single transaction: the account type, merchant capability and store row are committed or rolled back together. This avoids races where the same account creates both workspaces. Existing data containing both a delivery-company row and merchant role is not silently rewritten: the migration fails with `account_type_conflict` so an operator can reconcile the affected account first.

Preflight query:

```sql
select dc.user_id
from public.delivery_companies dc
join public.user_roles ur
  on ur.user_id = dc.user_id
 and ur.role = 'merchant'::public.app_role;
```

The query should return no rows before applying `20261101170000_account_type_model.sql`. The migration also fails safely if a delivery-company owner or merchant-role owner has no matching `profiles.user_id` row.

## Delivery identity

The delivery identity lookup uses `delivery_companies.user_id -> auth.users.id`, matching the stabilization migration `20261030201916_stabilize_delivery_identity_and_tracking.sql`. The registration trigger only records the account type; it does not change approval state or grant the `delivery_company` role.

## Personal and merchant onboarding

New personal accounts receive `personal` from the database default and the existing signup trigger grants the `customer` capability. Merchant signup selection only chooses the onboarding route; `create_my_store()` is the only client-facing path that changes a personal account to `merchant`. It derives the owner from `auth.uid()`, locks the profile, rejects delivery identities and duplicate stores, and atomically writes the merchant role and store.

## Profile privacy

Public personal profiles remain opt-in. `is_public` defaults to false; a synchronization trigger copies only display name, avatar, and general location into the private-schema projection table. Public reads use the narrow `public.public_personal_profiles` view; the base `profiles` table is never opened to anonymous users. The owner changes visibility through the `set_my_profile_visibility()` security-definer RPC, while direct profile UPDATE grants remain restricted to the existing column allowlist.

## Migration order

Apply the migrations in timestamp order after reviewing the preflight query and passing CI. These migrations have been committed to the repository only; they have not been applied to the live Supabase project.
