# Where every asset comes from

Take assets in this order. Stop at the first source that has it. Never crop an asset out of an old deck, a screenshot or a search result, and never redraw a logo.

## 1. Bundled with this skill (always available, works offline)

| Need | File |
|---|---|
| Opal wordmark, white (dark slides) / black (light) | `assets/brand/opal-white.png`, `assets/brand/opal-black.png` |
| Opal app icon (black, as on the Home Screen) | `assets/brand/app-icon.png`. Never a white-background icon |
| Apple logo, pure white | `assets/brand/apple-white.png`. Never grey |
| Apple Design Award, Social Impact 2025 | `assets/brand/apple-design-awards.png` |
| The Focus Company crest, lit silver (Glow covers) | `assets/crest/crest-silver.png`. Source shape: `assets/crest/crest-source.png` |
| Cave (Cave covers) | `assets/cave/cave-center.jpg` |
| Glow backdrops: 3 colours × 8 positions | `assets/glows/<purple|blue|teal>-<right|left|top-right|bottom-left|top-left|bottom-right|cover|close>.png` |
| Schools icons (locker, pouch, Opal) | `assets/schools/` |
| Student phone before / during school (current app) | `assets/screens/phone-before-school.png`, `assets/screens/phone-during-school.png` |
| School logos not on the website | `assets/logos/` |

## 2. Brand kit: https://brandkit.opal.so (public, owned by Nour)

Download a file with `https://brandkit.opal.so/<file>`:
`App_Icon.png` · `Opal_White.png` · `Opal_Black.png` · `Crest_White.png` · `Crest_Black.png` · `Apple_Design_Awards.png` · `App_Ratings.png` · `Gems/Milestone_5.png` (also 6, 7, 8, 13, 14) · `Images/Gem_Burst.jpg` · `Images/Gem_Burst_Logo.jpg` · `Screenshots/Android/<apps|block|breathein|games|hero|stats|timer>.jpg` · `Videos/Opal_<Focus|Home_Screen|Milestone_Gems|Park_Scroll|Scrolling_In_Bed|Streak>.mp4`.

Rules from the kit: logo white on dark, black on light. Never recolour, stretch, outline or add effects to the logo or the gems. Gems only on pure black, never cropped, with no text over them.

## 3. Figma (needs the Figma connector; ask the person if it isn't connected)

| What | File key | Node |
|---|---|---|
| Brand Elements: logos, app icon (and seasonal icons) | `wXM1Pn3IJwWiVzcAMviimu` | Opal Icon `1180:83121`, Opal Logo `1180:83122`, Colors `809:165`, Typography `809:166`, Cave `825:7746` (Cave Asset `825:7913`) |
| Glow reference: App Mockups tiles | `2w8KImrYxMI4xOajbjy1F9` (Brand-Marketing) | `2218:270`; the glow is "Ellipse 1238" in each tile |
| Crest artwork | `nNBuAyTcGtvsXmGpI5hWVy` (Archive) | `957:52515` |
| Current app screens (prefer these over any older screen) | `f5MIcJV8smkpC6keZiGJp2` (Timer) | Profile `35212:9496` |
| Opal Family and Cash App flows | `qgmdFTmuQ9Dt1xbJKnacBK` (🌄 Opal iOS), page Family v2 `31480:28604` | Core `32430:30243`, Cash App `34628:8648`, Cash App branded `34698:9862` |
| Before / during school home screens | same file | `35219:21903` (Before Opal, After Opal) |
| iOS app icons (third-party apps) | `Qwh9rlMDnnqB8fsTmqe6tN` (community) | `401:3` |

Frame names say the step: `P3 · New deal` is the parent's third screen, `C2 · Deal from Sally` the child's second. Export with `download_assets` at scale 3. If the export has a solid black background around a phone, cut it away (flood-fill from the edges) so the glow shows behind.

## 4. opalapp.com (public CDN)

Website media is at `https://cdn.opalapp.com/website/5ffc51a847b677701a3da52b/<file>`. Useful files:
`6ae2210fb14eb13507d63ecd_schools-dashboard.png` (admin dashboard) · `6ae2210fb24299671ab5bdcf_schools-schedule.png` · `663fb9cfd48ced9107a3d84b_ice-glow.webp` (the site's glow behind phones) · `6ad09d847baedeb426364ba3_NewHome.png` (current home screen phone).
School logos (already white): `6ae221107465349a5e09cea6_schools-logo-harvard-westlake.png` · `6ae221104a527540e4c2678b_schools-logo-loomis-chaffee.png` · `6ae221114a527540e4c267a0_schools-logo-berkeley-prep.png` · `6ae22110dba4bcbd601220eb_schools-logo-la-jolla.png` · `6ae221117465349a5e09cef7_schools-logo-miami-country-day.png` · `6ae4c89941d8de07d9269439_schools-logo-poly-prep.png`. The website's `…_schools-logo-campbell-hall.png` actually shows Colorado Academy; use the bundled `assets/logos/school-colorado-academy.png` instead.
New site media lives at `https://www.opalapp.com/media/…`, e.g. `/media/schools/apps/<app>.webp` (36 app icons). The before and during-school phones are bundled as `assets/screens/phone-before-school.png` and `phone-during-school.png`.
Press logos (white them first): `https://cdn.opalapp.com/website/600af2a75eac7614a9682354/` + `6971e47010b62083a2b547d3_NewYorkTimes.svg`, `6970eb9754e9a1ba59d4f613_WSJ_Logo.svg`, `6970ec026b3e3e23fac97104_Los_Angeles_Times_logo.svg`, `6970e8bab1c32b1523cf2d00_The_Guardian_2018.svg`, `6970f58112c16f2939c3d200_Forbes_logo%201.svg`, `6970f2fcf84108f82b340d41_Fortune_magazine_logo_2016.svg`, `6970f58ce72b9e242d8754af_GQ_Logo%201.svg`, `6970f596350e190804679be4_TechCrunch_logo%201.svg`, `6970e6b04f8513738ae21531_The_New_Yorker_Logo.svg`, `6970e615721df6dc0d53259f_The_Telegraph.svg`.

## 5. Other organisations' logos (schools, partners, press)

1. The organisation's own website: `node scripts/find-logo.mjs <homepage> <dir>` lists header logos and writes `candidates.png`; pick one by eye.
2. Its Wikipedia infobox image on Wikimedia Commons.
3. App icons: the Figma community file above, else [simple-icons](https://github.com/simple-icons/simple-icons) (CC0) on the brand colour: `https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/<slug>.svg`.

Then make it white with `node scripts/whiten.mjs <in> <out.png> 240` (add `--invert` for light marks on dark, `--cut=0.5` if grey boxes appear). Every logo on a slide is white, and logos in a row are sized for equal ink area, not equal height. Save new ones to `assets/logos/` and add them here.

## Without tools (Claude app, no Figma, no Node)

Everything in section 1 is a plain file: upload it as is. Brand kit and website files download over HTTPS. `photo_grid.py`, `logo_wall.py`, `fill_assets.py` and `check_slides.py` are standard-library Python. Only `glow.mjs`, `crest.mjs`, `find-logo.mjs`, `whiten.mjs`, `pitch-images.mjs` and `preview.mjs` need Node; the bundled assets cover the common cases without them.
