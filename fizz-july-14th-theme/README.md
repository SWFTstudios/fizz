# July 14th Custom Design — standalone Shopify theme

A standalone Shopify Online Store 2.0 theme for Fizz, inspired by the scroll
intro on spencerkofoed.com. Mobile-first, vanilla CSS/JS (no GSAP, Swiper, or
other libraries).

## Homepage flow (`templates/index.json`)

1. **J14 Intro** (`sections/j14-intro.liquid`) — brand wordmark split around a
   media window that expands to full screen as the visitor scrolls; editable
   media slides (image / Shopify video / YouTube / Vimeo) with a thumbnail
   strip.
2. **J14 Media Mosaic** (`j14-mosaic.liquid`) — admin-editable grid of photo
   and video tiles that slides up from the bottom on scroll; per-tile span,
   height, caption, and link controls.
3. **J14 Colorways Carousel** (`j14-colorways.liquid`) — swipe/scroll-snap
   carousel of bottle colors driven by a product's variants; active slide
   syncs the section background and CTA (`?variant=` deep link).
4. **J14 How To Use** (`j14-how-sticky.liquid`) — sticky full-viewport scene;
   each step's photo wipes in as the visitor scrolls through the track.
5. **J14 Flavors** (`j14-flavors.liquid`) — three flavor packs with product
   pickers, explore links, and "pair with a bottle" links.
6. **J14 About + Sustainability** (`j14-about.liquid`) — brand story plus
   sustainability stat blocks.
7. **J14 Footer** (`j14-footer.liquid`) — headline CTA, newsletter, links.

## Editor-editable

All copy, media, buttons, colors, products, and collections are section or
theme settings. Global brand colors, fonts (`font_picker`), page width, and
button radius live in **Theme settings** (`config/settings_schema.json`).

## Motion

`assets/j14-scroll.js` is a single rAF + IntersectionObserver engine for the
intro, mosaic, and how-to sections; `assets/j14-carousel.js` powers the
colorways rail. Both respect `prefers-reduced-motion` (and the Theme settings
"Enable scroll animations" toggle) with static fallbacks, and re-initialize on
theme editor events (`shopify:section:load`, `shopify:block:select`).

## Commerce templates

`product.json` (gallery, variant pills, price/ATC updates, accordions,
recommendations), `collection.json`, `list-collections.json`, `cart.json`,
`search.json`, `page.json`, `404.json`, plus `layout/password.liquid`.

## Development

```sh
shopify theme dev --path fizz-july-14th-theme     # local preview
shopify theme check --path fizz-july-14th-theme   # lint
shopify theme push --path fizz-july-14th-theme --unpublished --theme "July 14th Custom Design"
```

See `design/JULY14-DESIGN-RESEARCH.md` for the Shopify platform research and
documented limitations behind this build.
