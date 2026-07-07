/** Window event dispatched after a client-side cart change, so the header
 *  badge can refetch its count. Kept in its own tiny module (no server imports)
 *  so both client components can share it safely. */
export const CART_UPDATED_EVENT = "desertopal:cart-updated";
