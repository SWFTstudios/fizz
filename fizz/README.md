# Fizz — Shopify workspace

**Store:** `g9rykd-jt.myshopify.com` (admin: fizz-9820)  
**Live theme:** `Fizz Claude` (#188495003933) — push from `fizz-claude-theme/` (not `fizz/`)

## NextFil CO2 subscription status

| Step | Status |
|------|--------|
| Fizz Charge 6-pack product ($10, SKU `FIZZ-CO2-6PK`) | Done |
| `co2-refill` product template | Done |
| Theme: selling plan picker + 6-pack copy | Live |
| Theme: subscriptions account page (`/account?view=subscriptions`) | Live |
| NextFil selling plan (ad hoc) | **Manual — see docs below** |
| Theme editor: add NextFil app blocks | **Manual — 2 min** |

## One remaining manual step (NextFil admin)

1. Open **Apps → NextFil Subscriptions**
2. Follow [docs/nextfil-selling-plan-setup.md](docs/nextfil-selling-plan-setup.md)
3. In theme editor, follow [docs/theme-editor-setup.md](docs/theme-editor-setup.md)
4. Run `./scripts/verify-subscription-setup.sh` — all checks should pass

## Commands

```bash
# Pull latest Fizz Claude theme
shopify theme pull --path fizz-claude-theme --store g9rykd-jt.myshopify.com --theme "Fizz Claude"

# Push Fizz Claude to live (use fizz-claude-theme — NOT fizz/)
shopify theme push --path fizz-claude-theme --store g9rykd-jt.myshopify.com --theme "Fizz Claude" --allow-live

# Combined Kinetic Spark + Claude-suffix theme lives in fizz/ — never push that over live Fizz Claude

# Verify setup
./fizz/scripts/verify-subscription-setup.sh
```

## Product

- **URL:** https://fizz-9820.myshopify.com/products/fizz-co2-refills
- **Subscriptions portal:** https://fizz-9820.myshopify.com/account?view=subscriptions
