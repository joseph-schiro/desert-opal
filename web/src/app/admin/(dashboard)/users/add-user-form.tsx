"use client";

import { useActionState } from "react";
import { addUserAction, type AddUserState } from "./actions";

const inputClass =
  "mt-1 w-full rounded-xl2 border border-sand-deep/50 bg-white px-3 py-2 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30";

export function AddUserForm() {
  const [state, action, pending] = useActionState<AddUserState, FormData>(
    addUserAction,
    {}
  );

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div>
        <label htmlFor="username" className="text-sm font-medium text-ink/80">
          Username
        </label>
        <input
          id="username"
          name="username"
          autoCapitalize="none"
          autoComplete="off"
          placeholder="e.g. sarah"
          required
          className={inputClass}
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
          autoComplete="new-password"
          placeholder="at least 8 characters"
          required
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-fit rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-sage-deep disabled:cursor-not-allowed disabled:bg-muted/50"
      >
        {pending ? "Adding…" : "Add admin"}
      </button>

      {state.error && (
        <p className="sm:col-span-3 rounded-lg bg-blush/60 px-3 py-2 text-sm text-terracotta">
          {state.error}
        </p>
      )}
    </form>
  );
}
