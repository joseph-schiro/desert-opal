/** Shopify metafield namespace holding our boutique fields (care, tone, emoji…).
 *  Kept in a dependency-free leaf module so both the read (`shopify.ts`) and
 *  write (`shopify-admin.ts`) layers can import it without a circular import. */
export const METAFIELD_NAMESPACE = "desertopal";
