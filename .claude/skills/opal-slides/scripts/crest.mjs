// Renders the Focus Company crest as dark engraved glass: a deep tinted body, a rim of light on every edge (brightest where it
// faces the light, top left), a specular glint, and a soft outer glow. Transparent PNG, so it sits on any glow backdrop.
// Usage: node crest.mjs <crest.png|webp> <out.png> <tint #hex> [size=1800] [glow=0.55]
// The shape comes from the source's alpha, or from its brightness when it has a solid background (Figma exports do).
import sharp from "sharp";
const [inp, out, tint = "#B9B4FF", sizeArg = "1800", glowArg = "0.55"] = process.argv.slice(2);
const S = +sizeArg, G = +glowArg, pad = Math.round(S * 0.18), W = S + pad * 2;
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255);
const T = hex(tint);
const clear = { r: 0, g: 0, b: 0, alpha: 0 };
// Shape: the source's alpha, or, when it has a solid background (Figma exports do), each pixel's distance from the corner colour.
const src = await sharp(inp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const sd = src.data, n = src.info.width * src.info.height;
let opaque = 0; for (let i = 3; i < sd.length; i += 4 * 97) if (sd[i] > 250) opaque++;
const shape = Buffer.alloc(n);
if (opaque > (n / 97) * 0.9) {
  const bg = [sd[0], sd[1], sd[2]];
  for (let i = 0; i < n; i++) { const d = Math.max(Math.abs(sd[i * 4] - bg[0]), Math.abs(sd[i * 4 + 1] - bg[1]), Math.abs(sd[i * 4 + 2] - bg[2])); shape[i] = Math.round(Math.max(0, Math.min(1, (d - 16) / 12)) * 255); }
} else {
  let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, sd[i * 4 + 3]);
  for (let i = 0; i < n; i++) shape[i] = Math.round(Math.max(0, Math.min(1, (sd[i * 4 + 3] / peak - 0.12) / 0.6)) * 255);   // semi-transparent sources (the website's sits at ~30%)
}
const mask = await sharp(shape, { raw: { width: src.info.width, height: src.info.height, channels: 1 } })
  .resize(S, S, { fit: "contain", background: "#000" }).extend({ top: pad, bottom: pad, left: pad, right: pad, background: "#000" }).toColourspace("b-w").raw().toBuffer();
if (mask.length !== W * W) throw new Error(`mask is ${mask.length} bytes, expected ${W * W}`);
const blur = async (buf, s) => sharp(buf, { raw: { width: W, height: W, channels: 1 } }).blur(s).toColourspace("b-w").raw().toBuffer();   // stay single-channel, or the buffer comes back RGB
const h1 = await blur(mask, Math.max(1, S / 260));      // bevel on every stroke
const h2 = await blur(mask, S / 90);                    // broad dome so the whole crest catches light
const halo = await blur(mask, S / 22);
const o = Buffer.alloc(W * W * 4);
const L = [-0.45, -0.62, 0.64], Ln = Math.hypot(...L), Lx = L[0] / Ln, Ly = L[1] / Ln, Lz = L[2] / Ln;
const Hx = Lx, Hy = Ly, Hz = Lz + 1, Hn = Math.hypot(Hx, Hy, Hz);
const m2 = await blur(mask, 1.2);
for (let y = 1; y < W - 1; y++) for (let x = 1; x < W - 1; x++) {
  const i = y * W + x;
  const hh = j => (h1[j] * 0.75 + h2[j] * 0.25) / 255;
  const dx = hh(i + 1) - hh(i - 1), dy = hh(i + W) - hh(i - W);
  const edge = Math.min(1, Math.hypot(dx, dy) * 9);
  let nx = -dx * 14, ny = -dy * 14, nz = 1; const nn = Math.hypot(nx, ny, nz); nx /= nn; ny /= nn; nz /= nn;
  const facing = Math.max(0, (nx * Lx + ny * Ly) / Math.max(1e-4, Math.hypot(nx, ny)) );
  const diff = Math.max(0, nx * Lx + ny * Ly + nz * Lz);
  const spec = Math.pow(Math.max(0, (nx * Hx + ny * Hy + nz * Hz) / Hn), 60);
  const vert = 1.1 - (y - pad) / S * 0.4;
  const a = m2[i] / 255, g = (halo[i] / 255) * G * (1 - a);
  const rim = edge * (0.35 + 0.65 * facing);
  for (let c = 0; c < 3; c++) {
    const body = T[c] * (0.20 + 0.18 * diff) * vert + T[c] * rim * 1.25 * vert + spec * 0.8 * edge;
    const lit = Math.min(1, body), alpha = a + g * (1 - a);
    o[i * 4 + c] = Math.round((alpha > 0 ? (lit * a + T[c] * 0.55 * g * (1 - a)) / alpha : 0) * 255);
  }
  o[i * 4 + 3] = Math.round(Math.min(1, a + g * (1 - a)) * 255);
}
await sharp(o, { raw: { width: W, height: W, channels: 4 } }).png().toFile(out);
console.log("→", out);
