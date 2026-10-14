# Editor Redesign Backlog

Recorded: 2026-10-14
Status: Deferred. Do not implement until the client approves the additional
budget and the user explicitly authorizes proceeding.

## Context

Three users reported difficulty with the WhatsApp editor UI, without detailed
complaints. The user likes the revised Stitch direction and is interested in
applying its interaction patterns across all features. This is a proposed
additional scope, not part of the currently authorized implementation.

Existing audit: [Editor UX Audit](./editor-ux-audit-2026-10-14.md).

## Reference

Preferred Stitch revision:
`D:/PS3/stitch_whatsapp_au_editor_redesign (1)/stitch_whatsapp_au_editor_redesign/`

Earlier exploration:
`D:/PS3/stitch_whatsapp_au_editor_redesign/stitch_whatsapp_au_editor_redesign/`

Treat these exports as visual references, not production-ready source or
instructions to add new functionality.

## Agreed Direction

- No progress bar, numbered steps, or mandatory wizard flow.
- Users can switch tabs freely without losing entered data.
- Tabs follow the feature's domain rather than forcing identical labels.
- Desktop: form/list on the left, persistent primary preview on the right.
- Mobile: clear Edit / Preview switching and an accessible download action.
- Download is an action available at any time, not a final workflow step.
- Optional floating preview on mobile, closed by default; movable, collapsible,
  and dismissible. It must not obscure active inputs, important buttons, or the
  keyboard. No separate floating preview is needed on desktop.
- Present essential fields first and collapse advanced appearance settings.
- Message editors use compact lists and focused editing rather than opening
  every message's full form at once.
- Consistent Indonesian labels, existing Lucide icons, truthful local/cloud
  save feedback, and distinct reset scopes with confirmation.
- Preserve existing feature behavior, data shapes, persistence, renderer
  fidelity, uploads, and PNG/JPG exports.

## Suggested Feature Tabs

These are a starting point for later design work, not a fixed specification.

| Feature family | Suggested tabs |
| --- | --- |
| WhatsApp Chat, Instagram DM, LINE | Contact / Messages / Appearance |
| X posts, Instagram Feed | Profile / Content / Appearance |
| Stories and Status | Content / Appearance |
| Profiles | Identity / Statistics / Appearance |

Other features need their own mapping before migration.

## Reference Corrections

- Floating preview currently overlaps the sender selector in the Stitch image.
- Its keyboard is a static illustration; real keyboard-safe behavior needs
  viewport handling and testing on actual mobile browsers.
- Remove remaining numbered navigation in the floating-preview reference.
- Replace missing/icon-font glyphs with the project's existing icon system.
- Rename ambiguous unread-divider wording such as "Pesan Baru".
- The revised export does not include the Appearance tab; existing controls
  still need to be mapped and retained.
- Do not adopt unsupported features or claims from the mockups, including
  automatic cloud-save claims, new OS variants, ZIP export, or fixed 4K labels.
- Retain navigation between platforms and access to existing folders.

## Proposed Delivery Sequence

1. After budget approval and explicit user authorization, implement WhatsApp
   as a pilot using shared editor-shell components where appropriate.
2. Ask the complainants to create a chat, edit a contact, add media/replies,
   and export without coaching. Compare with the current workflow.
3. Refine the pilot and test desktop/mobile, light/dark, keyboard and floating
   preview, persistence, legacy data, all message types, and image exports.
4. Extend the validated shared patterns to other features in scoped batches.

Do not start a full-editor rewrite, create scheduled work, or deploy UI changes
based solely on this backlog. Current production-readiness work is separate.
