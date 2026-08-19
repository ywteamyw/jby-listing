# Jeff Brown Yachts — Vessel Listing Page

Static, self-contained listing (yacht detail) page for **2023 Riva 110' "Dolcevita"**.
Built from Figma file `MN091X2k7mLZfincVKVdjR`, frame `61526:14975` ("Listing Page", 1440 × 7547).

Live reference build: https://ywteamyw.github.io/jby-listing

---

## Contents

```
index.html          the whole page — markup + all CSS in one <style> block
assets/
  app.js            all behaviour (see "What the JS does")
  fonts.css         Mesmerize + Myriad Pro, embedded as base64 woff2
  jby_logo.svg      header and footer mark
  yacht_aerial_dock.jpg      gallery — main tile
  yacht_running_bow.jpg      gallery + Other listings
  yacht_profile.jpg          gallery + Share modal
  yacht_foredeck.jpg         gallery + Other listings
  tour_interior.jpg          3D Tour still
  event_newport.jpg          In-person event card
  event_axopar.jpg           In-person event card
  listing_axopar_1..3.jpg    Other listings rail
```

No build step. Open `index.html` over HTTP (not `file://`, or the fonts and
`app.js` will be blocked by CORS):

```
python3 -m http.server 8000
```

---

## External dependencies

Two, both loaded from a CDN in `index.html`:

| What | Where | Used by |
|---|---|---|
| Leaflet 1.9.4 (css + js, SRI-pinned) | unpkg.com | Range Calculator map |
| Esri World Imagery tiles | server.arcgisonline.com | Range Calculator basemap |

Everything else — fonts, images, scripts — is local. If the map is dropped,
`index.html` and `app.js` both degrade cleanly: the `#range-map` block just
stays empty.

---

## Design tokens

Declared as CSS custom properties at the top of the `<style>` block.

| Token | Value | Use |
|---|---|---|
| `--ink` | `#1d1d1b` | headings |
| `--text` | `#000` | body copy, field values |
| `--secondary` | `#575760` | labels, secondary copy |
| `--placeholder` | `#727279` | placeholders, disabled dates |
| `--tertiary` | `#a1a1ac` | field rules and borders only (never text) |
| `--border` | `#eeeef0` | card and divider borders |
| `--paper` | `#fdfeff` | page background |
| `--navy` / `--navy-d` | `#41647b` / `#365466` | primary action, links, hover |
| `--success` | `#0e7d47` | "Price reduced" |
| `--sand` | `#bdb19d` | note rules, shield mark |
| `--sh` | `0 4px 24px 4px rgba(132,144,163,.08)` | card shadow |

Type scale (the YachtWay/Figma scale, not the marketing-page one):

- h1 — Mesmerize 24 / 36, uppercase
- section h2 — Mesmerize Light 20 / 28, uppercase
- body — Myriad Pro 14 / 20 and 16 / 24
- buttons — Mesmerize Light 12 / 18, uppercase, 36px tall, 24px side padding
- price — Myriad Pro Semibold 24 / 36

Inside modals every label, placeholder and control sits at **16px minimum**;
all text colours clear WCAG AA (4.5:1) on white.

---

## Layout

- `.wrap` — max-width 1440, 40px gutters (24px under 1080px)
- Body grid — 800px content + 80px gap + 480px sticky sidebar
- 64px between sections
- Breakpoints: 1420 / 1080 / 820 (and 600 for modals)

---

## What the JS does

`assets/app.js`, one IIFE, no dependencies beyond Leaflet.

- sticky nav state + scroll progress bar
- scroll reveals (IntersectionObserver, with a scroll fallback so a fast
  scroll or an anchor jump cannot leave a section hidden)
- gallery lightbox (click, arrows, Esc)
- Show more / Read more toggles in the description
- "Ask Waylo" canned Q&A (`answers` object)
- Technical Specifications — 8 tabs, data in the `SPECS` object
- four horizontal rails with arrow buttons
- Range Calculator — Leaflet map, radius circle, pins, `invalidateSize` on
  resize
- Loan Calculator — live amortisation; price / down payment / % / term /
  rate all stay in sync
- seven modals (below), sharing a `simpleModal()` helper

### Modals

| Id | Opened by | Notes |
|---|---|---|
| `#shr` | SHARE | share targets are real (Facebook, WhatsApp, X, SMS, mail) + copy link |
| `#st` | Schedule a tour | mode, live calendar, slot picker, form, confirmation |
| `#pa` | Get price alert | email + consent |
| `#rm` | Report a mistake | name, email, message |
| `#nt` | bell on a Live Stream card | email + reminder lead time |
| `#rs` | Request to attend | RSVP: guests stepper, multi-select vessels, details |
| `#ce` | Contact an expert / Book a consultation | multi-select topics + contact fields |

All seven close on Esc, veil click and the ✕, reset when reopened, and end
on the same check-circle confirmation.

---

## Before this goes live

Everything below is front-end mock and needs wiring:

1. **Forms don't submit.** Every modal and the sidebar form validate client
   side, then show the confirmation state. No endpoint is called.
2. **Listing data is hard-coded** in `index.html` (title, price, spec strip)
   and in `SPECS` / `RS_VESSELS` / `answers` in `app.js`.
3. **Tour availability is generated**, not fetched — see `slotsFor()` in
   `app.js`: every day from today on is bookable, 6 weekday slots, 4 Saturday,
   2 Sunday. The sidebar still shows the Figma copy "Earliest slot:
   September 4, at 19:00", which is not wired to that function.
4. **Price Value Factors** still carry the Figma placeholders (`[YEAR]`,
   `[MAKE]`, `[MODEL]`…).
5. **3D Tour** is a still image with a Matterport badge, not an embed.
6. **Links** in the header, footer and Other listings point at `#`.
7. Loan calculator figures are indicative only.

---

## Browser support

Evergreen Chrome, Safari, Firefox, Edge. Uses CSS grid, custom properties,
`aspect-ratio`, `:has()` (progressive — only the selected-card border), and
IntersectionObserver.
