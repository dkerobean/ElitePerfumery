#!/usr/bin/env python3
"""
Makes every image the site serves as small as possible.

  pnpm images        (same as: python3 scripts/optimize-images.py)

What it does
  1. Inspired-by photos in /perfumes  ->  square 800px masters (see INSPIRED below)
  2. Every public/img/**/NAME.webp     ->  NAME-240.webp and NAME-480.webp (srcset sizes)
  3. Logo PNGs                         ->  small WebP logos
  4. Everything above, plus the masters, icons and the social-share image, is run
     through TinyPNG (smart lossy compression) when a key is available.

TinyPNG
  Put your key in .env.local (git-ignored, never committed):   TINIFY_KEY=xxxxxxxx
  The free plan covers 500 images a month. Results are recorded in
  scripts/tinify-cache.json, so re-running only sends new or changed images.
  Without a key the script still works; it just skips step 4.
"""
from __future__ import annotations

import base64
import hashlib
import io
import json
import os
import ssl
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "public" / "img"
SRC = ROOT / "perfumes"
CACHE_FILE = ROOT / "scripts" / "tinify-cache.json"

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
LOGOS = {"mark-dark": 72, "mark-light": 240, "wordmark-dark": 210, "wordmark-light": 390}
IN_PLACE = ["og-flyer.jpg", "icon-192.png", "apple-touch-icon.png"]  # compressed, format kept
SIZES = (240, 480)

# ---------------------------------------------------------------- helpers

def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:16]


def rel(p: Path) -> str:
    return p.relative_to(ROOT).as_posix()


def webp_bytes(im: Image.Image, quality: int) -> bytes:
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=quality, method=6)
    return buf.getvalue()


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


def tinify_key() -> str | None:
    if os.environ.get("TINIFY_KEY"):
        return os.environ["TINIFY_KEY"].strip()
    env = ROOT / ".env.local"
    if env.exists():
        for line in env.read_text().splitlines():
            if line.startswith("TINIFY_KEY="):
                return line.split("=", 1)[1].strip() or None
    return None


def ssl_context() -> ssl.SSLContext:
    """Some Python installs (e.g. python.org on macOS) ship without CA certificates."""
    try:
        import certifi  # type: ignore

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        pass
    for bundle in ("/etc/ssl/cert.pem", "/etc/ssl/certs/ca-certificates.crt"):
        if os.path.exists(bundle):
            return ssl.create_default_context(cafile=bundle)
    return ssl.create_default_context()


class Tinify:
    """Minimal TinyPNG client (https://tinypng.com/developers/reference)."""

    def __init__(self, key: str):
        self.ctx = ssl_context()
        self.auth = "Basic " + base64.b64encode(f"api:{key}".encode()).decode()
        self.count: int | None = None
        self.stopped: str | None = None  # set when the monthly limit is hit or the key is rejected

    def shrink(self, data: bytes) -> bytes | None:
        if self.stopped:
            return None
        req = urllib.request.Request("https://api.tinify.com/shrink", data=data, method="POST")
        req.add_header("Authorization", self.auth)
        try:
            with urllib.request.urlopen(req, timeout=60, context=self.ctx) as r:
                self.count = int(r.headers.get("Compression-Count", "0") or 0)
                out_url = json.loads(r.read())["output"]["url"]
            get = urllib.request.Request(out_url, headers={"Authorization": self.auth})
            with urllib.request.urlopen(get, timeout=60, context=self.ctx) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")[:200]
            if e.code in (401, 429):
                self.stopped = f"TinyPNG {e.code}: {body}"
            else:
                print(f"  ! TinyPNG error {e.code}: {body}")
            return None
        except Exception as e:  # network trouble: keep the local version
            print(f"  ! TinyPNG failed: {e}")
            return None


# ---------------------------------------------------------------- pipeline

class Job:
    """One output file. `make()` returns (fallback bytes, bytes to send to TinyPNG)."""

    def __init__(self, out: Path, src_key: str, make):
        self.out, self.src_key, self.make = out, src_key, make


def run(jobs: list[Job], cache: dict, tiny: Tinify | None) -> None:
    def up_to_date(j: Job) -> bool:
        c = cache.get(rel(j.out))
        return bool(c) and j.out.exists() and c.get("src") == j.src_key and c.get("out") == sha(j.out.read_bytes()) and (c.get("tiny") or not tiny)

    todo = [j for j in jobs if not up_to_date(j)]

    def work(j: Job):
        fallback, hi = j.make()
        best, tiny_done = fallback, False
        if tiny:
            t = tiny.shrink(hi)
            if t is not None:
                tiny_done = True
                if len(t) < len(best):
                    best = t
        j.out.write_bytes(best)
        return j, best, tiny_done

    with ThreadPoolExecutor(max_workers=6) as ex:
        for j, best, tiny_done in ex.map(work, todo):
            cache[rel(j.out)] = {"src": j.src_key, "out": sha(best), "tiny": tiny_done, "bytes": len(best)}
            print(f"  {rel(j.out):58s} {len(best)/1024:6.1f} KB{'  (TinyPNG)' if tiny_done else ''}")


def main():
    key = tinify_key()
    tiny = Tinify(key) if key else None
    cache = json.loads(CACHE_FILE.read_text()) if CACHE_FILE.exists() else {}
    before = sum(f.stat().st_size for f in IMG.rglob("*") if f.is_file())
    print("TinyPNG: on" if tiny else "TinyPNG: off (no TINIFY_KEY in .env.local)")
    prod = IMG / "products"

    # 1) inspired-by masters from the raw photos (skipped where the raw photo isn't on this machine)
    jobs = []
    for raw, (name, fy) in INSPIRED.items():
        p = SRC / raw
        if not p.exists():
            continue

        def make(p=p, fy=fy):
            im = square(flatten(Image.open(p)), fy).resize((800, 800), Image.LANCZOS)
            return webp_bytes(im, 80), webp_bytes(im, 95)

        jobs.append(Job(prod / f"{name}.webp", f"{sha(p.read_bytes())}:{fy}:800", make))
    run(jobs, cache, tiny)

    # 2) the other masters, compressed in place (format kept)
    masters = [p for p in sorted(IMG.rglob("*.webp")) if not p.stem.endswith(("-240", "-480")) and "mark" not in p.stem]
    in_place = masters + [IMG / n for n in IN_PLACE if (IMG / n).exists()]
    jobs = []
    for p in in_place:
        c = cache.get(rel(p))
        data = p.read_bytes()
        # its "source" is whatever it was before we first compressed it
        src_key = c["src"] if c and c.get("out") == sha(data) else sha(data)

        def make(data=data):
            return data, data

        jobs.append(Job(p, src_key, make))  # step-1 outputs are already up to date, so they're skipped
    run(jobs, cache, tiny)

    # 3) -240 / -480 versions of every master (from the final master)
    jobs = []
    for p in masters:
        msha = sha(p.read_bytes())
        for size in SIZES:
            def make(p=p, size=size):
                im = Image.open(p)
                if im.width > size:  # small photos are just re-saved: srcset expects every size
                    im = im.copy()
                    im.thumbnail((size, size * 4), Image.LANCZOS)
                return webp_bytes(im, 78), webp_bytes(im, 95)

            jobs.append(Job(p.with_name(f"{p.stem}-{size}.webp"), f"{msha}:{size}", make))
    run(jobs, cache, tiny)

    # 4) logos: PNG -> small WebP (keeps transparency)
    jobs = []
    for name, width in LOGOS.items():
        png = IMG / f"{name}.png"
        if not png.exists():
            continue

        def make(png=png, width=width):
            im = Image.open(png).convert("RGBA")
            im.thumbnail((width, width * 4), Image.LANCZOS)
            return webp_bytes(im, 85), webp_bytes(im, 100)

        jobs.append(Job(IMG / f"{name}.webp", f"{sha(png.read_bytes())}:{width}", make))
    run(jobs, cache, tiny)

    CACHE_FILE.write_text(json.dumps(dict(sorted(cache.items())), indent=1) + "\n")
    after = sum(f.stat().st_size for f in IMG.rglob("*") if f.is_file())
    print(f"done; public/img {before/1024:.0f} KB -> {after/1024:.0f} KB")
    if tiny and tiny.count is not None:
        print(f"TinyPNG compressions used this month: {tiny.count} of 500 free")
    if tiny and tiny.stopped:
        print(f"TinyPNG stopped early ({tiny.stopped}); the rest kept their local compression.")
        sys.exit(1)


if __name__ == "__main__":
    main()
