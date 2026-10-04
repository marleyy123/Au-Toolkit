# Firebase Staging

Project: `au-toolkit-staging-20261005` (AU Toolkit Staging).
Production remains `gen-lang-client-0839250297`.

## Provisioned

- Firebase Web App: `AU Toolkit Staging Web`.
- Firestore: Standard edition, `(default)` database, `asia-southeast2` (Jakarta).
- Separate security rules in `firestore.staging.rules`.
- Firebase Authentication activated; Email/Password and Google sign-in enabled.
- No customer data or accounts copied, and no billing account attached by this setup.

Deploy ONLY the staging rules with an explicit project and config:

```powershell
firebase deploy --only firestore:rules --project au-toolkit-staging-20261005 --config firebase.staging.json
```

Do not run a plain `firebase deploy`: the default alias still points to production.

## Remaining Authentication Setup

Firebase Authentication has been activated, Email/Password requires passwords,
and Google sign-in has an OAuth client configured. Do not upgrade to
Identity Platform or attach billing just to enable ordinary Firebase Auth.

Add the actual Vercel testing hostname under Authentication > Settings >
Authorized domains when the deployment is available. The current authorized
domains are `localhost`, `au-toolkit-staging-20261005.firebaseapp.com`, and
`au-toolkit-staging-20261005.web.app`. Create fresh test users; production users
are separate.

## Vercel Testing

Branch `development` contains the staging setup; `main` remains production.
Create a separate Vercel project from the AU Toolkit repository, and set its
Production Branch to `development`. Use the Vite framework preset and `dist`
as the output directory. Use `npx vite build` for the frontend build so the
standalone Express server bundle is not included as a public static asset.

This is not yet a complete Vercel backend: `/api/verify-buyer` and
`/api/export-render` currently use Netlify Functions. Add Vercel-compatible
handlers before treating the staging deployment as ready for end-to-end tests.
Do not redirect these calls to production as a workaround.

The local, git-ignored `.env.staging.vercel` contains the staging Firebase values.
Import those into the separate Vercel testing project's Production, Preview,
and Development environments. Its Production Branch should be `development`.
The filename is not automatically loaded by Vite and the production `.env`
has not been changed.

Spreadsheet URL, shared secrets, allowed origins, and app URL remain unset until
separate testing integrations are available. Buyer verification requires that
testing backend as well as Firebase; creating Firebase alone does not bypass it.
Never point testing at the production buyer spreadsheet or payment callbacks.

Cloud Storage has not been provisioned because it requires Blaze billing.
The bucket name in the ENV is a configuration placeholder, not a working bucket.
Images may use the existing local-media fallback until Storage is configured.
