import Link from "next/link";
import type { Metadata } from "next";
import {
  getAllProducts,
  CATEGORY_LABELS,
  type Category,
} from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = { title: "Shop" };

const FILTERS: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "succulents", label: CATEGORY_LABELS.succulents },
  { value: "cacti", label: CATEGORY_LABELS.cacti },
  { value: "accessories", label: CATEGORY_LABELS.accessories },
];

export default async function ShopPage(props: PageProps<"/shop">) {
  // In Next.js 16, searchParams is async and must be awaited.
  const { category } = await props.searchParams;
  const active = (typeof category === "string" ? category : "all") as
    | Category
    | "all";

  const all = await getAllProducts();
  const products =
    active === "all" ? all : all.filter((p) => p.category === active);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold text-ink">Shop the collection</h1>
        <p className="mt-2 text-ink/60">
          {products.length} little {products.length === 1 ? "treasure" : "treasures"}{" "}
          waiting for a home.
        </p>
      </header>

      {/* Filter pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const isActive = active === f.value;
          const href = f.value === "all" ? "/shop" : `/shop?category=${f.value}`;
          return (
            <Link
              key={f.value}
              href={href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-sage text-white shadow-sm"
                  : "bg-white text-ink/70 ring-1 ring-sand-deep/50 hover:bg-sand/60"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {products.length === 0 ? (
        <p className="rounded-xl2 bg-sand/60 p-10 text-center text-ink/60">
          Nothing here yet — check back soon! 🌱
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
