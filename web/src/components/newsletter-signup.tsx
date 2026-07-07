"use client";

import { useActionState } from "react";
import { subscribeAction, type SubscribeState } from "@/app/(store)/newsletter-actions";

export function NewsletterSignup() {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(
    subscribeAction,
    {}
  );

  if (state.ok) {
    return (
      <p className="mt-3 text-sm text-sage-deep">
        🌱 You&apos;re on the list — thanks for joining!
      </p>
    );
  }

  return (
    <form action={action} className="mt-3">
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="you@email.com"
          aria-label="Email address"
          className="min-w-0 flex-1 rounded-full border border-sand-deep/50 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-sage px-4 py-2 text-sm font-semibold text-white transition hover:bg-sage-deep disabled:bg-muted/50"
        >
          {pending ? "…" : "Join"}
        </button>
      </div>
      {state.error && <p className="mt-2 text-xs text-terracotta">{state.error}</p>}
    </form>
  );
}
