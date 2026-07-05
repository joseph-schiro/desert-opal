import Link from "next/link";
import {
  getAllProducts,
  formatPrice,
  CATEGORY_LABELS,
  LOW_STOCK_THRESHOLD,
  type Category,
} from "@/lib/catalog";

export default async function AdminDashboard() {
  const products = await getAllProducts();

  // Inventory KPIs derived from real catalog data.
  const skuCount = products.length;
  const unitsInStock = products.reduce((sum, p) => sum + p.stock, 0);
  const inventoryValueCents = products.reduce(
    (sum, p) => sum + p.stock * p.priceCents,
    0
  );
  const lowStock = products.filter(
    (p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD
  );
  const outOfStock = products.filter((p) => p.stock === 0);

  // Per-category unit counts.
  const byCategory = (Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => ({
    category: cat,
    units: products
      .filter((p) => p.category === cat)
      .reduce((s, p) => s + p.stock, 0),
  }));
  const maxUnits = Math.max(...byCategory.map((c) => c.units), 1);

  const kpis = [
    { label: "Products", value: String(skuCount), tint: "bg-lavender/40" },
    { label: "Units in stock", value: String(unitsInStock), tint: "bg-mint/40" },
    { label: "Inventory value", value: formatPrice(inventoryValueCents), tint: "bg-sky/40" },
    { label: "Low / out of stock", value: `${lowStock.length} / ${outOfStock.length}`, tint: "bg-peach/40" },
  ];

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-ink">Dashboard</h1>
        <p className="mt-1 text-ink/60">
          A quick pulse on the shop. Sales metrics activate once checkout is connected.
        </p>
      </header>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`rounded-xl2 ${k.tint} p-5 ring-1 ring-white/60`}
          >
            <p className="text-sm text-ink/60">{k.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink">
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Stock by category */}
        <section className="rounded-xl2 bg-white p-5 shadow-soft ring-1 ring-sand-deep/40">
          <h2 className="font-display text-lg font-semibold text-ink">Stock by category</h2>
          <div className="mt-4 space-y-3">
            {byCategory.map((c) => (
              <div key={c.category}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-ink/70">{CATEGORY_LABELS[c.category]}</span>
                  <span className="font-semibold text-ink">{c.units} units</span>
                </div>
                <div className="h-2 w-full rounded-full bg-sand">
                  <div
                    className="h-2 rounded-full bg-sage"
                    style={{ width: `${(c.units / maxUnits) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Needs attention */}
        <section className="rounded-xl2 bg-white p-5 shadow-soft ring-1 ring-sand-deep/40">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Needs restocking</h2>
            <Link href="/admin/products" className="text-sm font-semibold text-sage-deep hover:underline">
              Manage →
            </Link>
          </div>
          {lowStock.length === 0 && outOfStock.length === 0 ? (
            <p className="mt-4 text-sm text-ink/60">Everything's well stocked. 🌱</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {[...outOfStock, ...lowStock].map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-sand/50 px-3 py-2 text-sm"
                >
                  <span className="text-ink">{p.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.stock === 0
                        ? "bg-ink/80 text-cream"
                        : "bg-terracotta text-white"
                    }`}
                  >
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
