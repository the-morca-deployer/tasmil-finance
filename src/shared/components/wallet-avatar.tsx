"use client";

import { Avatar, Style } from "@dicebear/core";
import triangles from "@dicebear/styles/triangles.json";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

// One Style instance for every avatar (DiceBear v10 recommends reuse). Generated
// locally: wallet addresses are never sent to the DiceBear HTTP API.
const TRIANGLES = new Style(triangles);

const cache = new Map<string, string>();

/** Deterministic DiceBear "triangles" data URI for a wallet / contract address. */
export function walletAvatarUri(address: string | null | undefined): string {
  const seed = (address ?? "").trim() || "default";
  let uri = cache.get(seed);
  if (!uri) {
    uri = new Avatar(TRIANGLES, { seed }).toDataUri();
    cache.set(seed, uri);
  }
  return uri;
}

interface WalletAvatarProps {
  address: string | null | undefined;
  /** Pixel size; ignored when `className` sets width/height. */
  size?: number;
  className?: string;
}

export function WalletAvatar({ address, size = 32, className }: WalletAvatarProps) {
  const src = useMemo(() => walletAvatarUri(address), [address]);
  return (
    // biome-ignore lint/performance/noImgElement: inline data URI, nothing for next/image to optimize
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={cn("inline-block shrink-0 rounded-full", className)}
      style={{ width: size, height: size }}
    />
  );
}
