"use client";

import { useState, useTransition } from "react";
import { addItemAction } from "@/app/(store)/cart/actions";
import { CART_UPDATED_EVENT } from "@/lib/cart-events";

/**
 * Add-to-cart button used on the product page. Calls the server action, then
 * dispatches a window event so the header badge refreshes its count without a
 * full page reload. Disabled when sold out, or when there's no variant id
 * (Shopify not configured / mock data — nothing real to buy).
 */
export function AddToCartButton({
  variantId,
  soldOut,
}: {
  variantId?: string;
  soldOut: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unavailable = soldOut || !variantId;

  function handleClick() {
    if (!variantId) return;
    setError(null);
    startTransition(async () => {
      try {
        await addItemAction(variantId);
        window.dispatchEvent(new Event(CART_UPDATED_EVENT));
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={unavailable || pending}
        className="w-full rounded-full bg-sage px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-sage-deep disabled:cursor-not-allowed disabled:bg-muted/50"
      >
        {soldOut
          ? "Sold out"
          : pending
            ? "Adding…"
            : justAdded
              ? "Added ✓"
              : "Add to cart"}
      </button>
      {error && <p className="mt-2 text-sm text-terracotta">{error}</p>}
      {!variantId && !soldOut && (
        <p className="mt-2 text-xs text-muted">
          Online ordering for this item is coming soon.
        </p>
      )}
    </div>
  );
}
