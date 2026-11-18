#!/usr/bin/env python3
"""
Makes the small/medium image versions the site uses, so phones never download
more pixels than they display.

  python3 scripts/optimize-images.py

For every  public/img/**/NAME.webp  (that isn't already a -240/-480 version) it writes
  NAME-240.webp  (tiny: orbiting items, thumbnails)
  NAME-480.webp  (cards and grid tiles)
Logos (PNG) are converted to small WebP files.
Photos for the inspired-by range are cropped square from /perfumes (see INSPIRED below).
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "public" / "img"
SRC = ROOT / "perfumes"

# Raw photo in /perfumes  ->  (output name, vertical focus 0=top 1=bottom)
INSPIRED = {
    "texas-55-ml-edp-erkek-parfum-faf631 (5).jpg": ("inspired-texas", 1.0),
    "ares-55-ml-edp-erkek-parfum-c-4fa8 (4).png": ("inspired-ares", 1.0),
    "stronger-intensely-55-ml-edp-erkek-par-a6d186 (1).jpg": ("inspired-stronger-intensely", 1.0),
    "spice-bomb-55-ml-edp-erkek-parfum-6-9f37 (2).jpg": ("inspired-spicebomb", 1.0),
    "champion-55-ml-edp-erkek-parfum-9bed-4 (1).png": ("inspired-champion", 0.62),
    "stronger-55-ml-edp-erkek-parfum-22a-f2 (1).png": ("inspired-stronger", 0.8),
    "bad-boy-55-ml-edp-erkek-parfum--8528-.jpg": ("inspired-badboy", 1.0),
    "8576_1200x1755 (2).jpg": ("inspired-nomade", 0.95),
}

SIZES = (240, 480)


def flatten(im: Image.Image) -> Image.Image:
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert("RGB")


def square(im: Image.Image, focus_y: float) -> Image.Image:
    w, h = im.size
    s = min(w, h)
    left = (w - s) // 2
    top = int(round((h - s) * focus_y))
    return im.crop((left, top, left + s, top + s))


def variants(path: Path):
    im = Image.open(path)
    for size in SIZES:
        # always write every size (the site's srcset expects them); small photos are just re-saved
        out = path.with_name(f"{path.stem}-{size}.webp")
        r = im.copy()
        if im.width > size:
            r.thumbnail((size, size * 4), Image.LANCZOS)
        r.save(out, "WEBP", quality=78, method=6)


def main():
    prod = IMG / "products"
    # 1) inspired-by photos -> square 800px masters
    for raw, (name, fy) in INSPIRED.items():
        p = SRC / raw
        if not p.exists():
            print("missing", raw)
            continue
        im = square(flatten(Image.open(p)), fy)
        im = im.resize((800, 800), Image.LANCZOS)
        im.save(prod / f"{name}.webp", "WEBP", quality=80, method=6)

    # 2) -240 / -480 versions of every master webp
    for p in sorted(IMG.rglob("*.webp")):
        if p.stem.endswith(("-240", "-480")) or "mark" in p.stem:
            continue
        variants(p)

    # 3) logos: PNG -> small WebP (keeps transparency)
    for name, width in {"mark-dark": 72, "mark-light": 240, "wordmark-dark": 210, "wordmark-light": 390}.items():
        im = Image.open(IMG / f"{name}.png").convert("RGBA")
        im.thumbnail((width, width * 4), Image.LANCZOS)
        im.save(IMG / f"{name}.webp", "WEBP", quality=85, method=6)

    total = sum(f.stat().st_size for f in IMG.rglob("*") if f.is_file())
    print(f"done; public/img now {total/1024:.0f} KB")


if __name__ == "__main__":
    main()
