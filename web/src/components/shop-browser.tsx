"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import type { Category, Product } from "@/lib/catalog";

const CATEGORY_PILLS: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "succulents", label: "Succulents" },
  { value: "cacti", label: "Cacti" },
  { value: "accessories", label: "Pots & Extras" },
];

type SortKey = "name" | "price-asc" | "price-desc";

const CATEGORY_VALUES = new Set<string>(
  CATEGORY_PILLS.map((p) => p.value),
);

export function ShopBrowser({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The active category lives in the URL (?category=…) so the header nav links
  // and the pills below stay in sync. Reading it from useSearchParams (rather
  // than a useState seed) means soft client-side navigations update the filter
  // immediately, without needing a full page refresh.
  const categoryParam = searchParams.get("category");
  const category: Category | "all" =
    categoryParam && CATEGORY_VALUES.has(categoryParam)
      ? (categoryParam as Category)
      : "all";

  const setCategory = (value: Category | "all") => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete("category");
    else params.set("category", value);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [variegatedOnly, setVariegatedOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = products.filter((p) => {
      if (needle) {
        const hay = `${p.name} ${p.scientificName ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (category !== "all" && p.category !== category) return false;
      if (variegatedOnly && !p.variegated) return false;
      if (inStockOnly && p.stock === 0) return false;
      return true;
    });

    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "price-asc") return a.priceCents - b.priceCents;
      return b.priceCents - a.priceCents;
    });
    return list;
  }, [products, q, category, sort, variegatedOnly, inStockOnly]);

  return (
    <div>
      {/* Search + sort */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search plants…"
          className="min-w-[14rem] flex-1 rounded-full border border-sand-deep/50 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-full border border-sand-deep/50 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-sage"
        >
          <option value="name">Sort: Name (A–Z)</option>
          <option value="price-asc">Sort: Price (low → high)</option>
          <option value="price-desc">Sort: Price (high → low)</option>
        </select>
      </div>

      {/* Category pills + toggles */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {CATEGORY_PILLS.map((f) => {
          const isActive = category === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setCategory(f.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-sage text-white shadow-sm"
                  : "bg-white text-ink/70 ring-1 ring-sand-deep/50 hover:bg-sand/60"
              }`}
            >
              {f.label}
            </button>
          );
        })}
        <span className="mx-1 h-6 w-px bg-sand-deep/50" aria-hidden />
        <label className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-ink/80 ring-1 ring-sand-deep/50">
          <input type="checkbox" checked={variegatedOnly} onChange={(e) => setVariegatedOnly(e.target.checked)} className="h-4 w-4 rounded border-sand-deep/50" />
          🌿 Variegated
        </label>
        <label className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-ink/80 ring-1 ring-sand-deep/50">
          <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="h-4 w-4 rounded border-sand-deep/50" />
          In stock only
        </label>
      </div>

      <p className="mb-4 text-sm text-ink/60">
        {shown.length} {shown.length === 1 ? "treasure" : "treasures"}
        {shown.length !== products.length ? ` of ${products.length}` : ""}
      </p>

      {shown.length === 0 ? (
        <p className="rounded-xl2 bg-sand/60 p-10 text-center text-ink/60">
          No plants match your search — try clearing a filter. 🌱
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
