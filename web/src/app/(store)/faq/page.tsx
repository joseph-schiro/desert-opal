import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about ordering plants from Desert Opal.",
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Are the plants real, live plants?",
    a: "Yes! Every plant is a real, living succulent or cactus that we grow and hand-pick ourselves.",
  },
  {
    q: "How are plants shipped?",
    a: "Plants are carefully cleaned, wrapped, and boxed to travel safely. Succulents and cacti are wonderfully hardy and handle shipping well. (Please review your exact shipping timeframe and carrier here.)",
  },
  {
    q: "Do you offer local pickup?",
    a: "If you're nearby, reach out. We're happy to arrange local pickup and save you the shipping. (Update this with your pickup details.)",
  },
  {
    q: "What if my plant arrives damaged?",
    a: "It's rare, but if your plant arrives in rough shape, send us a photo within 48 hours of delivery and we'll make it right.",
  },
  {
    q: "How do I care for my new plant?",
    a: "Most succulents and cacti want lots of bright light, well-draining soil, and infrequent watering (let the soil dry out fully between drinks). Each product page lists that plant's light, water, and care level.",
  },
  {
    q: "What does “variegated” mean?",
    a: "Variegated plants have multi-colored foliage, streaks or patches of cream, pink, or lighter green. They're prized for their unusual look. Look for the 🌿 Variegated badge.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-4xl font-semibold text-ink">Frequently asked questions</h1>
      <p className="mt-2 text-ink/60">Everything you might want to know before bringing a plant home.</p>

      <div className="mt-8 space-y-3">
        {FAQS.map((item) => (
          <details
            key={item.q}
            className="group rounded-xl2 bg-white p-5 shadow-soft ring-1 ring-sand-deep/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between font-display font-semibold text-ink">
              {item.q}
              <span className="ml-4 text-sage-deep transition group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="mt-3 text-ink/70">{item.a}</p>
          </details>
        ))}
      </div>

      <p className="mt-8 text-ink/70">
        Still curious?{" "}
        <Link href="/contact" className="font-semibold text-sage-deep hover:underline">
          Get in touch
        </Link>{" "} - we&apos;re happy to help.
      </p>
    </div>
  );
}
