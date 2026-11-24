// Render every slide of a local deck to PNG and tile contact sheets, so you can look before publishing.
// Needs Node with `playwright` and `sharp` (npm install --no-save playwright sharp && npx playwright install chromium).
// Usage: node preview.mjs <folder that holds project/> <blobs.json> <out dir>
//   blobs.json maps each uploaded id to its local file: {"<32-hex id>": "/abs/path/file.png", ...}
// The browser forgives sizing the Slides editor ignores, so also run check_slides.py.
// Prints every element that ends below y 920 (the source line, logo, crest and glow excepted).
import { chromium } from "playwright";
import sharp from "sharp";
import fs from "fs";
const [root, blobsPath, out] = process.argv.slice(2);
const P = root + "/project", deck = JSON.parse(fs.readFileSync(P + "/deck.json", "utf8"));
const css = fs.existsSync(P + "/deck.css") ? fs.readFileSync(P + "/deck.css", "utf8") : "";
const blobs = JSON.parse(fs.readFileSync(blobsPath, "utf8"));
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const page = await (await b.newContext({ viewport: { width: 1920, height: 1080 }, javaScriptEnabled: true })).newPage();
await page.route("**/_blob/**", r => { const id = r.request().url().split("/_blob/")[1]; const f = blobs[id]; if (!f) { console.log("missing image", id); return r.abort(); } r.fulfill({ path: f }); });
const shots = [];
for (const [n, id] of deck.order.entries()) {
  const html = fs.readFileSync(`${P}/slides/${id}.html`, "utf8");
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><base href="http://preview.local/"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"><style>${css}
html,body{margin:0} section{position:relative;width:1920px;height:1080px;box-sizing:border-box;overflow:hidden;isolation:isolate} .bleed{z-index:-1} aside{display:none} *{animation:none!important}</style></head><body>${html}</body></html>`, { waitUntil: "networkidle" });
  const f = `${out}/${String(n + 1).padStart(2, "0")}-${id}.png`;
  await page.screenshot({ path: f }); shots.push(f);
  // Anything but the backdrop, the logo and the source line that ends below y 920 is too low.
  const low = await page.$$eval("section *", els => els.filter(e => {
    if (e.closest(".bleed, .crest, .logo, .source, aside") || !e.getBoundingClientRect().height) return false;
    const r = e.getBoundingClientRect(); return r.bottom > 921 && r.top < 1080 && !e.querySelector("*");
  }).map(e => `${e.tagName.toLowerCase()} "${(e.textContent || e.getAttribute("alt") || "").trim().slice(0, 40)}" ends at y ${Math.round(e.getBoundingClientRect().bottom)}`));
  for (const l of low) console.log(`${id}: ${l}`);
}
await b.close();
for (let s = 0; s * 9 < shots.length; s++) {
  const part = shots.slice(s * 9, s * 9 + 9);
  const tiles = await Promise.all(part.map(f => sharp(f).resize(640, 360).toBuffer()));
  await sharp({ create: { width: 1940, height: 1100, channels: 3, background: "#333" } })
    .composite(tiles.map((t, i) => ({ input: t, left: (i % 3) * 650, top: Math.floor(i / 3) * 370 }))).png().toFile(`${out}/contact-${s + 1}.png`);
}
console.log(`${shots.length} slides → ${out}/contact-*.png`);
