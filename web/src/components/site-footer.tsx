import Link from "next/link";
import { NewsletterSignup } from "@/components/newsletter-signup";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-sand-deep/40 bg-sand/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              🌵
            </span>
            <span className="font-display text-lg font-semibold text-ink">
              Desert Opal
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Hand-picked succulents, cacti, and desert treasures. Grown with love,
            shipped with care.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-ink">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/shop" className="hover:text-sage-deep">All plants</Link></li>
            <li><Link href="/shop?category=succulents" className="hover:text-sage-deep">Succulents</Link></li>
            <li><Link href="/shop?category=cacti" className="hover:text-sage-deep">Cacti</Link></li>
            <li><Link href="/shop?category=accessories" className="hover:text-sage-deep">Pots &amp; Extras</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-ink">Help</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/about" className="hover:text-sage-deep">About us</Link></li>
            <li><Link href="/faq" className="hover:text-sage-deep">FAQ</Link></li>
            <li><Link href="/shipping" className="hover:text-sage-deep">Shipping &amp; returns</Link></li>
            <li><Link href="/contact" className="hover:text-sage-deep">Contact us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-ink">Stay in touch</h4>
          <p className="mt-3 text-sm text-muted">
            New arrivals and care tips, straight to your inbox.
          </p>
          <NewsletterSignup />
        </div>
      </div>
      <div className="border-t border-sand-deep/40 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()}  Desert Opal Succulents &amp; Cacti. All rights reserved.
      </div>
    </footer>
  );
}
