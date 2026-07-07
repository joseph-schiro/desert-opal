import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Desert Opal is a small, family-run shop of hand-picked succulents and cacti — many one-of-a-kind.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <span className="text-4xl" aria-hidden>🌵</span>
      <h1 className="mt-3 text-4xl font-semibold text-ink">Our little desert</h1>

      <div className="mt-6 space-y-5 text-lg leading-relaxed text-ink/75">
        <p>
          Desert Opal started the way most good things do. with two people who
          couldn&apos;t stop bringing home plants. What began as a windowsill full
          of succulents turned into a shared obsession with the strange, sculptural,
          endlessly charming world of succulents and cacti.
        </p>
        <p>
          We hand-pick and grow every plant ourselves, so a lot of what you&apos;ll
          find here is genuinely <strong>one-of-a-kind</strong>, a single rooted
          cutting, a particularly pretty rosette, a variegated oddball we
          couldn&apos;t resist. When it&apos;s gone, it&apos;s gone, which is half
          the fun.
        </p>
        <p>
          Each plant is potted, fussed over, and packed with care before it makes
          its way to you. Our goal is simple: send happy, healthy little plants to
          people who&apos;ll love them as much as we do.
        </p>
      </div>

      <div className="mt-10 rounded-xl2 bg-sage-soft/50 p-6">
        <h2 className="font-display text-xl font-semibold text-ink">Why &ldquo;Desert Opal&rdquo;?</h2>
        <p className="mt-2 text-ink/70">
          Opals are formed slowly, quietly, and every one is different, a lot like
          a well-grown succulent. The name felt right for a shop full of small,
          slow-made treasures.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/shop" className="rounded-full bg-sage px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-sage-deep">
          Browse the shop
        </Link>
        <Link href="/contact" className="rounded-full bg-white px-6 py-3 font-semibold text-ink/80 ring-1 ring-sand-deep/50 transition hover:text-sage-deep">
          Say hello
        </Link>
      </div>
    </div>
  );
}
