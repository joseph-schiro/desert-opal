"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

export function LoginForm({ from }: { from?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      {from && <input type="hidden" name="from" value={from} />}

      <div>
        <label htmlFor="username" className="text-sm font-medium text-ink/80">
          Username
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          required
          className="mt-1 w-full rounded-xl2 border border-sand-deep/50 bg-white px-4 py-2.5 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
        />
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium text-ink/80">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-xl2 border border-sand-deep/50 bg-white px-4 py-2.5 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-blush/60 px-3 py-2 text-sm text-terracotta">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-sage px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-sage-deep disabled:cursor-not-allowed disabled:bg-muted/50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
