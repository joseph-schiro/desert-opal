/**
 * Data-access layer for admin auth. Per the Next.js auth guidance, security
 * checks belong close to the data (pages/actions), not only in layouts. Proxy
 * gives the redirect gate; these helpers are the in-page/in-action guard.
 */

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/** The logged-in admin username, or null. Memoized per request. */
export const getSessionUser = cache(async (): Promise<string | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
});

/** Require a valid session; redirect to login if absent. Returns the username. */
export async function requireAdmin(): Promise<string> {
  const username = await getSessionUser();
  if (!username) redirect("/admin/login");
  return username;
}
