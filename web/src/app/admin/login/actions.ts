"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticate } from "@/lib/admin-users";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
} from "@/lib/session";

export interface LoginState {
  error?: string;
}

/** Verify credentials and, on success, set the session cookie and redirect. */
export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "");

  if (!username || !password) {
    return { error: "Enter your username and password." };
  }

  const matched = authenticate(username, password);
  if (!matched) {
    return { error: "Invalid username or password." };
  }

  (await cookies()).set(SESSION_COOKIE, createSessionToken(matched), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  // Only allow internal redirect targets.
  redirect(from.startsWith("/admin") ? from : "/admin");
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
