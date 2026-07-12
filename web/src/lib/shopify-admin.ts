/**
 * Shopify ADMIN API client (write access).
 *
 * Separate from `shopify.ts` (Storefront, read-only). This uses the secret
 * Admin API token to CREATE and UPDATE products from our own admin UI, then
 * publish them so the Storefront API (and thus our shop pages) can see them.
 *
 * Never import this from client components — the token must stay server-side.
 */

import { METAFIELD_NAMESPACE } from "./metafields";
import type { Category, Difficulty, Tone } from "./catalog";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const CLIENT_ID = process.env.SHOPIFY_ADMIN_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_ADMIN_CLIENT_SECRET;
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2025-01";

/** True when the Admin API app credentials + domain are set. */
export function isAdminConfigured(): boolean {
  return Boolean(
    CLIENT_ID && CLIENT_SECRET && DOMAIN && !DOMAIN.startsWith("your-store")
  );
}

// Shopify's 2026 dev-dashboard apps have no static Admin token; we exchange the
// app's client credentials for a short-lived one (~24h) and cache it in memory,
// refreshing a minute before expiry.
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAdminToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }
  const res = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `Admin token exchange failed: HTTP ${res.status}: ${await res.text()}`
    );
  }
  const json = (await res.json()) as { access_token: string; expires_in?: number };
  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return tokenCache.token;
}

async function adminFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  if (!isAdminConfigured()) {
    throw new Error("Shopify Admin API is not configured (missing credentials).");
  }
  const token = await getAdminToken();
  const res = await fetch(
    `https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw new Error(`Shopify Admin HTTP ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (json.errors) {
    throw new Error(`Shopify Admin GraphQL error: ${JSON.stringify(json.errors)}`);
  }
  if (!json.data) throw new Error("Shopify Admin returned no data");
  return json.data;
}

/** Format a GraphQL userErrors array into a thrown error if non-empty. */
function assertNoUserErrors(
  errors: { field?: string[] | null; message: string }[] | undefined,
  context: string
) {
  if (errors && errors.length > 0) {
    throw new Error(
      `${context}: ${errors
        .map((e) => `${e.field?.join(".") ?? ""} ${e.message}`.trim())
        .join("; ")}`
    );
  }
}

// --- Locations & publications (cached per server process) -----------------
let cachedLocationId: string | null = null;
let cachedPublicationIds: string[] | null = null;

/** The primary/active inventory location, needed to seed stock. */
export async function getPrimaryLocationId(): Promise<string> {
  if (cachedLocationId) return cachedLocationId;
  const data = await adminFetch<{
    locations: { edges: { node: { id: string } }[] };
  }>(`{ locations(first: 1) { edges { node { id } } } }`);
  const id = data.locations.edges[0]?.node.id;
  if (!id) throw new Error("No inventory location found on the store.");
  cachedLocationId = id;
  return id;
}

/** All sales-channel publications, so we can publish a product everywhere. */
async function getPublicationIds(): Promise<string[]> {
  if (cachedPublicationIds) return cachedPublicationIds;
  const data = await adminFetch<{
    publications: { edges: { node: { id: string } }[] };
  }>(`{ publications(first: 20) { edges { node { id } } } }`);
  cachedPublicationIds = data.publications.edges.map((e) => e.node.id);
  return cachedPublicationIds;
}

/** Publish a product to every sales channel so the Storefront API can see it. */
async function publishEverywhere(productId: string): Promise<void> {
  const publicationIds = await getPublicationIds();
  if (publicationIds.length === 0) return;
  const data = await adminFetch<{
    publishablePublish: { userErrors: { field?: string[]; message: string }[] };
  }>(
    `mutation Publish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        userErrors { field message }
      }
    }`,
    { id: productId, input: publicationIds.map((id) => ({ publicationId: id })) }
  );
  assertNoUserErrors(data.publishablePublish.userErrors, "publish");
}

// --- Product create / update ----------------------------------------------
export interface ProductInput {
  title: string;
  descriptionHtml?: string;
  productType?: string;
  tags?: string[];
  status: "ACTIVE" | "DRAFT";
  priceDollars: string;
  stock: number;
  /** Shipping weight for this plant (drives Shopify's shipping rates). */
  weight?: number;
  weightUnit?: WeightUnit;
  /** Boutique fields stored as `desertopal` metafields (all optional). */
  metafields?: { key: string; value: string; type: string }[];
  /** Staged-upload resourceUrls for product images (from `uploadImages`). The
   *  first becomes the featured image. */
  imageSources?: string[];
}

// --- Image upload (staged upload -> push bytes -> attach via product files) --
const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * Normalize a browser-uploaded image into bytes Shopify accepts. iPhone photos
 * are HEIC — a format Shopify (and browsers) reject, and whose mimeType arrives
 * as `application/octet-stream` — so we transcode those to JPEG. For other
 * images we just fix a missing/garbage mimeType by inferring from the extension.
 */
async function normalizeImageForUpload(
  file: File
): Promise<{ body: ArrayBuffer; mimeType: string; filename: string }> {
  const name = file.name || "image";
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  const type = (file.type || "").toLowerCase();
  const arrayBuf = await file.arrayBuffer();

  const isHeic =
    ext === "heic" || ext === "heif" || type === "image/heic" || type === "image/heif";
  if (isHeic) {
    const convert = (await import("heic-convert")).default;
    const output = await convert({ buffer: Buffer.from(arrayBuf), format: "JPEG", quality: 0.92 });
    return {
      body: output,
      mimeType: "image/jpeg",
      filename: name.replace(/\.(heic|heif)$/i, "") + ".jpg",
    };
  }

  const mimeType =
    type && type !== "application/octet-stream"
      ? type
      : EXT_MIME[ext] ?? "image/jpeg";
  return { body: arrayBuf, mimeType, filename: name };
}

/**
 * Upload an image file to Shopify's staged storage and return the resourceUrl
 * to pass as a product `files` source. HEIC (iPhone) photos are transcoded to
 * JPEG first. Verified against the live Admin API.
 */
export async function uploadImage(file: File): Promise<string> {
  const { body, mimeType, filename } = await normalizeImageForUpload(file);

  const staged = await adminFetch<{
    stagedUploadsCreate: {
      stagedTargets: {
        url: string;
        resourceUrl: string;
        parameters: { name: string; value: string }[];
      }[];
      userErrors: { field?: string[]; message: string }[];
    };
  }>(
    /* GraphQL */ `
      mutation StagedUploads($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets { url resourceUrl parameters { name value } }
          userErrors { field message }
        }
      }
    `,
    {
      input: [
        {
          filename,
          mimeType,
          resource: "IMAGE",
          httpMethod: "POST",
        },
      ],
    }
  );
  assertNoUserErrors(staged.stagedUploadsCreate.userErrors, "stagedUploadsCreate");
  const target = staged.stagedUploadsCreate.stagedTargets[0];
  if (!target) throw new Error("No staged upload target returned");

  // Push the bytes to the staged target (Google Cloud Storage).
  const form = new FormData();
  for (const p of target.parameters) form.append(p.name, p.value);
  form.append("file", new Blob([body], { type: mimeType }), filename);
  const upload = await fetch(target.url, { method: "POST", body: form });
  if (!upload.ok) {
    throw new Error(`Image upload failed: HTTP ${upload.status}`);
  }
  return target.resourceUrl;
}

/** Upload several images (in parallel), returning their staged resourceUrls. */
export async function uploadImages(files: File[]): Promise<string[]> {
  return Promise.all(files.map((f) => uploadImage(f)));
}

/**
 * Append images to an existing product's media gallery (does NOT replace the
 * current photos — used on edit so galleries grow). `productSet` files would
 * overwrite, so we use productCreateMedia instead.
 */
export async function appendProductMedia(
  productId: string,
  sources: string[]
): Promise<void> {
  if (sources.length === 0) return;
  const data = await adminFetch<{
    productCreateMedia: {
      mediaUserErrors: { field?: string[]; message: string }[];
    };
  }>(
    /* GraphQL */ `
      mutation AddMedia($productId: ID!, $media: [CreateMediaInput!]!) {
        productCreateMedia(productId: $productId, media: $media) {
          mediaUserErrors { field message }
        }
      }
    `,
    {
      productId,
      media: sources.map((originalSource) => ({
        originalSource,
        mediaContentType: "IMAGE",
      })),
    }
  );
  assertNoUserErrors(data.productCreateMedia.mediaUserErrors, "productCreateMedia");
}

interface ProductSetResult {
  productSet: {
    product: { id: string; handle: string } | null;
    userErrors: { field?: string[]; message: string }[];
  };
}

const PRODUCT_SET = /* GraphQL */ `
  mutation ProductSet($input: ProductSetInput!) {
    productSet(synchronous: true, input: $input) {
      product { id handle }
      userErrors { field message }
    }
  }
`;

/** Create a product (with variant price + initial stock) and publish it. */
export async function createProduct(
  input: ProductInput
): Promise<{ id: string; handle: string }> {
  // Ensure boutique metafields are exposed to the Storefront API before we
  // write values, otherwise the storefront can't read care/tone/emoji.
  await ensureMetafieldDefinitions();

  const locationId = await getPrimaryLocationId();

  const setInput = {
    title: input.title,
    descriptionHtml: input.descriptionHtml ?? "",
    productType: input.productType,
    tags: input.tags,
    status: input.status,
    metafields: input.metafields?.map((m) => ({
      namespace: METAFIELD_NAMESPACE,
      key: m.key,
      type: m.type,
      value: m.value,
    })),
    files: input.imageSources?.length
      ? input.imageSources.map((originalSource) => ({
          originalSource,
          contentType: "IMAGE",
        }))
      : undefined,
    // A single-variant product still needs an explicit default option in
    // productSet (verified against the live API — omitting it errors).
    productOptions: [{ name: "Title", values: [{ name: "Default Title" }] }],
    variants: [
      {
        optionValues: [{ optionName: "Title", name: "Default Title" }],
        price: input.priceDollars,
        inventoryItem: {
          tracked: true,
          // Weight lives on the inventory item; Shopify uses it for shipping.
          ...(input.weight != null && input.weight > 0
            ? {
                measurement: {
                  weight: {
                    value: input.weight,
                    unit: input.weightUnit ?? DEFAULT_WEIGHT_UNIT,
                  },
                },
              }
            : {}),
        },
        inventoryQuantities: [
          { locationId, name: "available", quantity: Math.max(0, input.stock) },
        ],
      },
    ],
  };

  const data = await adminFetch<ProductSetResult>(PRODUCT_SET, { input: setInput });
  assertNoUserErrors(data.productSet.userErrors, "productSet");
  const product = data.productSet.product;
  if (!product) throw new Error("productSet returned no product");

  await publishEverywhere(product.id);
  return product;
}

// --- Metafield definitions (storefront visibility) ------------------------
// Values written to a product metafield are NOT readable by the Storefront API
// unless a definition grants storefront access. We create the definitions once
// per server process (idempotent — "already taken" is ignored).
let definitionsEnsured = false;

const TEXT = "single_line_text_field";
const METAFIELD_DEFINITIONS: { key: string; name: string; type: string }[] = [
  { key: "scientific_name", name: "Scientific name", type: TEXT },
  { key: "size", name: "Size", type: TEXT },
  { key: "light", name: "Light", type: TEXT },
  { key: "water", name: "Water", type: TEXT },
  { key: "difficulty", name: "Care level", type: TEXT },
  { key: "tone", name: "Tone", type: TEXT },
  { key: "emoji", name: "Emoji", type: TEXT },
  { key: "featured", name: "Featured", type: "boolean" },
  { key: "variegated", name: "Variegated", type: "boolean" },
];

async function ensureMetafieldDefinitions(): Promise<void> {
  if (definitionsEnsured) return;

  const mutation = /* GraphQL */ `
    mutation DefCreate($d: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $d) {
        createdDefinition { id }
        userErrors { field message code }
      }
    }
  `;

  await Promise.all(
    METAFIELD_DEFINITIONS.map(async (def) => {
      try {
        const data = await adminFetch<{
          metafieldDefinitionCreate: {
            userErrors: { code?: string; message: string }[];
          };
        }>(mutation, {
          d: {
            name: def.name,
            namespace: METAFIELD_NAMESPACE,
            key: def.key,
            type: def.type,
            ownerType: "PRODUCT",
            access: { storefront: "PUBLIC_READ" },
          },
        });
        const errs = data.metafieldDefinitionCreate.userErrors.filter(
          // Ignore "already exists" — definitions are one-time and shared.
          (e) => e.code !== "TAKEN"
        );
        if (errs.length) {
          console.warn(`[admin] metafield def ${def.key}:`, JSON.stringify(errs));
        }
      } catch (err) {
        console.warn(`[admin] metafield def ${def.key} failed:`, err);
      }
    })
  );

  definitionsEnsured = true;
}

// ==========================================================================
// Admin product list / read / update / delete
// ==========================================================================
// The admin uses the Admin API (not the Storefront API) so it can see DRAFT
// products and exact stock — e.g. a delisted plant must still be findable here
// to re-list it.

export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

/** Shopify weight units (used for shipping calculation). */
export type WeightUnit = "OUNCES" | "POUNDS" | "GRAMS" | "KILOGRAMS";
export const DEFAULT_WEIGHT_UNIT: WeightUnit = "OUNCES";

export interface AdminProduct {
  id: string; // gid://shopify/Product/...
  legacyId: string; // numeric id, used for edit URLs
  handle: string;
  title: string;
  status: ProductStatus;
  descriptionHtml: string;
  priceCents: number;
  stock: number;
  weight?: number;
  weightUnit: WeightUnit;
  category: Category;
  variantId?: string;
  inventoryItemId?: string;
  imageUrl?: string;
  /** Full media gallery (featured image first). */
  images: { url: string; altText?: string }[];
  // Boutique metafields (for the edit form + admin display).
  scientificName?: string;
  size?: string;
  light?: string;
  water?: string;
  difficulty: Difficulty;
  tone: Tone;
  emoji: string;
  featured: boolean;
  variegated: boolean;
}

const ADMIN_PRODUCT_FIELDS = /* GraphQL */ `
  id
  legacyResourceId
  handle
  title
  status
  descriptionHtml
  productType
  tags
  totalInventory
  featuredImage { url altText }
  images(first: 20) { edges { node { url altText } } }
  variants(first: 1) {
    edges {
      node {
        id
        price
        inventoryItem { id measurement { weight { value unit } } }
      }
    }
  }
  metafields(first: 25, namespace: "${METAFIELD_NAMESPACE}") {
    edges { node { key value } }
  }
`;

interface AdminProductNode {
  id: string;
  legacyResourceId: string;
  handle: string;
  title: string;
  status: ProductStatus;
  descriptionHtml: string | null;
  productType: string;
  tags: string[];
  totalInventory: number | null;
  featuredImage: { url: string; altText: string | null } | null;
  images: { edges: { node: { url: string; altText: string | null } }[] };
  variants: {
    edges: {
      node: {
        id: string;
        price: string;
        inventoryItem: {
          id: string;
          measurement: { weight: { value: number; unit: WeightUnit } | null } | null;
        } | null;
      };
    }[];
  };
  metafields: { edges: { node: { key: string; value: string } }[] };
}

const VALID_TONES: Tone[] = ["sage", "blush", "lavender", "mint", "peach", "sky"];
const VALID_DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Fussy"];

function resolveCategory(productType: string, tags: string[]): Category {
  for (const c of [productType, ...tags].map((s) => (s ?? "").toLowerCase())) {
    if (c.includes("cact")) return "cacti";
    if (c.includes("accessor") || c.includes("pot") || c.includes("kit"))
      return "accessories";
    if (c.includes("succulent")) return "succulents";
  }
  return "succulents";
}

function mapAdminProduct(node: AdminProductNode): AdminProduct {
  const mf: Record<string, string> = {};
  for (const e of node.metafields.edges) mf[e.node.key] = e.node.value;
  const variant = node.variants.edges[0]?.node;

  const tone = VALID_TONES.includes(mf.tone as Tone) ? (mf.tone as Tone) : "sage";
  const difficulty = VALID_DIFFICULTIES.includes(mf.difficulty as Difficulty)
    ? (mf.difficulty as Difficulty)
    : "Easy";

  return {
    id: node.id,
    legacyId: node.legacyResourceId,
    handle: node.handle,
    title: node.title,
    status: node.status,
    descriptionHtml: node.descriptionHtml ?? "",
    // Read the variant's own price — Shopify's aggregated priceRange can report a
    // stale/×100-wrong value after productVariantsBulkUpdate.
    priceCents: Math.round(parseFloat(variant?.price ?? "0") * 100),
    stock: Math.max(0, node.totalInventory ?? 0),
    weight: variant?.inventoryItem?.measurement?.weight?.value ?? undefined,
    weightUnit: variant?.inventoryItem?.measurement?.weight?.unit ?? DEFAULT_WEIGHT_UNIT,
    category: resolveCategory(node.productType, node.tags),
    variantId: variant?.id,
    inventoryItemId: variant?.inventoryItem?.id,
    imageUrl: node.featuredImage?.url,
    images: node.images.edges.map((e) => ({
      url: e.node.url,
      altText: e.node.altText ?? undefined,
    })),
    scientificName: mf.scientific_name || undefined,
    size: mf.size || undefined,
    light: mf.light || undefined,
    water: mf.water || undefined,
    difficulty,
    tone,
    emoji: mf.emoji || "🪴",
    featured: mf.featured === "true",
    variegated: mf.variegated === "true",
  };
}

/** List every product (incl. drafts) for the admin inventory table. */
export async function getAdminProducts(first = 100): Promise<AdminProduct[]> {
  const data = await adminFetch<{ products: { edges: { node: AdminProductNode }[] } }>(
    /* GraphQL */ `
      query AdminProducts($first: Int!) {
        products(first: $first, sortKey: TITLE) {
          edges { node { ${ADMIN_PRODUCT_FIELDS} } }
        }
      }
    `,
    { first }
  );
  return data.products.edges.map((e) => mapAdminProduct(e.node));
}

/** Fetch one product by its numeric (legacy) id, for the edit form. */
export async function getAdminProduct(legacyId: string): Promise<AdminProduct | null> {
  const data = await adminFetch<{ product: AdminProductNode | null }>(
    /* GraphQL */ `
      query AdminProduct($id: ID!) {
        product(id: $id) { ${ADMIN_PRODUCT_FIELDS} }
      }
    `,
    { id: `gid://shopify/Product/${legacyId}` }
  );
  return data.product ? mapAdminProduct(data.product) : null;
}

export interface ProductUpdate {
  id: string; // gid
  title: string;
  descriptionHtml?: string;
  productType?: string;
  tags?: string[];
  status: ProductStatus;
  priceDollars: string;
  stock: number;
  weight?: number;
  weightUnit?: WeightUnit;
  variantId?: string;
  inventoryItemId?: string;
  metafields?: { key: string; value: string; type: string }[];
  /** New images to APPEND to the existing gallery (does not replace photos). */
  imageSources?: string[];
}

/** Update an existing product: core fields + metafields, price, stock, images. */
export async function updateProduct(input: ProductUpdate): Promise<void> {
  await ensureMetafieldDefinitions();

  // 1. Core fields + metafields via productSet by id. No `files` here — new
  //    images are appended separately (below) so the current gallery survives.
  //    No `variants` either, so we don't need the productOptions scaffold.
  const setData = await adminFetch<ProductSetResult>(PRODUCT_SET, {
    input: {
      id: input.id,
      title: input.title,
      descriptionHtml: input.descriptionHtml ?? "",
      productType: input.productType,
      tags: input.tags,
      status: input.status,
      metafields: input.metafields?.map((m) => ({
        namespace: METAFIELD_NAMESPACE,
        key: m.key,
        type: m.type,
        value: m.value,
      })),
    },
  });
  assertNoUserErrors(setData.productSet.userErrors, "productSet(update)");

  // 1b. Append any newly uploaded images to the gallery.
  if (input.imageSources?.length) {
    await appendProductMedia(input.id, input.imageSources);
  }

  // 2. Price (+ weight) via productVariantsBulkUpdate.
  if (input.variantId) {
    const variantInput: Record<string, unknown> = {
      id: input.variantId,
      price: input.priceDollars,
    };
    if (input.weight != null && input.weight > 0) {
      variantInput.inventoryItem = {
        measurement: {
          weight: { value: input.weight, unit: input.weightUnit ?? DEFAULT_WEIGHT_UNIT },
        },
      };
    }
    const priceData = await adminFetch<{
      productVariantsBulkUpdate: { userErrors: { field?: string[]; message: string }[] };
    }>(
      /* GraphQL */ `
        mutation UpdatePrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            userErrors { field message }
          }
        }
      `,
      { productId: input.id, variants: [variantInput] }
    );
    assertNoUserErrors(
      priceData.productVariantsBulkUpdate.userErrors,
      "productVariantsBulkUpdate"
    );
  }

  // 3. Stock via inventorySetQuantities (absolute set at the primary location).
  if (input.inventoryItemId) {
    const locationId = await getPrimaryLocationId();
    const invData = await adminFetch<{
      inventorySetQuantities: { userErrors: { field?: string[]; message: string }[] };
    }>(
      /* GraphQL */ `
        mutation SetStock($input: InventorySetQuantitiesInput!) {
          inventorySetQuantities(input: $input) { userErrors { field message } }
        }
      `,
      {
        input: {
          name: "available",
          reason: "correction",
          ignoreCompareQuantity: true,
          quantities: [
            {
              inventoryItemId: input.inventoryItemId,
              locationId,
              quantity: Math.max(0, input.stock),
            },
          ],
        },
      }
    );
    assertNoUserErrors(
      invData.inventorySetQuantities.userErrors,
      "inventorySetQuantities"
    );
  }

  // Re-publish in case status flipped back to ACTIVE from draft.
  if (input.status === "ACTIVE") {
    await publishEverywhere(input.id).catch((e) =>
      console.warn("[admin] republish failed:", e)
    );
  }
}

/** Set a single variant's price (used by the bulk pricing tool). */
export async function setProductPrice(
  productId: string,
  variantId: string,
  priceDollars: string
): Promise<void> {
  const data = await adminFetch<{
    productVariantsBulkUpdate: { userErrors: { field?: string[]; message: string }[] };
  }>(
    /* GraphQL */ `
      mutation SetPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          userErrors { field message }
        }
      }
    `,
    { productId, variants: [{ id: variantId, price: priceDollars }] }
  );
  assertNoUserErrors(
    data.productVariantsBulkUpdate.userErrors,
    "productVariantsBulkUpdate"
  );
}

/** Permanently delete a product (e.g. a plant that's gone for good). */
export async function deleteProduct(gid: string): Promise<void> {
  const data = await adminFetch<{
    productDelete: { deletedProductId: string | null; userErrors: { field?: string[]; message: string }[] };
  }>(
    /* GraphQL */ `
      mutation DeleteProduct($id: ID!) {
        productDelete(input: { id: $id }) {
          deletedProductId
          userErrors { field message }
        }
      }
    `,
    { id: gid }
  );
  assertNoUserErrors(data.productDelete.userErrors, "productDelete");
}

// ==========================================================================
// Orders (needs the read_orders scope)
// ==========================================================================

export interface AdminOrder {
  id: string;
  name: string; // "#1001"
  createdAt: string;
  customerName: string | null;
  totalCents: number;
  financialStatus: string | null; // PAID, PENDING, REFUNDED…
  fulfillmentStatus: string | null; // FULFILLED, UNFULFILLED…
  itemCount: number;
  itemsSummary: string; // "Jade Plant ×1, Ruby Slippers ×2"
}

export interface OrderMetrics {
  totalOrders: number;
  totalRevenueCents: number;
  last30Orders: number;
  last30RevenueCents: number;
  unfulfilled: number;
  topProducts: { title: string; qty: number }[];
}

interface OrderNode {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string | null;
  customer: { displayName: string | null } | null;
  currentTotalPriceSet: { shopMoney: { amount: string } };
  lineItems: { edges: { node: { title: string; quantity: number } }[] };
}

const ORDER_FIELDS = /* GraphQL */ `
  id
  name
  createdAt
  displayFinancialStatus
  displayFulfillmentStatus
  customer { displayName }
  currentTotalPriceSet { shopMoney { amount } }
  lineItems(first: 50) { edges { node { title quantity } } }
`;

function mapOrder(node: OrderNode): AdminOrder {
  const lines = node.lineItems.edges.map((e) => e.node);
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
  return {
    id: node.id,
    name: node.name,
    createdAt: node.createdAt,
    customerName: node.customer?.displayName || null,
    totalCents: Math.round(parseFloat(node.currentTotalPriceSet.shopMoney.amount) * 100),
    financialStatus: node.displayFinancialStatus,
    fulfillmentStatus: node.displayFulfillmentStatus,
    itemCount,
    itemsSummary: lines.map((l) => `${l.title} ×${l.quantity}`).join(", "),
  };
}

/** Recent orders, newest first. Throws if read_orders isn't granted. */
export async function getOrders(first = 50): Promise<AdminOrder[]> {
  const data = await adminFetch<{ orders: { edges: { node: OrderNode }[] } }>(
    /* GraphQL */ `
      query Orders($first: Int!) {
        orders(first: $first, sortKey: CREATED_AT, reverse: true) {
          edges { node { ${ORDER_FIELDS} } }
        }
      }
    `,
    { first }
  );
  return data.orders.edges.map((e) => mapOrder(e.node));
}

/** Aggregate sales metrics for the dashboard. Throws if read_orders isn't granted. */
export async function getOrderMetrics(): Promise<OrderMetrics> {
  const orders = await getOrders(250);
  const now = Date.now();
  const THIRTY = 30 * 24 * 60 * 60 * 1000;

  const paid = (o: AdminOrder) =>
    o.financialStatus === "PAID" || o.financialStatus === "PARTIALLY_REFUNDED";

  let totalRevenueCents = 0;
  let last30Orders = 0;
  let last30RevenueCents = 0;
  let unfulfilled = 0;
  const productQty: Record<string, number> = {};

  for (const o of orders) {
    if (paid(o)) totalRevenueCents += o.totalCents;
    if (o.fulfillmentStatus !== "FULFILLED") unfulfilled++;
    if (now - new Date(o.createdAt).getTime() <= THIRTY) {
      last30Orders++;
      if (paid(o)) last30RevenueCents += o.totalCents;
    }
  }
  // Best-sellers need line-item detail — fetch is already included above.
  // (Re-derive from the same order set.)
  for (const o of orders) {
    for (const part of o.itemsSummary.split(", ")) {
      const m = part.match(/^(.*) ×(\d+)$/);
      if (m) productQty[m[1]] = (productQty[m[1]] ?? 0) + Number(m[2]);
    }
  }
  const topProducts = Object.entries(productQty)
    .map(([title, qty]) => ({ title, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return {
    totalOrders: orders.length,
    totalRevenueCents,
    last30Orders,
    last30RevenueCents,
    unfulfilled,
    topProducts,
  };
}
