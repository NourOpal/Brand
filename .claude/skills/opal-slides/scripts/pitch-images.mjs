// Saves the original image files a Pitch deck loads (photos, clippings, screenshots), at the size Pitch stores them, instead of cropping screenshots.
import { chromium } from "playwright";
import fs from "fs";
const [deckUrl, out] = process.argv.slice(2);  // usage: node pitch-images.mjs <pitch.com/v/... link> <out-dir>
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const seen = new Map();
p.on("response", async r => { const ct = r.headers()["content-type"] || ""; const u = r.url();
  if (!/image\/(png|jpe?g|webp|avif)/.test(ct) || seen.has(u)) return;
  try { const body = await r.body(); if (body.length < 15000) return; seen.set(u, body.length); const n = String(seen.size).padStart(2, "0"); fs.writeFileSync(`${out}/img-${n}.${ct.split("/")[1].replace("jpeg","jpg")}`, body); fs.appendFileSync(`${out}/urls.txt`, `img-${n} ${body.length} ${u.slice(0,160)}\n`); } catch {} });
await p.goto(deckUrl, { waitUntil: "networkidle", timeout: 90000 });
await p.waitForTimeout(3000);
for (let i = 0; i < 26; i++) { await p.keyboard.press("ArrowRight"); await p.waitForTimeout(1800); }
await p.waitForTimeout(3000); await b.close(); console.log(seen.size, "images");
