# Ballena Fizz

Standalone Online Store 2.0 theme in the Fizz Theme Library. Inspired by
[ballenacabo.com](https://ballenacabo.com/) — quality imagery, floaty Lenis
scroll, clean spaced typography, and a floating pill navigation.

**Do not push this folder over NeoFizz / July 14 / Claude / live.** Deploy only
as its own unpublished theme named **Ballena Fizz**.

## Keepers from NeoFizz / Fizz

- Loading intro (`nf-intro`)
- Infinite marquee (`nf-marquee`)
- Bubble page transitions (`nf-page-transition.js`)
- Lottie / key-features scroll scrub (`fizz-key-features`)
- SVG water wave (`nf-water-wave`)
- Lifestyle imagery assets

## Ballena-specific

- `bf-header` — floating pill nav (Shop | FIZZ | menu)
- `bf-hero`, `bf-about-carousel`, `bf-benefits`, `bf-flavors`, `bf-social-carousel`, `bf-footer`
- Shared section chrome (`bf-section-chrome`) for padding, margin, type, and background media

## Deploy (unpublished only)

```bash
shopify theme push \
  --path fizz-ballena-theme \
  --unpublished \
  --theme "Ballena Fizz" \
  --nodelete
```

Never use `--allow-live` against NeoFizz (`#189109174557`).

## Branch

`feature/ballena-fizz`

## Docs

- [`INSTRUCTIONS.md`](INSTRUCTIONS.md) — content-safe push rules
- [`design/BALLENA-FIZZ-RESEARCH.md`](design/BALLENA-FIZZ-RESEARCH.md)
