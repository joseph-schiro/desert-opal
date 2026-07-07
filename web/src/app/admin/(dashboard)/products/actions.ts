"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  isAdminConfigured,
  uploadImage,
} from "@/lib/shopify-admin";
import type { Category } from "@/lib/catalog";

export interface ProductFormState {
  error?: string;
}

/** Map our category to Shopify productType + a tag the storefront can resolve. */
const CATEGORY_TO_TYPE: Record<Category, string> = {
  succulents: "Succulents",
  cacti: "Cacti",
  accessories: "Accessories",
};

/** Build a `desertopal` metafield entry only when the value is non-empty. */
function metafield(key: string, value: string, type = "single_line_text_field") {
  const v = value.trim();
  return v ? { key, value: v, type } : null;
}

interface ParsedForm {
  title: string;
  priceDollars: string;
  stock: number;
  status: "ACTIVE" | "DRAFT";
  productType: string;
  descriptionHtml: string;
  metafields: { key: string; value: string; type: string }[];
}

/** Shared parse/validate for the create & edit forms. Returns an error string or the parsed data. */
function parseForm(formData: FormData): { error: string } | { data: ParsedForm } {
  const get = (k: string) => String(formData.get(k) ?? "").trim();

  const title = get("title");
  const priceDollars = get("price");
  if (!title) return { error: "Name is required." };
  if (!priceDollars || isNaN(Number(priceDollars)) || Number(priceDollars) < 0) {
    return { error: "Enter a valid price." };
  }

  const category = get("category") as Category;
  const metafields = [
    metafield("scientific_name", get("scientificName")),
    metafield("size", get("size")),
    metafield("light", get("light")),
    metafield("water", get("water")),
    metafield("difficulty", get("difficulty")),
    metafield("tone", get("tone")),
    metafield("emoji", get("emoji")),
    { key: "featured", value: formData.get("featured") ? "true" : "false", type: "boolean" },
    { key: "variegated", value: formData.get("variegated") ? "true" : "false", type: "boolean" },
  ].filter((m): m is { key: string; value: string; type: string } => m !== null);

  return {
    data: {
      title,
      priceDollars,
      stock: Math.max(0, parseInt(get("stock") || "0", 10) || 0),
      status: get("status") === "draft" ? "DRAFT" : "ACTIVE",
      productType: CATEGORY_TO_TYPE[category] ?? "Succulents",
      descriptionHtml: get("description"),
      metafields,
    },
  };
}

/** Upload the form's image file if one was provided. Returns the staged source or undefined. */
async function maybeUploadImage(formData: FormData): Promise<string | undefined> {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    return uploadImage(file);
  }
  return undefined;
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin();
  if (!isAdminConfigured()) {
    return { error: "Shopify Admin API isn't configured yet." };
  }

  const parsed = parseForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    const imageSource = await maybeUploadImage(formData);
    await createProduct({
      title: parsed.data.title,
      descriptionHtml: parsed.data.descriptionHtml,
      productType: parsed.data.productType,
      tags: [parsed.data.productType],
      status: parsed.data.status,
      priceDollars: parsed.data.priceDollars,
      stock: parsed.data.stock,
      metafields: parsed.data.metafields,
      imageSource,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create product." };
  }

  revalidateStore();
  redirect("/admin/products?created=1");
}

export async function updateProductAction(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin();
  if (!isAdminConfigured()) {
    return { error: "Shopify Admin API isn't configured yet." };
  }

  const id = String(formData.get("id") ?? "");
  const variantId = String(formData.get("variantId") ?? "") || undefined;
  const inventoryItemId = String(formData.get("inventoryItemId") ?? "") || undefined;
  if (!id) return { error: "Missing product id." };

  const parsed = parseForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    const imageSource = await maybeUploadImage(formData);
    await updateProduct({
      id,
      title: parsed.data.title,
      descriptionHtml: parsed.data.descriptionHtml,
      productType: parsed.data.productType,
      tags: [parsed.data.productType],
      status: parsed.data.status,
      priceDollars: parsed.data.priceDollars,
      stock: parsed.data.stock,
      variantId,
      inventoryItemId,
      metafields: parsed.data.metafields,
      imageSource,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update product." };
  }

  revalidateStore();
  redirect("/admin/products?updated=1");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await deleteProduct(id);
    revalidateStore();
  }
  redirect("/admin/products?deleted=1");
}

/** Refresh admin + storefront caches after a product change. */
function revalidateStore() {
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/shop");
  revalidatePath("/");
}
