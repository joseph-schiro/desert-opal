/**
 * Shopify Storefront API client.
 *
 * This is the low-level bridge to Shopify. `catalog.ts` calls into here and
 * maps the results into the app-wide `Product` shape, so the rest of the app
 * never imports this file directly.
 *
 * The commerce basics (title, price, inventory, image) come straight from
 * Shopify's product fields. Desert-Opal-specific flourishes (care notes, tone,
 * emoji, scientific name) live in product *metafields* under the "desertopal"
 * namespace — see METAFIELD_KEYS below. Every metafield is optional; when one
 * is missing we fall back to a sensible default so the store still renders.
 */

import { METAFIELD_NAMESPACE } from "./metafields";
import type { Category, Difficulty, Product, Tone } from "./catalog";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2025-01";

/** True only when both the domain and token are set to real-looking values. */
export function isShopifyConfigured(): boolean {
  return Boolean(
    DOMAIN && TOKEN && !DOMAIN.startsWith("your-store")
  );
}

/**
 * Run a GraphQL query against the Storefront API.
 *
 * Reads (products) are cached for 5 minutes — this Next version does NOT cache
 * fetch by default. Mutations (cart) pass `{ noStore: true }` so they always hit
 * Shopify fresh; caching a cart mutation would be a correctness bug.
 */
async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  opts: { revalidate?: number; noStore?: boolean } = {}
): Promise<T> {
  const cacheInit = opts.noStore
    ? { cache: "no-store" as const }
    : { next: { revalidate: opts.revalidate ?? 300 } };

  const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN as string,
    },
    body: JSON.stringify({ query, variables }),
    ...cacheInit,
  });

  if (!res.ok) {
    throw new Error(`Shopify HTTP ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { data?: T; errors?: unknown };
  // Be resilient to partial failures: GraphQL can return usable `data` alongside
  // field-level `errors` (e.g. a missing optional access scope like
  // `unauthenticated_read_product_inventory`). Warn but keep the data we got;
  // only throw when there's nothing usable.
  if (json.errors) {
    console.warn("[shopify] GraphQL errors:", JSON.stringify(json.errors));
  }
  if (!json.data) {
    throw new Error(
      `Shopify returned no data${
        json.errors ? `: ${JSON.stringify(json.errors)}` : ""
      }`
    );
  }
  return json.data;
}

// --- Metafields -----------------------------------------------------------
// Set these on each product in Shopify (Settings -> Custom data -> Products)
// under the namespace "desertopal". All optional; defaults kick in if absent.
const METAFIELD_KEYS = [
  "scientific_name",
  "size",
  "light",
  "water",
  "difficulty",
  "tone",
  "emoji",
  "featured",
  "variegated",
] as const;

const METAFIELD_IDENTIFIERS = METAFIELD_KEYS.map(
  (key) => `{ namespace: "${METAFIELD_NAMESPACE}", key: "${key}" }`
).join(", ");

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!) {
    products(first: $first, sortKey: TITLE) {
      edges {
        node {
          id
          handle
          title
          description
          productType
          tags
          totalInventory
          featuredImage { url altText }
          priceRange { minVariantPrice { amount currencyCode } }
          variants(first: 1) {
            edges { node { id availableForSale quantityAvailable } }
          }
          metafields(identifiers: [${METAFIELD_IDENTIFIERS}]) { key value }
        }
      }
    }
  }
`;

// --- Raw Shopify response types (only the fields we request) --------------
interface ShopifyMetafield {
  key: string;
  value: string;
}

interface ShopifyProductNode {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  totalInventory: number | null;
  featuredImage: { url: string; altText: string | null } | null;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  variants: {
    edges: {
      node: {
        id: string;
        availableForSale: boolean;
        quantityAvailable: number | null;
      };
    }[];
  };
  // Shopify returns null entries for identifiers with no set value.
  metafields: (ShopifyMetafield | null)[];
}

interface ProductsResponse {
  products: { edges: { node: ShopifyProductNode }[] };
}

// --- Mapping helpers ------------------------------------------------------
/** Sentinel "in stock, exact count unknown" — high enough to avoid low-stock UI. */
const IN_STOCK_UNKNOWN = 999;

const VALID_TONES: Tone[] = ["sage", "blush", "lavender", "mint", "peach", "sky"];
const VALID_DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Fussy"];

/** Turn the metafields array into a plain lookup, skipping nulls. */
function metafieldMap(fields: (ShopifyMetafield | null)[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of fields) {
    if (f?.value) map[f.key] = f.value;
  }
  return map;
}

/**
 * Best-effort category: prefer Shopify's productType, fall back to tags, then
 * default to "succulents". Case-insensitive; singular or plural both work.
 */
function resolveCategory(node: ShopifyProductNode): Category {
  const candidates = [node.productType, ...node.tags].map((s) =>
    (s ?? "").toLowerCase()
  );
  for (const c of candidates) {
    if (c.includes("cact")) return "cacti";
    if (c.includes("accessor") || c.includes("pot") || c.includes("kit"))
      return "accessories";
    if (c.includes("succulent")) return "succulents";
  }
  return "succulents";
}

function mapProduct(node: ShopifyProductNode): Product {
  const mf = metafieldMap(node.metafields);
  const firstVariant = node.variants.edges[0]?.node;

  const amount = node.priceRange.minVariantPrice.amount;
  const priceCents = Math.round(parseFloat(amount) * 100);

  // Prefer real counts. If the inventory scope isn't granted (fields come back
  // null), fall back to Shopify's availableForSale flag: in-stock items get a
  // sentinel high count so they aren't shown as "sold out" or "only N left".
  const exactStock = node.totalInventory ?? firstVariant?.quantityAvailable;
  const stock =
    exactStock ?? (firstVariant?.availableForSale ? IN_STOCK_UNKNOWN : 0);

  const tone = VALID_TONES.includes(mf.tone as Tone)
    ? (mf.tone as Tone)
    : "sage";

  const difficulty = VALID_DIFFICULTIES.includes(mf.difficulty as Difficulty)
    ? (mf.difficulty as Difficulty)
    : "Easy";

  return {
    id: node.id,
    variantId: firstVariant?.id,
    slug: node.handle,
    name: node.title,
    scientificName: mf.scientific_name || undefined,
    category: resolveCategory(node),
    priceCents,
    stock: Math.max(0, stock),
    size: mf.size || "",
    description: node.description,
    care: {
      light: mf.light || "Bright, indirect",
      water: mf.water || "Every 2–3 weeks",
      difficulty,
    },
    tone,
    variegated: mf.variegated === "true",
    featured: mf.featured === "true",
    emoji: mf.emoji || "🪴",
    imageUrl: node.featuredImage?.url,
    imageAlt: node.featuredImage?.altText ?? undefined,
  };
}

/** Fetch and map every product from Shopify. Returns [] if the store is empty. */
export async function getShopifyProducts(first = 100): Promise<Product[]> {
  const data = await shopifyFetch<ProductsResponse>(PRODUCTS_QUERY, { first });
  return data.products.edges.map((e) => mapProduct(e.node));
}

// ==========================================================================
// Cart / checkout (Shopify Storefront Cart API)
// ==========================================================================
// A Shopify cart is server-side state identified by a cart id we persist in a
// cookie. Its `checkoutUrl` is Shopify's hosted checkout — we redirect there so
// payments/shipping/tax are all handled by Shopify.

export interface CartLine {
  /** Cart line id (needed to update/remove this line). */
  id: string;
  variantId: string;
  quantity: number;
  /** Product title (+ variant title when it isn't the default). */
  title: string;
  variantTitle: string | null;
  priceCents: number;
  /** Line subtotal = priceCents * quantity. */
  lineTotalCents: number;
  handle: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotalCents: number;
  lines: CartLine[];
}

const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost { subtotalAmount { amount currencyCode } }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              image { url altText }
              price { amount currencyCode }
              product { title handle }
            }
          }
        }
      }
    }
  }
`;

interface CartMoney {
  amount: string;
  currencyCode: string;
}

interface CartNode {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: CartMoney };
  lines: {
    edges: {
      node: {
        id: string;
        quantity: number;
        merchandise: {
          id: string;
          title: string;
          image: { url: string; altText: string | null } | null;
          price: CartMoney;
          product: { title: string; handle: string };
        };
      };
    }[];
  };
}

const toCents = (amount: string) => Math.round(parseFloat(amount) * 100);

function mapCart(node: CartNode): Cart {
  const lines: CartLine[] = node.lines.edges.map(({ node: line }) => {
    const m = line.merchandise;
    const priceCents = toCents(m.price.amount);
    // Shopify uses "Default Title" for single-variant products — hide it.
    const variantTitle = m.title === "Default Title" ? null : m.title;
    return {
      id: line.id,
      variantId: m.id,
      quantity: line.quantity,
      title: m.product.title,
      variantTitle,
      priceCents,
      lineTotalCents: priceCents * line.quantity,
      handle: m.product.handle,
      imageUrl: m.image?.url,
      imageAlt: m.image?.altText ?? undefined,
    };
  });

  return {
    id: node.id,
    checkoutUrl: node.checkoutUrl,
    totalQuantity: node.totalQuantity,
    subtotalCents: toCents(node.cost.subtotalAmount.amount),
    lines,
  };
}

/** Throw if a Cart mutation reported user errors (bad variant, sold out, etc.). */
function assertNoUserErrors(errors: { message: string }[] | undefined) {
  if (errors && errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
}

export async function createCart(variantId: string, quantity = 1): Promise<Cart> {
  const query = /* GraphQL */ `
    ${CART_FRAGMENT}
    mutation CreateCart($lines: [CartLineInput!]!) {
      cartCreate(input: { lines: $lines }) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }
  `;
  const data = await shopifyFetch<{
    cartCreate: { cart: CartNode; userErrors: { message: string }[] };
  }>(query, { lines: [{ merchandiseId: variantId, quantity }] }, { noStore: true });
  assertNoUserErrors(data.cartCreate.userErrors);
  return mapCart(data.cartCreate.cart);
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity = 1
): Promise<Cart> {
  const query = /* GraphQL */ `
    ${CART_FRAGMENT}
    mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }
  `;
  const data = await shopifyFetch<{
    cartLinesAdd: { cart: CartNode; userErrors: { message: string }[] };
  }>(
    query,
    { cartId, lines: [{ merchandiseId: variantId, quantity }] },
    { noStore: true }
  );
  assertNoUserErrors(data.cartLinesAdd.userErrors);
  return mapCart(data.cartLinesAdd.cart);
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<Cart> {
  const query = /* GraphQL */ `
    ${CART_FRAGMENT}
    mutation UpdateCartLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }
  `;
  const data = await shopifyFetch<{
    cartLinesUpdate: { cart: CartNode; userErrors: { message: string }[] };
  }>(query, { cartId, lines: [{ id: lineId, quantity }] }, { noStore: true });
  assertNoUserErrors(data.cartLinesUpdate.userErrors);
  return mapCart(data.cartLinesUpdate.cart);
}

export async function removeCartLine(
  cartId: string,
  lineId: string
): Promise<Cart> {
  const query = /* GraphQL */ `
    ${CART_FRAGMENT}
    mutation RemoveCartLine($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }
  `;
  const data = await shopifyFetch<{
    cartLinesRemove: { cart: CartNode; userErrors: { message: string }[] };
  }>(query, { cartId, lineIds: [lineId] }, { noStore: true });
  assertNoUserErrors(data.cartLinesRemove.userErrors);
  return mapCart(data.cartLinesRemove.cart);
}

/** Fetch an existing cart. Returns null if it no longer exists (e.g. completed/expired). */
export async function getCart(cartId: string): Promise<Cart | null> {
  const query = /* GraphQL */ `
    ${CART_FRAGMENT}
    query GetCart($cartId: ID!) {
      cart(id: $cartId) { ...CartFields }
    }
  `;
  const data = await shopifyFetch<{ cart: CartNode | null }>(
    query,
    { cartId },
    { noStore: true }
  );
  return data.cart ? mapCart(data.cart) : null;
}
