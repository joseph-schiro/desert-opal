import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllProducts,
  formatPrice,
  CATEGORY_LABELS,
} from "@/lib/catalog";
import { getAdminProducts, isAdminConfigured } from "@/lib/shopify-admin";
import { InventoryTable, type InventoryRow } from "./inventory-table";

export const metadata: Metadata = { title: "Inventory" };

export default async function AdminInventory({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; deleted?: string }>;
}) {
  const adminReady = isAdminConfigured();
  const flags = await searchParams;

  // Admin API when available (includes drafts + edit links); else read-only catalog.
  let rows: InventoryRow[];
  if (adminReady) {
    const products = await getAdminProducts();
    rows = products.map((p) => ({
      key: p.id,
      title: p.title,
      scientificName: p.scientificName,
      category: p.category,
      categoryLabel: CATEGORY_LABELS[p.category],
      priceCents: p.priceCents,
      priceLabel: formatPrice(p.priceCents),
      stock: p.stock,
      tone: p.tone,
      emoji: p.emoji,
      imageUrl: p.imageUrl,
      variegated: p.variegated,
      editHref: `/admin/products/${p.legacyId}/edit`,
      duplicateHref: `/admin/products/new?from=${p.legacyId}`,
      status: p.status,
    }));
  } else {
    const products = await getAllProducts();
    rows = products.map((p) => ({
      key: p.id,
      title: p.name,
      scientificName: p.scientificName,
      category: p.category,
      categoryLabel: CATEGORY_LABELS[p.category],
      priceCents: p.priceCents,
      priceLabel: formatPrice(p.priceCents),
      stock: p.stock,
      tone: p.tone,
      emoji: p.emoji,
      imageUrl: p.imageUrl,
      variegated: p.variegated,
    }));
  }

  const banner =
    flags.created ? "✓ Product created and published to your store."
    : flags.updated ? "✓ Changes saved."
    : flags.deleted ? "✓ Product deleted."
    : null;

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Inventory</h1>
          <p className="mt-1 text-ink/60">{rows.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/pricing"
            className="rounded-full border border-sand-deep/50 bg-white px-4 py-2 text-sm font-semibold text-ink/80 transition hover:border-sage hover:text-sage-deep"
          >
            💲 Bulk pricing
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-deep"
          >
            + Add product
          </Link>
        </div>
      </header>

      {banner && (
        <div className="mb-4 rounded-xl2 bg-mint/50 px-4 py-3 text-sm font-medium text-sage-deep ring-1 ring-sage/30">
          {banner}
        </div>
      )}

      <InventoryTable rows={rows} adminReady={adminReady} />

      {!adminReady && (
        <p className="mt-4 text-xs text-muted">
          Add your Shopify Admin API credentials to <code>.env.local</code> to
          create and edit products from here. This is currently a read-only view.
        </p>
      )}
    </div>
  );
}
