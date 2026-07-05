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
import { PlantPhoto } from "@/components/plant-photo";

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
  return { title: product.name, description: product.description };
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
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
        <PlantPhoto
          tone={product.tone}
          emoji={product.emoji}
          size="text-9xl"
          className="aspect-square w-full rounded-xl2 shadow-soft ring-1 ring-sand-deep/40"
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
            <button
              type="button"
              disabled={soldOut}
              className="flex-1 rounded-full bg-sage px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-sage-deep disabled:cursor-not-allowed disabled:bg-muted/50"
            >
              {soldOut ? "Sold out" : "Add to cart"}
            </button>
            <span className="text-sm text-muted">
              {product.size}
              {!soldOut && product.stock <= 4 && (
                <span className="ml-2 font-semibold text-terracotta">
                  · Only {product.stock} left
                </span>
              )}
            </span>
          </div>
          {/* NOTE: checkout is wired up once the Shopify backend is connected. */}
        </div>
      </div>
    </div>
  );
}
