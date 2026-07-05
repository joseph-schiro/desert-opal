import type { Tone } from "@/lib/catalog";

/*
  Placeholder "photo": a soft pastel gradient with the plant's emoji.
  Tailwind can't build class names from dynamic strings, so each tone maps
  to a fixed pair of gradient classes. When real product photography exists,
  replace this component with next/image and the rest of the UI is unchanged.
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
  className = "",
  size = "text-6xl",
}: {
  tone: Tone;
  emoji: string;
  className?: string;
  size?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${TONE_GRADIENTS[tone]} ${className}`}
      aria-hidden
    >
      <span className={`${size} drop-shadow-sm select-none`}>{emoji}</span>
    </div>
  );
}
