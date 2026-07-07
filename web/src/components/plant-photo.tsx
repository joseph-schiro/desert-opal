import Image from "next/image";
import type { Tone } from "@/lib/catalog";

/*
  Product visual. When the product has a real photo (`imageUrl`), show it.
  Otherwise fall back to a soft pastel gradient with the plant's emoji.
  Tailwind can't build class names from dynamic strings, so each tone maps
  to a fixed pair of gradient classes.
*/
const TONE_GRADIENTS: Record<Tone, string> = {
  sage: "from-sage-soft to-mint",
  blush: "from-blush to-peach",
  lavender: "from-lavender to-sky",
  mint: "from-mint to-sage-soft",
  peach: "from-peach to-blush",
  sky: "from-sky to-lavender",
};

export function PlantPhoto({
  tone,
  emoji,
  imageUrl,
  imageAlt,
  className = "",
  size = "text-6xl",
  sizes = "(max-width: 768px) 100vw, 400px",
}: {
  tone: Tone;
  emoji: string;
  imageUrl?: string;
  imageAlt?: string;
  className?: string;
  size?: string;
  /** next/image `sizes` hint; tune per usage for best responsive loading. */
  sizes?: string;
}) {
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden bg-sand ${className}`}>
        <Image
          src={imageUrl}
          alt={imageAlt ?? ""}
          fill
          sizes={sizes}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${TONE_GRADIENTS[tone]} ${className}`}
      aria-hidden
    >
      <span className={`${size} drop-shadow-sm select-none`}>{emoji}</span>
    </div>
  );
}
