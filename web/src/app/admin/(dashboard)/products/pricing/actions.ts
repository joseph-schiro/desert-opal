"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { setProductPrice, isAdminConfigured } from "@/lib/shopify-admin";

export interface PriceUpdate {
  id: string; // product gid
  variantId: string;
  priceDollars: string;
}

export interface BulkPriceResult {
  updated: number;
  failed: number;
  error?: string;
}

/** Apply a batch of price changes. Only the rows the client sends are updated. */
export async function bulkUpdatePricesAction(
  rows: PriceUpdate[]
): Promise<BulkPriceResult> {
  await requireAdmin();
  if (!isAdminConfigured()) {
    return { updated: 0, failed: 0, error: "Shopify Admin API isn't configured." };
  }

  let updated = 0;
  let failed = 0;
  for (const row of rows) {
    const price = row.priceDollars.trim();
    if (!row.id || !row.variantId) { failed++; continue; }
    if (price === "" || isNaN(Number(price)) || Number(price) < 0) { failed++; continue; }
    try {
      await setProductPrice(row.id, row.variantId, Number(price).toFixed(2));
      updated++;
    } catch {
      failed++;
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/products/pricing");
  revalidatePath("/shop");
  revalidatePath("/");

  return { updated, failed };
}
