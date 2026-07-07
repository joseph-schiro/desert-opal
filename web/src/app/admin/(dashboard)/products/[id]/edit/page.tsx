import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { getAdminProduct } from "@/lib/shopify-admin";
import { ProductForm } from "../../new/product-form";
import { updateProductAction, deleteProductAction } from "../../actions";

export const metadata: Metadata = { title: "Edit Product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-4 text-sm text-muted">
        <Link href="/admin/products" className="hover:text-sage-deep">Inventory</Link>
        <span className="px-2">/</span>
        <span className="text-ink/70">Edit</span>
      </nav>

      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-semibold text-ink">{product.title}</h1>
        {product.status === "DRAFT" && (
          <span className="rounded-full bg-ink/80 px-2.5 py-0.5 text-xs font-semibold text-cream">
            Draft (hidden)
          </span>
        )}
      </div>
      <p className="mt-1 text-ink/60">Edit details, stock, or delist this product.</p>

      <div className="mt-6">
        <ProductForm action={updateProductAction} product={product} />
      </div>

      {/* Danger zone */}
      <div className="mt-10 rounded-xl2 border border-terracotta/40 bg-blush/30 p-5">
        <h2 className="font-display font-semibold text-ink">Delete product</h2>
        <p className="mt-1 text-sm text-ink/70">
          Permanently removes this product from Shopify and your store. To hide it
          temporarily instead, set its status to <strong>Draft</strong> above.
        </p>
        <form action={deleteProductAction} className="mt-3">
          <input type="hidden" name="id" value={product.id} />
          <button
            type="submit"
            className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-white transition hover:bg-terracotta/90"
          >
            Delete permanently
          </button>
        </form>
      </div>
    </div>
  );
}
