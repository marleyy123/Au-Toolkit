# Lynk webhook: staging only

Source protocol: https://documenter.getpostman.com/view/3211564/2sB2cVf2Kp

The endpoint is `api/lynk-webhook.js` on the Vercel testing project. It does not
exist on the deployed project until the development changes are deployed.
Do not register the production domain, Netlify verifier, localhost, or the
Google Apps Script URL as the Lynk webhook target.

## Phase 1: deploy and inspect

1. Deploy the `development` branch to the existing `au-toolkit-testing` Vercel
   project. Confirm its configured Git production branch is `development`.
2. In that project's Settings > Environment Variables, set
   `VITE_FIREBASE_PROJECT_ID=au-toolkit-staging-20261005` and
   `LYNK_WEBHOOK_MODE=inspect`. Redeploy after environment changes.
3. Open `https://au-toolkit-testing.vercel.app/api/lynk-webhook`.
   GET should return `WEBHOOK_HEALTH`, `environment: staging`, `mode: inspect`.
   This only checks endpoint availability, not payments or spreadsheet access.
4. In Lynk Settings > Integrations > Webhook, save that same URL. The official
   docs say the merchant key becomes available after saving a webhook URL.
5. Copy the key directly into Vercel's server-only `LYNK_MERCHANT_KEY` variable.
   Do not share it in chat, screenshots, Git, or any `VITE_` variable. Redeploy.
6. Click Lynk's Test URL. A signed successful sample returns
   `INSPECTED_NO_ACCESS_GRANTED`; other events may return `IGNORED_EVENT`.
   If Lynk sends an unsigned probe, it will be rejected, not granted access.
7. Vercel function logs record only product UUIDs/titles in inspect mode,
   not customer details, signature, key or the full request body. A generic
   Test URL sample may contain a dummy product. Obtain the UUID of the actual
   TEST product from its metadata or an actual TEST order in inspect mode.
   The public slug `l755mjy6y4v5` is NOT assumed to be the item UUID.

Inspect mode never calls Apps Script and never grants access. A paid test
order in this phase will NOT activate automatically. It can be redelivered
after activation is configured, if Lynk supports replay in the dashboard.
Zero-price orders are accepted by the code, but Lynk's actual free-order
delivery behavior still needs live verification. Do not infer that a generic
Test URL success proves the real payment flow.

## Phase 2: connect the testing spreadsheets

1. Open the existing AU Access Test bound Apps Script project, NOT production.
   Replace its source with the updated complete
   `apps-script/au-toolkit-access-staging.gs` file; save.
2. In Script Properties, add `LYNK_TEST_PRODUCT_UUID` with the real TEST product
   UUID. Keep the existing `API_SHARED_SECRET` unchanged. The three test sheets
   must already be set up as documented in `spreadsheet-staging.md`.
3. Update the existing web app deployment via Deploy > Manage deployments >
   Edit > New version > Deploy. Preserve its `/exec` URL and access settings.
4. In the Vercel testing project, configure server variables:

| Variable | Value |
| --- | --- |
| `LYNK_WEBHOOK_MODE` | `activate` |
| `LYNK_MERCHANT_KEY` | Key from your Lynk dashboard |
| `LYNK_TEST_PRODUCT_UUID` | Same UUID as the Script Property |
| `GOOGLE_SHEETS_SCRIPT_URL` | Existing staging `/exec` URL |
| `APPS_SCRIPT_SHARED_SECRET` | Existing staging `API_SHARED_SECRET` |

The existing staging adapter pins the Firebase project and Apps Script URL.
Use the established staging environment from `spreadsheet-staging.md`; changing
the deployment ID requires deliberately updating both API guards.
Redeploy Vercel after configuring variables. These belong in Production on the
TESTING project (and Preview if testing there), never the real production app.

## Phase 3: verify a real TEST order

Use the same Google email for checkout and staging login. After the signed
`payment.received` / `SUCCESS` event, verify:

- The Vercel endpoint returns `PURCHASE_SYNCED`.
- Exactly one transaction with its Ref appears in AU Toolkit PRO TEST.
- AU Access Test has that buyer and a 30-day expiry from purchase date.
- Staging login succeeds, retaining the existing device-slot rules.
- Redelivering the same Ref returns `duplicate: true` without changing its
  purchase date, device IDs, manual status or adding another transaction.
- Another product is ignored; failed/pending events do not activate access.

Only quantity 1 of the approved TEST product is supported. Multi-quantity
orders are rejected rather than guessed into subscription durations. Renewals
use existing subscription behavior, not automatic accumulation of unused days.
Transactions with conflicting Ref/email/date are rejected. Apps Script uses a
script lock so concurrent duplicate delivery is serialized. If AU Access sync
fails after a transaction write, redelivery heals the sync without another row.

Lynk's documented signature is SHA-256 of `grandTotal + refId + message_id +
merchantKey`, NOT an HMAC of the whole body. We implement that exact contract;
do not describe it as authenticating every payload field. Request data is
additionally validated and activation is restricted to the TEST product.
Naive `createdAt` values use Asia/Jakarta (+07:00); explicit offsets are honored.
Signed historical retries are accepted and deduplicated by Ref, not renewed
from delivery time. Future purchase timestamps over five minutes are rejected.

## Local checks

`node tests/lynk-webhook.test.mjs`

`node tests/apps-script-staging.test.mjs`

Live merchant-key validation, Vercel environment changes, Apps Script redeploy,
real order delivery and end-to-end login still require the user's accounts.
