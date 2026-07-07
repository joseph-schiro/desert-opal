"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PlantPhoto } from "@/components/plant-photo";
import type { Category, Tone } from "@/lib/catalog";
import type { ProductStatus } from "@/lib/shopify-admin";

export interface InventoryRow {
  key: string;
  title: string;
  scientificName?: string;
  category: Category;
  categoryLabel: string;
  priceCents: number;
  priceLabel: string;
  stock: number;
  tone: Tone;
  emoji: string;
  imageUrl?: string;
  variegated?: boolean;
  editHref?: string;
  status?: ProductStatus;
}

type SortKey = "title" | "priceCents" | "stock" | "status";
type StockFilter = "all" | "in" | "low" | "out";

export function InventoryTable({
  rows,
  adminReady,
  lowStockThreshold,
}: {
  rows: InventoryRow[];
  adminReady: boolean;
  lowStockThreshold: number;
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [status, setStatus] = useState<ProductStatus | "all">("all");
  const [stock, setStock] = useState<StockFilter>("all");
  const [variegatedOnly, setVariegatedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (needle) {
        const hay = `${r.title} ${r.scientificName ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (category !== "all" && r.category !== category) return false;
      if (adminReady && status !== "all" && r.status !== status) return false;
      if (variegatedOnly && !r.variegated) return false;
      if (stock === "in" && r.stock <= lowStockThreshold) return false;
      if (stock === "low" && !(r.stock > 0 && r.stock <= lowStockThreshold)) return false;
      if (stock === "out" && r.stock !== 0) return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      let cmp: number;
      if (sortKey === "title") cmp = a.title.localeCompare(b.title);
      else if (sortKey === "status") cmp = (a.status ?? "").localeCompare(b.status ?? "");
      else cmp = a[sortKey] - b[sortKey];
      return cmp * dir;
    });
    return list;
  }, [rows, q, category, status, stock, variegatedOnly, sortKey, sortDir, adminReady, lowStockThreshold]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
  }
  const arrow = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  const selectClass =
    "rounded-full border border-sand-deep/50 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-sage";
  const anyFilter =
    q || category !== "all" || status !== "all" || stock !== "all" || variegatedOnly;

  function reset() {
    setQ(""); setCategory("all"); setStatus("all"); setStock("all"); setVariegatedOnly(false);
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or scientific name…"
          className="min-w-[14rem] flex-1 rounded-full border border-sand-deep/50 bg-white px-4 py-2 text-sm text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value as Category | "all")} className={selectClass}>
          <option value="all">All categories</option>
          <option value="succulents">Succulents</option>
          <option value="cacti">Cacti</option>
          <option value="accessories">Pots & Extras</option>
        </select>
        {adminReady && (
          <select value={status} onChange={(e) => setStatus(e.target.value as ProductStatus | "all")} className={selectClass}>
            <option value="all">Any status</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
          </select>
        )}
        <select value={stock} onChange={(e) => setStock(e.target.value as StockFilter)} className={selectClass}>
          <option value="all">Any stock</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <label className="flex items-center gap-2 rounded-full border border-sand-deep/50 bg-white px-3 py-2 text-sm text-ink">
          <input type="checkbox" checked={variegatedOnly} onChange={(e) => setVariegatedOnly(e.target.checked)} className="h-4 w-4 rounded border-sand-deep/50" />
          🌿 Variegated
        </label>
        {anyFilter && (
          <button type="button" onClick={reset} className="text-sm text-muted underline-offset-2 hover:text-sage-deep hover:underline">
            Clear
          </button>
        )}
      </div>

      <p className="mb-2 text-xs text-muted">
        Showing {filtered.length} of {rows.length}
      </p>

      <div className="overflow-hidden rounded-xl2 bg-white shadow-soft ring-1 ring-sand-deep/40">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-sand-deep/40 bg-sand/40 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3 font-semibold">
                <button type="button" onClick={() => toggleSort("title")} className="uppercase tracking-wide hover:text-sage-deep">
                  Product{arrow("title")}
                </button>
              </th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">
                <button type="button" onClick={() => toggleSort("priceCents")} className="uppercase tracking-wide hover:text-sage-deep">
                  Price{arrow("priceCents")}
                </button>
              </th>
              <th className="px-4 py-3 font-semibold">
                <button type="button" onClick={() => toggleSort("stock")} className="uppercase tracking-wide hover:text-sage-deep">
                  Stock{arrow("stock")}
                </button>
              </th>
              <th className="px-4 py-3 font-semibold">
                {adminReady ? (
                  <button type="button" onClick={() => toggleSort("status")} className="uppercase tracking-wide hover:text-sage-deep">
                    Status{arrow("status")}
                  </button>
                ) : ("Status")}
              </th>
              {adminReady && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-deep/30">
            {filtered.map((r) => {
              const badge =
                r.stock === 0 ? { label: "Out of stock", className: "bg-ink/80 text-cream" }
                : r.stock <= lowStockThreshold ? { label: "Low", className: "bg-terracotta text-white" }
                : { label: "In stock", className: "bg-mint text-sage-deep" };
              return (
                <tr key={r.key} className="transition hover:bg-sand/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <PlantPhoto tone={r.tone} emoji={r.emoji} imageUrl={r.imageUrl} imageAlt={r.title} size="text-xl" sizes="40px" className="h-10 w-10 shrink-0 rounded-lg" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{r.title}</span>
                          {r.variegated && (
                            <span className="rounded-full bg-mint/60 px-2 py-0.5 text-[0.65rem] font-semibold text-sage-deep">🌿 Variegated</span>
                          )}
                        </div>
                        {r.scientificName && <div className="text-xs italic text-muted">{r.scientificName}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{r.categoryLabel}</td>
                  <td className="px-4 py-3 font-medium text-ink">{r.priceLabel}</td>
                  <td className="px-4 py-3 font-medium text-ink">{r.stock}</td>
                  <td className="px-4 py-3">
                    {r.status === "DRAFT" ? (
                      <span className="inline-block rounded-full bg-ink/80 px-2.5 py-0.5 text-xs font-semibold text-cream">Draft</span>
                    ) : (
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                    )}
                  </td>
                  {adminReady && (
                    <td className="px-4 py-3 text-right">
                      {r.editHref && <Link href={r.editHref} className="text-sm font-semibold text-sage-deep hover:underline">Edit</Link>}
                    </td>
                  )}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={adminReady ? 6 : 5} className="px-4 py-10 text-center text-sm text-muted">
                  No products match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
