// Turns any logo (SVG or raster, any colours) into a white mark on transparent, keeping its inner detail.
// Renders it on white, then alpha = darkness: dark ink becomes solid white, light areas become clear.
// Usage: node whiten.mjs <in> <out.png> [height=480] [--invert] [--cut=0.6]
//   --invert  the mark is drawn light on a dark or coloured ground (most logos taken from dark site headers)
//   --cut=N   hard edge at ink level N instead of a soft ramp; use it when coloured blocks or grey tones turn into grey boxes
import sharp from "sharp";
const [inp, out, hArg = "480", ...flags] = process.argv.slice(2);
const flag = flags.includes("--invert") ? "--invert" : "";
const cut = +(flags.find(f => f.startsWith("--cut="))?.slice(6) ?? NaN);
const H = +hArg;
const src = sharp(inp, { density: 600 }).resize({ height: H * 2, withoutEnlargement: false });
const { data, info } = await src.flatten({ background: flag === "--invert" ? "#000" : "#fff" }).greyscale().raw().toBuffer({ resolveWithObject: true });
const o = Buffer.alloc(info.width * info.height * 4);
for (let i = 0; i < info.width * info.height; i++) {
  const lum = data[i] / 255, ink = flag === "--invert" ? lum : 1 - lum;
  const a = Number.isNaN(cut) ? Math.max(0, Math.min(1, (ink - 0.08) / 0.84)) : Math.max(0, Math.min(1, (ink - cut) / 0.08 + 0.5));
  o[i * 4] = o[i * 4 + 1] = o[i * 4 + 2] = 255; o[i * 4 + 3] = Math.round(a * 255);
}
await sharp(o, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({ threshold: 1 }).resize({ height: H }).png().toFile(out);
console.log("→", out);
