// The Figma glow, recreated: one ellipse filled with a two-colour gradient, under a Gaussian blur, on black.
// Same proportions as "Ellipse 1238" in the Brand-Marketing App Mockups tiles (1369x838, blur stdDev 900 in a 3420px frame),
// blended in sRGB like Figma. Computed in float, upsampled with a smooth (cubic) filter, finished with ±1 LSB grain so
// 8-bit output never bands, and saved as PNG. Never save it as JPEG.
// Usage: node glow.mjs <out.png> <cx> <cy> <colourTopRight> <colourBottomLeft> [size=1] [W=1920] [H=1080]
//   size scales the ellipse and the blur together (1 = the Figma tile's proportions on a 1920px slide).
import sharp from "sharp";
const [out, cxA, cyA, cA, cB, sizeA = "1", WA = "1920", HA = "1080"] = process.argv.slice(2);
const cx = +cxA, cy = +cyA, size = +sizeA, W = +WA, H = +HA;
const k = (1920 / 3420) * size, rx = 684.5 * k, ry = 419 * k, sigma = 900 * k;
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const A = hex(cA), B = hex(cB), bg = hex("#07080B");
// work grid: 1/4 resolution, padded so blur pulls in light from outside the frame
const f = 4, pad = Math.ceil((sigma * 3) / f), w = Math.ceil(W / f) + 2 * pad, h = Math.ceil(H / f) + 2 * pad, s = sigma / f;
const ch = [new Float32Array(w * h), new Float32Array(w * h), new Float32Array(w * h), new Float32Array(w * h)]; // r,g,b premultiplied, coverage
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const px = (x - pad + 0.5) * f, py = (y - pad + 0.5) * f, dx = (px - cx) / rx, dy = (py - cy) / ry;
  if (dx * dx + dy * dy > 1) continue;
  const t = Math.min(1, Math.max(0, 0.5 + (dy * 0.55 - dx * 0.45) / 2)), i = y * w + x;
  for (let c = 0; c < 3; c++) ch[c][i] = A[c] + (B[c] - A[c]) * t;
  ch[3][i] = 1;
}
const r = Math.ceil(s * 3), ker = new Float32Array(2 * r + 1); let sum = 0;
for (let i = -r; i <= r; i++) { ker[i + r] = Math.exp(-(i * i) / (2 * s * s)); sum += ker[i + r]; }
for (let i = 0; i < ker.length; i++) ker[i] /= sum;
const blur = (src, horiz) => { const dst = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let a = 0;
    for (let j = -r; j <= r; j++) { const xx = horiz ? x + j : x, yy = horiz ? y : y + j; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; a += src[yy * w + xx] * ker[j + r]; }
    dst[y * w + x] = a; } return dst; };
const bl = ch.map(c => blur(blur(c, true), false));
const cub = (p0, p1, p2, p3, t) => p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
const sample = (arr, fx, fy) => { const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, row = [];
  for (let j = -1; j <= 2; j++) { const yy = Math.min(h - 1, Math.max(0, y0 + j)), q = [];
    for (let i = -1; i <= 2; i++) q.push(arr[yy * w + Math.min(w - 1, Math.max(0, x0 + i))]);
    row.push(cub(q[0], q[1], q[2], q[3], tx)); }
  return cub(row[0], row[1], row[2], row[3], ty); };
const o = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const fx = (x + 0.5) / f + pad - 0.5, fy = (y + 0.5) / f + pad - 0.5, cov = Math.max(0, sample(bl[3], fx, fy));
  for (let c = 0; c < 3; c++) {
    const col = cov > 1e-6 ? sample(bl[c], fx, fy) / cov : 0;           // gradient colour under the blur
    const v = bg[c] + (col - bg[c]) * cov + (Math.random() - Math.random()); // sRGB "normal" blend, like Figma, plus grain
    o[(y * W + x) * 3 + c] = Math.max(0, Math.min(255, Math.round(v)));
  }
}
await sharp(o, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 9 }).toFile(out);
console.log("→", out);
