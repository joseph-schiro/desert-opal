import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrders() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-ink">Orders</h1>
      <div className="mt-6 rounded-xl2 bg-white p-10 text-center shadow-soft ring-1 ring-sand-deep/40">
        <div className="text-4xl">📦</div>
        <h2 className="mt-3 font-display text-lg font-semibold text-ink">
          Orders show up here once checkout is connected
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
          When the Shopify (or custom payments) backend is wired in, incoming
          orders, fulfillment status, and shipping labels will live on this page.
        </p>
      </div>
    </div>
  );
}
