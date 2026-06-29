import Avatar from "boring-avatars";
import { cn } from "@/lib/utils";

// Diverse palette so each seed (wallet) produces a visibly distinct avatar,
// rather than every avatar reading as the same brand-cyan blob.
export const TASMIL_AVATAR_COLORS = ["#22d3ee", "#6366f1", "#a855f7", "#ec4899", "#f59e0b"];
export type TasmilAvatarVariant = "marble" | "bauhaus" | "beam" | "pixel" | "ring" | "sunset";

export function normalizeSeed(seed: string | null | undefined): string {
  const s = (seed ?? "").trim().toLowerCase();
  return s.length > 0 ? s : "default";
}

interface TasmilAvatarProps {
  seed: string | null | undefined;
  size?: number | "full";
  variant?: TasmilAvatarVariant;
  className?: string;
}

export function TasmilAvatar({
  seed,
  size = 40,
  variant = "marble",
  className,
}: TasmilAvatarProps) {
  const fill = size === "full";
  const px = fill ? 96 : size;
  return (
    <span
      className={cn(
        "inline-block shrink-0 overflow-hidden rounded-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full",
        fill && "h-full w-full",
        className
      )}
      style={fill ? undefined : { width: px, height: px }}
    >
      <Avatar
        name={normalizeSeed(seed)}
        size={px}
        variant={variant}
        colors={TASMIL_AVATAR_COLORS}
      />
    </span>
  );
}
