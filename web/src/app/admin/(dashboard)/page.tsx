import Link from "next/link";
import {
  getAllProducts,
  formatPrice,
  CATEGORY_LABELS,
  LOW_STOCK_THRESHOLD,
  type Category,
} from "@/lib/catalog";
import {
  getOrderMetrics,
  isAdminConfigured,
  type OrderMetrics,
} from "@/lib/shopify-admin";

export default async function AdminDashboard() {
  const products = await getAllProducts();

  // Sales metrics from Shopify (needs read_orders; degrade gracefully if absent).
  let metrics: OrderMetrics | null = null;
  if (isAdminConfigured()) {
    try {
      metrics = await getOrderMetrics();
    } catch {
      metrics = null;
    }
  }

  // Inventory KPIs.
  const skuCount = products.length;
  const unitsInStock = products.reduce((sum, p) => sum + p.stock, 0);
  const inventoryValueCents = products.reduce((sum, p) => sum + p.stock * p.priceCents, 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD);
  const outOfStock = products.filter((p) => p.stock === 0);

  const byCategory = (Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => ({
    category: cat,
    units: products.filter((p) => p.category === cat).reduce((s, p) => s + p.stock, 0),
  }));
  const maxUnits = Math.max(...byCategory.map((c) => c.units), 1);

  const salesKpis = metrics
    ? [
        { label: "Revenue (all time)", value: formatPrice(metrics.totalRevenueCents), tint: "bg-mint/50" },
        { label: "Orders", value: String(metrics.totalOrders), tint: "bg-sky/40" },
        { label: "Revenue (30 days)", value: formatPrice(metrics.last30RevenueCents), tint: "bg-lavender/40" },
        { label: "Unfulfilled", value: String(metrics.unfulfilled), tint: "bg-peach/40" },
      ]
    : [];

  const inventoryKpis = [
    { label: "Products", value: String(skuCount), tint: "bg-lavender/40" },
    { label: "Units in stock", value: String(unitsInStock), tint: "bg-mint/40" },
    { label: "Inventory value", value: formatPrice(inventoryValueCents), tint: "bg-sky/40" },
    { label: "Low / out of stock", value: `${lowStock.length} / ${outOfStock.length}`, tint: "bg-peach/40" },
  ];

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-ink">Dashboard</h1>
        <p className="mt-1 text-ink/60">A quick pulse on the shop.</p>
      </header>

      {/* Sales */}
      {metrics ? (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">Sales</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {salesKpis.map((k) => (
              <div key={k.label} className={`rounded-xl2 ${k.tint} p-5 ring-1 ring-white/60`}>
                <p className="text-sm text-ink/60">{k.label}</p>
                <p className="mt-1 font-display text-2xl font-semibold text-ink">{k.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="mb-6 rounded-xl2 bg-sand/50 px-4 py-3 text-sm text-ink/60">
          💡 Sales metrics activate once the <code>read_orders</code> permission is
          added to your Shopify admin app. Inventory stats are live below.
        </div>
      )}

      {/* Inventory */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">Inventory</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {inventoryKpis.map((k) => (
          <div key={k.label} className={`rounded-xl2 ${k.tint} p-5 ring-1 ring-white/60`}>
            <p className="text-sm text-ink/60">{k.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Best sellers (when we have sales) or stock by category */}
        {metrics && metrics.topProducts.length > 0 ? (
          <section className="rounded-xl2 bg-white p-5 shadow-soft ring-1 ring-sand-deep/40">
            <h2 className="font-display text-lg font-semibold text-ink">Best sellers</h2>
            <ul className="mt-4 space-y-2">
              {metrics.topProducts.map((p, i) => (
                <li key={p.title} className="flex items-center justify-between rounded-lg bg-sand/50 px-3 py-2 text-sm">
                  <span className="text-ink">
                    <span className="mr-2 text-ink/40">{i + 1}.</span>
                    {p.title}
                  </span>
                  <span className="font-semibold text-sage-deep">{p.qty} sold</span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
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
                    <div className="h-2 rounded-full bg-sage" style={{ width: `${(c.units / maxUnits) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Needs restocking */}
        <section className="rounded-xl2 bg-white p-5 shadow-soft ring-1 ring-sand-deep/40">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Needs restocking</h2>
            <Link href="/admin/products" className="text-sm font-semibold text-sage-deep hover:underline">
              Manage →
            </Link>
          </div>
          {lowStock.length === 0 && outOfStock.length === 0 ? (
            <p className="mt-4 text-sm text-ink/60">Everything&apos;s well stocked. 🌱</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {[...outOfStock, ...lowStock].slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg bg-sand/50 px-3 py-2 text-sm">
                  <span className="text-ink">{p.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.stock === 0 ? "bg-ink/80 text-cream" : "bg-terracotta text-white"}`}>
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
