"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useState } from "react";
import type { ProductFormState } from "../actions";
import type { AdminProduct } from "@/lib/shopify-admin";

const TONES = ["sage", "blush", "lavender", "mint", "peach", "sky"];
const DIFFICULTIES = ["Easy", "Medium", "Fussy"];
const WEIGHT_UNITS: { value: string; label: string }[] = [
  { value: "OUNCES", label: "oz" },
  { value: "POUNDS", label: "lb" },
  { value: "GRAMS", label: "g" },
  { value: "KILOGRAMS", label: "kg" },
];

const inputClass =
  "mt-1 w-full rounded-xl2 border border-sand-deep/50 bg-white px-3 py-2 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30";
const labelClass = "text-sm font-medium text-ink/80";

type FormAction = (
  state: ProductFormState,
  formData: FormData
) => Promise<ProductFormState>;

export function ProductForm({
  action,
  product,
  prefill,
}: {
  action: FormAction;
  /** When present, the form edits this product; otherwise it creates one. */
  product?: AdminProduct;
  /** When present (and `product` is not), pre-fills a NEW product from an
   *  existing one — used by the "Duplicate" flow. Image + stock start fresh. */
  prefill?: AdminProduct;
}) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    action,
    {}
  );
  const isEdit = Boolean(product);
  // Field defaults come from the edited product, or the plant being duplicated.
  const d = product ?? prefill;

  // Category drives the stock control: plants are one-of-a-kind (available/sold
  // toggle), while accessories (pots, kits) keep a real numeric quantity.
  const [category, setCategory] = useState<string>(d?.category ?? "succulents");
  const isPlant = category !== "accessories";
  // New/duplicated plants start available; an edited one keeps its current state.
  const defaultAvailable = product ? product.stock > 0 : true;

  return (
    <form action={formAction} className="space-y-6">
      {/* Identifiers needed to update the right Shopify records. */}
      {product && (
        <>
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="variantId" value={product.variantId ?? ""} />
          <input
            type="hidden"
            name="inventoryItemId"
            value={product.inventoryItemId ?? ""}
          />
        </>
      )}

      {/* Core */}
      <section className="rounded-xl2 bg-white/70 p-6 shadow-soft ring-1 ring-sand-deep/40">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className={labelClass}>Name *</label>
            <input id="title" name="title" required defaultValue={d?.title} className={inputClass} />
          </div>

          <div>
            <label htmlFor="category" className={labelClass}>Category</label>
            <select id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              <option value="succulents">Succulents</option>
              <option value="cacti">Cacti</option>
              <option value="accessories">Pots & Extras</option>
            </select>
          </div>
          <div>
            <label htmlFor="scientificName" className={labelClass}>Scientific name</label>
            <input id="scientificName" name="scientificName" defaultValue={d?.scientificName} className={inputClass} />
          </div>

          <div>
            <label htmlFor="price" className={labelClass}>Price (USD) *</label>
            <input id="price" name="price" inputMode="decimal" placeholder="18.00" required defaultValue={d ? (d.priceCents / 100).toFixed(2) : ""} className={inputClass} />
          </div>
          {isPlant ? (
            <div>
              <label className={labelClass}>Availability</label>
              <label className="mt-1 flex items-center gap-2 rounded-xl2 border border-sand-deep/50 bg-white px-3 py-2 text-ink">
                <input type="checkbox" name="available" defaultChecked={defaultAvailable} className="h-4 w-4 rounded border-sand-deep/50" />
                Available for sale
              </label>
              <p className="mt-1 text-xs text-muted">Each plant is one of a kind — uncheck once it&apos;s sold to take it off the shop.</p>
            </div>
          ) : (
            <div>
              <label htmlFor="stock" className={labelClass}>Quantity in stock</label>
              <input id="stock" name="stock" inputMode="numeric" defaultValue={product ? String(product.stock) : "1"} className={inputClass} />
            </div>
          )}

          <div>
            <label htmlFor="size" className={labelClass}>Size</label>
            <input id="size" name="size" placeholder='3&quot; pot' defaultValue={d?.size} className={inputClass} />
          </div>
          <div>
            <label htmlFor="weight" className={labelClass}>Shipping weight</label>
            <div className="mt-1 flex gap-2">
              <input id="weight" name="weight" inputMode="decimal" placeholder="8" defaultValue={d?.weight ?? ""} className={`${inputClass} mt-0`} />
              <select name="weightUnit" defaultValue={d?.weightUnit ?? "OUNCES"} className={`${inputClass} mt-0 w-24`}>
                {WEIGHT_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            <p className="mt-1 text-xs text-muted">Potted weight — used to calculate shipping.</p>
          </div>

          <div>
            <label htmlFor="status" className={labelClass}>Status</label>
            <select id="status" name="status" defaultValue={d?.status === "DRAFT" ? "draft" : "active"} className={inputClass}>
              <option value="active">Active (visible in shop)</option>
              <option value="draft">Draft (hidden / delisted)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className={labelClass}>Description</label>
            <textarea id="description" name="description" rows={4} defaultValue={d?.descriptionHtml} className={inputClass} />
          </div>
        </div>
      </section>

      {/* Photos */}
      <section className="rounded-xl2 bg-white/70 p-6 shadow-soft ring-1 ring-sand-deep/40">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Photos</h2>
        {product?.images && product.images.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs text-muted">
              Current gallery ({product.images.length}) — the first is the main image.
            </p>
            <div className="flex flex-wrap gap-3">
              {product.images.map((img, i) => (
                <div key={img.url} className="relative">
                  <Image
                    src={img.url}
                    alt={img.altText ?? product.title}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-xl2 object-cover ring-1 ring-sand-deep/40"
                  />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded-full bg-sage px-1.5 py-0.5 text-[0.6rem] font-semibold text-white">
                      Main
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <input
          type="file"
          name="images"
          accept="image/*,.heic,.heif"
          multiple
          className="block text-sm text-ink/80 file:mr-3 file:rounded-full file:border-0 file:bg-sage file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-sage-deep"
        />
        <p className="mt-1 text-xs text-muted">
          {isEdit
            ? "Add one or more photos — they'll be appended to the gallery above. (To remove or reorder, use the Shopify admin.)"
            : "Optional. Select one or more — the first becomes the main image. JPG or PNG."}
        </p>
      </section>

      {/* Storefront styling */}
      <section className="rounded-xl2 bg-white/70 p-6 shadow-soft ring-1 ring-sand-deep/40">
        <h2 className="mb-1 font-display text-lg font-semibold text-ink">Storefront details</h2>
        <p className="mb-4 text-xs text-muted">
          Optional — these control how the product looks on the site (until a real
          photo is added, the emoji + tone create its placeholder tile).
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="light" className={labelClass}>Light</label>
            <input id="light" name="light" placeholder="Bright, indirect" defaultValue={d?.light} className={inputClass} />
          </div>
          <div>
            <label htmlFor="water" className={labelClass}>Water</label>
            <input id="water" name="water" placeholder="Every 2–3 weeks" defaultValue={d?.water} className={inputClass} />
          </div>
          <div>
            <label htmlFor="difficulty" className={labelClass}>Care level</label>
            <select id="difficulty" name="difficulty" defaultValue={d?.difficulty ?? "Easy"} className={inputClass}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="tone" className={labelClass}>Tile color (tone)</label>
            <select id="tone" name="tone" defaultValue={d?.tone ?? "sage"} className={inputClass}>
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="emoji" className={labelClass}>Placeholder emoji</label>
            <input id="emoji" name="emoji" placeholder="🪴" maxLength={4} defaultValue={d?.emoji} className={inputClass} />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
              <input type="checkbox" name="variegated" defaultChecked={d?.variegated} className="h-4 w-4 rounded border-sand-deep/50" />
              Variegated foliage
            </label>
          </div>
          <div className="flex items-end pb-2 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
              <input type="checkbox" name="featured" defaultChecked={d?.featured} className="h-4 w-4 rounded border-sand-deep/50" />
              Feature on the homepage
            </label>
          </div>
        </div>
      </section>

      {state.error && (
        <p className="rounded-xl2 bg-blush/60 px-4 py-3 text-sm text-terracotta">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-sage px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-sage-deep disabled:cursor-not-allowed disabled:bg-muted/50"
        >
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
        <Link href="/admin/products" className="text-sm text-muted transition hover:text-sage-deep">
          Cancel
        </Link>
      </div>
    </form>
  );
}
