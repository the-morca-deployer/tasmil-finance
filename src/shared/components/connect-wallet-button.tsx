"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Copy, ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { useCredits } from "@/features/credits/use-credits";
import { Flame, PtsCoin } from "@/features/quest/components/icons";
import { $ } from "@/features/quest/lib/kubb-config";
import { RANK_STYLES, rankFromPoints } from "@/features/quest/lib/tier";
import { useUsersControllerGetMe } from "@/gen-quest/hooks";
import { TasmilAvatar } from "@/shared/components/tasmil-avatar";
import { activeNetwork, getExplorerUrl, isMainnet } from "@/shared/config/stellar";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Typography } from "@/shared/ui/typography";
import { ReplayMenuItem } from "./replay-menu-item";

const networkLabel = isMainnet ? "Mainnet" : "Testnet";

function explorerUrl(address: string): string {
  return getExplorerUrl("account", address);
}

/** Fetch the native XLM balance for an address from Horizon. */
async function fetchNativeBalance(address: string): Promise<string> {
  const res = await fetch(`${activeNetwork.horizonUrl}/accounts/${address}`);
  if (res.status === 404) return "0"; // unfunded account
  if (!res.ok) throw new Error("Failed to fetch balance");
  const json = (await res.json()) as { balances?: { asset_type: string; balance: string }[] };
  const native = json.balances?.find((b) => b.asset_type === "native");
  return native?.balance ?? "0";
}

interface AddressAvatarProps {
  address: string;
  size?: string;
  iconSize?: string;
}

function sizeClassToPx(size: string): number {
  // Arbitrary pixel value, e.g. "size-[30px]" → 30 (already px, no scaling).
  const bracketPx = size.match(/\[(\d+(?:\.\d+)?)px\]/);
  if (bracketPx) return Math.round(Number(bracketPx[1]));
  // Tailwind spacing unit, e.g. "size-8" → 8 × 4px = 32.
  const unit = size.match(/(\d+(?:\.\d+)?)/);
  if (unit) return Math.round(Number(unit[1]) * 4);
  return 48;
}

const AddressAvatar = ({ address, size = "size-12" }: AddressAvatarProps) => (
  <TasmilAvatar seed={address} size={sizeClassToPx(size)} />
);

interface ConnectWalletButtonProps {
  variant?: "topbar" | "sidebar";
  rankSlot?: ReactNode;
}

export function ConnectWalletButton({ variant = "sidebar", rankSlot }: ConnectWalletButtonProps) {
  const { isConnected, address, displayAddress, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === "topbar") {
    return (
      <TopbarWallet
        isConnected={isConnected}
        address={address}
        displayAddress={displayAddress}
        connect={connect}
        disconnect={disconnect}
        copied={copied}
        copyAddress={copyAddress}
        rankSlot={rankSlot}
      />
    );
  }

  // -- Connected: expanded sidebar (default) ---------------------------
  if (!isConnected) {
    return (
      <Button className="w-full" onClick={connect} variant="gradient" data-testid="connect-wallet">
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="flex h-auto w-full items-center justify-start gap-3 rounded-xl bg-zinc-800/50 px-3 py-2.5 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
          variant="ghost"
          data-testid="wallet-connected"
        >
          <AddressAvatar address={address || ""} size="size-8" />
          <div className="min-w-0 flex-1 text-left">
            <Typography className="text-white" size="sm" weight="medium">
              {displayAddress}
            </Typography>
            <Typography className="text-muted-foreground" size="xs">
              {networkLabel}
            </Typography>
          </div>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/15">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        {rankSlot}
        <DropdownMenuItem onClick={copyAddress}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-emerald-400" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? "Copied!" : "Copy Address"}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={explorerUrl(address || "")} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Explorer
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ReplayMenuItem />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={disconnect}
          className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface TopbarWalletProps {
  isConnected: boolean;
  address: string | null | undefined;
  displayAddress: string | null | undefined;
  connect: () => void;
  disconnect: () => void;
  copied: boolean;
  copyAddress: () => Promise<void>;
  rankSlot?: ReactNode;
}

function TopbarWallet({
  isConnected,
  address,
  displayAddress,
  connect,
  disconnect,
  copied,
  copyAddress,
}: TopbarWalletProps) {
  const { data: creditsData, isLoading: creditsLoading } = useCredits();
  const credits = creditsData?.credits ?? 0;
  const creditsDisplay = creditsLoading ? "-" : new Intl.NumberFormat("en-US").format(credits);

  // Quest points + streak - sourced like QuestHeaderBadges (`$` unwraps the
  // `{ success, data }` envelope, so `me.data` IS the profile).
  const me = useUsersControllerGetMe($);
  const profile = (me.data as { totalPoints?: number; loginStreak?: number } | undefined) ?? null;
  const points = profile?.totalPoints ?? 0;
  const streak = profile?.loginStreak ?? 0;
  const rankStyle = RANK_STYLES[rankFromPoints(points).rank];

  // Native XLM balance - same fetch/queryKey pattern as the strategy WalletMenu.
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ["native-balance", address],
    queryFn: () => fetchNativeBalance(address ?? ""),
    enabled: Boolean(address),
    refetchInterval: 30_000,
  });
  const balanceLabel =
    balance != null
      ? `${Number(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })} XLM`
      : "-";

  if (!isConnected) {
    return (
      <Button
        size="sm"
        variant="gradient"
        onClick={connect}
        data-testid="connect-wallet"
        className="h-9 rounded-full px-4 font-bold text-sm"
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="wallet-connected"
          className="inline-flex h-10 w-10 items-center justify-center rounded-quest-pill border border-quest-line-2 bg-quest-surface font-semibold text-[13.5px] text-quest-text transition-colors hover:bg-white/[0.05] lg:w-auto lg:justify-start lg:gap-[10px] lg:pr-[14px] lg:pl-[6px]"
        >
          <AddressAvatar address={address ?? ""} size="size-[30px]" iconSize="size-3.5" />
          <span className="hidden font-mono lg:inline">{displayAddress}</span>
          <ChevronDown className="hidden h-4 w-4 opacity-60 lg:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="w-[min(260px,calc(100vw-24px))] border-quest-line-2 bg-quest-surface text-quest-text"
      >
        {/* Balance header + single inline rank/points/streak row */}
        <div className="px-2 py-2">
          <p className="text-[11px] text-quest-muted uppercase tracking-[0.08em]">Balance</p>
          <p className="mt-0.5 font-mono font-semibold text-[16px]">
            {balanceLoading ? "Loading..." : balanceLabel}
          </p>
          <div className="mt-2 flex items-center gap-2.5 text-[13px]">
            <img
              src={rankStyle.asset}
              alt={rankStyle.label}
              width={20}
              height={20}
              className="flex-none object-contain [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.4))]"
            />
            <span className="text-quest-text">{rankStyle.label}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-quest-accent">
              <PtsCoin style={{ width: 16, height: 16 }} />
              {points.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-quest-amber">
              <Flame style={{ width: 16, height: 16 }} />
              {streak.toLocaleString()}d
            </span>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-quest-line-2" />
        <DropdownMenuItem asChild className="cursor-pointer gap-2 text-[13px]">
          <Link
            href="/profile/credits"
            data-testid="wallet-credits-row"
            className="flex w-full items-center justify-between"
          >
            <span>Credits</span>
            <span className="ml-auto font-mono tabular-nums">{creditsDisplay}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-quest-line-2" />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void copyAddress();
          }}
          className="cursor-pointer gap-2 text-[13px]"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="font-mono">{displayAddress}</span>
          <span className="ml-auto text-[11px] text-quest-muted">{copied ? "Copied" : "Copy"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer gap-2 text-[13px]">
          <a href={explorerUrl(address || "")} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            View on explorer
          </a>
        </DropdownMenuItem>
        <ReplayMenuItem />
        <DropdownMenuSeparator className="bg-quest-line-2" />
        <DropdownMenuItem
          onSelect={() => disconnect()}
          className="cursor-pointer gap-2 text-[13px] text-red-400 focus:bg-red-500/10 focus:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { AddressAvatar };
