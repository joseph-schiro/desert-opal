import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Desert Opal Succulents & Cacti.",
};

// TODO: set these to your real details.
const CONTACT_EMAIL = "support@desertopal.shop";
const INSTAGRAM = "https://instagram.com/desertopalsucculents"; // add your handle

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <span className="text-4xl" aria-hidden>💌</span>
      <h1 className="mt-3 text-4xl font-semibold text-ink">Say hello</h1>
      <p className="mt-3 text-lg text-ink/75">
        Questions about a plant, an order, care advice, or local pickup? We&apos;d
        love to hear from you - we usually reply within a day or two.
      </p>

      <div className="mt-8 space-y-4">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="flex items-center gap-4 rounded-xl2 bg-white p-5 shadow-soft ring-1 ring-sand-deep/40 transition hover:ring-sage"
        >
          <span className="text-2xl" aria-hidden>✉️</span>
          <span>
            <span className="block font-display font-semibold text-ink">Email us</span>
            <span className="text-sage-deep">{CONTACT_EMAIL}</span>
          </span>
        </a>

        <a
          href={INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-xl2 bg-white p-5 shadow-soft ring-1 ring-sand-deep/40 transition hover:ring-sage"
        >
          <span className="text-2xl" aria-hidden>📸</span>
          <span>
            <span className="block font-display font-semibold text-ink">Instagram</span>
            <span className="text-sage-deep">Follow for new arrivals &amp; care tips</span>
          </span>
        </a>
      </div>

      <p className="mt-8 text-sm text-muted">
        Prefer to browse first? Check the{" "}
        <a href="/faq" className="font-semibold text-sage-deep hover:underline">FAQ</a> —
        your question might already be answered there.
      </p>
    </div>
  );
}
