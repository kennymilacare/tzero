#!/usr/bin/env python3
"""compress-photos.py - give every photograph the sizes the pages show it in.

The photographs were stored at the size the camera took them: the
product shots are 2048 pixels square, and the studded one weighed
880 KB. The page shows that photograph 300 pixels wide in the
catalogue and 600 on its own page. A visitor on a phone was
downloading a photograph six times the size of the screen it went
on - and the catalogue alone asked for 2.1 MB of pictures.

This makes, for each photograph:

  * <name>-320.webp  <name>-640.webp  <name>-1200.webp
    the three widths the pages use, in WebP. Almost every browser
    asks for WebP, and the same picture in WebP is about a third
    of the weight of the .jpg.
  * <name>-320.jpg   <name>-640.jpg   <name>-1200.jpg
    the same three widths in JPEG, for the browsers that do not
    take WebP.

The original stays where it is. It is what the structured data
points at, and what a link to the photograph should give.

The pages ask for the right copy with a <picture> and a srcset.
See assets/js/photos.js.

Run it once to see what it would do:

    python scripts/compress-photos.py

Run it for real:

    python scripts/compress-photos.py --apply

Needs Pillow:  pip install pillow
"""

import io
import os
import sys

try:
    from PIL import Image, features
except ImportError:
    print("compress-photos: Pillow is not installed. Run:  pip install pillow")
    sys.exit(1)

if not features.check("webp"):
    print("compress-photos: this Pillow was built without WebP support.")
    sys.exit(1)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES = os.path.join(ROOT, "assets", "images")

# The folders the photographs live in. The Open Graph pictures, the
# logos and the icons are not photographs and are left alone.
FOLDERS = ("products", "news")

# One photograph outside those folders is on a page: the picture the
# home page opens with. It is the only photograph left in couples/ —
# the stock pictures that used to sit beside it were never on a page
# and were removed on 2026-11-06.
EXTRA = ("couples/hero-product-studded.jpg",)

# The widths the pages use. A phone is 390 pixels across, a card is
# about 300 and a product page about 600 - so 320 serves the small
# screens, 640 the cards, and 1200 the big ones with a retina screen
# to spare. These must match PHOTO_WIDTHS in assets/js/photos.js.
WIDTHS = (320, 640, 1200)

# The quality. A photograph of a product on a plain background has
# no fine writing to keep sharp, and 80 is where WebP stops
# costing quality and starts costing bytes.
WEBP_QUALITY = 80
JPEG_QUALITY = 82

# A picture smaller than this is not worth cutting up: there is
# nothing to save.
MIN_WIDTH = WIDTHS[0]


def rel(path):
    return os.path.relpath(path, ROOT).replace(os.sep, "/")


def photographs():
    for folder in FOLDERS:
        directory = os.path.join(IMAGES, folder)
        if not os.path.isdir(directory):
            continue
        for name in sorted(os.listdir(directory)):
            if name.lower().endswith((".jpg", ".jpeg")):
                yield os.path.join(directory, name)
    for extra in EXTRA:
        path = os.path.join(IMAGES, *extra.split("/"))
        if os.path.exists(path):
            yield path


def encode(im, width):
    """The picture, made smaller and put back together."""
    out = im.copy()
    if out.size[0] > width:
        height = round(out.size[1] * width / out.size[0])
        out = out.resize((width, height), Image.LANCZOS)
    return out


def to_webp(im, width):
    out = encode(im, width)
    buf = io.BytesIO()
    out.convert("RGB").save(buf, "WEBP", quality=WEBP_QUALITY, method=6)
    return out.size, buf.getvalue()


def to_jpeg(im, width):
    out = encode(im, width)
    buf = io.BytesIO()
    out.convert("RGB").save(
        buf, "JPEG", quality=JPEG_QUALITY, subsampling=2,
        optimize=True, progressive=True,
    )
    return out.size, buf.getvalue()


def main():
    apply = "--apply" in sys.argv

    # --apply takes the exact files to create. Nothing outside that
    # list is touched, and a file that already exists is left alone:
    # this only ever adds a copy, it never replaces one.
    wanted = [w for w in sys.argv[1:] if not w.startswith("--")]
    allowed = {os.path.normcase(os.path.abspath(w)) for w in wanted} if wanted else None

    plan = []
    total_before = 0
    total_after = 0

    print("%-52s %9s %9s %9s %9s"
          % ("file", "original", "320 webp", "640 webp", "1200 webp"))
    for path in photographs():
        name = rel(path)
        before = os.path.getsize(path)
        total_before += before

        with Image.open(path) as im:
            im.load()
            if im.size[0] < MIN_WIDTH:
                total_after += before
                continue

            made = {}
            for width in WIDTHS:
                (_w, _h), webp = to_webp(im, width)
                made[width] = len(webp)

            # What a visitor actually takes: the small copy in a
            # card, the large one on a product page. Both are WebP.
            taken = made[WIDTHS[0]] if before > made[WIDTHS[-1]] else made[WIDTHS[-1]]
            total_after += taken
            plan.append((path, before, made))

    for path, before, made in plan:
        print("%-52s %7d KB %7d KB %7d KB %7d KB"
              % (rel(path), before // 1024, made[WIDTHS[0]] // 1024,
                 made[WIDTHS[1]] // 1024, made[WIDTHS[2]] // 1024))

    print()
    print("one copy of every photograph on the site:")
    print("  %d KB now, %d KB after" % (total_before // 1024, total_after // 1024))

    # The exact list of files that --apply will write. Nothing else
    # is touched: the originals stay where they are.
    written = []
    for path, _before, _made in plan:
        base, _ext = os.path.splitext(path)
        for width in WIDTHS:
            for suffix in (".webp", ".jpg"):
                target = "%s-%d%s" % (base, width, suffix)
                if allowed is not None:
                    if os.path.normcase(os.path.abspath(target)) not in allowed:
                        continue
                written.append(rel(target))

    print()
    print("--apply will write these %d files:" % len(written))
    for name in written:
        print("  " + name)

    if not apply:
        print("\nNothing was written. Run again with --apply to do it.")
        return

    for path, _before, _made in plan:
        base, _ext = os.path.splitext(path)
        with Image.open(path) as im:
            im.load()
            for width in WIDTHS:
                for suffix, writer in ((".webp", to_webp), (".jpg", to_jpeg)):
                    target = "%s-%d%s" % (base, width, suffix)
                    if allowed is not None:
                        if os.path.normcase(os.path.abspath(target)) not in allowed:
                            continue
                    if os.path.exists(target):
                        print("  skipped %s (already there)" % rel(target))
                        continue
                    _size, data = writer(im, width)
                    with open(target, "wb") as fh:
                        fh.write(data)
                    print("  wrote %s" % rel(target))


if __name__ == "__main__":
    main()
