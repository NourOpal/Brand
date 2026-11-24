#!/usr/bin/env python3
"""Lay out 1 to 10 photos on a slide so they fill the space and keep their shape: never stretched,
at most 20% cropped (object-fit: cover), with an exact no-crop fallback.

Tries every way to split the photos, in order, into 1-4 rows. Each row gets the height that makes its
photos exactly fill the width, then the whole block is scaled to fit the box. The layout that fills
the box best, with rows of similar height, wins. Output is HTML with fixed pixel positions, which is
what the Slides editor needs.

Usage:
  python3 photo_grid.py [--box X Y W H] [--gap 20] [--radius 22] [--crop 0.2] [--keep-order] photo1.jpg:/_blob/<id> photo2.png:/_blob/<id> ...
  (each argument is a local file to measure, then the src to write; a bare WxH also works: 1600x1200:/_blob/<id>)
Default box is the slide area under a one-line title: x 128 (the left edge), y 340 (title bottom + 40), 1664 x 580
(ends at y 920). For a two-line title, start the box 100px lower and make it 100px shorter.
The block is left-aligned at x and starts at y; it never re-centres, so it lines up with the title.
Standard library only, so it runs in Claude Code and in the Claude app.
"""
import struct, sys, itertools


def size_of(path):
    with open(path, "rb") as f:
        head = f.read(32)
        if head[:8] == b"\x89PNG\r\n\x1a\n":
            return struct.unpack(">II", head[16:24])
        if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
            kind = head[12:16]
            if kind == b"VP8X":
                return 1 + int.from_bytes(head[24:27], "little"), 1 + int.from_bytes(head[27:30], "little")
            f.seek(0); data = f.read(40)
            if kind == b"VP8 ":
                w, h = struct.unpack("<HH", data[26:30]); return w & 0x3FFF, h & 0x3FFF
            if kind == b"VP8L":
                b = data[21:25]; v = int.from_bytes(b, "little")
                return (v & 0x3FFF) + 1, ((v >> 14) & 0x3FFF) + 1
        if head[:2] == b"\xff\xd8":
            f.seek(2)
            while True:
                marker, = struct.unpack(">H", f.read(2))
                length, = struct.unpack(">H", f.read(2))
                if marker in (0xFFC0, 0xFFC1, 0xFFC2):
                    f.read(1); h, w = struct.unpack(">HH", f.read(4)); return w, h
                f.seek(length - 2, 1)
    raise ValueError(f"can't read the size of {path} (use WxH:src instead)")


def parse(arg):
    measure, _, src = arg.partition(":/")
    src = "/" + src if src else measure
    if "x" in measure and measure.replace("x", "").isdigit():
        w, h = map(int, measure.split("x"))
    else:
        w, h = size_of(measure)
    return {"src": src, "ar": w / h}


def layout(photos, W, H, gap, crop=0.2):
    """Rows of equal height that fill the box; each photo may crop by up to `crop` (never stretched).
    If no split of the photos fits that, fall back to exact justified rows (no crop at all)."""
    n, best = len(photos), None
    for rows in range(1, min(4, n) + 1):
        h = (H - gap * (rows - 1)) / rows
        for cuts in itertools.combinations(range(1, n), rows - 1):
            groups = [photos[a:b] for a, b in zip((0,) + cuts, cuts + (n,))]
            factors = [(W - gap * (len(g) - 1)) / (sum(p["ar"] for p in g) * h) for g in groups]
            if any(abs(f - 1) > crop for f in factors):
                continue
            score = sum(abs(f - 1) for f in factors) / rows
            if best is None or score < best[0]:
                best = (score, groups, h, factors)
    out = []
    if best:
        _, groups, h, factors = best
        for r, (g, f) in enumerate(zip(groups, factors)):
            x, y = 0.0, r * (h + gap)
            for p in g:
                w = p["ar"] * h * f
                out.append((p["src"], round(x), round(y), round(w), round(h)))
                x += w + gap
        return out, H
    best = None
    for rows in range(1, min(4, n) + 1):
        for cuts in itertools.combinations(range(1, n), rows - 1):
            groups = [photos[a:b] for a, b in zip((0,) + cuts, cuts + (n,))]
            heights = [(W - gap * (len(g) - 1)) / sum(p["ar"] for p in g) for g in groups]
            total = sum(heights) + gap * (rows - 1)
            s = min(1.0, (H - gap * (rows - 1)) / (total - gap * (rows - 1)))
            used = (W * s) * (min(total, H) if s == 1.0 else H) / (W * H)
            score = (1 - used) + 0.25 * (max(heights) / min(heights) - 1)
            if best is None or score < best[0]:
                best = (score, groups, heights, s)
    _, groups, heights, s = best
    y, block_h = 0.0, sum(h * s for h in heights) + gap * (len(groups) - 1)
    for g, h in zip(groups, heights):
        h *= s
        x = 0.0
        for p in g:
            w = p["ar"] * h
            out.append((p["src"], round(x), round(y), round(w), round(h)))
            x += w + gap
        y += h + gap
    return out, block_h


def best_layout(photos, W, H, gap, crop, reorder=True):
    """Try the given order, then (up to 7 photos) every order, and keep the layout that covers the most of the box."""
    orders = [photos]
    if reorder and len(photos) <= 7:
        orders += [list(o) for o in itertools.permutations(photos)][1:]
    best = None
    for o in orders:
        cells, bh = layout(o, W, H, gap, crop)
        area = sum(w * h for _, _, _, w, h in cells)
        if best is None or area > best[0] * 1.03:      # keep the original order unless another is clearly better
            best = (area, cells, bh)
    return best[1], best[2]


def main(argv):
    X, Y, W, H, gap, radius, crop, reorder, items = 128, 340, 1664, 580, 20, 22, 0.2, True, []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--box": X, Y, W, H = map(int, argv[i + 1:i + 5]); i += 5; continue
        if a == "--gap": gap = int(argv[i + 1]); i += 2; continue
        if a == "--radius": radius = int(argv[i + 1]); i += 2; continue
        if a == "--crop": crop = float(argv[i + 1]); i += 2; continue
        if a == "--keep-order": reorder = False; i += 1; continue
        items.append(parse(a)); i += 1
    if not 1 <= len(items) <= 10:
        sys.exit("give 1 to 10 photos; for more, split them across two slides")
    cells, block_h = best_layout(items, W, H, gap, crop, reorder)
    top = Y
    print(f'<div class="rise" style="--i:2; position:absolute; left:{X}px; top:{top}px; width:{W}px; height:{round(block_h)}px">')
    for src, x, y, w, h in cells:
        print(f'<img src="{src}" alt="" style="position:absolute; left:{x}px; top:{y}px; width:{w}px; height:{h}px; object-fit:cover; border-radius:{radius}px">')
    print("</div>")


if __name__ == "__main__":
    main(sys.argv[1:])
