---
name: opal-slides
description: Make or redo an Opal presentation (school, partner, investor, team) in Opal's brand, as a Claude Slides deck. Use whenever someone asks for an Opal deck, slides or a presentation, or hands over an old deck (PDF, Pitch, Google Slides, Keynote) to rebuild.
---

# Opal slides

An Opal deck looks like the app and the website: black, white type, real app screens, very few words, and either a soft coloured glow (**Glow**) or the website's cave (**Cave**). Read this whole file, then `reference/sources.md` for where every asset comes from. Brand owner: Nour (nour@opal.so).

Never use the org's "Opal Design System" artifact (it is built on the Android app) or any older presentation skill.

## 1. Ask first (one message, as clickable choices)

Use the question tool (`AskUserQuestion` in Claude Code; the choice prompt in the Claude app). Skip anything the person already said.

1. **What it's for:** who sees it, and what they should do afterwards.
2. **The source:** old deck, doc, notes or links. Also ask for any photos to include.
3. **Theme**, with the switcher link so they can try it live: https://claude.ai/artifact/MrVvWrVV5dygHqw7NZP77G
   - **Glow:** a soft coloured light behind each slide's subject, glass panels, the lit silver crest on the cover and close.
   - **Cave:** the opalapp.com look. Black slides, white-to-grey headlines, the cave on the cover and close.
4. **Colour** (Glow only): **Light purple** · **Light blue** · **Light teal** (the First Gem). A partner deck may use the partner's brand colour instead.

Recommend one option and put it first: schools → Glow, light purple · Opal Family or the app → Glow, light teal · partner → Glow, light teal or the partner's colour · investors, hiring → Glow, light blue · launch or brand → Cave.

## 2. Read the source completely

| Source | How |
|---|---|
| PDF | `pdftotext -layout`; images with `pdfimages -all` |
| Pitch link | It renders in JavaScript, so a plain fetch gets only the title. Use `scripts/pitch-images.mjs <link> <dir>` for the original images, and Playwright for the text (screenshot, `document.body.innerText`, ArrowRight, repeat). Or ask for the PDF export |
| Google Slides / Keynote | Ask for a PDF export |
| Figma | `get_metadata`, `get_screenshot`, `download_assets` at scale 3 |

Write down every fact, figure, quote and source line. **Keep every picture** (photos, clippings, headshots, screens). Take the original files, never screenshots of slides. If one can't be found at full quality, keep its slot and list it in the handover; never drop one silently.

## 3. Plan, then show the plan

One line per slide: its point as a sentence, plus the layout (§5). Share it in a few lines before building.

- **One idea per slide.** Split slides that make two points, and merge slides that repeat.
- **Titles state the point**, not the topic, never as a question, never "It's not X, it's Y".
- **Order:** idea → proof → how → ask.
- **Never change or invent a number, name, quote or price.** If a figure has no source, write `[source?]` and ask.
- **Cut:** confidential footers, repeated logos, paywall links. On slides, follow the website's look, never its page furniture: no store badges, ratings widgets, counters or buttons.
- **Too many slides or pictures?** Ask before cutting. Anything cut is listed in the handover, never dropped silently.
- **Figures that disagree** between slides or sources: keep both out, write `[which?]` and ask.
- **Current screens only.** Check every app screen against the Figma files in `reference/sources.md`; old decks and the website are often a version behind.

## 4. Theme, colour, type

**Files.** Copy `templates/deck.css` as the deck's `project/deck.css`. For **Cave**, append `templates/theme-cave.css` to it. Set the colour once, in the `--accent` line of the first `:root` block:

| Colour | `--accent` | Glow files | Gradient (only for a new glow position) |
|---|---|---|---|
| Light purple | `#B39AFF` | `assets/glows/purple-*.png` | `#E1B4FF → #B39AFF` |
| Light blue | `#A9CBFF` | `assets/glows/blue-*.png` | `#A9CBFF → #87C5FD` |
| Light teal (First Gem) | `#9EF9FF` | `assets/glows/teal-*.png` | `#9EF9FF → #D4FF9C` (`Gemstone.Color.firstGem`; never teal alone) |
| Partner | the partner's colour | render with `scripts/glow.mjs` | partner colour → `#9EF9FF` |
| Cave | `#FFFFFF` | none | none |

Colours come only from the app (`ColorStyle.swift`, `Gemstone.swift`) or the partner's brand. Never invent one. `--accent` is used only on marks and highlights (check marks, the highlighted bar or price), never on text.

**Glow backdrops (Glow theme).**
- Each content slide's first child is `<img class="bleed glow glow-in" src="…" style="width:1920px; height:1080px">`.
- Pick the file whose light sits behind that slide's subject: `right` (a phone on the right), `left`, `top-left` (a big number), `cover`, `close`, or a corner for text slides.
- **Alternate the corner from one slide to the next. Never use the same glow on two neighbouring slides, and never use a glow that washes the whole slide.**
- New positions: `node scripts/glow.mjs out.png <cx> <cy> <colourA> <colourB> <size> 1280 720` (coordinates on a 1280×720 canvas, size about 0.65; the slide scales it). It reproduces the Figma recipe: one gradient ellipse under a large Gaussian blur, computed at full precision with fine grain, saved as **PNG**. Never use JPEG or CSS gradients for a glow: they band and pixelate.

**Covers and closes.**
- **Glow:** `assets/crest/crest-silver.png`, about 860px, right half, over the `cover` glow. Close: crest about 400px, top centre, over the `close` glow, with the copy centred under it. Logo top left.
- **Cave:** `assets/cave/cave-center.jpg` (the opening is centred on the slide axis). The `.hero` block is centred at y 395 and holds only the headline and one short line. Logo top left.

**Type.**
- Font stack: `system-ui, -apple-system, 'SF Pro Text', 'Inter'`, with Inter registered in `faces` (Google Fonts). Never upload SF Pro (licence).
- Letter spacing: −0.02em for display text, −0.025em for titles and big figures, −0.03em for the 340px hero number. The brand kit's −0.04em is too tight at slide size.
- One pill label above each title. Text sharpens in (`.rise`); nothing slides.

## 5. Layouts

Start from `templates/slides/<name>.html`. Each one holds example copy from a real deck, to show the length and tone that fit; replace every line of it, then delete the `<!-- TEMPLATE … -->` marker on line 1 (the checker fails while it's there). Replace `{c}` with the colour (`purple`, `blue`, `teal`) and every `IMAGE` with your images. Leave `ASSET:<path>` as it is; `scripts/fill_assets.py` fills those after upload (§6).

| Content | Template |
|---|---|
| Opening | `cover-glow`, `cover-cave` |
| Close | `close-glow`, `close-cave` |
| One phone and steps or points | `split-steps`, `split-points` |
| Wide screenshot (dashboard) | `split-screenshot` (set the box to the image's own aspect: height = width × image height ÷ width; the editor drops `object-position`) |
| A flow of 3–4 screens | `phones-row` |
| 3 parallel points | `cards` (equal height; every divider lines up across the row) |
| 4 short points | `columns` |
| Next steps or a plan | `path` (3 columns, rows on a shared grid, last column white) |
| One big number and up to 3 stats | `hero-number` |
| Bars or a comparison over groups | `bar-chart` (the highlighted bar is `--accent`, the rest white at low opacity, values exact) |
| Prices or tiers | `stat-panel` (highlight one cell) |
| Which option covers what | `coverage-table` (real icons, a dot for "no") |
| Sees / never sees, allowed / blocked | `sees-never` (✓ in `--accent`, ✕ grey) |
| Settings or categories shown as the product shows them | `category-card` (toggle and chips) |
| A system | `flow` (black app icon, white Apple logo) |
| A quote | `quote-big` (with photo); 3 quotes → `quotes` |
| Customer logos | `logo-wall` (white marks, equal cells; sizes from `scripts/logo_wall.py`) |
| Press | `press-wall` |
| 1–10 photos | `photos`, laid out by `scripts/photo_grid.py` (below) |

**Photos.**
- Run `python3 scripts/photo_grid.py a.jpg:/_blob/<id> b.png:/_blob/<id> …` (each argument is the local file, a colon, then its blob). Type the arguments out in full; don't build them in a shell loop.
- The default box sits under a one-line title: x 128, y 340 (title bottom + 40), 1664 × 580. Under a two-line title use `--box 128 440 1664 480`.
- It finds the arrangement that fills the box best and keeps every photo's shape: never stretched, at most 20% cropped, with an uncropped fallback that stays aligned to x 128.
- Paste its output in place of the template's photo block.
- More than 10 photos → two slides.

**Logos.** Make each logo a white PNG (§5 of `reference/sources.md`), then run `python3 scripts/logo_wall.py --cell 300 150 a.png:/_blob/<id> …`. It measures each logo's ink and sizes them so a wordmark and a monogram carry the same weight. For fewer than five logos, raise `--ink` (default 9000).

**Every slide:**
- Every image gets an inline pixel `width` and `height`. The Slides editor ignores `%`, `max-width` and `fr` on images.
- Boxes in a row are the same height, and their inner lines line up.
- No line holds a single word. List rows are 1–2 lines. Minimum text size is 24px.
- Content fills about 70% of the column. Nothing goes below y 920 except the source line.
- Every number has a source on its slide.
- Left edges line up at x 128: `.display` −7px, `.title` −4px, `.hero-num` −13px.
- Icons from the website must be solid. Fill cut-outs with black, or the glow shows through.

## 6. Build, check, hand over

1. Create the deck from the Claude Slides type (decline the org design system: `designSystems: []`). Write `project/deck.json` with `"v": 5`, `"lists": "css"`, `"format": {"shared": ["project/deck.css"]}`, `faces` with Inter, and `order`. Write every file with the file tool, not a shell command.
2. Upload every image, and keep a small `uploads.json` that maps each skill asset path (as written after `ASSET:`) to the id the upload returned. Run `python3 scripts/fill_assets.py <deck folder> uploads.json <skill folder>`: it fills every `ASSET:` and writes `blobs.json` for the preview. Your own images use the `/_blob/<id>` exactly as returned.
3. **Before changing an existing deck, read its live version** (Artifact `read` with `paths`). People adjust slides in the editor, and publishing from an older copy erases their work.
4. Run `python3 scripts/check_slides.py <folder>`. It must pass: `--accent` set, inline image sizes, no template marker or placeholder left, glows on every Glow slide and alternating, letter spacing, no text under 24px. It lists every `[…?]` question for the handover.
5. If Node is available, render every slide with `node scripts/preview.mjs <folder> <folder>/blobs.json <out>`. Fix anything it reports below y 920, then look at every contact sheet. Without Node, open the deck and look at every slide.
6. Hand over:
   - the link
   - the contact sheets, so every slide is visible without opening the deck
   - copy you changed (old → new) where meaning could shift
   - slides merged, split or cut
   - missing assets
   - open questions about facts

   Keep it to about 10 lines. The deck is private. A partner gets a PDF export, not the link.

## Requirements

- **Claude Code:** Python 3. Node 18+ with `npm install --no-save sharp playwright && npx playwright install chromium` for the Node scripts. The Figma connector for app screens.
- **Claude app:** works with the bundled assets and the four Python scripts (`photo_grid.py`, `logo_wall.py`, `fill_assets.py`, `check_slides.py`). It can't render new glows or crests, so use the 24 bundled glows.
- **No Figma access:** use the brand kit and website files in `reference/sources.md`, and ask the person for any missing screen.
