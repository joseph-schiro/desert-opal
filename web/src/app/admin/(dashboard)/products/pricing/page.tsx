import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getAdminProducts, isAdminConfigured } from "@/lib/shopify-admin";
import { CATEGORY_LABELS } from "@/lib/catalog";
import { PricingGrid, type PricingRow } from "./pricing-grid";

export const metadata: Metadata = { title: "Bulk Pricing" };

export default async function PricingPage() {
  await requireAdmin();

  if (!isAdminConfigured()) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold text-ink">Bulk pricing</h1>
        <p className="mt-4 rounded-xl2 bg-peach/50 px-4 py-3 text-sm text-terracotta">
          Shopify Admin API isn&apos;t configured yet.
        </p>
      </div>
    );
  }

  const products = await getAdminProducts();
  const rows: PricingRow[] = products
    .filter((p) => p.variantId)
    .map((p) => ({
      id: p.id,
      legacyId: p.legacyId,
      variantId: p.variantId as string,
      title: p.title,
      categoryLabel: CATEGORY_LABELS[p.category],
      priceCents: p.priceCents,
      stock: p.stock,
    }));

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-4 text-sm text-muted">
        <Link href="/admin/products" className="hover:text-sage-deep">Inventory</Link>
        <span className="px-2">/</span>
        <span className="text-ink/70">Bulk pricing</span>
      </nav>

      <h1 className="text-3xl font-semibold text-ink">Bulk pricing</h1>
      <p className="mt-1 text-ink/60">
        Set prices for every plant at once. Edit any field, or fill all $0 plants
        with one value, then save.
      </p>

      <div className="mt-6">
        <PricingGrid rows={rows} />
      </div>
    </div>
  );
}
