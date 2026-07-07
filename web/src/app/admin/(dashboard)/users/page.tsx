import type { Metadata } from "next";
import { requireAdmin, getSessionUser } from "@/lib/dal";
import { listUsers } from "@/lib/admin-users";
import { AddUserForm } from "./add-user-form";
import { deleteUserAction } from "./actions";

export const metadata: Metadata = { title: "Users" };

function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; removed?: string; error?: string }>;
}) {
  await requireAdmin();
  const [me, flags] = await Promise.all([getSessionUser(), searchParams]);
  const users = listUsers();

  const banner = flags.added
    ? { text: "✓ Admin added.", ok: true }
    : flags.removed
      ? { text: "✓ Admin removed.", ok: true }
      : flags.error
        ? { text: flags.error, ok: false }
        : null;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold text-ink">Users</h1>
      <p className="mt-1 text-ink/60">
        People who can sign in to this admin. Everyone here has full access.
      </p>

      {banner && (
        <div
          className={`mt-4 rounded-xl2 px-4 py-3 text-sm font-medium ring-1 ${
            banner.ok
              ? "bg-mint/50 text-sage-deep ring-sage/30"
              : "bg-blush/60 text-terracotta ring-terracotta/30"
          }`}
        >
          {banner.text}
        </div>
      )}

      {/* Existing admins */}
      <div className="mt-6 overflow-hidden rounded-xl2 bg-white shadow-soft ring-1 ring-sand-deep/40">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-sand-deep/40 bg-sand/40 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Username</th>
              <th className="px-4 py-3 font-semibold">Added</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-deep/30">
            {users.map((u) => {
              const isMe = u.username === me;
              return (
                <tr key={u.username} className="transition hover:bg-sand/30">
                  <td className="px-4 py-3 font-semibold text-ink">
                    {u.username}
                    {isMe && (
                      <span className="ml-2 rounded-full bg-sky/50 px-2 py-0.5 text-xs font-medium text-ink/70">
                        you
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {users.length > 1 ? (
                      <form action={deleteUserAction} className="inline">
                        <input type="hidden" name="username" value={u.username} />
                        <button
                          type="submit"
                          className="text-sm text-muted underline-offset-2 transition hover:text-terracotta hover:underline"
                        >
                          Remove
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-muted">last admin</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add admin */}
      <div className="mt-8 rounded-xl2 bg-white/70 p-6 shadow-soft ring-1 ring-sand-deep/40">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Add an admin</h2>
        <AddUserForm />
      </div>

      <p className="mt-4 text-xs text-muted">
        Removing an admin blocks new logins immediately. If they&apos;re already
        signed in, their session ends within 7 days — to cut it off now, rotate
        <code className="mx-1">SESSION_SECRET</code> (logs everyone out).
      </p>
    </div>
  );
}
