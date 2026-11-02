#!/usr/bin/env python3
"""compress-carousel.py - make the banner pictures smaller.

The four pictures in the banner at the top of the site were 2658
pixels wide and cost about 1.2 MB between them. Every page of the
site carries them, so every visitor on a phone downloaded a megabyte
of banner before the page could finish painting - and the first of
the four is the largest picture on the screen, the one the page is
judged on.

This makes two smaller copies of each picture:

  * <name>-1600.jpg, 1600 wide, for the screens that are big enough
    to show it;
  * <name>-800.jpg, 800 wide, for the phones - which is all a
    390-pixel screen needs, and a quarter of the weight.

The original pictures are left where they are. Nothing is overwritten:
the pages ask for the new copies, and the old ones stay in the
repository until they are no longer needed.

The pages ask for the right one with a srcset. See
scripts/update-carousel-markup.mjs.

Run:  python scripts/compress-carousel.py
Needs Pillow:  pip install pillow
"""

import io
import os
import sys

try:
    from PIL import Image
except ImportError:
    print("compress-carousel: Pillow is not installed. Run:  pip install pillow")
    sys.exit(1)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAROUSEL = os.path.join(ROOT, "assets", "images", "banners", "carousel")

# The copies that are made: the width, and the quality.
# The banner is a soft-focus product photograph - there is no fine
# writing in it to keep sharp - so a lower quality is invisible at
# the size it is shown, and the file is half the weight.
LARGE = (1600, 74)
SMALL = (800, 72)

# The pictures in the banner, in the order they appear.
BANNERS = ["Tzero_website_banner.jpg", "7.jpg", "11.jpg", "9.jpg"]


def encode(im, width, quality):
    """The picture, made smaller and put back together."""
    out = im.copy()
    out.thumbnail((width, 10000), Image.LANCZOS)
    buf = io.BytesIO()
    out.convert("RGB").save(
        buf, "JPEG", quality=quality, subsampling=2,
        optimize=True, progressive=True,
    )
    return out.size, buf.getvalue()


def main():
    if not os.path.isdir(CAROUSEL):
        print("compress-carousel: %s is not there" % CAROUSEL)
        sys.exit(1)

    total_before = 0
    total_after = 0

    print("%-30s %9s %9s %9s" % ("file", "before", "1600", "800"))
    for name in BANNERS:
        path = os.path.join(CAROUSEL, name)
        if not os.path.exists(path):
            print("  %s is missing - skipped" % name)
            continue

        before = os.path.getsize(path)
        total_before += before

        with Image.open(path) as im:
            (w, h), large = encode(im, *LARGE)
        with Image.open(path) as im:
            (_, _), small = encode(im, *SMALL)

        large_path = os.path.join(CAROUSEL, name[:-4] + "-1600.jpg")
        small_path = os.path.join(CAROUSEL, name[:-4] + "-800.jpg")
        with open(large_path, "wb") as fh:
            fh.write(large)
        with open(small_path, "wb") as fh:
            fh.write(small)

        total_after += len(large) + len(small)
        print("%-30s %7d KB %7d KB %7d KB  (%dx%d)"
              % (name, before // 1024, len(large) // 1024, len(small) // 1024, w, h))

    print()
    print("the four pictures: %d KB now, %d KB in the two new sizes"
          % (total_before // 1024, total_after // 1024))
    print("Run node scripts/update-carousel-markup.mjs to point the pages at them.")


if __name__ == "__main__":
    main()
