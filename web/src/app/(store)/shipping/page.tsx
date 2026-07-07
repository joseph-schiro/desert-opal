import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "How Desert Opal ships plants, and our policy on returns and damaged arrivals.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-ink/75">{children}</div>
    </section>
  );
}

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-4xl font-semibold text-ink">Shipping &amp; Returns</h1>
      <p className="mt-2 text-ink/60">
        Please review and adjust these details to match your actual policies.
      </p>

      <Section title="Processing time">
        <p>
          Orders are usually packed and shipped within a few business days. Because
          many plants are one-of-a-kind, we double-check each one before it goes out
          the door.
        </p>
      </Section>

      <Section title="How we ship">
        <p>
          Plants are gently cleaned, wrapped, and boxed with padding to keep them
          safe in transit. Succulents and cacti travel well and can spend several
          days in a box without harm.
        </p>
        <p className="text-sm text-muted">
          Add your carrier, shipping rates, and estimated delivery windows here.
        </p>
      </Section>

      <Section title="Live arrival">
        <p>
          We want your plant to arrive happy. If it shows up damaged or in poor
          condition, email us a photo within <strong>48 hours </strong> of delivery
          and we&apos;ll arrange a replacement or refund.
        </p>
      </Section>

      <Section title="Returns">
        <p>
          Because these are living things, we generally can&apos;t accept returns of
          healthy plants. If something isn&apos;t right with your order, reach out —
          we&apos;ll always do our best to make it fair.
        </p>
      </Section>

      <Section title="Local pickup">
        <p>
          Nearby? We&apos;re happy to arrange local pickup so you can skip shipping
          entirely. Get in touch to set it up.
        </p>
      </Section>
    </div>
  );
}
