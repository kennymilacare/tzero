#!/usr/bin/env python3
"""compress-images.py - make the site's images smaller.

The images on the site came to 38 MB. The photographs were stored as
PNG, which is lossless: a 2658x984 banner cost 2.6 MB, and the first
one on the page was the largest paint a visitor had to wait for.

This script:

  * turns a PNG photograph into a JPEG, writes the .jpg beside it and
    points the HTML at the new file;
  * re-encodes a JPEG that is heavier than it needs to be;
  * leaves a PNG alone when it has transparency (a logo needs it) or
    when it is small enough not to matter;
  * removes the files that neither a page nor a document mentions -
    they are dead weight in every deployment.

Run it once to see what it would do:

    python scripts/compress-images.py

Run it for real:

    python scripts/compress-images.py --apply

Needs Pillow:  pip install pillow
"""

import io
import os
import sys

try:
    from PIL import Image
except ImportError:
    print("compress-images: Pillow is not installed. Run:  pip install pillow")
    sys.exit(1)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_DIR = os.path.join(ROOT, "assets", "images")

# Under this size an image is not worth touching.
MIN_BYTES = 120 * 1024

# Photographs: JPEG 4:2:0 at this quality is indistinguishable from the
# original at the size they are shown, and a tenth of the weight.
PHOTO_QUALITY = 82
PHOTO_SUBSAMPLING = 2

# Graphics with fine text: no chroma subsampling and a higher quality,
# so the small writing stays readable.
GRAPHIC_QUALITY = 90
GRAPHIC_SUBSAMPLING = 0

# Graphics - text and flat shapes, not photographs. Matched on the
# name without the extension, so a graphic stays a graphic after it
# has been turned into a .jpg.
GRAPHIC = {
    "assets/images/products/lubricant-comparison",
    "assets/images/products/hyaluronic-acid",
}

# Never touched. The Open Graph image stays a PNG: social platforms
# read it, and it is not on the critical path for a visitor.
KEEP = {
    "assets/images/og-image.png",
}

# The obvious name is taken by a different picture (a crop of the
# brand's own banner, credited in couples/CREDITS.md), so the file
# the home page shows gets its own name.
RENAME = {
    "assets/images/couples/hero-product.png": "assets/images/couples/hero-product-studded.jpg",
}

# The files that make up the site: pages, styles, scripts and the
# data they read.
CODE_SUFFIXES = (".html", ".css", ".js", ".mjs", ".json", ".xml", ".yml")
# Anything a person wrote down counts as a mention too.
DOC_SUFFIXES = CODE_SUFFIXES + (".md", ".txt")
SKIP_DIRS = (".git", "node_modules", ".tmp-test", ".tmp-verify")


def has_transparency(im):
    if im.mode in ("RGBA", "LA"):
        return True
    if im.mode == "P":
        return "transparency" in im.info
    return False


def rel(path):
    return os.path.relpath(path, ROOT).replace(os.sep, "/")


def images():
    for base, _dirs, files in os.walk(IMAGE_DIR):
        for name in sorted(files):
            if name.lower().endswith((".png", ".jpg", ".jpeg")):
                yield os.path.join(base, name)


def files_with(suffixes):
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            if name.endswith(suffixes):
                yield os.path.join(base, name)


def mentioned(name, suffixes):
    """Is this file named anywhere in the given kind of file?"""
    for path in files_with(suffixes):
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                if name in fh.read():
                    return True
        except OSError:
            continue
    return False


def encode(im, quality, subsampling):
    buf = io.BytesIO()
    im.convert("RGB").save(
        buf, "JPEG", quality=quality, subsampling=subsampling,
        optimize=True, progressive=True,
    )
    return buf.getvalue()


def settings_for(name):
    if os.path.splitext(name)[0] in GRAPHIC:
        return GRAPHIC_QUALITY, GRAPHIC_SUBSAMPLING
    return PHOTO_QUALITY, PHOTO_SUBSAMPLING


def repoint(old_rel, new_rel):
    """Point the pages at the new file, keeping the line endings."""
    changed = []
    for path in files_with(CODE_SUFFIXES):
        with open(path, "r", encoding="utf-8", newline="") as fh:
            raw = fh.read()
        if old_rel not in raw:
            continue
        with open(path, "w", encoding="utf-8", newline="") as fh:
            fh.write(raw.replace(old_rel, new_rel))
        changed.append(rel(path))
    return changed


def main():
    apply = "--apply" in sys.argv
    dry = "--dry-run" in sys.argv or not apply
    strays = []
    plan = []
    total_before = 0
    total_after = 0

    for path in images():
        name = rel(path)
        size = os.path.getsize(path)
        total_before += size

        if name in KEEP:
            total_after += size
            continue

        base = os.path.basename(path)
        used = mentioned(base, CODE_SUFFIXES)
        known = used or mentioned(base, DOC_SUFFIXES)

        if not known:
            strays.append((name, size))
            continue

        if not used or size < MIN_BYTES:
            total_after += size
            continue

        with Image.open(path) as im:
            if has_transparency(im):
                total_after += size
                continue
            data = encode(im, *settings_for(name))

        if len(data) >= size:
            total_after += size
            continue

        if path.lower().endswith(".png"):
            target = RENAME.get(name, name[:-4] + ".jpg")
            plan.append((name, target, size, len(data), True))
        else:
            plan.append((name, name, size, len(data), False))
        total_after += len(data)

    if strays:
        print("Nothing on the site or in the docs mentions these - they only")
        print("make the repository heavier:")
        for name, size in strays:
            print("  %s (%d KB)" % (name, size // 1024))
        print()

    if plan:
        print("%-58s %9s %9s" % ("file", "before", "after"))
        for old_rel, new_rel, before, after, renamed in plan:
            mark = " -> " + new_rel.split("/")[-1] if renamed else ""
            print("%-58s %7d KB %7d KB" % (old_rel + mark, before // 1024, after // 1024))
        print()

    kept = total_after + sum(s for _n, s in strays)
    print("total %d KB -> %d KB" % (total_before // 1024, kept // 1024))

    if not apply or dry:
        if strays or plan:
            print("\nNothing was written. Run again with --apply to do it.")
        else:
            print("\nEvery image is already lean.")
        return

    for name, size in strays:
        os.remove(os.path.join(ROOT, name))
        print("  removed %s (%d KB) - nothing mentioned it" % (name, size // 1024))

    for old_rel, new_rel, _before, _after, renamed in plan:
        old_path = os.path.join(ROOT, old_rel)
        new_path = os.path.join(ROOT, new_rel)
        # Only a file that changes its name can already be there. A file
        # that is compressed in place is, of course, already there.
        if renamed and os.path.exists(new_path):
            print("  skipped %s: %s already exists" % (old_rel, new_rel))
            continue
        with Image.open(old_path) as im:
            data = encode(im, *settings_for(old_rel))
        with open(new_path, "wb") as fh:
            fh.write(data)
        if renamed:
            for c in repoint(old_rel, new_rel):
                print("  %s: %s -> %s" % (c, old_rel, new_rel))
            os.remove(old_path)
            print("  wrote %s (%d KB), removed %s" % (new_rel, len(data) // 1024, old_rel))
        else:
            print("  rewrote %s (%d KB)" % (new_rel, len(data) // 1024))


if __name__ == "__main__":
    main()
