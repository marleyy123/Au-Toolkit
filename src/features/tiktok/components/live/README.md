# TikTok LIVE

The `tiktok-live` tab is separate from the existing `tiktok-feed-live` (FYP Live)
format. Its form and preview adapt the supplied `FormLiveTiktok.txt` and
`PreviewLiveTiktok.txt` references to the shared registries and workspace hooks.

Supported controls include host profile, top viewers, ranking badges,
comments/join/like activity, reaction hearts, bottom bar buttons, multiple
products, a selected product card, and the voucher preview. Voucher interactions
only change the mockup state; they do not make a purchase or claim a real coupon.

Images use the existing crop/upload controls. MP4/WebM uploads up to 15 MB are
stored per account in the browser's existing IndexedDB media store. Uploaded
media is local to that browser and does not sync across devices. A video is
exported as an image of the frame currently visible in the editor; the native
export payload freezes that frame before rebuilding the preview.

The new state participates in folder switching, account-scoped local storage,
cloud workspace payloads, hydration and reset. Existing FYP Live data is retained.

Validation: `node tests/tiktok-live.mjs`, `npm run lint`, and `npm run build`.
Browser tests mock authentication/cloud calls; they do not verify a deployed
account or a live remote export service.
