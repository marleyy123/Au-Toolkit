# Editor UX Audit

Date: 2026-10-14

## Scope And Limits

Primary audience: first-time users. Three users reportedly complained about
the WhatsApp form; their exact tasks, devices, and complaint details are unknown.
These findings are usability hypotheses supported by inspection, not a claim
that all three users encountered the same problem.

Inspected actual header, form, and preview/export components with isolated dummy
data at 1366 x 768 and 390 x 844. Covered WhatsApp Chat initial state, adding the
first outgoing message, mobile preview switching, and shared problems in
Instagram Feed/DM. Authentication, cloud saves, actual downloads, destructive
actions, and floating-preview behavior were not exercised in the fixture.
No application UI was changed. This is not a full accessibility audit or a
moderated user test.

## Findings

### High: Primary Content Action Is Below Secondary Settings

In the initial WhatsApp fixture, the outgoing-message action was approximately
1482 px from the top at desktop size and 1993 px on mobile. Users encounter the
global font manager, folders, contact settings, aspect ratio, theme, wallpaper,
input-bar settings, spacing sliders, and custom-theme controls before adding
the content they came to create. Instagram DM exhibited the same pattern.

Move contact essentials and message creation above optional appearance controls.
Default font, spacing, and theme choices should work without user intervention.

Source: `src/features/editor/components/form/EditorFormPanel.tsx:66` and
`src/features/whatsapp/components/whatsappChat/whatsappChatForm/WhatsAppChatForm.tsx`.

### High: Mobile Preview Is Below Its Own Controls

The mobile header was approximately 277 px tall, about 33% of an 844 px viewport.
In the preview view, export settings, zoom controls, and corner-radius controls
then consume most of the remaining first viewport; only the top of the actual
chat is visible. Desktop uses independent scroll panels with hidden scrollbars,
reducing the visible indication that more content exists.

Make the actual preview the primary surface. Keep export reachable without
placing every advanced option above it. Consolidate account controls in a menu
and make panel scrolling discoverable.

Sources: `src/features/workspace/components/header/AppHeader.tsx`,
`src/features/workspace/components/navigation/MobileViewSwitcher.tsx`,
`src/features/workspace/components/preview/PreviewExportPanel.tsx:107`,
`src/features/editor/components/form/EditorFormPanel.tsx:48`.

### Medium: Mixed Language And Technical Labels

Indonesian mode still shows labels including Global Typography Manager,
Contact Info & Chat Header, Container Aspect Ratio, Same Sender Gap,
Bubble Roundness, Reply Quote Box, and Add Folder. The top theme button and
chat theme controls both expose Light/Dark, with their distinct scopes mainly
explained by tooltips. Touch users cannot rely on hover tooltips.

Use consistent localized labels, such as Font, Nama Kontak, Ukuran Gambar,
Jarak Pesan, Sudut Balon, Balas Pesan, Tema Editor, and Tema Chat. Do not add
lengthy explanatory copy as a substitute for a clear hierarchy.

### Medium: Too Many Equal-Weight Message And Preview Actions

WhatsApp exposes 14 add-block choices at once, with separate left/right actions
for several types. After adding a message, another sender selector, type
selector, and message-action toolbar appear. Preview zoom is available as
presets, slider, buttons, and a second on-canvas toolbar.

Keep text-message creation prominent; group media and special blocks in an
add menu. Preserve efficient workflows for experienced users without presenting
all options as equally necessary to beginners. Consolidate zoom controls.

Source: `src/features/whatsapp/components/whatsappChat/whatsappChatForm/WhatsAppChatMessagesEditor.tsx`.

### Medium: Reset Scope And Save Feedback Need Clearer Placement

Reset Total is a prominent header command although it clears forms/folders
across modules. A confirmation dialog exists; this is not a one-click deletion
bug. Its prominence can nevertheless suggest a routine current-form action.
Folder-save buttons are intentionally hidden, but the persistent cloud status
component is not mounted in the inspected application header.

Move the global reset into account/settings, distinguish it from resetting the
current form, and expose a compact truthful save/sync status. Keep the existing
confirmation and do not claim cloud sync for locally stored images.

Sources: `src/features/workspace/components/header/AppHeader.tsx:95`,
`src/features/workspace/components/feedback/WorkspaceFeedback.tsx`,
`src/components/FormControls.tsx:932`.

### Medium: Export Label 4K Is Misleading

The 3x setting is labelled 4K even though a 380 px wide DM canvas produces a
1140 px wide export at 3x. Scaling is not equivalent to a fixed 4K resolution.
Use 1x/2x/3x with actual output dimensions rather than a misleading quality name.

Source: `src/features/workspace/components/preview/PreviewExportPanel.tsx:146`.

## Recommended First Iteration

1. Reorder the WhatsApp form: contact essentials, messages, optional appearance.
2. Collapse advanced font, wallpaper, spacing, and custom-color settings.
3. Simplify message creation while preserving every existing message type.
4. Prioritize mobile preview and a compact export action.
5. Normalize Indonesian labels, reset placement, and save feedback.

Do not start with a tutorial overlay or a second separate beginner-mode engine.
Improve the default workflow first. Test keyboard access, collapsed sections,
state persistence, mobile switching, and export after implementation.

## Validation With Users

Ask each complainant to create a two-message WhatsApp chat, change contact
name/avatar, add one photo or reply, and export it. Observe completion without
coaching, wrong clicks, hesitation, scrolling, and requests for help. Repeat
with the revised UI. These observations are needed to confirm the actual
complaint and to judge whether the redesign helped.

## Evidence

- [Desktop initial state](D:/Premiere_Temporary_Edit/WindowsTemp/au-editor-ux-desktop.png)
- [Desktop first message](D:/Premiere_Temporary_Edit/WindowsTemp/au-editor-ux-message.png)
- [Mobile initial state](D:/Premiere_Temporary_Edit/WindowsTemp/au-editor-ux-mobile.png)
- [Mobile preview](D:/Premiere_Temporary_Edit/WindowsTemp/au-editor-ux-mobile-preview.png)
- [Instagram DM comparison](D:/Premiere_Temporary_Edit/WindowsTemp/au-editor-ux-instagram-dm.png)
