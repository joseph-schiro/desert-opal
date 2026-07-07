import type { Metadata } from "next";
import { getAllProducts, type Category } from "@/lib/catalog";
import { ShopBrowser } from "@/components/shop-browser";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage(props: PageProps<"/shop">) {
  // In Next.js 16, searchParams is async and must be awaited.
  // The header nav deep-links here with ?category=… — use it as the initial filter.
  const { category } = await props.searchParams;
  const initialCategory = (typeof category === "string" ? category : "all") as
    | Category
    | "all";

  const products = await getAllProducts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold text-ink">Shop the collection</h1>
        <p className="mt-2 text-ink/60">Find a little green friend to bring home.</p>
      </header>

      <ShopBrowser products={products} initialCategory={initialCategory} />
    </div>
  );
}
