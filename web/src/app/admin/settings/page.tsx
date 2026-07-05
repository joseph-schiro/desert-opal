import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default function AdminSettings() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-ink">Settings</h1>
      <div className="mt-6 rounded-xl2 bg-white p-10 text-center shadow-soft ring-1 ring-sand-deep/40">
        <div className="text-4xl">⚙️</div>
        <h2 className="mt-3 font-display text-lg font-semibold text-ink">
          Store settings
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
          Shop details, shipping rates, payment connections, and admin logins
          will be managed here.
        </p>
      </div>
    </div>
  );
}
