#!/usr/bin/env python3
"""Generate transparent Fizz bottle product PNGs matched to each colorway."""

from __future__ import annotations

import argparse
import io
import sys
from pathlib import Path

from PIL import Image
from rembg import remove

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

STUDIO_SOURCES = {
    "arctic-white": "stitch-bottle-arctic-white-studio.jpg",
    "charcoal-black": "stitch-bottle-charcoal-black-studio.jpg",
    "coral-orange": "stitch-bottle-coral-orange-studio.jpg",
    "sage-green": "stitch-bottle-sage-green-studio.jpg",
}

LIFESTYLE_SOURCES = {
    "electric-blue": ("stitch-bottle-electric-blue-water.jpg", "electric-blue-bottle"),
    "steel-navy": ("stitch-bottle-steel-navy-desk.jpg", "left"),
}

TARGET_HEIGHT = 1400
PADDING_RATIO = 0.05


def crop_bottle_region(img: Image.Image, mode: str) -> Image.Image:
    width, height = img.size

    if mode == "electric-blue-bottle":
        crop_w = int(width * 0.19)
        crop_h = int(height * 0.94)
        left = int(width * 0.73)
        top = int(height * 0.02)
    elif mode == "right-tight":
        crop_w = int(width * 0.26)
        crop_h = int(height * 0.78)
        left = int(width * 0.66)
        top = int(height * 0.05)
    elif mode == "left":
        crop_w = int(width * 0.30)
        crop_h = int(height * 0.90)
        left = int(width * 0.06)
        top = int(height * 0.03)
    else:
        crop_w = int(width * 0.34)
        crop_h = int(height * 0.88)
        left = (width - crop_w) // 2
        top = int(height * 0.04)

    left = max(0, min(left, width - crop_w))
    top = max(0, min(top, height - crop_h))
    return img.crop((left, top, left + crop_w, top + crop_h))


def remove_background(data: bytes) -> Image.Image:
    result = remove(data)
    return Image.open(io.BytesIO(result)).convert("RGBA")


def largest_alpha_component(img: Image.Image) -> Image.Image:
    """Keep the tallest vertical blob — the bottle, not props."""
    alpha = img.split()[-1]
    mask = alpha.point(lambda value: 255 if value > 20 else 0)
    width, height = mask.size
    visited = set()
    best_bbox = None
    best_score = 0

    pixels = mask.load()
    for y in range(height):
        for x in range(width):
            if pixels[x, y] == 0 or (x, y) in visited:
                continue
            stack = [(x, y)]
            min_x = max_x = x
            min_y = max_y = y
            area = 0
            while stack:
                cx, cy = stack.pop()
                if (cx, cy) in visited or cx < 0 or cy < 0 or cx >= width or cy >= height:
                    continue
                if pixels[cx, cy] == 0:
                    continue
                visited.add((cx, cy))
                area += 1
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                stack.extend([(cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)])

            blob_w = max_x - min_x + 1
            blob_h = max_y - min_y + 1
            if blob_h < 80 or blob_w < 20:
                continue
            aspect = blob_h / max(blob_w, 1)
            if aspect < 1.1:
                continue
            score = blob_h * aspect
            if score > best_score:
                best_score = score
                best_bbox = (min_x, min_y, max_x + 1, max_y + 1)

    if best_bbox:
        return img.crop(best_bbox)
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def trim_and_pad(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    cropped = img.crop(bbox)
    pad_x = int(cropped.width * PADDING_RATIO)
    pad_y = int(cropped.height * PADDING_RATIO)
    canvas = Image.new("RGBA", (cropped.width + pad_x * 2, cropped.height + pad_y * 2), (0, 0, 0, 0))
    canvas.paste(cropped, (pad_x, pad_y), cropped)
    return canvas


def normalize_height(img: Image.Image, height: int) -> Image.Image:
    if img.height == height:
        return img
    ratio = height / img.height
    size = (max(1, int(img.width * ratio)), height)
    return img.resize(size, Image.Resampling.LANCZOS)


def process_source(src: Path, crop_mode: str | None) -> Image.Image:
    with src.open("rb") as handle:
        raw = handle.read()

    if crop_mode:
        base = Image.open(io.BytesIO(raw)).convert("RGB")
        cropped = crop_bottle_region(base, crop_mode)
        buffer = io.BytesIO()
        cropped.save(buffer, format="PNG")
        img = remove_background(buffer.getvalue())
    else:
        img = remove_background(raw)

    img = largest_alpha_component(img)
    img = trim_and_pad(img)
    return normalize_height(img, TARGET_HEIGHT)


def validate_alpha(img: Image.Image, label: str) -> None:
    if img.mode != "RGBA":
        raise ValueError(f"{label}: expected RGBA, got {img.mode}")

    alpha = img.getchannel("A")
    lo, hi = alpha.getextrema()
    if lo == hi == 255:
        raise ValueError(f"{label}: alpha channel is fully opaque (no transparency)")

    pixels = alpha.load()
    transparent = sum(
        1 for y in range(alpha.height) for x in range(alpha.width) if pixels[x, y] < 16
    )

    total = alpha.width * alpha.height
    if transparent / total < 0.08:
        raise ValueError(f"{label}: too few transparent pixels ({transparent}/{total})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate transparent Fizz bottle product PNGs")
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
        out = ASSETS / f"fizz-bottle-product-{color}.png"
        crop_mode = None
        if color in STUDIO_SOURCES and (ASSETS / STUDIO_SOURCES[color]).exists():
            src = ASSETS / STUDIO_SOURCES[color]
        elif color in LIFESTYLE_SOURCES:
            filename, crop_mode = LIFESTYLE_SOURCES[color]
            src = ASSETS / filename
        else:
            src = ASSETS / f"hero-lifestyle-{color}.png"
            crop_mode = "center"

        if not src.exists():
            print(f"skip missing source for {color}")
            continue

        print(f"{color}: {src.name} (crop={crop_mode})")
        img = process_source(src, crop_mode=crop_mode)
        validate_alpha(img, color)
        img.save(out, format="PNG", optimize=True)
        print(f"  -> {out.name} ({img.width}x{img.height}, alpha ok)")


if __name__ == "__main__":
    main()
