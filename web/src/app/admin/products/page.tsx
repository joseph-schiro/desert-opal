import type { Metadata } from "next";
import {
  getAllProducts,
  formatPrice,
  CATEGORY_LABELS,
  LOW_STOCK_THRESHOLD,
  type Product,
} from "@/lib/catalog";
import { PlantPhoto } from "@/components/plant-photo";

export const metadata: Metadata = { title: "Inventory" };

function stockBadge(p: Product) {
  if (p.stock === 0)
    return { label: "Out of stock", className: "bg-ink/80 text-cream" };
  if (p.stock <= LOW_STOCK_THRESHOLD)
    return { label: "Low", className: "bg-terracotta text-white" };
  return { label: "In stock", className: "bg-mint text-sage-deep" };
}

export default async function AdminInventory() {
  const products = await getAllProducts();

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Inventory</h1>
          <p className="mt-1 text-ink/60">{products.length} products</p>
        </div>
        <button
          type="button"
          className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-deep"
        >
          + Add product
        </button>
      </header>

      <div className="overflow-hidden rounded-xl2 bg-white shadow-soft ring-1 ring-sand-deep/40">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-sand-deep/40 bg-sand/40 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-deep/30">
            {products.map((p) => {
              const badge = stockBadge(p);
              return (
                <tr key={p.id} className="transition hover:bg-sand/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <PlantPhoto
                        tone={p.tone}
                        emoji={p.emoji}
                        size="text-xl"
                        className="h-10 w-10 shrink-0 rounded-lg"
                      />
                      <div>
                        <div className="font-semibold text-ink">{p.name}</div>
                        {p.scientificName && (
                          <div className="text-xs italic text-muted">
                            {p.scientificName}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {CATEGORY_LABELS[p.category]}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    {formatPrice(p.priceCents)}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted">
        Editing and adding products becomes live once the catalog is backed by a
        database or Shopify. For now this is a read-only view of the sample catalog.
      </p>
    </div>
  );
}
