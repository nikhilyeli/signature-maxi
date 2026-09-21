# HyperFrames prompt — Signature Maxi product reel

Paste everything below the line into HyperFrames. It recreates the in-app "Watch Product Tour" reel
(`src/components/signature-maxi/features/product-reel`) as a rendered video, using the Signature Maxi design system.

---

## Brief

Build a **63.5 s, 1920×1080, 30 fps** product reel for **Signature Maxi**, a digital-signature capture and tracking
app. It is a screen-recording-style tour: a dark cinema stage, a browser-window frame, and pixel-faithful replicas of
the real app UI floating on it, each scene with one headline, one or two callout pills, and small choreographed
animations. No voice-over, no music required (leave an empty audio track). The video must look like the app itself,
not a generic template — use only the tokens, type and component rules below.

## Composition rules (HyperFrames)

- One root composition, 1920×1080, 30 fps, total duration 63.5 s. **One sub-composition per scene** (11 scenes below),
  each placed on the same track back to back; crossfade 0.55 s (opacity 0→1, translateY 10px→0, scale .99→1).
- Everything is driven by a **single paused, seek-safe timeline** (GSAP). No `Date.now`, `setInterval`,
  `requestAnimationFrame` state, or CSS animations that depend on wall-clock time. Every delay below is relative to the
  scene start.
- Fonts must be embedded/loaded locally for render: **Fraunces** (500–700), **Inter** (400–700), **JetBrains Mono**
  (500–600). Icons: Material Icons (ligature font) plus one custom "stylus_note" SVG (below).
- Persistent chrome on every scene: a rounded window (radius 14px, 1px border `rgba(255,255,255,.08)`, panel `#12161f`)
  filling the frame; top bar with three 9px dots (`#2a2f3b`) and a centered mono URL `app.signaturemaxi/dashboard`
  (`app.signaturemaxi` in `#8b93a7`, `/dashboard` in `#5b6376`); a slim bottom bar with a gold progress rail
  (`#d79f28`) and one tick per scene. Scale all sizes below by **2.5×** from the 800-px-wide reference so the app UI
  reads at 1080p.

## Design system (Signature Maxi) — use these values exactly

**Stage (video chrome, always dark)**: page `#0a0d13`, panel `#12161f`, screen `#0d1119`, hairline
`rgba(255,255,255,.08)`, ink `#eef1f6`, ink-dim `#8b93a7`, ink-faint `#5b6376`, brand-bright `#f9c23c`,
brand glow `rgba(249,194,60,.28)`.

**App replicas (light theme, from `src/styles.scss`)**: bg `#f4f5f8`, surface `#ffffff`, surface-2 `#f9f9fb`,
surface-3 `#eef0f5`, border `#d0d4e8`, border-tint `rgba(69,140,215,.15)`, **brand gold `#d79f28`**, brand-dim
`rgba(215,159,40,.15)`, brand-dark `#614914`, blue `#458cd7`, success `#4caf50`, danger `#f44336`, ink `#1a1a2e`,
ink-muted `#6b7080`, ink-faint `#b0b4c0`. **Dark theme** (only used in the Light & dark scene): bg `#121212`, surface
`#1e1e1e`, surface-3 `#3a3a3a`, border `#444`, ink `#e0e0e0`, muted `#9e9e9e`, brand `#f9c23c`, brand-dim
`rgba(249,194,60,.15)`.

**Type**: display = Fraunces 600 (scene titles 1.6rem-equivalent, cover 3.2rem); UI = Inter (name 600, labels 500,
badges 700); eyebrows and IDs = JetBrains Mono, uppercase, letter-spacing .16em, colour `#f9c23c`. Signature ink =
"Segoe Script", "Brush Script MT", cursive, italic, `#111`.

**Shape**: radius 8px everywhere (cards, buttons, inputs, dialogs), 6px pills/badges, 50% avatars/dots; 1px borders
instead of shadows at rest; floating things use `0 24px 50px rgba(0,0,0,.45)`. Signature surfaces are **always pure
white**, in both themes. Mandatory signer = 3px left border `rgba(215,159,40,.5)`; signed card border
`rgba(76,175,80,.3)`.

**Motion**: ease-out, 0.15–0.25 s for hover/colour, 0.4–0.6 s for reveals, progress fill 2.6 s. Nothing bounces except the
one "Complete" pill pop (scale .5→1.08→1). No blue-purple gradients, no emoji, no decorative glows beyond the callout dot.

**Callout pill** (every scene, 1–2 per scene): dark pill `rgba(10,13,19,.92)`, 1px border `rgba(215,159,40,.45)`,
fully rounded, 7px gold dot with a 4px glow ring, ink text .7rem. Enters at scene +0.0 s (c1) / +0.35 s (c2) with a
0.5 s fade-up (translateY 8px→0).

**Brand mark**: 48×48 rounded square (rx 10) fill `#0f1220`; gold stroke path `M10 34 Q18 14 24 22 Q30 30 38 10`
(width 3.5, round caps); blue underline `#458cd7` from (10,39) to (38,39), width 2. `stylus_note` icon is the Material
"stylus note" glyph, used for the primary sign action.

## Storyboard (start–end, exact copy)

1. **Cover 0–4.5 s.** Centered. Mark draws on (stroke-dashoffset 92→0, 1.3 s, delay .15 s, ease in-out). Title
   "Signature Maxi" (Fraunces 600). Tagline: "Every signature, captured clean — draw, type, upload, or snap a photo. One
   dashboard tracks the rest."
2. **Promise 4.5–8.5 s.** Left-aligned. Italic faint line: "Chasing signatures across email threads and loose PDFs gets
   old fast." Headline: "One dashboard. **Every** signer, **every** device." (both "Every" in `#f9c23c`). Five outlined
   pills: Multi-signer · Card & list views · 3 capture modes · Light & dark · On-brand watermark (icon in gold).
3. **Dashboard 8.5–14.5 s.** Eyebrow "01 — The dashboard", title "Every signer, one screen." Replica app card
   (max 640 → 1600 px wide): header = mark, "Signature Maxi", mono chip `Q3_MSA_v2` (gold on brand-dim), pills "4 signers"
   (blue) and "2 signed" (green), icon-only Card|List toggle (Card active). 3 px progress track at 43 % gold. Three signer
   cards in a row: **Elena Cho** (signed: green check avatar, "Req'd" badge, white signature box with her name in script),
   **Marcus Webb** (M avatar, Req'd, dashed "Not signed"), **Sam Okafor** (S avatar, "Optional" grey badge).
   Callouts: "Card or List — switch any time" (top right), "Required signers get a marked border" (bottom left).
4. **List view 14.5–21.5 s.** Eyebrow "02 — List view", title "Grouped by role, at a glance." Same header with List toggle
   active and pill "1/3 signed". Rows in a 40 % / 60 % grid: role label left — **Author** with a red `*` and a `?` help icon;
   **Reviewer** with `?`. Content-sized cards, stacked vertically, same width: name (600), email (muted, smaller), and for
   signed people "✓ Has signed at *11/09/2026 10:41 am*" (green, bold italic date). Info icon at the card's left-centre;
   image icon bottom-right of a signed card. **Elena Cho** row: at +1.1 s the pencil / eye / bin actions fade in beside the
   card; at +1.6 s a rich tooltip fades up under the image icon showing the signature on white plus "Signed 11/09/2026 10:41
   am". Marcus Webb, Sam Okafor unsigned (two lines only). Callouts: "Hover the image icon: signature + sign time";
   "Red * marks a mandatory role".
5. **Card actions 21.5–29 s.** Eyebrow "03 — Card actions", title "The same three moves, in either view." Two light panels
   side by side, tagged "CARD VIEW" and "LIST VIEW" (mono, muted). Card view: Elena Cho signed card with three chips
   under the signature that fade in one by one — **Edit** (gold outline, +0.9 s), **View** (+1.5 s), **Delete** (+2.1 s).
   List view: Elena's row with pencil/eye/bin (+1.1 s) and Marcus's row with the gold stylus "add signature" icon (+1.9 s)
   — add and edit use **different icons**. At +3.6 s a small confirm dialog rises in the centre over a 55 % dark scrim:
   title "Delete signature?", body "Elena Cho's signature will be removed and they will need to sign again.", buttons
   Cancel (outlined) and **Delete** (red `#f44336`, white text). Callout: "Add or edit, view, delete — on every card and
   row".
6. **Manage signers 29–36 s.** Eyebrow "04 — Manage signers", title "Your whole team, set up in one table." White table
   (radius 8, 1px border): header row on surface-3 — "NAME * / EMAIL", "ROLE", "REQ.", "ED.", "DEL." (uppercase, muted,
   .04em). Each row: name over a hairline, email below it (smaller, muted), role as a select pill with a chevron, three 12 px
   gold checkboxes, a bin icon. Rows: Harry Potter / harry.potter@example.com / Owner (all checked); Micheal Jackson /
   micheal.jackson@example.com / Author (all checked); Chloe Brooks / chloe.brooks@example.com / Observer (Req. **unchecked**,
   Ed. and Del. checked). At +1.6 s a fourth row fades up: placeholders "Full name" / "Email (optional)", role Reviewer, its
   name underline turns gold. Footer on surface-3: outlined "Add Signer" left; "Default List", "Revert" and gold **Apply**
   right — Apply pulses twice from +3.4 s (gold glow ring, 1.2 s each). Callouts: "Name, email and role for every signer"
   (top right), "Req. · Ed. · Del. = permissions" (left of the table).
7. **Sign All dialog 36–43.5 s.** Eyebrow "05 — Sign All", title "One panel for the whole signing round." Dialog (radius 8,
   `#f9f9fb`): gold header bar `#d79f28` with dark navy `#1a1a2e` text/icons — stylus icon, "Signatures Panel", reset and
   close icons. Body split 34 % / 66 %: left "USERS" list (Harry Potter — Owner · Required, selected on brand-dim;
   Micheal Jackson — Author · Required; Chloe Brooks — Observer). Right: "Signing as **Harry Potter** · Owner", tabs **Sign**
   (active, gold underline) / Write / Capture, a white pad with a dashed gold baseline, and Clear / gold **Confirm**
   buttons. Footer on surface-3: Cancel (outlined) and Complete (grey, disabled). Choreography: at +1.1 s "Harry Potter"
   is written into the pad by a left-to-right reveal (1.4 s); Confirm pulses at +2.7 s; at +3.6 s a green check appears on
   Harry's row and Complete turns gold with dark text. Callouts: "Sign, Write or Capture / Upload"; "Complete unlocks when
   done".
8. **Built to finish 43.5–49 s.** Eyebrow "06 — Built to finish", title "Nothing ships until it's really done." Card with pill
   "4 signers" and a "✓ Complete" pill (gold on brand-dim) that pops in at +2.5 s. Progress track: fill holds at 38 % gold
   until +1.65 s then grows to 100 % **and turns green** by +2.9 s. At +2.9 s a green-tinted banner rises: "All required
   signatures complete — ready to submit." with a green **Submit** button. Callout: "The bar turns green the moment it's done".
9. **Light & dark 49–54.5 s.** Eyebrow "07 — Light & dark", title "The same card, either theme." One signer card (Priya Nair,
   Req'd, dashed "Not signed") over a Light | Dark toggle. Every 2.2 s the card and toggle cross-fade (0.6 s) between light
   and dark tokens; the toggle knob slides and its track turns `#f9c23c` in dark.
10. **Your mark 54.5–59.5 s.** Eyebrow "08 — Your mark", title "Stamp it, before it ships." Left: control card — label
    "WATERMARK TEXT" value CONFIDENTIAL, "COLOR" gold swatch + mono `#D79F28`, "OPACITY" slider at 28 %. Right: white
    document silhouette (four grey lines); at +1.1 s a diagonal "CONFIDENTIAL" stamp (Inter 700, tracking .06em, `#1a1a2e`)
    fades in to 16 % opacity, rotated −20°, scale .85→1 over 1 s.
11. **Close 59.5–63.5 s.** Centered mark, "Signature Maxi", and "Draw it, type it, upload it — signed either way."

## Layout guardrails

Replica cards are centred and never exceed ~1600 px; keep ≥ 40 px from window edges; kicker (eyebrow + title) top-left at
x ≈ 140 px; callouts never cover the element they describe; the tooltip/confirm layers sit above callouts. Text stays
≥ 4.5:1 against its ground (white-on-gold is only used for Apply/Confirm/Sign All exactly as in the app; new gold fills use
`#1a1a2e` text).

## Do not

Do not invent features, colours, fonts or copy beyond this brief. No stock footage, no emoji, no gradients other than the
avatar 135° gold→`#614914` (signed: `#4caf50`→`#2e7d32`), no camera moves, no bouncing easing, no on-screen text smaller than
the equivalent of 11 px at 1080p.

## Deliverable

`signature-maxi-product-reel.mp4` (H.264, 1920×1080, 30 fps, ~63.5 s, no audio needed), plus the project folder so
scenes can be re-rendered individually.
