# Separate AU access storage

This is a local Apps Script change, not a production deployment. No webhook,
Firestore migration, frontend change, or automatic renewal is included.

## Connections

- Lynk source: `1nNzq6PVrbJQmLbcDMTTgXChaZO44tVjafSWDYwbTc88`, tab `AU Toolkit PRO`.
- Fast Track source: `1OinUvkN6ih9vKoues14q3Akt1Gdqnc45J_-cPXn2DEQ`, tab `Fast Track`.
- Fast Track tab identity: gid `437086551`. Version 3.5.2 resolves this stable
  identity first, then exact/trimmed case-insensitive name if the tab was recreated.
  Required Lynk headers O/P/Q/Z are verified before using the selected tab. A
  missing tab/schema still fails closed, with an explicit diagnostic rather than
  silently reading another sheet. Granting access does not bypass source failures.
- AU storage: `1B0lN8Cfn7-Tev81vSRsGS7OWeAtaWpoGrcmG7A6-FoQ`, tab `AU Access`.
- The executing Apps Script account needs read access to BOTH Lynk sources and Editor access
  to AU storage. Neither spreadsheet needs public sharing.
- Lynk is read-only in this script, including setup, refresh, and daily triggers.

## AU Access columns

| Column | Header | Purpose |
| --- | --- | --- |
| A | Buyer Email | Normalized account email |
| B | Ref | Stable transaction reference from Lynk Z |
| C | Buyer Name | Buyer name |
| D | Purchase Date | Original purchase timestamp |
| E | AU Expiration Date | Editable expiry |
| F | AU Status Account | Active, Inactive, or Expired |
| G | AU Device Handphone | Phone display label |
| H | AU Device Laptop | Computer display label |
| I | Mobile Device ID | Phone identifier |
| J | Laptop Device ID | Computer identifier |
| K | Transaction Source | Source spreadsheet ID; part of the transaction key |
| L | Jalur Pembelian | Display label: Reguler or Fast Track |

Do not rename headers or change email/Ref identity after import. Sort the entire
table, never individual columns. The script looks up source + Ref and checks email instead
of using Lynk row numbers. Missing, conflicting, or duplicate references fail
closed. Existing AU access rows are never overwritten by legacy blanks.

## Existing purchase semantics

Only SUCCESS transactions are eligible. Login still selects the latest successful
purchase by date across both sources. Regular wins exact timestamp ties. Each
source + Ref has a separate access row; a genuinely
new purchase is a separate entitlement, not a duplicate login. This is not an
account-level renewal ledger: it does not stack unused time, support different
package durations. Both products use the existing 30-calendar-day initialization;
Fast Track changes the purchasing route, not duration or device limits.

Version 3.5 prevents an Inactive account from bypassing its block with another
purchase/source. To reactivate an account, admins must review and clear all its
Inactive entries. Expired is purchase-specific so a new paid purchase can work.
On first importing a new transaction, existing saved device slots are carried
forward (most recent saved purchase with an ID per slot), rather than reset.
This does not rewrite existing registered devices. Admins must reset the device
slot on the currently selected purchase, not an unrelated older row.

Existing A:J rows remain valid: missing K means regular source. Setup adds only
the K header, and migration/login backfills the source on matched regular rows.
Neither source receives any writes. Access-sheet duplicate checks and the date
repair use source + Ref so identical references in different sources are safe.

Version 3.5.1 adds display-only L without replacing technical K. Existing A:K
schemas remain compatible. Run `updateTransactionSourceLabels` in the Apps Script
editor to label existing rows; it touches only L data and missing K/L headers,
never expiry/status/device fields or transaction IDs. Unknown source IDs are
skipped and reported instead of mislabelled. Re-running it is idempotent.
New purchases and runtime refreshes maintain L automatically. K may be hidden
in Google Sheets, but must not be deleted or replaced with the display label.

For the same Ref, manual expiry, Inactive/Expired status, and devices remain
authoritative across logins and Lynk rewrites. A blank expiry initializes to the
purchase date plus 30 calendar days. Invalid nonempty dates deny access. Expiry
at or before today's date denies access, preserving the previous behavior.

## Safe migration and rollout

1. Back up the current Lynk spreadsheet, any surviving AA:AF, and the deployed
   Apps Script source/version. Keep older exports for reconciliation.
2. Test in a separate Apps Script project with copies of ALL THREE spreadsheets.
   Set all three IDs in that project's CONFIG to the staging copies. The older
   `testing/au-toolkit-access-testing.gs` is the v3.4.1 single-source test snapshot,
   not a Fast Track test script. For v3.5, use the current main source with three
   staging IDs instead. Keep the shared
   secret server-side and configure the staging server to call only that project.
   Copy only `au-toolkit-access.gs`; do not combine it with another `Code.gs`
   that defines the same entry points or CONFIG.
3. In staging, run `testSpreadsheetConnection`, then `setupTechnicalHeaders`.
   Setup initializes an empty AU Access tab or adds a missing K header; incompatible headers cause
   an error instead of overwriting existing data.
4. Run `migrateLegacyAccessData`. It reads SUCCESS transactions and imports
   surviving legacy AA:AF only for missing access records. It never registers
   devices. Re-running it does not duplicate records or overwrite manual state.
   Review its processed/invalid/failed summary (now includes both sources); fix failures before deploying.
5. Reconcile missing legacy state from backups by email AND Ref, never row number.
   AA -> E, AB -> F, AC -> G, AD -> H, AE -> I, AF -> J.
   Blank legacy cells do not prove an intentional admin reset. Migration cannot
   recover deleted manual extensions, blocks, or device IDs. Review historical
   values against newer admin changes before restoring anything. Do not restore
   the entire old Lynk sheet over new purchases.
6. Verify new/existing buyers, pending orders, unknown emails, Inactive, Expired,
   changed devices, repeated login, duplicate email purchases, and manual expiry.
   Erase staging Lynk AA:AF and reorder whole source rows; AU state must survive.
   Test actual Google Sheets/API behavior and concurrent logins as well; local
   mocks are not a live permission, quota, or load test.
7. After acceptance, copy the tested script with production IDs to the existing
   Apps Script project. Preserve API_SHARED_SECRET. Pause the old daily trigger
   during migration: editor code changes affect triggers before web deployment.
   Run connection/setup/migration, reconcile state, then update the existing web
   deployment to a new version to preserve its URL. Coordinate the cutover so
   old web requests do not register devices in Lynk while migration runs.
8. Check the deployed health response: version `3.5.2-stable-fast-track-tab`,
   selectedSheetName `AU Toolkit PRO`, fastTrackSheetName `Fast Track`,
   accessSheetName `AU Access`. Re-enable
   the daily trigger and perform live smoke tests. No Netlify redeploy is needed
   if the Apps Script deployment URL and response contract stay the same.

## Admin actions after cutover

### Calendar dates and the 3.4 migration

The date displayed in the old Lynk spreadsheet is authoritative, even when that
spreadsheet uses Pacific time and AU Access uses Bangkok/Jakarta time. Version
3.4.1 imports purchase wall-clock time and expiry calendar dates as text using
the source spreadsheet's timezone. New calculated expiry dates are text too,
so formatting them in another spreadsheet timezone cannot shift their day.
Do not change the Lynk spreadsheet timezone to repair an earlier migration.

For rows already imported by version 3.4:

1. Back up AU Access before correction.
2. Update the editor source and run `previewLegacyDateAlignment`. This is
   read-only. Review the logged source/access timezones, changes, and skipped
   entries by Ref. Do not treat a missing legacy expiry as recoverable data.
3. Only after approving the preview, run `alignLegacyDatesToSource`. It rebuilds
   the plan under the script lock and converts only unchanged copied Date values
   to the old sheet's calendar representation. It preserves status/device fields.
   Changed values are skipped for manual reconciliation. Do not edit either
   spreadsheet during the short correction operation.
4. Re-run the preview to confirm repaired rows no longer appear. Inspect the
   sheet and test the dates returned by access validation. Update the existing
   web deployment to the current version after acceptance; don't create another URL.

This repair is editor-only, not a new public API action, and cannot reconstruct
dates that Lynk already deleted. It does not globally subtract one day.

### Account edits

- Adjust E and F in AU Access, not AA/AB in Lynk.
- Renew manually by setting E to the agreed future date and F to Active on the
  currently selected Ref; automated purchased renewals are not implemented here.
- Reset a phone by clearing I; reset a computer by clearing J.
- Do not delete an access row to block someone: set F to Inactive instead.
- Protect identity/header columns and restrict spreadsheet editing to admins.

## Rollback

Keep a backup of AU Access before rollback. Reverting to version 3.3 alone does
not restore access state to Lynk: it would resume the old reset-prone storage.
Reconcile the latest AU state back to legacy AA:AF by Ref/email before switching
the old deployment and trigger back, without overwriting raw transaction columns.
Prefer pausing cutover and repairing configuration errors over blind rollback.

## Local verification

Run `node tests/apps-script-access.test.mjs`. The mock Lynk sheet rejects every
write and tests enforce locking for all AU writes, idempotent migration, state
preservation, schema/permission failures, and existing purchase behavior.
