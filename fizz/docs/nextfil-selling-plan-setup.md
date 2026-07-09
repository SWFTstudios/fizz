# NextFil Selling Plan Setup — Fizz Charge

Complete these steps in **Shopify Admin → Apps → NextFil Subscriptions** after theme files are deployed.

## Selling Plan Group

| Field | Value |
|-------|-------|
| **Name** (customer-facing) | Fizz Charge Refill |
| **Internal Name** | fizz-charge-refill |
| **Grouping Key** | fizz-co2 |

## Activation Product

Attach **Fizz Charge — CO2 Refill 6-Pack** (`FIZZ-CO2-6PK`):

- Product ID: `gid://shopify/Product/10229603565853`
- Variant ID: `gid://shopify/ProductVariant/51885256671517`

## Selling Plan

| Field | Value |
|-------|-------|
| **Plan name** | On-demand 6-pack refill |
| **Price** | $10.00 |
| **Billing mode** | **Ad hoc** (on-demand renewal) |
| **Renewal product** | Same as activation (Fizz Charge 6-Pack) |

> NextFil ad hoc billing uses a long internal billing interval (~100 years). Renewals are triggered by the customer, support, or fulfillment — not on a fixed calendar.

## Optional: Send Product Action

Enable a **Send Product** action on the subscription so customers can request a refill from the portal:

- Product: Fizz Charge 6-Pack
- Cooldown: recommend 7–14 days between customer-triggered refills

## Verify

1. **Products → Fizz Charge → Purchase options** — selling plan appears
2. Storefront `/products/fizz-co2-refills` — subscribe option shows at $10.00
3. Run: `./fizz/scripts/verify-subscription-setup.sh`
