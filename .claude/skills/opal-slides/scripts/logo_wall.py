#!/usr/bin/env python3
"""Size a row or wall of logos so each carries the same visual weight. Standard library only.

A wordmark and a monogram at the same height look nothing alike: the wordmark is wide and thin, the
monogram a dense block. This measures each PNG's ink (its visible pixels), then scales every logo so
the ink areas match, capped by the cell size. Output is the <img> tags with inline px sizes.

Usage:
  python3 logo_wall.py [--cell 300 150] [--ink 9000] logo1.png:/_blob/<id> logo2.png:/_blob/<id> ...
  --cell W H   the largest box a logo may fill (default 300 x 150, for a 5-column wall)
  --ink N      the target ink area in px² (default 9000; raise it for fewer, bigger logos)
PNG only (8-bit, any colour type). Convert SVG or JPEG first with scripts/whiten.mjs.
"""
import struct, sys, zlib


def read_png(path):
    """Return (width, height, alpha(x, y) -> 0..255) for an 8-bit PNG."""
    data = open(path, "rb").read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        sys.exit(f"{path}: not a PNG")
    pos, idat, w = 8, b"", 0
    while pos < len(data):
        n, kind = struct.unpack(">I4s", data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + n]
        if kind == b"IHDR":
            w, h, depth, ctype, _, _, interlace = struct.unpack(">IIBBBBB", body)
            if depth != 8 or interlace:
                sys.exit(f"{path}: use an 8-bit, non-interlaced PNG")
        elif kind == b"IDAT":
            idat += body
        pos += 12 + n
    bpp = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    raw, stride = zlib.decompress(idat), w * bpp
    rows, prev, i = [], bytearray(stride), 0
    for _ in range(h):
        f, line = raw[i], bytearray(raw[i + 1:i + 1 + stride]); i += 1 + stride
        for x in range(stride):
            a = line[x - bpp] if x >= bpp else 0
            b, c = prev[x], prev[x - bpp] if x >= bpp else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + (a + b) // 2) & 255
            elif f == 4:
                p = a + b - c; pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        rows.append(line); prev = line
    if ctype in (4, 6):
        return w, h, lambda x, y: rows[y][x * bpp + bpp - 1]
    # No alpha: ink is anything brighter than near-black (white logos on black, as the deck uses).
    return w, h, lambda x, y: 255 if max(rows[y][x * bpp:x * bpp + min(bpp, 3)]) > 40 else 0


def ink(path):
    """Fraction of the trimmed logo's box that is ink, and the trimmed box's size."""
    w, h, alpha = read_png(path)
    step = max(1, max(w, h) // 400)
    xs, ys, filled = [], [], 0
    for y in range(0, h, step):
        for x in range(0, w, step):
            if alpha(x, y) > 64:
                xs.append(x); ys.append(y); filled += 1
    if not xs:
        sys.exit(f"{path}: no visible pixels")
    bw, bh = max(xs) - min(xs) + step, max(ys) - min(ys) + step
    return filled * step * step / (bw * bh), bw, bh


def main(argv):
    cw, ch, target, items, i = 300, 150, 9000.0, [], 0
    while i < len(argv):
        if argv[i] == "--cell": cw, ch = int(argv[i + 1]), int(argv[i + 2]); i += 3; continue
        if argv[i] == "--ink": target = float(argv[i + 1]); i += 2; continue
        items.append(argv[i]); i += 1
    if not items:
        sys.exit(__doc__)
    for item in items:
        path, _, src = item.partition(":")
        density, bw, bh = ink(path)
        ar = bw / bh
        # Ink area = density * width * height, with height = width / ar.
        width = (target * ar / density) ** 0.5
        width = min(width, cw, ch * ar)
        print(f'<img src="{src or path}" alt="" style="width:{round(width)}px; height:{round(width / ar)}px; object-fit:contain">')


if __name__ == "__main__":
    main(sys.argv[1:])
