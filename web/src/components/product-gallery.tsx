"use client";

import { useState } from "react";
import Image from "next/image";
import { PlantPhoto } from "@/components/plant-photo";
import type { Tone } from "@/lib/catalog";

/**
 * Product photo gallery. With multiple images it shows a large main image plus
 * a clickable thumbnail strip; with one image, just the image; with none, it
 * falls back to the pastel emoji tile (via PlantPhoto).
 */
export function ProductGallery({
  images,
  tone,
  emoji,
  name,
}: {
  images: { url: string; altText?: string }[];
  tone: Tone;
  emoji: string;
  name: string;
}) {
  const [active, setActive] = useState(0);

  // No real photos yet — keep the emoji placeholder tile.
  if (images.length === 0) {
    return (
      <PlantPhoto
        tone={tone}
        emoji={emoji}
        size="text-9xl"
        sizes="(max-width: 768px) 100vw, 500px"
        className="aspect-square w-full rounded-xl2 shadow-soft ring-1 ring-sand-deep/40"
      />
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl2 bg-sand shadow-soft ring-1 ring-sand-deep/40">
        <Image
          src={current.url}
          alt={current.altText ?? name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 500px"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1} of ${images.length}`}
              aria-current={i === active}
              className={`relative h-16 w-16 overflow-hidden rounded-lg ring-2 transition ${
                i === active
                  ? "ring-sage-deep"
                  : "ring-sand-deep/40 hover:ring-sage/60"
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${name} — photo ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
