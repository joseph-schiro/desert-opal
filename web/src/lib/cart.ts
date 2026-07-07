/**
 * Server-side cart helpers shared by pages and Server Actions.
 *
 * The cart lives in Shopify; we only persist its id in an httpOnly cookie. This
 * module reads that cookie and hydrates the cart. Mutations (add/update/remove)
 * live in `app/(store)/cart/actions.ts` since only Server Actions / Route
 * Handlers may *write* cookies.
 */

import { cookies } from "next/headers";
import { getCart, type Cart } from "./shopify";

/** Cookie holding the Shopify cart id. httpOnly — never read client-side. */
export const CART_COOKIE = "cartId";
/** Persist the cart id for ~30 days. */
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** Read the current cart from the cookie, or null if none / expired. */
export async function getCurrentCart(): Promise<Cart | null> {
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return null;
  try {
    return await getCart(cartId);
  } catch (err) {
    console.warn("[cart] failed to load cart:", err);
    return null;
  }
}

/** Total item count for the header badge (0 when empty). */
export async function getCartCount(): Promise<number> {
  const cart = await getCurrentCart();
  return cart?.totalQuantity ?? 0;
}
