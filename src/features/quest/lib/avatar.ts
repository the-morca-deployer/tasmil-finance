import type { TasmilAvatarVariant } from "@/shared/components/tasmil-avatar";

export const QUEST_AVATAR_VARIANTS: TasmilAvatarVariant[] = [
  "marble",
  "bauhaus",
  "beam",
  "pixel",
  "ring",
  "sunset",
];

const TOKEN_PREFIX = "tasmil:";

export function variantToken(variant: TasmilAvatarVariant): string {
  return `${TOKEN_PREFIX}${variant}`;
}

export function variantFromAvatarUrl(avatarUrl?: string | null): TasmilAvatarVariant {
  if (avatarUrl?.startsWith(TOKEN_PREFIX)) {
    const candidate = avatarUrl.slice(TOKEN_PREFIX.length) as TasmilAvatarVariant;
    if (QUEST_AVATAR_VARIANTS.includes(candidate)) return candidate;
  }
  return "marble";
}
