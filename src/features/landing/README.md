# AU Toolkit landing page

Slicing for the `development` staging branch. `/` and `/landing` show this page;
`/editor` keeps the existing editor/login workflow. No backend entitlement or
staging payment configuration is modified.

Sections live in `components/`, content and demo templates in `data/`, and scoped
styles in `landing.css`. The hero demo reuses the real WhatsApp preview. Gallery
assets are rendered from the real WhatsApp, LINE and Instagram DM components.
Run `npm run build`, then `node scripts/render-landing-previews.mjs` to regenerate those PNGs.

Checkout defaults to the user's two Lynk products:

- Indonesia, Rp15.000: `https://lynk.id/sempiternal/l755mjy6y4v5/checkout`.
- International, Rp30.000: `https://lynk.id/sempiternal/6qnn7x36v3xq/checkout`.

Live automatic activation remains unverified, including the international
product UUID and PayPal checkout; do not use this page for customer sales yet.
Optional public Vite environment variables:

- `VITE_LANDING_WHATSAPP_URL`: HTTPS `wa.me` support URL override; defaults to `https://wa.me/6285179615352`.

Server-only Vercel variables for `/api/regional-pricing`:

- `LYNK_DOMESTIC_CHECKOUT_URL`: optional HTTPS Lynk checkout override; defaults
  to the TEST product above.
- `LYNK_INTERNATIONAL_CHECKOUT_URL`: optional HTTPS Lynk checkout override;
  defaults to the International product above. Invalid overrides block checkout.

No shadcn dependency is needed for these sections. Navigation, demo controls and
the native details/summary FAQ use React and the existing Lucide icon library.

The 30-day plan uses one checkout CTA with no manual region selector. The server
reads Vercel's `x-vercel-ip-country`: ID is Rp15.000, other countries Rp30.000.
Prices and links come from the server, not a client parameter. Missing or invalid
geo headers disable checkout and show retry/help rather than guessing a price.
Quotes are private and never cached across visitors. No raw IP is stored/logged,
no third-party geo service or browser location permission is used.
VPNs, geolocation mistakes, and direct access to a known cheaper Lynk product
remain limitations: IP pricing is not billing-country enforcement.
No exchange rate is implied.
The current webhook accepts only one configured TEST product UUID; activating
both real products needs backend product mapping and verified payment tests.

Local styling preview: `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174`.
Bare Vite SIMULATES country ID (not real IP detection). Set `LANDING_DEV_COUNTRY=PH`
or `MY` before starting Vite to simulate international; `XX` simulates failure.
This middleware is development-only; real geo headers are tested after Vercel deploy.
This preview does not verify Firebase staging login. Use the staging environment
and Vercel adapter described in `docs/firebase-staging.md` for authenticated tests.

With the local preview running, `node tests/landing-page.mjs` checks desktop,
tablet and mobile sizes in Chrome and WebKit. Screenshots go to `dist/landing-qa/`.
`node tests/regional-pricing.test.mjs` tests server rules and browser states with
mocked geo responses, including Philippines, Malaysia, missing links and retry.
