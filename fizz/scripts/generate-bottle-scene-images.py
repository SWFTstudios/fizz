#!/usr/bin/env python3
"""Composite Fizz bottle PNGs onto colorway scene backgrounds for PDP hero images."""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

COLORS = [
    "arctic-white",
    "charcoal-black",
    "coral-orange",
    "electric-blue",
    "sage-green",
    "steel-navy",
]

SCENE_COLORS: dict[str, tuple[str, str]] = {
    "electric-blue": ("#061018", "#2f6fd6"),
    "coral-orange": ("#1a0f08", "#f07a2e"),
    "sage-green": ("#0a1a12", "#2e8b57"),
    "charcoal-black": ("#080a0d", "#16161a"),
    "arctic-white": ("#d4d3cc", "#efeee8"),
    "steel-navy": ("#0f1a2e", "#26344f"),
}

CANVAS_SIZE = (1400, 1750)
BOTTLE_HEIGHT_RATIO = 0.68
BOTTLE_TOP_RATIO = 0.1
JPEG_QUALITY = 92


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def lerp_channel(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def make_radial_scene(bg: str, bg_end: str, size: tuple[int, int]) -> Image.Image:
    width, height = size
    outer = hex_to_rgb(bg)
    inner = hex_to_rgb(bg_end)
    img = Image.new("RGB", size)
    pixels = img.load()
    cx = width * 0.5
    cy = height * 0.92
    rx = width * 0.42
    ry = height * 0.55

    for y in range(height):
        for x in range(width):
            dx = (x - cx) / rx
            dy = (y - cy) / ry
            dist = min(1.0, math.sqrt(dx * dx + dy * dy))
            pixels[x, y] = (
                lerp_channel(inner[0], outer[0], dist),
                lerp_channel(inner[1], outer[1], dist),
                lerp_channel(inner[2], outer[2], dist),
            )

    return img


def composite_bottle(scene: Image.Image, bottle_path: Path) -> Image.Image:
    bottle = Image.open(bottle_path).convert("RGBA")
    target_h = int(scene.height * BOTTLE_HEIGHT_RATIO)
    scale = target_h / bottle.height
    target_w = max(1, int(bottle.width * scale))
    bottle = bottle.resize((target_w, target_h), Image.Resampling.LANCZOS)
    x = (scene.width - target_w) // 2
    y = int(scene.height * BOTTLE_TOP_RATIO)
    scene = scene.convert("RGBA")
    scene.paste(bottle, (x, y), bottle)
    return scene.convert("RGB")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Fizz bottle scene JPGs")
    parser.add_argument(
        "--only",
        dest="only_colors",
        action="append",
        help="Regenerate only these color slugs (repeatable)",
    )
    args = parser.parse_args()

    colors = COLORS
    if args.only_colors:
        colors = [c for c in COLORS if c in args.only_colors]
        unknown = set(args.only_colors) - set(COLORS)
        if unknown:
            print(f"unknown colors: {', '.join(sorted(unknown))}", file=sys.stderr)
            sys.exit(1)

    for color in colors:
        bottle_png = ASSETS / f"fizz-bottle-product-{color}.png"
        out = ASSETS / f"fizz-bottle-scene-{color}.jpg"
        bg, bg_end = SCENE_COLORS.get(color, ("#0f1a2e", "#26344f"))

        if not bottle_png.exists():
            print(f"skip missing bottle PNG for {color}")
            continue

        print(f"{color}: compositing onto scene")
        scene = make_radial_scene(bg, bg_end, CANVAS_SIZE)
        scene = composite_bottle(scene, bottle_png)
        scene.save(out, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        print(f"  wrote {out.name}")


if __name__ == "__main__":
    main()
