"use server";

import { addSubscriber } from "@/lib/newsletter";

export interface SubscribeState {
  ok?: boolean;
  error?: string;
}

export async function subscribeAction(
  _prev: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const email = String(formData.get("email") ?? "");
  const error = addSubscriber(email);
  if (error) return { error };
  return { ok: true };
}
