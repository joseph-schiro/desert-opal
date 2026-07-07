import type { Metadata } from "next";
import { requireAdmin } from "@/lib/dal";
import { getOrders, isAdminConfigured, type AdminOrder } from "@/lib/shopify-admin";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusPill(status: string | null, kind: "financial" | "fulfillment") {
  const s = (status ?? "").toUpperCase();
  let cls = "bg-sand text-ink/70";
  if (kind === "financial") {
    if (s === "PAID") cls = "bg-mint text-sage-deep";
    else if (s === "PENDING" || s === "AUTHORIZED") cls = "bg-peach text-terracotta";
    else if (s.includes("REFUND")) cls = "bg-lavender/60 text-ink/70";
  } else {
    if (s === "FULFILLED") cls = "bg-mint text-sage-deep";
    else if (s === "UNFULFILLED" || s === "") cls = "bg-terracotta text-white";
    else cls = "bg-peach text-terracotta";
  }
  const label = (status ?? "UNFULFILLED").replace(/_/g, " ").toLowerCase();
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {label}
    </span>
  );
}

export default async function AdminOrders() {
  await requireAdmin();

  let orders: AdminOrder[] | null = null;
  let scopeError = false;
  if (isAdminConfigured()) {
    try {
      orders = await getOrders(50);
    } catch {
      scopeError = true; // most likely read_orders not granted
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold text-ink">Orders</h1>
      <p className="mt-1 text-ink/60">Incoming orders and their fulfillment status.</p>

      {scopeError && (
        <div className="mt-6 rounded-xl2 bg-peach/50 p-5 text-sm text-terracotta ring-1 ring-terracotta/30">
          <p className="font-semibold">Orders access needs one more permission.</p>
          <p className="mt-1 text-ink/70">
            In your <strong>Desert Opal Admin</strong> app, add the
            <code className="mx-1 rounded bg-white/60 px-1">read_orders</code> scope
            to the version&apos;s scope list and <strong>Release</strong> it. Then this
            page fills in automatically — no new token needed.
          </p>
        </div>
      )}

      {orders && orders.length === 0 && (
        <div className="mt-6 rounded-xl2 bg-white p-10 text-center shadow-soft ring-1 ring-sand-deep/40">
          <div className="text-4xl">📦</div>
          <h2 className="mt-3 font-display text-lg font-semibold text-ink">No orders yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
            When someone checks out, their order shows up here.
          </p>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl2 bg-white shadow-soft ring-1 ring-sand-deep/40">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-sand-deep/40 bg-sand/40 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-deep/30">
              {orders.map((o) => (
                <tr key={o.id} className="align-top transition hover:bg-sand/30">
                  <td className="px-4 py-3 font-semibold text-ink">{o.name}</td>
                  <td className="px-4 py-3 text-ink/70">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-ink/70">{o.customerName ?? "—"}</td>
                  <td className="px-4 py-3 text-ink/70">
                    <span className="block max-w-xs truncate" title={o.itemsSummary}>
                      {o.itemsSummary || `${o.itemCount} items`}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{formatPrice(o.totalCents)}</td>
                  <td className="px-4 py-3">{statusPill(o.financialStatus, "financial")}</td>
                  <td className="px-4 py-3">{statusPill(o.fulfillmentStatus, "fulfillment")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
