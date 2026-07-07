"use client";

import { useMemo, useState, useTransition } from "react";
import { bulkUpdatePricesAction, type BulkPriceResult } from "./actions";

export interface PricingRow {
  id: string; // product gid
  legacyId: string;
  variantId: string;
  title: string;
  categoryLabel: string;
  priceCents: number;
  stock: number;
}

/** cents -> "12.00" for an editable input. */
const toInput = (cents: number) => (cents / 100).toFixed(2);

export function PricingGrid({ rows }: { rows: PricingRow[] }) {
  // Map of legacyId -> current input string.
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((r) => [r.legacyId, toInput(r.priceCents)]))
  );
  const [fill, setFill] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<BulkPriceResult | null>(null);

  const zeroCount = useMemo(
    () => rows.filter((r) => r.priceCents === 0).length,
    [rows]
  );

  const changed = useMemo(
    () =>
      rows.filter((r) => {
        const v = prices[r.legacyId]?.trim();
        return v !== undefined && v !== "" && v !== toInput(r.priceCents);
      }),
    [rows, prices]
  );

  function setPrice(legacyId: string, value: string) {
    setPrices((p) => ({ ...p, [legacyId]: value }));
    setResult(null);
  }

  function fillEmpties() {
    const v = fill.trim();
    if (v === "" || isNaN(Number(v))) return;
    setPrices((p) => {
      const next = { ...p };
      for (const r of rows) if (r.priceCents === 0) next[r.legacyId] = Number(v).toFixed(2);
      return next;
    });
    setResult(null);
  }

  function save() {
    const payload = changed.map((r) => ({
      id: r.id,
      variantId: r.variantId,
      priceDollars: prices[r.legacyId].trim(),
    }));
    if (payload.length === 0) return;
    startTransition(async () => {
      const res = await bulkUpdatePricesAction(payload);
      setResult(res);
    });
  }

  return (
    <div>
      {/* Quick fill */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl2 bg-white/70 p-4 ring-1 ring-sand-deep/40">
        <span className="text-sm text-ink/70">
          {zeroCount > 0 ? `${zeroCount} plants still at $0.` : "All plants priced."}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Set all $0 plants to $</span>
          <input
            value={fill}
            onChange={(e) => setFill(e.target.value)}
            inputMode="decimal"
            placeholder="8.00"
            className="w-24 rounded-full border border-sand-deep/50 bg-white px-3 py-1.5 text-sm outline-none focus:border-sage"
          />
          <button
            type="button"
            onClick={fillEmpties}
            className="rounded-full bg-sand px-3 py-1.5 text-sm font-semibold text-ink/80 transition hover:bg-sand-deep/40"
          >
            Fill
          </button>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky top-0 z-10 mb-3 flex items-center justify-between rounded-xl2 bg-cream/90 px-4 py-3 shadow-soft ring-1 ring-sand-deep/40 backdrop-blur">
        <span className="text-sm text-ink/70">
          {changed.length} unsaved {changed.length === 1 ? "change" : "changes"}
        </span>
        <div className="flex items-center gap-3">
          {result && (
            <span className={`text-sm font-medium ${result.failed ? "text-terracotta" : "text-sage-deep"}`}>
              {result.error ?? `Saved ${result.updated}${result.failed ? `, ${result.failed} failed` : ""}.`}
            </span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending || changed.length === 0}
            className="rounded-full bg-sage px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-sage-deep disabled:cursor-not-allowed disabled:bg-muted/50"
          >
            {pending ? "Saving…" : "Save prices"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl2 bg-white shadow-soft ring-1 ring-sand-deep/40">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-sand-deep/40 bg-sand/40 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Price (USD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-deep/30">
            {rows.map((r) => {
              const dirty = prices[r.legacyId]?.trim() !== toInput(r.priceCents);
              return (
                <tr key={r.id} className={dirty ? "bg-mint/20" : "transition hover:bg-sand/30"}>
                  <td className="px-4 py-2.5 font-medium text-ink">{r.title}</td>
                  <td className="px-4 py-2.5 text-ink/70">{r.categoryLabel}</td>
                  <td className="px-4 py-2.5 text-ink/70">{r.stock}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <span className="text-ink/50">$</span>
                      <input
                        value={prices[r.legacyId] ?? ""}
                        onChange={(e) => setPrice(r.legacyId, e.target.value)}
                        inputMode="decimal"
                        className={`w-24 rounded-lg border px-2 py-1 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30 ${
                          r.priceCents === 0 && !dirty ? "border-terracotta/50 bg-blush/30" : "border-sand-deep/50 bg-white"
                        }`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
