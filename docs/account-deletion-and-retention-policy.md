# Arownd — account deletion and retention policy (implementation baseline)

**Status:** engineering baseline for legal review. This document is not a legal opinion and must be approved by Algerian counsel and Arownd's data-protection owner before publication or production activation.

## 1. User-facing deletion request

- The request page is available at `/delete-account` on the public website and from Settings in the app.
- A signed-in user can submit one open request at a time and see its status.
- A user who cannot sign in can contact `arownddz@gmail.com` from the same page. Support must verify identity using a proportionate process and must not ask users to send passwords or one-time codes.
- Submitting a request does not immediately delete the account. The account is placed in a review queue so active orders, merchant obligations, COD collections, disputes, and statutory records can be handled safely.
- Status values: pending, under_review, blocked, completed, rejected. A blocked request must include a plain-language explanation and the specific retention/transaction reason.
- Completion must be recorded only after the deletion/anonymization checklist has been completed. No client-side operation may set a request to completed.

## 2. Retention principles

Algeria's Law 18-07, as amended by Law 25-11 (24 July 2025), requires personal data to be limited to the purposes for which it is processed and not retained in identifiable form longer than necessary. The law also introduces processing-activity and processing-operation registers. Arownd must maintain its processing inventory and record deletion/anonymization operations.

The Algerian Commercial Code (Article 12) and the Directorate General of Taxes guidance require specified commercial/accounting books and supporting documents to be retained for ten years. This is a document-specific obligation; it does **not** mean every profile field, chat, device token, or application event may be kept for ten years.

## 3. Data disposition matrix

| Data category | On approved deletion | Retention rule |
| --- | --- | --- |
| Authentication credentials and active sessions | Revoke sessions and delete the Auth identity after the dependent-record checklist passes | Do not retain credentials or active tokens |
| Profile, avatar, contact preferences, saved addresses, push tokens | Delete or irreversibly anonymize | No blanket 10-year retention |
| Favorites, transient activity, non-essential analytics | Delete | Keep only aggregated data that cannot reasonably identify a person |
| Reviews, public profile content, store ownership | Remove or anonymize the account linkage; handle merchant/store ownership transfer before deletion | Keep only where a separately documented legal need exists |
| Orders, invoices, accounting books, COD collections and payment evidence | Preserve only the minimum legally required transaction evidence; remove/anonymize unnecessary direct identifiers where legally permitted | Up to 10 years only for books/documents covered by the Commercial Code or tax rules; calculate from the legally applicable starting date for each record |
| Open orders, returns, disputes, chargebacks, delivery claims or investigations | Pause final deletion and explain the specific outstanding matter; restrict access to staff who need it | Retain only until the matter is resolved and any applicable statutory period ends |
| Deletion-request audit row | Keep request ID, timestamps and final status; user_id becomes NULL when Auth user is deleted | Minimal, non-identifying audit record; set a separate approved expiry schedule |
| Backups | Allow normal backup expiry; do not restore deleted data into live service without reapplying deletion | Document actual provider backup windows before publishing a number |

## 4. Merchant and delivery-account safeguards

Before final deletion, verify that the account has no open orders, merchant suborders, shipments, COD collection records, unsettled balances, or store ownership that must be transferred. Never cascade-delete transaction or accounting evidence to make an Auth deletion succeed.

The current schema has restrictive foreign keys around `merchant_order_cod_collections`, `merchant_orders`, and `stores`. A separate reviewed migration is required to preserve accounting history while replacing personal actor references with a non-identifying audit actor where lawful. Do not change those constraints with a blind cascade.

## 5. Operational checklist

1. Verify the requestor's identity and recent authentication.
2. Identify the account role and all linked stores, orders, shipments, COD collections, wallet/settlement records, reports and disputes.
3. Resolve or transfer open obligations; document any legal hold and tell the user what is retained and why.
4. Delete or irreversibly anonymize non-required personal data, including storage objects and push tokens.
5. Preserve only the minimum required accounting evidence under restricted access and the applicable retention schedule.
6. Revoke sessions, remove authentication credentials, and delete the Auth identity only after foreign-key checks pass.
7. Set the request to completed and retain only the minimal non-identifying request audit.
8. Verify that deleted personal data is no longer exposed by public profiles, APIs, search, storage, or analytics.

## 6. Legal references to verify before launch

- Law 18-07 and amendment Law 25-11: https://droit.mjustice.gov.dz/content/حماية-الأشخاص-الطبيعيين-في-مجال-معالجة-المعطيات-ذات-الطابع-الشخصي
- Official DGI guidance on the real tax regime and ten-year accounting-document retention: https://mfdgi.gov.dz/professionnels-ar/identifier-regime-fiscal-ar/regime-reel-ar/regime-reel-arabe
- Commercial Code, Article 12 (ten-year retention of specified books and documents): https://www.wipo.int/wipolex/

The exact retention categories, starting dates, tax-document scope, and backup expiry must be confirmed by Algerian legal/accounting advisers before the policy is presented as a binding customer promise.
