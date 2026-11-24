#!/usr/bin/env python3
"""Check a deck's files before publishing. Standard library only (runs in Claude Code and the Claude app).

Usage: python3 check_slides.py <folder that holds project/>
Fails (exit 1) on anything the Slides editor renders differently from a browser, or that breaks the brand:
  - an <img> without an inline pixel width and height (the editor ignores %, max-width, fr: images blow up)
  - an image rule in deck.css that sizes images with %, max-width or max-height
  - leftover template placeholders (ASSET:, IMAGE, {c})
  - a content slide in a Glow deck with no glow backdrop, or two neighbouring slides with the same glow
  - headline letter-spacing tighter than -0.03em (in deck.css or inline)
  - no --accent in deck.css; a template marker or [bracketed placeholder] left in a slide
  - inline text smaller than 24px
Warns (no failure) on [source?] and other [...?]: those are open questions for the handover.
"""
import os, re, sys, json

root = sys.argv[1] if len(sys.argv) > 1 else "."
proj = os.path.join(root, "project")
problems = []
deck = json.load(open(os.path.join(proj, "deck.json")))
css = open(os.path.join(proj, "deck.css")).read() if os.path.exists(os.path.join(proj, "deck.css")) else ""
cave = "Cave theme" in css
if not re.search(r"--accent\s*:", css):
    problems.append("deck.css: --accent is not set; set it once in :root (see SKILL.md §4)")
warnings = []

for sel, body in re.findall(r"([^{}]+)\{([^}]*)\}", css):
    if "img" in sel and re.search(r"(width|height)\s*:\s*\d+%|max-width|max-height", body):
        problems.append(f"deck.css: '{sel.strip()}' sizes images with % or max-*; give each <img> inline px instead")
    if re.search(r"\.(display|title|hero-num)\b", sel):
        m = re.search(r"letter-spacing:\s*(-?[\d.]+)em", body)
        if m and float(m.group(1)) < -0.03:
            problems.append(f"deck.css: '{sel.strip()}' letter-spacing {m.group(1)}em is too tight (use -0.02 to -0.03em)")

px_classes = set()   # classes whose own rule sets both width and height in px
for sel, body in re.findall(r"([^{}]+)\{([^}]*)\}", css):
    if re.search(r"(^|[;\s])width:\s*\d+px", body) and re.search(r"(^|[;\s])height:\s*\d+px", body):
        for cls in re.findall(r"^\s*\.([\w-]+)\s*$", sel.strip() + "\n", re.M):
            px_classes.add(cls)
cave = cave or "Theme: Black" in css

prev_glow = None
for i, sid in enumerate(deck["order"]):
    path = os.path.join(proj, "slides", sid + ".html")
    if not os.path.exists(path):
        problems.append(f"{sid}: listed in order but slides/{sid}.html is missing"); continue
    s = open(path).read()
    for img in re.findall(r"<img\b[^>]*>", s):
        style = (re.search(r'style="([^"]*)"', img) or [None, ""])[1]
        if not (re.search(r"(^|;)\s*width:\s*\d+px", style) and re.search(r"(^|;)\s*height:\s*\d+px", style)):
            classes = set((re.search(r'class="([^"]*)"', img) or [None, ""])[1].split())
            if not classes & px_classes:
                problems.append(f"{sid}: <img> without inline px width and height: {img[:90]}")
    for ph in ("ASSET:", "src=\"IMAGE\"", "{c}"):
        if ph in s:
            problems.append(f"{sid}: template placeholder '{ph}' left in the slide")
    if "<!-- TEMPLATE" in s:
        problems.append(f"{sid}: template marker left in; replace the example copy, then delete the marker line")
    text = re.sub(r"<[^>]+>", " ", re.sub(r"<!--.*?-->", "", s, flags=re.S))
    for br in re.findall(r"\[[^\]]{1,60}\]", text):
        (warnings if br.endswith("?]") else problems).append(f"{sid}: {br} left in the copy")
    for size in re.findall(r"font-size:\s*(\d+)px", s):
        if int(size) < 24:
            problems.append(f"{sid}: inline font-size {size}px; nothing on a slide is under 24px")
    for ls in re.findall(r"letter-spacing:\s*(-?[\d.]+)em", s):
        if float(ls) < -0.03:
            problems.append(f"{sid}: inline letter-spacing {ls}em is too tight (use -0.02 to -0.03em)")
    glow = re.search(r'class="bleed glow[^"]*" src="([^"]+)"', s)
    if not cave and i not in (0, len(deck["order"]) - 1):
        if not glow:
            problems.append(f"{sid}: Glow deck slide with no glow backdrop (add one from assets/glows)")
        elif prev_glow and glow.group(1) == prev_glow:
            problems.append(f"{sid}: same glow position as the slide before; alternate corners")
    prev_glow = glow.group(1) if glow else None

for w in warnings:
    print("! " + w + " (ask, and list it in the handover)")
if problems:
    print("\n".join("✗ " + p for p in problems)); sys.exit(1)
print(f"✓ {len(deck['order'])} slides pass")
