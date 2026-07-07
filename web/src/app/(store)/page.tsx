import Link from "next/link";
import { getFeaturedProducts, CATEGORY_LABELS, type Category } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

const CATEGORY_CARDS: { category: Category; emoji: string; blurb: string; tint: string }[] = [
  { category: "succulents", emoji: "🪷", blurb: "Rosettes, jellybeans & pearls", tint: "bg-lavender/50" },
  { category: "cacti", emoji: "🌵", blurb: "Spiky little characters", tint: "bg-peach/50" },
  { category: "accessories", emoji: "🪴", blurb: "Pots, soil & gift kits", tint: "bg-mint/50" },
];

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sage-soft via-cream to-blush/40" />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center md:py-28">
          <span className="rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-sage-deep shadow-sm">
            Small-batch · Grown with love
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-ink md:text-6xl">
            Little desert treasures for your windowsill
          </h1>
          <p className="max-w-xl text-lg text-ink/70">
            Hand-picked succulents and cacti.
            Easy to love, easy to keep alive.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/shop"
              className="rounded-full bg-sage px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-sage-deep"
            >
              Shop the collection
            </Link>
            {/* <Link
              href="/shop?category=succulents"
              className="rounded-full bg-white/80 px-6 py-3 font-semibold text-sage-deep ring-1 ring-sage/40 transition hover:bg-white"
            >
              Browse succulents
            </Link> */}
          </div>
        </div>
      </section>

      {/* Category shortcuts */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {CATEGORY_CARDS.map((c) => (
            <Link
              key={c.category}
              href={`/shop?category=${c.category}`}
              className={`flex items-center gap-4 rounded-xl2 ${c.tint} p-5 shadow-soft ring-1 ring-white/60 transition hover:-translate-y-1`}
            >
              <span className="text-4xl" aria-hidden>{c.emoji}</span>
              <span>
                <span className="block font-display text-lg font-semibold text-ink">
                  {CATEGORY_LABELS[c.category]}
                </span>
                <span className="block text-sm text-ink/60">{c.blurb}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-ink">Fan favorites</h2>
            <p className="mt-1 text-ink/60">The ones that never last long.</p>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-sage-deep hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Reassurance band */}
      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="grid gap-6 rounded-xl2 bg-sand/60 p-8 text-center sm:grid-cols-3">
          {[
            { emoji: "📦", title: "Carefully packed", body: "Each plant is snug and secure for the trip." },
            { emoji: "🌱", title: "Healthy guarantee", body: "Arrives happy, or we'll make it right." },
            { emoji: "💌", title: "Care card included", body: "Simple tips so it thrives with you." },
          ].map((f) => (
            <div key={f.title}>
              <div className="text-3xl">{f.emoji}</div>
              <h3 className="mt-2 font-display text-lg font-semibold text-ink">{f.title}</h3>
              <p className="mt-1 text-sm text-ink/60">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
