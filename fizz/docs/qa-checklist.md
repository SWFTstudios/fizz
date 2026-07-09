# Fizz Charge Subscription QA Checklist

Run after NextFil selling plan is configured and theme is published.

## Storefront — product page

- [ ] Visit `/products/fizz-co2-refills`
- [ ] Title shows **Fizz Charge — CO2 Refill 6-Pack**
- [ ] Badge shows **6-pack · $10 per refill**
- [ ] Price shows **$10.00**
- [ ] Unit price shows per-canister breakdown (6 canisters)
- [ ] Subscribe option appears with on-demand copy
- [ ] One-time 6-pack option works

## Checkout — new subscription

- [ ] Select subscribe plan → checkout completes
- [ ] Order total is **$10.00**
- [ ] Line item is Fizz Charge 6-Pack (`FIZZ-CO2-6PK`)
- [ ] Subscription contract created in Shopify Admin

## Customer portal

- [ ] Visit `/account?view=subscriptions` while logged in
- [ ] NextFil subscription block renders
- [ ] Active Fizz Charge subscription visible
- [ ] Request on-demand refill → new order at **$10.00**

## Account management

- [ ] Pause subscription works
- [ ] Cancel subscription works
- [ ] Payment failure email copy matches `docs/nextfil-email-templates.md`

## Mixed cart

- [ ] CO2 subscription + one-time product in cart behaves correctly at checkout

## Mobile

- [ ] Product page plan picker usable on mobile
- [ ] Subscription portal usable on mobile

## Verification script

```bash
chmod +x fizz/scripts/verify-subscription-setup.sh
./fizz/scripts/verify-subscription-setup.sh
```

All catalog + theme checks should pass; selling plan check passes after NextFil admin setup.
