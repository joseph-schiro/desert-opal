import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin Sign In" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand/40 px-4">
      <div className="w-full max-w-sm rounded-xl2 bg-white/80 p-8 shadow-soft ring-1 ring-sand-deep/40">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            🌵
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold text-ink">
              Desert Opal
            </span>
            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted">
              Admin
            </span>
          </span>
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-muted">
          This area is for shop owners only.
        </p>

        <LoginForm from={from} />
      </div>
    </div>
  );
}
