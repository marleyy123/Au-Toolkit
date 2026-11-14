# Netlify Production Security

These changes prepare the existing Netlify/Sheets backend. They do not promote
the staging Firestore billing backend or deploy anything to Firebase.

## Authentication

- `validateAccess` and `registerDevice` require a signed Firebase ID token.
- Signature, issuer, audience, expiration, issue time, subject, email, and
  verified-email status are checked before forwarding to Apps Script.
- Email aliases supplied by the browser must match the verified token email.
- `checkBuyerEmail` remains a read-only signup precheck. It is not proof of
  authentication and must not create device registrations or workspace grants.
- Client entitlement cache cannot authorize access when the backend fails.
- Unverified email/password accounts receive a verification email and are
  signed out. They must follow that link before signing in again. Existing
  verified accounts and Google accounts retain their UIDs and data paths.

Set Netlify's server `FIREBASE_PROJECT_ID` and build
`VITE_FIREBASE_PROJECT_ID` to the same production project:
`gen-lang-client-0839250297`. Keep the existing production Apps Script URL,
shared secret, allowed origins, and auth domain; do not copy staging values.
Do not put server secrets in `VITE_` variables.

## Firestore Rules

`firestore.rules` restricts current workspace writes to the verified UID owner.
Legacy documents can be read by the verified UID owner or by the verified email
matching the legacy root's `userEmail`. Legacy workspaces remain read-only.
Other accounts cannot read or list these documents/subcollections.

Legacy documents without a reliable ownership field and without a UID document
ID need a server-side migration. Do not reopen cross-account reads to recover
them. Check representative old accounts before deployment.

These production rules enforce ownership and verified email, not subscription
expiry. Server validation still checks the Sheets subscription. Direct database
subscription enforcement requires server-managed workspace access grants, as
implemented by the separate staging Firestore billing backend; that migration
is not part of this change.

After backup and old-account verification, deploy rules explicitly:

```powershell
firebase deploy --only firestore:rules --project gen-lang-client-0839250297 --config firebase.production.json
```

This does not deploy Storage rules or hosting. Keep a copy of the currently
deployed production rules and the previous Netlify deploy for rollback.

## Verification

```powershell
node tests/netlify-buyer-auth.test.mjs
firebase emulators:exec --only firestore --project demo-au-production-review --config firebase.production-review.json "node tests/production-workspace-rules.mjs"
node tests/google-login-flow.mjs
npm run lint
node scripts/build-netlify-functions.mjs
```

Before switching live, test a verified Google account, verified email/password
account, unverified existing account, legacy workspace, wrong email, expired
buyer, inactive buyer, and unavailable Sheets backend. Emulator and mock tests
do not establish deployed IAM permissions, mail delivery, or live rules.
