#!/usr/bin/env python3
"""
Compose PWA / Apple touch icons from brand PNGs on the same gray as web (--background #1e1e1e).
Usage:
  python tools/generate_pwa_icons_from_brand.py [--member PATH] [--trainer PATH]

Defaults: member/trainer under %USERPROFILE%/Downloads/member.png and trainer.png
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from PIL import Image

# Matches Frontend/app/globals.css --background
WEB_BG = (30, 30, 30)  # #1e1e1e
# Maskable safe zone ~80% (10% inset each side)
SAFE = 0.8


def compose_square(src: Path, size: int) -> Image.Image:
    fg = Image.open(src).convert("RGBA")
    canvas = Image.new("RGBA", (size, size), (*WEB_BG, 255))
    inner = int(size * SAFE)
    pad = (size - inner) // 2
    fw, fh = fg.size
    scale = min(inner / fw, inner / fh)
    nw = max(1, int(fw * scale))
    nh = max(1, int(fh * scale))
    fg = fg.resize((nw, nh), Image.Resampling.LANCZOS)
    x = pad + (inner - nw) // 2
    y = pad + (inner - nh) // 2
    canvas.paste(fg, (x, y), fg)
    return canvas


def main() -> None:
    dl = Path(os.environ.get("USERPROFILE", ".")) / "Downloads"
    p = argparse.ArgumentParser()
    p.add_argument("--member", type=Path, default=dl / "member.png")
    p.add_argument("--trainer", type=Path, default=dl / "trainer.png")
    p.add_argument("--out", type=Path, default=Path("public/icons"))
    args = p.parse_args()

    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=True)

    if not args.member.is_file():
        raise SystemExit(f"Member source not found: {args.member}")
    if not args.trainer.is_file():
        raise SystemExit(f"Trainer source not found: {args.trainer}")

    # Default install / home-screen icons (member artwork — primary audience)
    compose_square(args.member, 192).save(out / "pwa-192.png", optimize=True)
    compose_square(args.member, 512).save(out / "pwa-512.png", optimize=True)
    compose_square(args.member, 180).convert("RGB").save(out / "apple-touch-icon.png", optimize=True)

    # Manifest shortcut tiles (96 is a common minimum for shortcuts)
    compose_square(args.member, 96).save(out / "shortcut-member-96.png", optimize=True)
    compose_square(args.trainer, 96).save(out / "shortcut-trainer-96.png", optimize=True)

    print(f"[ok] Wrote icons to {out} (background #{WEB_BG[0]:02x}{WEB_BG[1]:02x}{WEB_BG[2]:02x})")


if __name__ == "__main__":
    main()
