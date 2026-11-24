#!/usr/bin/env python3
"""Swap every ASSET:<path> placeholder in a deck's slides for its uploaded /_blob/<id>. Standard library only.

Usage: python3 fill_assets.py <folder that holds project/> <uploads.json> <skill folder>
  uploads.json maps each skill asset path (as written after ASSET:) to the id the upload returned:
    {"glows/purple-right.png": "<32-hex id>", "brand/opal-white.png": "<32-hex id>", ...}
Writes the slides in place and <folder>/blobs.json (id -> local file) for preview.mjs.
Lists any ASSET: path that has no upload yet, so you know what is left to upload.
"""
import json, os, re, sys

root, uploads_path, skill = sys.argv[1:4]
uploads = json.load(open(uploads_path))
slides = os.path.join(root, "project", "slides")
missing, blobs = set(), {}
for name in sorted(os.listdir(slides)):
    path = os.path.join(slides, name)
    html = open(path).read()

    def swap(m):
        asset = m.group(1)
        if asset not in uploads:
            missing.add(asset)
            return m.group(0)
        blobs[uploads[asset]] = os.path.abspath(os.path.join(skill, "assets", asset))
        return "/_blob/" + uploads[asset]

    open(path, "w").write(re.sub(r"ASSET:([\w./-]+)", swap, html))
json.dump(blobs, open(os.path.join(root, "blobs.json"), "w"), indent=1)
if missing:
    print("Upload these, add them to uploads.json and run again:\n  " + "\n  ".join(sorted(missing)))
    sys.exit(1)
print(f"✓ {len(blobs)} assets filled; blobs.json written")
