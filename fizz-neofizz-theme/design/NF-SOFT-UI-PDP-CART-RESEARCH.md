# NeoFizz soft-UI PDP + cart — research

Theme: `fizz-neofizz-theme`  
Date: 2026-08-04  
Goal: Match LARQ-style soft-UI layout on product and cart pages without rewriting commerce.

## Research (Shopify docs)

| Topic | Finding | Source |
| --- | --- | --- |
| Product template | Must include product object + product form (variant selector, quantity, optional accelerated checkout) | [product template](https://shopify.dev/docs/storefronts/themes/architecture/templates/product/overview) |
| Product form | `{% form 'product', product %}` posts to `/cart/add` | [Liquid form tag](https://shopify.dev/docs/api/liquid/tags/form) |
| Cart template | Cart page lists `cart.items`; checkout via form `action="{{ routes.cart_url }}"` + submit `name="checkout"` | [cart template](https://shopify.dev/docs/storefronts/themes/architecture/templates/cart) |
| Qty updates | Inputs `name="updates[]"` + update submit (or Cart AJAX API) | [cart template — update quantities](https://shopify.dev/docs/storefronts/themes/architecture/templates/cart#update-line-item-quantities) |
| AJAX cart | Optional for stay-on-PDP ATC; NeoFizz keeps classic form POST | [Cart AJAX API](https://shopify.dev/docs/api/ajax/reference/cart) |
| Theme styles | Max **5** presets in `settings_data.json` — unchanged by this work | Theme architecture / prior NeoFizz research |

## Storefront vs theme editor

- Soft radii/shadows and steppers run on the storefront (CSS + small JS).
- Merchants edit badge label, feature blocks, gallery thumbs, and trust/accordions in the theme editor via `nf-product` settings/blocks.
- Cart section remains cart-template-only (`enabled_on: cart`).

## Approach locked for implementation

1. Restyle [`sections/nf-product.liquid`](../sections/nf-product.liquid) + [`sections/nf-cart.liquid`](../sections/nf-cart.liquid) markup lightly.
2. Soft-UI CSS in [`assets/nf-base.css`](../assets/nf-base.css) scoped to `.nf-product` / `.nf-cart` (do not globally raise `--nf-btn-radius`).
3. Soft shadow / card radius tokens on `:root` in [`snippets/nf-theme-tokens.liquid`](../snippets/nf-theme-tokens.liquid).
4. Keep `data-nf-*` variant JS, colorway hex swatches, and standard product/cart forms.

## Limitations

| Limit | Mitigation |
| --- | --- |
| Hosted checkout cannot be restyled in theme | Full-width Checkout button only on cart page |
| Shipping/tax often unknown until checkout | Summary rows show “At checkout” / existing taxes note |
| Pointer-line callouts on media | Out of scope; use `feature` blocks |
| Floating Back/Bag/Share over hero | Keep sticky NeoFizz header; round gallery card |
| No cart drawer this pass | Header still links to `/cart` |
| Liquid cannot parse JSON palettes | Colorway swatches stay hex via existing metafield/slug map |

## Mockup reference

Pre-implementation mockup: soft-UI PDP + cart in Steel Navy tokens (`#e8edf5` / `#6b9fd4` / `#0f1a2e`), adapted from LARQ layout reference.
