// Finds an organisation's own logo on its website: inline <svg> or <img> whose src/alt/class/id mentions "logo", in the header first.
// Usage: node find-logo.mjs <site-url> <out-dir>   → writes candidate-N.svg/.png plus candidates.html to compare them on black.
import { chromium } from "playwright";
import fs from "fs";
const [url, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(3500);
const found = await p.evaluate(() => {
  const hit = el => /logo|brand|crest|seal|wordmark/i.test([el.id, el.className?.baseVal ?? el.className, el.getAttribute("alt"), el.getAttribute("src"), el.getAttribute("aria-label"), el.closest("a")?.getAttribute("aria-label"), el.closest("[class]")?.className].join(" "));
  const inHeader = el => !!el.closest("header, nav, [class*=header], [id*=header], [class*=Header]");
  const out = [];
  for (const el of document.querySelectorAll("svg, img")) {
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 16 || r.width > 700) continue;
    const alt = (el.getAttribute("alt") || el.getAttribute("aria-label") || "").trim().toLowerCase();
    const site = document.title.toLowerCase();
    const named = alt.length > 2 && alt.split(/\s+/).length <= 5 && site.includes(alt.split(/[|–-]/)[0].trim());
    const file = /logo|wordmark|white|crest|seal/i.test(el.getAttribute("src") || "");
    const photo = /\.(jpe?g)(\?|$)/i.test(el.getAttribute("src") || "") || /^welcome|photo/i.test(alt);
    const score = (hit(el) ? 2 : 0) + (named ? 3 : 0) + (file ? 2 : 0) + (inHeader(el) ? 1 : 0) + (el.tagName === "svg" ? 1 : 0) - (photo ? 4 : 0);
    if (score <= 0) continue;
    if (el.tagName.toLowerCase() === "svg") {
      const c = el.cloneNode(true);
      if (!c.getAttribute("xmlns")) c.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      for (const u of c.querySelectorAll("use")) { const ref = document.querySelector(u.getAttribute("href") || u.getAttribute("xlink:href")); if (ref) u.replaceWith(ref.cloneNode(true)); }
      out.push({ kind: "svg", score, w: r.width, h: r.height, data: c.outerHTML });
    } else out.push({ kind: "img", score, w: r.width, h: r.height, data: el.currentSrc || el.src });
  }
  return out.sort((a, c) => c.score - a.score || c.w * c.h - a.w * a.h).slice(0, 6);
});
let i = 0, html = "<body style='background:#07080B;margin:0;padding:40px;display:grid;gap:40px'>";
for (const f of found) {
  i++;
  let file;
  if (f.kind === "svg") { file = `candidate-${i}.svg`; fs.writeFileSync(`${out}/${file}`, f.data); }
  else { const r = await p.request.get(f.data).catch(() => null); if (!r || !r.ok()) continue; const ext = (f.data.match(/\.(svg|png|webp|jpe?g)(\?|$)/i)?.[1] || "png").toLowerCase(); file = `candidate-${i}.${ext}`; fs.writeFileSync(`${out}/${file}`, await r.body()); }
  html += `<div style="color:#888;font:16px system-ui">${file} · score ${f.score} · ${Math.round(f.w)}×${Math.round(f.h)}<br><img src="${file}" style="height:120px;max-width:700px;object-fit:contain;filter:brightness(0) invert(1)"> <img src="${file}" style="height:120px;max-width:700px;object-fit:contain;background:#fff"></div>`;
}
fs.writeFileSync(`${out}/candidates.html`, html + "</body>");
await p.goto("file://" + out + "/candidates.html"); await p.screenshot({ path: `${out}/candidates.png`, fullPage: true });
console.log(found.length + " candidates →", out);
await b.close();
