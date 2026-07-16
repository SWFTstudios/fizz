#!/usr/bin/env bash
# Bootstrap Warp / colorway metafield definitions for July 14 homepage.
# Store: g9rykd-jt.myshopify.com
set -euo pipefail

STORE="${STORE:-g9rykd-jt.myshopify.com}"

echo "==> Auth store (skip if already authenticated)"
shopify store auth \
  --store "$STORE" \
  --scopes "read_products,write_products" || true

create_def() {
  local name="$1" key="$2" type="$3" owner="$4" desc="$5"
  echo "==> Create $owner.custom.$key ($type)"
  shopify store execute \
    --store "$STORE" \
    --allow-mutations \
    --query '
      mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition { id namespace key name }
          userErrors { field message code }
        }
      }
    ' \
    --variables "{
      \"definition\": {
        \"name\": \"$name\",
        \"namespace\": \"custom\",
        \"key\": \"$key\",
        \"description\": \"$desc\",
        \"type\": \"$type\",
        \"ownerType\": \"$owner\",
        \"access\": { \"storefront\": \"PUBLIC_READ\" }
      }
    }" || true
}

# Products
create_def "Warp media"        "warp_media"     "file_reference"         "PRODUCT"         "Warp carousel panel image or video"
create_def "Scene bg start"    "scene_bg"       "color"                  "PRODUCT"         "Warp section background start"
create_def "Scene bg end"      "scene_bg_end"   "color"                  "PRODUCT"         "Warp section background end"
create_def "Scene button"      "scene_btn"      "color"                  "PRODUCT"         "Warp CTA button color"
create_def "Scene text"        "scene_text"     "color"                  "PRODUCT"         "Warp caption text color"
create_def "Swatch hex"        "swatch_hex"     "single_line_text_field" "PRODUCT"         "Swatch / panel color hex"

# Variants (needed for Product variants source mode)
create_def "Warp media"        "warp_media"     "file_reference"         "PRODUCTVARIANT"  "Warp carousel panel image or video"
create_def "Scene bg start"    "scene_bg"       "color"                  "PRODUCTVARIANT"  "Warp section background start"
create_def "Scene bg end"      "scene_bg_end"   "color"                  "PRODUCTVARIANT"  "Warp section background end"
create_def "Scene button"      "scene_btn"      "color"                  "PRODUCTVARIANT"  "Warp CTA button color"
create_def "Scene text"        "scene_text"     "color"                  "PRODUCTVARIANT"  "Warp caption text color"
create_def "Swatch hex"        "swatch_hex"     "single_line_text_field" "PRODUCTVARIANT"  "Swatch / panel color hex"

echo "Done. Existing definitions will report Taken/AlreadyExists in userErrors — that is OK."
