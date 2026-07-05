/**
 * Catalog data layer.
 *
 * This is the ONLY place the rest of the app talks to for product data.
 * Right now it returns hand-written mock plants. When the Shopify store is
 * ready, we swap the bodies of these functions to call the Shopify Storefront
 * API and map the results into this same `Product` shape — every page/component
 * keeps working untouched. The types below deliberately mirror Shopify's model
 * (money as minor units, handle/slug, variants-as-stock) to make that painless.
 */

export type Category = "succulents" | "cacti" | "accessories";

export type Difficulty = "Easy" | "Medium" | "Fussy";

/** Accent token used to tint the placeholder "photo" until real images exist. */
export type Tone = "sage" | "blush" | "lavender" | "mint" | "peach" | "sky";

export interface Product {
  id: string;
  /** URL-safe identifier (Shopify calls this the "handle"). */
  slug: string;
  name: string;
  scientificName?: string;
  category: Category;
  /** Price in cents to avoid floating-point money bugs (Shopify-style). */
  priceCents: number;
  /** On-hand inventory count. */
  stock: number;
  size: string;
  description: string;
  care: { light: string; water: string; difficulty: Difficulty };
  tone: Tone;
  featured?: boolean;
  /** Placeholder emoji shown on the tinted card until a real photo is added. */
  emoji: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  succulents: "Succulents",
  cacti: "Cacti",
  accessories: "Pots & Extras",
};

/** Threshold under which the admin flags a product as "low stock". */
export const LOW_STOCK_THRESHOLD = 4;

const PRODUCTS: Product[] = [
  {
    id: "1",
    slug: "opal-echeveria",
    name: "Opal Echeveria",
    scientificName: "Echeveria 'Lola'",
    category: "succulents",
    priceCents: 1800,
    stock: 12,
    size: '3" pot',
    description:
      "A dreamy rosette with a frosted, pearly sheen that shifts from lavender to pink in bright light. Our little namesake and a customer favorite.",
    care: { light: "Bright, indirect", water: "Every 2–3 weeks", difficulty: "Easy" },
    tone: "lavender",
    featured: true,
    emoji: "🪷",
  },
  {
    id: "2",
    slug: "golden-barrel-cactus",
    name: "Golden Barrel Cactus",
    scientificName: "Echinocactus grusonii",
    category: "cacti",
    priceCents: 2400,
    stock: 7,
    size: '4" pot',
    description:
      "A cheerful, round golden barrel with sunny spines. Slow-growing, nearly indestructible, and endlessly charming on a sunny sill.",
    care: { light: "Full sun", water: "Monthly", difficulty: "Easy" },
    tone: "peach",
    featured: true,
    emoji: "🌵",
  },
  {
    id: "3",
    slug: "string-of-pearls",
    name: "String of Pearls",
    scientificName: "Curio rowleyanus",
    category: "succulents",
    priceCents: 2000,
    stock: 3,
    size: '4" hanging pot',
    description:
      "Cascading strands of little green beads that spill beautifully over shelves and hanging planters. A trailing showstopper.",
    care: { light: "Bright, indirect", water: "Every 2 weeks", difficulty: "Medium" },
    tone: "mint",
    featured: true,
    emoji: "🌿",
  },
  {
    id: "4",
    slug: "bunny-ear-cactus",
    name: "Bunny Ear Cactus",
    scientificName: "Opuntia microdasys",
    category: "cacti",
    priceCents: 1600,
    stock: 9,
    size: '3" pot',
    description:
      "Adorable paddle-shaped pads that sprout in pairs like little bunny ears. Soft-looking golden tufts (handle with care — they're prickly!).",
    care: { light: "Full sun", water: "Every 3 weeks", difficulty: "Easy" },
    tone: "peach",
    emoji: "🐰",
  },
  {
    id: "5",
    slug: "pink-moonstone",
    name: "Pink Moonstone",
    scientificName: "Pachyphytum oviferum",
    category: "succulents",
    priceCents: 2200,
    stock: 2,
    size: '3" pot',
    description:
      "Plump, sugared jellybean leaves in soft opal pinks and blues. Looks like a little bowl of candy — utterly irresistible.",
    care: { light: "Bright, indirect", water: "Every 2 weeks", difficulty: "Medium" },
    tone: "blush",
    featured: true,
    emoji: "🌸",
  },
  {
    id: "6",
    slug: "moon-cactus",
    name: "Moon Cactus",
    scientificName: "Gymnocalycium mihanovichii",
    category: "cacti",
    priceCents: 1500,
    stock: 6,
    size: '2.5" pot',
    description:
      "A vivid pastel top grafted onto a green base — a pop of color that brightens any desk. Small but mighty on personality.",
    care: { light: "Bright, indirect", water: "Every 2 weeks", difficulty: "Medium" },
    tone: "blush",
    emoji: "🌙",
  },
  {
    id: "7",
    slug: "blue-echeveria",
    name: "Blue Chalk Echeveria",
    scientificName: "Echeveria 'Blue Bird'",
    category: "succulents",
    priceCents: 1900,
    stock: 8,
    size: '3.5" pot',
    description:
      "Powder-blue rosettes with a soft chalky bloom. Cool, calm, and endlessly photogenic — a serene counterpoint to the warmer pastels.",
    care: { light: "Bright light", water: "Every 2–3 weeks", difficulty: "Easy" },
    tone: "sky",
    emoji: "🩵",
  },
  {
    id: "8",
    slug: "handmade-pastel-pot",
    name: "Handmade Pastel Pot",
    category: "accessories",
    priceCents: 2800,
    stock: 5,
    size: '4" ceramic',
    description:
      "A locally thrown ceramic planter in a soft matte glaze with a drainage hole. Each one is a little different — pick your favorite pastel.",
    care: { light: "—", water: "—", difficulty: "Easy" },
    tone: "lavender",
    emoji: "🪴",
  },
  {
    id: "9",
    slug: "desert-starter-kit",
    name: "Desert Starter Kit",
    category: "accessories",
    priceCents: 3400,
    stock: 4,
    size: "Kit",
    description:
      "Everything a new plant parent needs: gritty cactus soil, a mini watering tool, and a care card. The perfect gift to go with any plant.",
    care: { light: "—", water: "—", difficulty: "Easy" },
    tone: "sage",
    emoji: "🎁",
  },
];

// Simulate async I/O so swapping in the real Shopify API is a drop-in change.
const tick = <T,>(value: T): Promise<T> => Promise.resolve(value);

export function getAllProducts(): Promise<Product[]> {
  return tick(PRODUCTS);
}

export function getProductBySlug(slug: string): Promise<Product | undefined> {
  return tick(PRODUCTS.find((p) => p.slug === slug));
}

export function getFeaturedProducts(): Promise<Product[]> {
  return tick(PRODUCTS.filter((p) => p.featured));
}

export function getProductsByCategory(category: Category): Promise<Product[]> {
  return tick(PRODUCTS.filter((p) => p.category === category));
}

/** Money helper: cents -> "$18.00". */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
