# Arownd order and per-store delivery quote workflow

## Checkout

- A single customer cart can contain products from multiple stores.
- Checkout creates one parent `orders` row and one `merchant_orders` row per store.
- Checkout displays the products subtotal only. It does not ask the buyer to select a carrier or pay a delivery fee.
- Payment is cash on delivery (COD) only.
- Stock is reserved transactionally by the existing order creation function.
- Each store owner receives an in-app order notification.

## Merchant quote

Each merchant reviews only its own suborder and submits a non-negative delivery fee. Store pickup must use a zero fee. The suborder moves from `pending` to `quoted`; the buyer receives an in-app notification containing the products subtotal, delivery fee, and final amount.

The merchant must not prepare the order while its status is `quoted`.

## Buyer decision

The buyer responds independently to each `quoted` suborder:

- Accept: `quoted -> confirmed`. For home delivery, the database creates one unassigned shipment linked to that merchant suborder. Arownd must assign an approved carrier before the physical handoff.
- Decline: `quoted -> cancelled`. Only the declined suborder's reserved stock is restored. Other stores' suborders remain unchanged.

The merchant receives a notification of the buyer's decision.

## Fulfilment

- Home delivery: the merchant waits for Arownd carrier assignment. Carrier shipment status updates advance the linked merchant suborder.
- Store pickup: the merchant can mark an accepted suborder delivered.
- The parent order's subtotal, shipping fee, total, and aggregate status are recalculated from non-cancelled merchant suborders.
- Historical parent orders without merchant suborders are not modified by this workflow.

## Statuses

| Entity | Status | Meaning |
|---|---|---|
| merchant_orders | pending | Waiting for merchant review and quote |
| merchant_orders | quoted | Waiting for buyer approval |
| merchant_orders | confirmed | Buyer accepted the final amount |
| merchant_orders | shipped | Carrier has picked up / is transporting it |
| merchant_orders | delivered | Completed |
| merchant_orders | cancelled | Buyer declined or the order was cancelled |

## Database migration

`20261101190500_merchant_shipping_quotes_and_buyer_approval.sql` adds quote snapshots and the authenticated merchant/customer RPCs. It is committed to `arownd-premium` but is **not applied to the live Supabase project**.

Carrier assignment/reassignment UI and COD collection/reconciliation remain separate follow-up work.