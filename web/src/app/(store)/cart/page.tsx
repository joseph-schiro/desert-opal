import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getCurrentCart } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";
import {
  checkoutAction,
  removeItemAction,
  updateItemAction,
} from "./actions";

export const metadata: Metadata = { title: "Your Cart" };

// Reads the cart cookie, so this route is always rendered per-request.
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const cart = await getCurrentCart();

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-6xl" aria-hidden>
          🪴
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-ink">Your cart is empty</h1>
        <p className="mt-2 text-muted">
          Find a little green friend to bring home.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-sage px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-sage-deep"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-4xl font-semibold text-ink">Your Cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        {/* Line items */}
        <ul className="space-y-4">
          {cart.lines.map((line) => (
            <li
              key={line.id}
              className="flex gap-4 rounded-xl2 bg-white/60 p-4 shadow-soft ring-1 ring-sand-deep/40"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl2 bg-sand">
                {line.imageUrl && (
                  <Image
                    src={line.imageUrl}
                    alt={line.imageAlt ?? line.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col">
                <Link
                  href={`/products/${line.handle}`}
                  className="font-semibold text-ink hover:text-sage-deep"
                >
                  {line.title}
                </Link>
                {line.variantTitle && (
                  <span className="text-sm text-muted">{line.variantTitle}</span>
                )}
                <span className="mt-1 text-sm text-muted">
                  {formatPrice(line.priceCents)} each
                </span>

                {/* Quantity controls */}
                <div className="mt-auto flex items-center gap-3 pt-3">
                  <div className="flex items-center rounded-full border border-sand-deep/50">
                    <form action={updateItemAction.bind(null, line.id, line.quantity - 1)}>
                      <button
                        type="submit"
                        aria-label="Decrease quantity"
                        className="px-3 py-1 text-lg leading-none text-ink/70 transition hover:text-sage-deep"
                      >
                        −
                      </button>
                    </form>
                    <span className="min-w-8 text-center text-sm font-semibold">
                      {line.quantity}
                    </span>
                    <form action={updateItemAction.bind(null, line.id, line.quantity + 1)}>
                      <button
                        type="submit"
                        aria-label="Increase quantity"
                        className="px-3 py-1 text-lg leading-none text-ink/70 transition hover:text-sage-deep"
                      >
                        +
                      </button>
                    </form>
                  </div>

                  <form action={removeItemAction.bind(null, line.id)}>
                    <button
                      type="submit"
                      className="text-sm text-muted underline-offset-2 transition hover:text-terracotta hover:underline"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              </div>

              <div className="shrink-0 font-semibold text-sage-deep">
                {formatPrice(line.lineTotalCents)}
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <aside className="h-fit rounded-xl2 bg-white/70 p-6 shadow-soft ring-1 ring-sand-deep/40">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>Subtotal</span>
            <span className="text-lg font-semibold text-ink">
              {formatPrice(cart.subtotalCents)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Shipping &amp; taxes calculated at checkout.
          </p>

          <form action={checkoutAction} className="mt-5">
            <button
              type="submit"
              className="w-full rounded-full bg-sage px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-sage-deep"
            >
              Checkout
            </button>
          </form>

          <Link
            href="/shop"
            className="mt-3 block text-center text-sm text-muted transition hover:text-sage-deep"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
