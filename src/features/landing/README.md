# AU Toolkit landing page

Slicing for the `development` staging branch. `/` and `/landing` show this page;
`/editor` keeps the existing editor/login workflow. No backend entitlement or
staging payment configuration is modified.

Sections live in `components/`, content and demo templates in `data/`, and scoped
styles in `landing.css`. The hero demo reuses the real WhatsApp preview. Gallery
assets are rendered from the real WhatsApp, LINE and Instagram DM components.
Run `npm run build`, then `node scripts/render-landing-previews.mjs` to regenerate those PNGs.

Checkout links to the user's Lynk TEST product at
`https://lynk.id/sempiternal/l755mjy6y4v5/checkout`. Automatic payment activation
is not implemented; do not use this page for customer sales yet.
Optional public Vite environment variables:

- `VITE_LANDING_LYNK_URL`: HTTPS `lynk.id` checkout URL override.
- `VITE_LANDING_WHATSAPP_URL`: HTTPS `wa.me` support URL override; defaults to `https://wa.me/6285179615352`.
- `VITE_LANDING_MONTHLY_PRICE`: price label, defaults to `Rp15.000`.

No shadcn dependency is needed for these sections. Navigation, demo controls and
the native details/summary FAQ use React and the existing Lucide icon library.

Local styling preview: `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174`.
This preview does not verify Firebase staging login. Use the staging environment
and Vercel adapter described in `docs/firebase-staging.md` for authenticated tests.

With the local preview running, `node tests/landing-page.mjs` checks desktop,
tablet and mobile sizes in Chrome and WebKit. Screenshots go to `dist/landing-qa/`.
