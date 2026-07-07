import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllProducts } from "@/lib/catalog";
import { ShopBrowser } from "@/components/shop-browser";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage() {
  // The header nav deep-links here with ?category=… — ShopBrowser reads that
  // straight from the URL (via useSearchParams) so it stays in sync on soft
  // client-side navigations.
  const products = await getAllProducts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold text-ink">Shop the collection</h1>
        <p className="mt-2 text-ink/60">Find a little green friend to bring home.</p>
      </header>

      <Suspense fallback={null}>
        <ShopBrowser products={products} />
      </Suspense>
    </div>
  );
}
