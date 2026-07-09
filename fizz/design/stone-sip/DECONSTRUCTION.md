# Stone Sip → Fizz redesign deconstruction

Reference: https://stone-sip-roaster.webflow.io  
Constraint: replicate **layout + motion patterns** only. Original Fizz code, copy, fonts, and assets.

## Animation stack (template)

| Library | Role |
|---------|------|
| GSAP 3.15 | Core timelines |
| ScrollTrigger | Scroll reveals, scrub refresh |
| SplitText (Club) | Word/line splits for heading reveals |
| CustomEase (Club) | Named easings |
| jQuery | Webflow runtime only — **not used in Fizz** |
| Webflow IX (`data-w-id`) | Rare; most motion is attribute-driven GSAP |

### Attribute animation system (replicated as `data-ss-*`)

| Template attr | Fizz equivalent | Behavior |
|---------------|-----------------|----------|
| `text-split` + `words-slide-up` | `data-ss-split="words"` | Split words, slide up from below with stagger |
| `page-load` | `data-ss-trigger="load"` | Run on page load |
| `scroll` | `data-ss-trigger="scroll"` | Run when in viewport (ScrollTrigger) |
| `fade-up` | `data-ss-fade="up"` | Opacity + y translate |
| `delay` / `duration` | `data-ss-delay` / `data-ss-duration` | Timing |

**Default motion:** duration ~0.3–0.5s, ease `power3.out`, word stagger ~0.04s, fade distance ~24–40px.  
**Marquee:** duplicated track, infinite CSS/GSAP loop, ~20–40s cycle, pause on hover.  
**Reduced motion:** skip splits/marquees; show content immediately.

**Note:** SplitText + CustomEase are Club plugins. Fizz uses a free word-split helper + standard GSAP easings (`power3.out`, `expo.out`) — no Club files.

## Page maps

### Home `/`

1. **Nav** — logo center/left, Menu + Cart, transparent over cream/brown hero
2. **Hero** — large H1 (split on load), subcopy, “Buy Now” CTA, hero product visual
3. **As-seen marquee** — logo strip, dual rows
4. **Intro split** — large stacked title (“COLD BREW / WITHOUT ANY COMPROMISE”) + column copy + Learn More
5. **Product lineup** — “The Drink lineup” + View All, 6-up product cards (image, badge, title, price)
6. **Reviews wall** — heading + card grid (quote, name, verified)
7. **CTA band** — large headline + Learn More on contrasting bg
8. **Benefits** — headline + body + pill/benefit list (energy, no sugar, etc.) often with marquee accents
9. **Story** — long narrative heading + short body + About CTA
10. **Footer lineup marquee** — product titles scrolling
11. **Footer** — menus, social, copyright, review badge

### Shop `/all-products`

1. Collection hero (“All Flavors”)
2. Product card grid (same card pattern as home lineup)
3. Shared footer

### Product `/product/*`

1. Hero: title (split on load), price, qty, Add to cart, product visual
2. Related lineup rail (same product cards)
3. FAQ accordion
4. Footer

### About `/about-01`

1. “Our Story” hero
2. Intro narrative (fade-up)
3. Two-column story bands
4. Timeline years
5. FAQ
6. Footer

## Token map (Stone Sip roles → Fizz)

| Role | Stone Sip (approx) | Fizz |
|------|--------------------|------|
| Page bg | Cream / warm white or brown bands | `#030303` / `#111` / surface |
| Accent bands | Brown / deep | Coral `#FF7F50` accents, dark panels |
| Text | Near-black on light | `#f5f5f7` / `#e5e2e1` |
| Body font | Template display | Hanken Grotesk |
| Label font | Caps labels | JetBrains Mono |
| Radius | Soft cards, pill CTAs | 16px media, `9999px` CTAs |
| Page inset | Wide container | `--fizz-space-page-x` |
| Section bands | Large vertical air | `fizz-section--relaxed` / `--statement` / `--flush` |

## Fizz section targets

| Pattern | Section |
|---------|---------|
| Hero | `fizz-ss-hero` |
| Logo marquee | `fizz-ss-marquee` |
| Intro split | `fizz-ss-intro-split` |
| Product lineup | `fizz-ss-product-lineup` |
| Reviews | `fizz-ss-reviews` |
| CTA band | `fizz-ss-cta-band` |
| Benefits | `fizz-ss-benefits` |
| Story | `fizz-ss-story` |
| Collection | `fizz-ss-collection` |
| PDP hero | `fizz-ss-product` |
| About | `fizz-ss-about` |
| Motion runtime | `assets/fizz-ss-motion.js` |
| Layout CSS | `assets/fizz-ss.css` |
