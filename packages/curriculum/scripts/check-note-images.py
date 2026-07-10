#!/usr/bin/env python3
"""Gate: every image referenced by a note MDX must exist and be big enough to
carry hotspot pins.

Why this exists: a 56x56 image loads fine, so `naturalWidth > 0` passes and the
Playwright sweep reports success. Nothing else in the pipeline looks at pixels.
Two sessions shipped icon-sized images into HotspotImage before this ran.

Why we parse headers ourselves: `file(1)` prints the EXIF *thumbnail* size for
many JPEGs, so `file x.jpg | grep WxH` silently reports 96x96 for an 899x361
image. That misreading caused a real, wrong bug report. Read the SOF marker.
"""

import glob
import os
import re
import struct
import sys

MIN_W = 640          # below this, hotspot pins land on top of each other
MIN_SIDE = 240       # a 960x50 strip cannot host 5 pins either
NOTES = "content/notes/**/*.mdx"
PUBLIC = "../../apps/platform/public"


def dimensions(path):
    """(width, height) from the file header. None if unparseable."""
    with open(path, "rb") as fh:
        blob = fh.read()

    if blob[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", blob[16:24])

    if blob[:2] == b"\xff\xd8":  # JPEG: walk segments to the true SOF marker
        i = 2
        while i < len(blob) - 9:
            if blob[i] != 0xFF:
                i += 1
                continue
            marker = blob[i + 1]
            # SOF0..SOF15, excluding DHT/JPG/DAC (0xC4/0xC8/0xCC)
            if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                          0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                h, w = struct.unpack(">HH", blob[i + 5:i + 9])
                return w, h
            if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
                i += 2
                continue
            i += 2 + struct.unpack(">H", blob[i + 2:i + 4])[0]
        return None

    if blob[:4] == b"<svg" or b"<svg" in blob[:200]:
        return "vector"

    return None


def main():
    failures = []
    checked = 0

    for note in sorted(glob.glob(NOTES, recursive=True)):
        src = open(note).read()
        rel = os.path.relpath(note, "content/notes")

        # Every referenced image must exist, hotspot or not.
        all_refs = re.findall(r'src="(/notes/[^"]+)"', src)
        # Only HotspotImage sources need to be large: pins are placed by
        # percentage, so a small image crowds them into an unreadable pile.
        # <Figure><img style={{maxWidth:"140px"}}> icons are meant to be small.
        hotspot_refs = {
            m.group(1)
            for m in re.finditer(r'<HotspotImage\b[^>]*?src="(/notes/[^"]+)"', src, re.S)
        }

        for ref in all_refs:
            path = os.path.join(PUBLIC, ref.lstrip("/"))

            if not os.path.exists(path):
                failures.append(f"{rel}: MISSING {ref}")
                continue
            if ref not in hotspot_refs:
                continue

            checked += 1
            dim = dimensions(path)
            if dim == "vector" or dim is None:
                continue  # SVG scales; unparseable formats are not our business

            w, h = dim
            if w < MIN_W or min(w, h) < MIN_SIDE:
                failures.append(f"{rel}: {ref} is {w}x{h} — too small for hotspot pins "
                                f"(need width >= {MIN_W}, both sides >= {MIN_SIDE})")

    print(f"checked {checked} HotspotImage sources for size (all refs checked for existence)")
    for f in failures:
        print(f"  FAIL {f}")
    if failures:
        print(f"\n{len(failures)} image problem(s)")
        return 1
    print("all note images present and large enough")
    return 0


if __name__ == "__main__":
    sys.exit(main())
