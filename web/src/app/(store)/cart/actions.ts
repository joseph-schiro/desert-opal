"use server";

/**
 * Cart mutation Server Actions. These are the only place cart cookies are
 * written. Each returns the fresh item count so client components (the
 * add-to-cart button, the header badge) can update without a full reload; the
 * cart page itself is dynamic and re-reads on revalidation.
 */

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addToCart,
  createCart,
  removeCartLine,
  updateCartLine,
} from "@/lib/shopify";
import {
  CART_COOKIE,
  CART_COOKIE_MAX_AGE,
  getCurrentCart,
} from "@/lib/cart";

async function setCartCookie(cartId: string) {
  (await cookies()).set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

/** Add one unit of a variant to the cart, creating the cart if needed. */
export async function addItemAction(variantId: string): Promise<number> {
  if (!variantId) throw new Error("Missing variantId");

  const existingId = (await cookies()).get(CART_COOKIE)?.value;

  // If we have a cart id but Shopify no longer has the cart (completed/expired),
  // fall back to creating a fresh one.
  let cart = existingId
    ? await addToCart(existingId, variantId).catch(() => null)
    : null;
  if (!cart) {
    cart = await createCart(variantId);
    await setCartCookie(cart.id);
  }

  revalidatePath("/cart");
  return cart.totalQuantity;
}

/** Set a line's quantity; quantity <= 0 removes the line. */
export async function updateItemAction(
  lineId: string,
  quantity: number
): Promise<void> {
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return;

  if (quantity <= 0) {
    await removeCartLine(cartId, lineId);
  } else {
    await updateCartLine(cartId, lineId, quantity);
  }
  revalidatePath("/cart");
}

export async function removeItemAction(lineId: string): Promise<void> {
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return;
  await removeCartLine(cartId, lineId);
  revalidatePath("/cart");
}

/** Current item count — used by the header badge on load / after changes. */
export async function getCartCountAction(): Promise<number> {
  const cart = await getCurrentCart();
  return cart?.totalQuantity ?? 0;
}

/** Redirect the shopper to Shopify's hosted checkout. */
export async function checkoutAction(): Promise<void> {
  const cart = await getCurrentCart();
  if (!cart || cart.lines.length === 0) {
    redirect("/cart");
  }
  redirect(cart.checkoutUrl);
}
