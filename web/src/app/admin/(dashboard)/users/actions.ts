"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { addUser, deleteUser } from "@/lib/admin-users";

export interface AddUserState {
  error?: string;
}

export async function addUserAction(
  _prev: AddUserState,
  formData: FormData
): Promise<AddUserState> {
  await requireAdmin();

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const error = addUser(username, password);
  if (error) return { error };

  revalidatePath("/admin/users");
  redirect("/admin/users?added=1");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const username = String(formData.get("username") ?? "");
  const error = deleteUser(username);

  revalidatePath("/admin/users");
  redirect(
    error
      ? `/admin/users?error=${encodeURIComponent(error)}`
      : "/admin/users?removed=1"
  );
}
