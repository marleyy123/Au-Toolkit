# AU Access deployment

Use `au-toolkit-access.gs` as the Web App backend. `Code.gs` is the legacy
single-spreadsheet implementation; do not combine the two scripts in one project.

The script can stay attached to the AU Toolkit PRO spreadsheet. It opens both
spreadsheets explicitly, so its parent spreadsheet does not determine the login
email source.

## Data ownership

- `Sheets au` / `AU Access`: Buyer Email is the login email. Account status,
  expiration and device locks are maintained here.
- `AU Toolkit PRO` / `AU Toolkit PRO`, and `Fast Track` / `Fast Track`:
  original purchase email and transaction
  data stay unchanged. Payment status and purchase date are read by `Ref`.
- AU Access column B (`Ref`) must match the Lynk `Ref`; column K
  (`Transaction Source`) must contain a configured Lynk source spreadsheet ID.
  Both Reguler and Fast Track are supported. Ref is matched within its source.
- Correct email only in AU Access column A. The correction applies to the linked
  transaction, not automatically to future renewals with a new Ref.

The backend never grants access using an email similarity rule. The linked
transaction must exist and have SUCCESS status. Missing links and unsupported
transaction sources are denied. Manual Inactive/Expired status and existing
device locks are preserved.

## Apply the fix

1. Update the existing Apps Script Web App project with `au-toolkit-access.gs`.
2. Keep the existing `API_SHARED_SECRET` Script Property.
3. The execution account must already have access to read both spreadsheets and
   write the AU Access sheet.
4. Update the existing deployment to a new version, preserving its `/exec` URL.
5. Check the health response version: `3.6-append-only-buyer-sync`.
6. Verify the corrected Google email on the buyer's registered device.

No website rebuild is needed if the existing deployment URL stays the same.

## Buyer sync and backfill

Run `previewBuyerAccessSync` in the Apps Script editor to inspect the number of
missing transactions without changing cells. Then run `syncBuyerAccess` once
to backfill missing SUCCESS transactions from Reguler and Fast Track. Finally,
run `createBuyerAccessSyncTrigger` once to schedule the sync every five minutes.
Check Executions for failures and the added/alreadyPresent/skipped counts.

The sync only appends missing `Transaction Source + Ref` pairs. It never modifies
existing rows, including corrected login email, expiration, manual account status
or device locks. Subscription dates for new rows use the original purchase date
plus 30 days, not the sync date. Unpaid transactions and invalid emails/dates are
skipped. Future refunds are still checked directly against the source at login.

The owner running the trigger needs access to AU Access and both payment sources.
Triggers run the saved editor code; the Web App must separately be redeployed.

## Other importers

Any external Lynk-to-AU-Access importer must upsert by `Transaction Source + Ref`,
append new transactions, and preserve existing columns A and E:J on existing
transactions. Rebuilding AU Access from scratch or overwriting Buyer Email with
the original Lynk email will still erase a manual correction. That importer is
not present in this repository and must be checked separately. This backend
joins current rows by Ref, so reordering Lynk rows or adding another buyer does
not break a correction that remains in AU Access.

## Verification

Run `node tests/apps-script-access.test.mjs` and
`node tests/apps-script-ref-access.test.mjs` for manual status, linked email,
source refresh, payment, expiry and device lock regressions.
Run `node --import tsx tests/access-guard-status.test.mjs` to verify that an
unverified payment or device issue is not displayed as an expired subscription.
Run `node tests/apps-script-buyer-sync.test.mjs` for sync/backfill regressions.
Run `node tests/device-id-persistence.test.mjs` for persisted browser device identity.

## Device mismatch

DEVICE_MISMATCH does not mean the subscription expired. It means the current
device ID differs from the registered AU Access ID. Legacy suffixes are accepted
only for the same full hardware hash and slot. Browser IDs are now retained
across environment changes instead of recomputed on every load.

Changing browsers, clearing site storage or switching devices can still require
an administrator to verify the buyer and reset the corresponding AU Access
technical ID: column I for mobile or J for desktop. Keep the expiration/status
unchanged; the next authorized login registers the replacement device.
