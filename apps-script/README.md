# AU Access deployment

Use `au-toolkit-access.gs` as the Web App backend. `Code.gs` is the legacy
single-spreadsheet implementation; do not combine the two scripts in one project.

The script can stay attached to the AU Toolkit PRO spreadsheet. It opens both
spreadsheets explicitly, so its parent spreadsheet does not determine the login
email source.

## Data ownership

- `Sheets au` / `AU Access`: Buyer Email is the login email. Account status,
  expiration and device locks are maintained here.
- `AU Toolkit PRO` / `AU Toolkit PRO`: original purchase email and transaction
  data stay unchanged. Payment status and purchase date are read by `Ref`.
- AU Access column B (`Ref`) must match the Lynk `Ref`; column K
  (`Transaction Source`) must contain the configured Lynk spreadsheet ID.
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
5. Check the health response version: `3.4-ref-linked-access`.
6. Verify the corrected Google email on the buyer's registered device.

No website rebuild is needed if the existing deployment URL stays the same.

## External import/sync

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
