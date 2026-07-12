import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getAdminProduct, isAdminConfigured } from "@/lib/shopify-admin";
import { ProductForm } from "./product-form";
import { createProductAction } from "../actions";

export const metadata: Metadata = { title: "New Product" };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  await requireAdmin();
  const adminReady = isAdminConfigured();

  // "Duplicate" flow: ?from=<legacyId> pre-fills the form from an existing plant
  // (a huge time-saver when adding many plants of the same species). The image
  // and stock intentionally start fresh — each physical plant needs its own photo.
  const { from } = await searchParams;
  const prefill = from && adminReady ? await getAdminProduct(from) : null;

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-4 text-sm text-muted">
        <Link href="/admin/products" className="hover:text-sage-deep">
          Inventory
        </Link>
        <span className="px-2">/</span>
        <span className="text-ink/70">{prefill ? "Duplicate" : "New product"}</span>
      </nav>

      <h1 className="text-3xl font-semibold text-ink">
        {prefill ? "Duplicate plant" : "New product"}
      </h1>
      <p className="mt-1 text-ink/60">
        {prefill
          ? "Prefilled from an existing plant — swap the photo, tweak the details, and save it as its own listing."
          : "This creates the product directly in Shopify and publishes it to your store."}
      </p>

      {!adminReady && (
        <div className="mt-6 rounded-xl2 bg-peach/50 px-4 py-3 text-sm text-terracotta ring-1 ring-terracotta/30">
          Shopify Admin API isn&apos;t configured yet. Add
          <code className="mx-1 rounded bg-white/60 px-1">SHOPIFY_ADMIN_ACCESS_TOKEN</code>
          to <code className="rounded bg-white/60 px-1">.env.local</code> to enable
          product creation.
        </div>
      )}

      <div className="mt-6">
        <ProductForm action={createProductAction} prefill={prefill ?? undefined} />
      </div>
    </div>
  );
}
