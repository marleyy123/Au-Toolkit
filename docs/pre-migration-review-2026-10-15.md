# Development pre-migration review — 15 October 2026

Scope: review branch `development` before a proposed production migration. No deployment, production data import, payment, or account changes were performed.

## Findings requiring preparation before production cutover

1. **Firestore billing handlers are staging-only.** `api/verify-buyer.js`, `api/lynk-webhook.js`, `api/sheet-admin.js`, and `lib/staging-access-store.js` restrict the Firebase project to `au-toolkit-staging-20261005`. The store checks the service-account project and the verifier checks JWT issuer/audience. Production cannot use these handlers just by replacing environment values. Introduce explicit environment configuration while preserving project isolation and verifying production token checks.
2. **Product configuration is for testing.** `lib/access-plans.js` reads `LYNK_TEST_PRODUCT_UUID*`. The 90/365-day plans are priced at zero and their checkout availability is restricted to staging in `api/regional-pricing.js`. The live testing endpoint currently offers those test checkouts. Define production product UUIDs, prices, and checkout URLs before enabling paid production plans; check that international and domestic checkout products both map to the correct entitlement.
3. **Hosting needs a deliberate choice.** Vercel serves the new `api/` handlers. Current `netlify.toml` only routes buyer verification and export rendering to Netlify functions; it does not provide regional pricing, the Lynk webhook, or the new sheet-admin adapter. A production Netlify deploy needs equivalent adapters/routes; a Vercel move needs production Firebase authorized domains and hosting configuration.
4. **Migration tools and rules have different scopes.** The Apps Script Firestore admin tool is bound to staging spreadsheet IDs and the testing API URL. Existing production rules support legacy workspace recovery, while staging rules require server-managed `workspaceAccess` grants and do not include legacy reads. Prepare production import/report configuration, preserve Auth UIDs, back up access/workspace data, and verify legacy workspace recovery before switching rules. The importer only covers successful Regular transactions, not Fast Track.
5. **Lynk-to-access integration remains an end-to-end check.** The user confirmed that PayPal payment processing is handled by Lynk.id; no separate PayPal integration is required for this migration. Local mocks and public health responses do not establish service-account IAM, report synchronization, or production access activation after a successful Lynk purchase. Validate the Lynk webhook, deduplication/retry, matching verified email, renewal, and access denial after expiry/block. Keep a reconciled rollback snapshot.

## Verified

- Initial Git working tree clean; branch `development`, commit `55a3446`.
- Node 20.19.6; `npm run lint` and `npm run build` passed.
- Existing access-plan, Apps Script access/staging, Firestore access/admin, Lynk webhook, Netlify authentication, and Vercel buyer tests passed.
- Google login fixture passed active/unknown/expired/inactive/device-mismatch cases, popup cancellation, email/password preservation, unverified-email rejection, and denial during backend failure despite cached access.
- Email/device policy and desktop/mobile access renewal flow passed.
- Staging Firestore rules passed the real emulator: active access, block/expiry denial, preserved data, verified owner/email, and rejection of client-written grants/billing.
- Production rules passed their separate emulator suite, including legacy ownership reads, UID isolation, and rejection of legacy writes and client billing/grants. This validates the checked-in rules, not the currently deployed rules.
- Landing language and desktop/mobile anchor-navigation tests passed.
- Regional-pricing browser tests passed in Chrome and WebKit at 1440, 390, and 320 px: domestic/international quotes, checkout routing, unavailable checkout, detection failure/retry, and horizontal-overflow checks.
- Netlify function packaging passed.
- Public testing deployment returned HTTP 200 for the landing page, webhook health, buyer health, and regional pricing. Webhook reports `activate` / `firestore`; buyer health explicitly reports `databaseChecked: false` and is not a database/IAM check.

## Review changes and caveats

- Updated the existing regional-pricing browser test to recognize automatic English localization for international visitors and translated loading-error controls. Its missing-checkout fixture now keeps the top-level quote and monthly plan consistent, as required by the current validator. Application behavior was not changed.
- Build warns about JavaScript chunks around 1.98 MB and 2.02 MB before gzip; this is a performance follow-up, not a build failure.
- Browser tests initially needed their expected local server ports configured. No customer credentials or production sessions were used.
- Production migration readiness is conditional on resolving the configuration/import/rules items above and completing a live checkout-to-access check.
