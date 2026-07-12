import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getAllProducts,
  getProductBySlug,
  formatPrice,
  CATEGORY_LABELS,
  type Difficulty,
} from "@/lib/catalog";
import { ProductGallery } from "@/components/product-gallery";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Pre-render a page for each product at build time.
export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };
  const desc = product.description || `${product.name} — a hand-picked plant from Desert Opal.`;
  return {
    title: product.name,
    description: desc,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: desc,
      url: `${SITE_URL}/products/${product.slug}`,
      images: product.images?.length
        ? product.images.map((i) => ({ url: i.url }))
        : product.imageUrl
          ? [{ url: product.imageUrl }]
          : undefined,
    },
  };
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Easy: "bg-mint text-sage-deep",
  Medium: "bg-peach text-terracotta",
  Fussy: "bg-blush text-ink",
};

export default async function ProductPage(
  props: PageProps<"/products/[slug]">
) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const soldOut = product.stock === 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.images?.length
      ? product.images.map((i) => i.url)
      : product.imageUrl
        ? [product.imageUrl]
        : undefined,
    category: CATEGORY_LABELS[product.category],
    ...(product.scientificName ? { alternateName: product.scientificName } : {}),
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (product.priceCents / 100).toFixed(2),
      availability: soldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      url: `${SITE_URL}/products/${product.slug}`,
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="mb-6 text-sm text-muted">
        <Link href="/shop" className="hover:text-sage-deep">Shop</Link>
        <span className="px-2">/</span>
        <Link
          href={`/shop?category=${product.category}`}
          className="hover:text-sage-deep"
        >
          {CATEGORY_LABELS[product.category]}
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery
          images={
            product.images && product.images.length > 0
              ? product.images
              : product.imageUrl
                ? [{ url: product.imageUrl, altText: product.imageAlt }]
                : []
          }
          tone={product.tone}
          emoji={product.emoji}
          name={product.name}
        />

        <div className="flex flex-col">
          <span className="text-sm font-semibold uppercase tracking-widest text-sage-deep">
            {CATEGORY_LABELS[product.category]}
          </span>
          <h1 className="mt-1 text-4xl font-semibold text-ink">{product.name}</h1>
          {product.scientificName && (
            <p className="mt-1 text-lg italic text-muted">
              {product.scientificName}
            </p>
          )}
          {product.variegated && (
            <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-mint/60 px-3 py-1 text-sm font-semibold text-sage-deep ring-1 ring-sage/30">
              🌿 Variegated
            </span>
          )}

          <p className="mt-4 text-2xl font-semibold text-sage-deep">
            {formatPrice(product.priceCents)}
          </p>

          <p className="mt-4 leading-relaxed text-ink/75">{product.description}</p>

          {/* Care details */}
          {product.category !== "accessories" && (
            <dl className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl2 bg-sky/40 p-3 text-center">
                <dt className="text-xs uppercase tracking-wide text-ink/50">Light</dt>
                <dd className="mt-1 text-sm font-semibold text-ink">{product.care.light}</dd>
              </div>
              <div className="rounded-xl2 bg-mint/40 p-3 text-center">
                <dt className="text-xs uppercase tracking-wide text-ink/50">Water</dt>
                <dd className="mt-1 text-sm font-semibold text-ink">{product.care.water}</dd>
              </div>
              <div className="rounded-xl2 bg-lavender/40 p-3 text-center">
                <dt className="text-xs uppercase tracking-wide text-ink/50">Care level</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${DIFFICULTY_STYLES[product.care.difficulty]}`}
                  >
                    {product.care.difficulty}
                  </span>
                </dd>
              </div>
            </dl>
          )}

          {/* Stock + CTA */}
          <div className="mt-8 flex items-center gap-3">
            <AddToCartButton variantId={product.variantId} soldOut={soldOut} />
            <span className="text-sm text-muted">{product.size}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
