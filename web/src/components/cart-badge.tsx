"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCartCountAction } from "@/app/(store)/cart/actions";
import { CART_UPDATED_EVENT } from "@/lib/cart-events";

/**
 * Header cart link with a live item-count bubble. Fetches the count on mount
 * and whenever a cart change is broadcast, so we keep the storefront pages
 * static (no per-request cookie read in the layout).
 */
export function CartBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const refresh = () =>
      getCartCountAction()
        .then((n) => active && setCount(n))
        .catch(() => {});

    refresh();
    window.addEventListener(CART_UPDATED_EVENT, refresh);
    return () => {
      active = false;
      window.removeEventListener(CART_UPDATED_EVENT, refresh);
    };
  }, []);

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
      className="relative rounded-full border border-sand-deep/50 bg-cream px-4 py-2 text-sm font-semibold text-ink transition hover:border-sage hover:text-sage-deep"
    >
      Cart
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-[0.7rem] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
