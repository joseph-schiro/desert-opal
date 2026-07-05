import Link from "next/link";
import { formatPrice, type Product } from "@/lib/catalog";
import { PlantPhoto } from "@/components/plant-photo";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock === 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl2 bg-white shadow-soft ring-1 ring-sand-deep/40 transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative">
        <PlantPhoto
          tone={product.tone}
          emoji={product.emoji}
          className="aspect-square w-full transition group-hover:scale-105"
        />
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-cream">
            Sold out
          </span>
        )}
        {!soldOut && product.stock <= 3 && (
          <span className="absolute left-3 top-3 rounded-full bg-terracotta px-3 py-1 text-xs font-semibold text-white">
            Only {product.stock} left
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-semibold leading-tight text-ink">
          {product.name}
        </h3>
        {product.scientificName && (
          <p className="mt-0.5 text-sm italic text-muted">
            {product.scientificName}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-semibold text-sage-deep">
            {formatPrice(product.priceCents)}
          </span>
          <span className="text-sm text-muted">{product.size}</span>
        </div>
      </div>
    </Link>
  );
}
