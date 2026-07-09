# Fizz PDP content guide

Merchants can customize product pages without editing theme code. Content lives in **Shopify Admin → Products** (and variant metafields where noted).

## Product metafields (`custom` namespace)

| Metafield | Type | Purpose |
|-----------|------|---------|
| `pdp_tagline` | Single line | Hero subtitle under the product title |
| `how_to_use` | Multi-line text | “How to use” accordion |
| `care_instructions` | Multi-line text | “Care” accordion |
| `warranty_note` | Multi-line text | “Warranty” accordion |
| `pairs_with_heading` | Single line | Heading for manual cross-sell rail (default: “Complete your setup”) |
| `pairs_with_products` | List of products | Curated “pairs with” cards |
| `also_like_collection` | Collection | Fallback collection for recommendations (optional) |

Sections that read these: `fizz-product-*` heroes, `fizz-pdp-care-use`, `fizz-pdp-pairs-with`.

## Variant metafields (`custom` namespace)

| Metafield | Used on | Purpose |
|-----------|---------|---------|
| `color_slug` | Bottle colors | Theme class + fallback lifestyle asset (`hero-lifestyle-{slug}.png`) |
| `pack_slug` | Flavor packs | Fallback pack image (`flavor-pack-{slug}.png`) |
| `lifestyle_image` | Bottle / flavors | Hero lifestyle band image (optional) |
| `lifestyle_image_mobile` | Bottle / flavors | Mobile crop (optional) |
| `lifestyle_caption` | All | Alt text + overlay caption |
| `gallery_images` | Bottle / flavors | Extra gallery thumbnails |
| `variant_story` | Bottle / flavors | Short lifestyle copy in `fizz-pdp-variant-story` |

### Bottle color slugs

| Color | `color_slug` value |
|-------|-------------------|
| Black | `charcoal-black` |
| White | `arctic-white` |
| Orange | `coral-orange` |
| Sage | `sage-green` |
| Blue | `electric-blue` |
| Navy | `steel-navy` |

## Product templates

Assign in **Product → Theme template**:

| Product type | Template |
|--------------|----------|
| Fizz Bottle | `bottle` |
| Flavor packs | `flavor-pack` |
| Fizz Charge CO₂ | `co2-refill` |

Each template stacks: hero → variant story → USP grid → care/use → FAQ → pairs with → recommendations → collection rails.

## FAQ content

Two options (theme checks metafields first, then section blocks):

1. **Theme editor** — edit FAQ blocks on the `fizz-pdp-faq` section per template.
2. **Metaobjects** (optional) — define `pdp_faq` entries and link via `custom.pdp_faqs` when ready.

## Cross-sell defaults

| Product | Suggested `pairs_with_products` |
|---------|--------------------------------|
| Bottle | CO₂ 6-pack + one flavor |
| CO₂ | Bottle + flavor pack |
| Flavor | Bottle + CO₂ |

Shopify **complementary / related** recommendations load automatically in `fizz-pdp-recommendations`.

## Re-running setup

From the repo root:

```bash
./fizz/scripts/setup-pdp-metafields.sh
```

This creates metafield definitions (safe to re-run), assigns templates, and seeds launch copy for bottle, CO₂, and Orange Tangerine.

## QA checklist

- [ ] Bottle: color swatch updates hero + lifestyle band without full page reload
- [ ] Mobile: sticky bottom ATC appears after scrolling past hero
- [ ] Desktop: gallery + buy box stick while scrolling the hero section
- [ ] Care / FAQ / pairs sections show on all three product types
- [ ] CO₂ subscription picker still renders NextFil app blocks
- [ ] 320px–1440px layout pass on bottle, flavor, and CO₂ pages
