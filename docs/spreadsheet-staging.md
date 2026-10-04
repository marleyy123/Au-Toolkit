# Spreadsheet Staging Setup

Use a NEW Apps Script project bound to AU Access Test. Never paste the staging
script into the production Apps Script project or update the production web app.

## Files and Schema

The complete script is `apps-script/au-toolkit-access-staging.gs`, based on the
production attachment version 3.5.2. The existing production script in the repo
is not changed. All spreadsheet operations reject IDs outside the three test
spreadsheets.

| Role | Spreadsheet ID | Required tab |
| --- | --- | --- |
| Regular | `16NKN_XpFDeSR396xMHMC77rLlWZ7ZJ1SfPzp5TncK6k` | `AU Toolkit PRO` |
| Fast Track | `1pnOVwfeAnuOJzcByPR18tlTaJdL4xgVmFjXyuy6gE6A` | `Fast Track` |
| Access | `1ez3-ilO4rAXXWaXRBn2Dsl6IN6zXW5wb8JACIQbByTs` | `AU Access` |

Transaction sheets have 26 columns. O = Tanggal, P = Status, Q = Buyer Email,
R = Buyer Name, Z = Ref. Other columns are explicitly reserved placeholders,
not a claim about the full Lynk export format. Preserve column positions.

Access A:L: Buyer Email, Ref, Buyer Name, Purchase Date, AU Expiration Date,
AU Status Account, AU Device Handphone, AU Device Laptop, Mobile Device ID,
Laptop Device ID, Transaction Source, Jalur Pembelian.

The access sheet is NOT an IMPORTRANGE union. The script reads transactions
from both sources, then stores subscription/device records in AU Access.
Normal API validation does not write back to transaction sheets.

## Setup

1. Open AU Access Test, then Extensions > Apps Script. Use the account with
   edit access to all three testing spreadsheets.
2. Replace the new project's starter code with the complete staging script.
   Name the project `AU Toolkit Access STAGING` and save it.
3. Run `setupStagingSpreadsheets` from the function dropdown and complete
   Google's authorization flow yourself. It creates/renames empty tabs,
   installs exact headers and date formats, and sets Asia/Jakarta timezone.
   Existing mismatched headers cause an error instead of overwriting data.
4. Optionally run `seedStagingTestBuyers`. It adds four dummy transactions and
   refreshes AU Access. Re-running skips existing refs. Successful Regular and
   Fast Track orders are active; an old successful order is expired; a pending
   order is not imported. Manual Inactive in access column F must stay denied.
5. Run `testSpreadsheetConnection` and `doGet` to check configuration.

`setupStagingSpreadsheets` generates a new 64-character `API_SHARED_SECRET`
in Project Settings > Script Properties if none exists. It does not print the
secret and never reuses production secrets. Keep it out of chat and Git.

Dummy example.com addresses are for backend tests only, not actual login.
For an end-to-end login, add a SUCCESS transaction with your real tester email,
a current date in O and a unique STAGING ref in Z, then run
`updateAllSubscriptions`. Use that same email for Firebase staging sign-in.

## Web App and Vercel

After setup, deploy this NEW script project as a Web app: execute as the owner.
The backend requires unauthenticated server access to the endpoint; the POST
handler enforces the script secret. The GET endpoint exposes only health data.
Select the web app access setting allowing that server access, if your Google
account permits it. Do not disable the POST secret check.

Send only the NEW web app `/exec` URL, not its secret, to continue backend setup.
In the separate Vercel testing project, set:

- `GOOGLE_SHEETS_SCRIPT_URL`: staging web app `/exec` URL.
- `APPS_SCRIPT_SHARED_SECRET`: staging Script Property `API_SHARED_SECRET`.
- `APP_URL` and `ALLOWED_ORIGINS`: `https://au-toolkit-testing.vercel.app`.

The Vercel `/api/verify-buyer` adapter now supports buyer prechecks, health checks
and authenticated device validation. It verifies signed Firebase staging tokens
and rejects production Firebase configuration or a different Apps Script URL.
Set these variables in Vercel Production (the testing project's development
branch) and Preview, then redeploy. `API_SHARED_SECRET` is the Apps Script
property name; the backend ENV name must be `APPS_SCRIPT_SHARED_SECRET`.
No full login has been verified on the deployed Vercel API yet. The export-render
endpoint is not ported to Vercel by this change. No real Lynk webhook, customer records, scheduled
trigger, production spreadsheet, or production deployment is configured here.
Daily subscription triggers are optional and should be added only later.

## Verification Status

The local staging regression suite tests the actual script with mocked Apps
Script spreadsheet services: headers, repeated setup/seeding, active/expired/
pending/inactive cases, device slots, source immutability during validation,
unauthorized requests, and rejection of production IDs.

The user ran setup and seed successfully: three tabs with 26/26/12 columns,
four test transactions and three processed subscriptions, with zero failures.
The staging web app GET health endpoint returned version `3.5.2-staging` and
the expected tab names. Secret-authenticated live POST and end-to-end login
remain unverified until the Vercel adapter is deployed with the staging ENV.
