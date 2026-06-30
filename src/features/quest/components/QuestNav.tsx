"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Copy, ExternalLink, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useWallet } from "@/features/quest/context/wallet-context";
import { RANK_STYLES, rankFromPoints } from "@/features/quest/lib/tier";
import {
  usersControllerGetMeQueryKey,
  useUsersControllerDailyLogin,
  useUsersControllerGetCheckInStatus,
  useUsersControllerGetMe,
} from "@/gen-quest";
import { cn } from "@/lib/utils";
import { AddressAvatar } from "@/shared/components/connect-wallet-button";
import { activeNetwork, getExplorerUrl } from "@/shared/config/stellar";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { $, withAuth } from "../lib/kubb-config";
import { useQuestAuthStore } from "../store/use-quest-auth";
import { Flame, PtsCoin } from "./icons";

const LINKS = [
  { href: "/quest", label: "Explore" },
  { href: "/quest/campaigns", label: "Campaigns" },
  { href: "/quest/leaderboard", label: "Leaderboard" },
  { href: "/quest/profile", label: "My Quests" },
];

interface MeFields {
  totalPoints?: number;
  loginStreak?: number;
  walletAddress?: string;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

/** Fetch the native XLM balance for an address from Horizon. */
async function fetchNativeBalance(address: string): Promise<string> {
  const res = await fetch(`${activeNetwork.horizonUrl}/accounts/${address}`);
  if (res.status === 404) return "0"; // unfunded account
  if (!res.ok) throw new Error("Failed to fetch balance");
  const json = (await res.json()) as { balances?: { asset_type: string; balance: string }[] };
  const native = json.balances?.find((b) => b.asset_type === "native");
  return native?.balance ?? "0";
}

const shorten = (addr: string) =>
  addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

// Shared base so the PTS, check-in and wallet chips render identically
// (same height, radius, border, surface and text size). Each chip layers
// its own accent color on top.
const CHIP_BASE = cn(
  "inline-flex h-10 items-center gap-[7px]",
  "px-[14px] text-[13.5px] font-semibold",
  "rounded-quest-pill bg-[var(--surface)] border border-[var(--line-2)]",
  "transition-colors"
);

export function QuestNav() {
  const path = usePathname() ?? "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated } = useQuestAuthStore();

  // Portal target (document.body) is only available client-side.
  useEffect(() => setMounted(true), []);

  // Lock body scroll while the mobile drawer is open. Close it whenever the
  // route changes so a tapped link doesn't leave the drawer hanging open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: close on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [path]);
  const { data } = useUsersControllerGetMe({
    ...$,
    query: { ...$.query, enabled: isAuthenticated },
  });
  const queryClient = useQueryClient();

  const { connect, disconnect, isAuthenticating } = useWallet();
  // `$` routes through questApiClient, whose interceptor already unwraps the
  // `{ success, data }` envelope — so `data` IS the profile (no extra `.data`).
  const me = ((data as MeFields | undefined) ?? {}) as MeFields;
  const points = me.totalPoints ?? 0;
  const streak = me.loginStreak ?? 0;
  const address = me.walletAddress ?? user?.walletAddress ?? "";
  const rankStyle = RANK_STYLES[rankFromPoints(points).rank];

  // Native XLM balance — same fetch/queryKey pattern as the strategy WalletMenu.
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ["native-balance", address],
    queryFn: () => fetchNativeBalance(address),
    enabled: Boolean(address),
    refetchInterval: 30_000,
  });
  const balanceLabel =
    balance != null
      ? `${Number(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })} XLM`
      : "—";

  const [copied, setCopied] = useState(false);
  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Address copied");
  };

  // Check-in status from the simple endpoint
  const { data: checkInStatusData, refetch: refetchCheckInStatus } =
    useUsersControllerGetCheckInStatus({
      ...$,
      query: { ...$.query, enabled: isAuthenticated, staleTime: 0, gcTime: 0 },
    });
  const hasCheckedIn =
    (checkInStatusData as { hasCheckedIn?: boolean } | undefined)?.hasCheckedIn ?? false;

  // Daily login mutation
  const dailyLogin = useUsersControllerDailyLogin({
    ...withAuth,
    mutation: {
      onSuccess: async (result) => {
        await queryClient.invalidateQueries({ queryKey: usersControllerGetMeQueryKey() });
        await refetchCheckInStatus();
        const awarded = (result as { pointsAwarded?: number } | undefined)?.pointsAwarded;
        toast.success(awarded ? `Check-in successful! +${awarded} points` : "Check-in successful!");
      },
      onError: (error: unknown) => {
        const envelope = error as { response?: { status?: number; data?: { message?: string } } };
        if (envelope.response?.status === 409) {
          toast.info("Already checked in today");
        } else {
          toast.error("Failed to check in. Please try again.");
        }
      },
    },
  });

  const handleCheckIn = () => {
    if (dailyLogin.isPending || hasCheckedIn) return;
    dailyLogin.mutate(undefined);
  };

  const isActive = (href: string) => {
    if (href === "/quest") {
      return path === "/quest" || path.startsWith("/quest/explore");
    }
    if (href === "/quest/campaigns") {
      return path.startsWith("/quest/campaigns") || path.startsWith("/quest/campaign");
    }
    return path === href || path.startsWith(`${href}/`);
  };

  return (
    <nav
      className={cn(
        "sticky top-0 z-50",
        "grid grid-cols-[1fr_auto_1fr] items-center",
        "px-[clamp(20px,5vw,56px)] py-4",
        "bg-[rgba(20,20,25,0.72)] backdrop-blur-[18px]",
        "border-b border-[var(--line)]"
      )}
    >
      {/* Brand — .brand + .mk + .brand-name */}
      <Link
        className={cn(
          "flex items-center gap-3",
          "font-bold text-[22px] tracking-[-0.03em]",
          "justify-self-start no-underline text-inherit",
          "max-[680px]:text-[15px] max-[680px]:gap-2"
        )}
        href="/quest"
      >
        <img
          className="w-[34px] h-[34px] flex-none block"
          src="/tasmil-tf-logo.png"
          alt="Tasmil"
          width="34"
          height="34"
        />
        <span
          className={cn(
            "bg-[linear-gradient(100deg,#fff_0%,#67e8f9_100%)]",
            "bg-clip-text text-transparent"
          )}
        >
          Tasmil Quest
        </span>
      </Link>

      {/* Nav links — .nav-links + .nav-item + .nav-item.active */}
      <div className="flex gap-0.5 justify-self-center max-[680px]:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            className={cn(
              "relative text-[16px] font-semibold px-4 py-[9px] rounded-quest-pill",
              "transition-[color,background] duration-[250ms] cursor-pointer",
              isActive(l.href)
                ? [
                    "text-[var(--text)]",
                    "after:content-[''] after:absolute after:left-[15px] after:right-[15px]",
                    "after:bottom-[1px] after:h-0.5 after:rounded-[2px]",
                    "after:bg-[var(--accent)]",
                    "after:shadow-[0_0_10px_var(--accent-glow)]",
                  ].join(" ")
                : ["text-[var(--muted)]", "hover:text-[var(--text)] hover:bg-white/[0.05]"].join(
                    " "
                  )
            )}
            href={l.href}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Right side — .nav-right */}
      <div className="flex items-center gap-3 justify-self-end">
        {/* PTS + streak chips only make sense once the wallet is connected/authenticated */}
        {isAuthenticated && (
          <>
            {/* .stat-pill.pts */}
            <span
              className={cn(
                CHIP_BASE,
                "text-quest-accent [&_svg]:text-quest-accent",
                "max-[680px]:hidden"
              )}
            >
              <PtsCoin style={{ width: 20, height: 20 }} />
              {fmt(points)}
            </span>

            {/* .stat-pill.streak — same color; text shows whether check-in is due */}
            <button
              type="button"
              className={cn(
                CHIP_BASE,
                "text-quest-amber [&_svg]:text-quest-amber",
                "hover:bg-white/[0.05] disabled:cursor-default disabled:hover:bg-[var(--surface)]",
                "max-[680px]:hidden"
              )}
              onClick={handleCheckIn}
              disabled={hasCheckedIn || dailyLogin.isPending}
              aria-label={hasCheckedIn ? "Checked in today" : "Daily check-in"}
              title={hasCheckedIn ? "Checked in today" : "Click to check in (+points)"}
            >
              <Flame style={{ width: 19, height: 19 }} />
              {dailyLogin.isPending ? "…" : hasCheckedIn ? `${fmt(streak)}` : "Check in"}
            </button>
          </>
        )}

        {/* Wallet chip — avatar-only on mobile, full chip at lg; opens a click/tap
            dropdown so it works on touch (mirrors the strategy WalletMenu). */}
        {address && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-testid="wallet-connected"
                className={cn(
                  "inline-flex h-10 items-center rounded-quest-pill border border-[var(--line-2)] bg-[var(--surface)] text-[var(--text)] outline-none transition-colors hover:bg-white/[0.05]",
                  "w-10 justify-center",
                  "min-[681px]:w-auto min-[681px]:justify-start min-[681px]:gap-[7px] min-[681px]:px-[14px] min-[681px]:text-[13.5px] min-[681px]:font-semibold"
                )}
              >
                <AddressAvatar address={address} size="size-[30px]" iconSize="size-3.5" />
                <span className="hidden min-[681px]:inline">{shorten(address)}</span>
                <ChevronDown className="hidden h-4 w-4 opacity-60 min-[681px]:block" />
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
                  {balanceLoading ? "Loading…" : balanceLabel}
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
                    {fmt(points)}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-quest-amber">
                    <Flame style={{ width: 16, height: 16 }} />
                    {fmt(streak)}d
                  </span>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-quest-line-2" />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  copyAddress();
                }}
                className="cursor-pointer gap-2 text-[13px]"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="font-mono">{shorten(address)}</span>
                <span className="ml-auto text-[11px] text-quest-muted">
                  {copied ? "Copied" : "Copy"}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer gap-2 text-[13px]">
                <a
                  href={getExplorerUrl("account", address)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Explorer
                </a>
              </DropdownMenuItem>
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
        )}

        {/* Connect Wallet — matches main navbar gradient button */}
        {!address && (
          <Button
            size="sm"
            variant="gradient"
            onClick={() => connect()}
            disabled={isAuthenticating}
            data-testid="connect-wallet"
            className="h-9 rounded-full px-4 font-bold text-sm"
          >
            {isAuthenticating ? "Connecting..." : "Connect Wallet"}
          </Button>
        )}

        {/* Hamburger — circular bordered Menu trigger (mirrors strategy); only
            shown below 680px, where the nav links are hidden. The drawer carries
            its own X / backdrop to close. */}
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className={cn(
            "hidden h-9 w-9 items-center justify-center rounded-full max-[680px]:inline-flex",
            "border border-[var(--line-2)] bg-[var(--surface)] text-[var(--text)] outline-none transition-colors hover:bg-white/[0.05]"
          )}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer — portaled to <body> so the full-height fixed panel
          escapes the nav's `backdrop-filter` containing block. Rendered only
          while open. */}
      {mounted &&
        menuOpen &&
        createPortal(
          <div className="min-[681px]:hidden">
            {/* Backdrop */}
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[190] animate-in cursor-default bg-black/60 backdrop-blur-sm duration-200 fade-in"
            />

            {/* Drawer panel */}
            <aside className="fixed top-0 right-0 z-[200] flex h-full w-[300px] max-w-[88vw] animate-in flex-col border-quest-line-2 border-l bg-quest-surface duration-300 slide-in-from-right">
              <div className="flex items-center justify-between border-quest-line-2 border-b px-4 py-4">
                <Link
                  href="/quest"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-w-0 items-center gap-2.5"
                >
                  <img
                    src="/tasmil-tf-logo.png"
                    alt="Tasmil"
                    width={26}
                    height={26}
                    className="h-[26px] w-[26px] flex-none"
                  />
                  <span className="truncate bg-[linear-gradient(100deg,#fff_0%,#67e8f9_100%)] bg-clip-text font-bold text-[17px] text-transparent">
                    Tasmil Quest
                  </span>
                </Link>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-quest-pill text-quest-text outline-none hover:bg-white/5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
                {/* Profile — flat (only the stat tiles are bordered) */}
                {address && isAuthenticated && (
                  <div className="flex flex-col gap-3 border-quest-line-2 border-b pb-4">
                    <div className="flex items-center gap-2.5">
                      <AddressAvatar address={address} size="size-9" iconSize="size-4" />
                      <div className="flex min-w-0 flex-col">
                        <span className="font-mono text-quest-text text-sm">
                          {shorten(address)}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5">
                          <img
                            src={rankStyle.asset}
                            alt={rankStyle.label}
                            width={16}
                            height={16}
                            className="flex-none object-contain [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.4))]"
                          />
                          <span className="text-quest-muted text-xs">{rankStyle.label}</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-[12px] border border-quest-line-2 bg-quest-surface px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <PtsCoin style={{ width: 18, height: 18 }} />
                          <span className="font-semibold text-[16px] text-quest-accent">
                            {fmt(points)}
                          </span>
                        </div>
                        <span className="mt-0.5 block text-[10px] text-quest-muted uppercase tracking-[0.12em]">
                          Points
                        </span>
                      </div>
                      <div className="rounded-[12px] border border-quest-line-2 bg-quest-surface px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <Flame style={{ width: 18, height: 18 }} />
                          <span className="font-semibold text-[16px] text-quest-amber">
                            {fmt(streak)}d
                          </span>
                        </div>
                        <span className="mt-0.5 block text-[10px] text-quest-muted uppercase tracking-[0.12em]">
                          Streak
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCheckIn}
                      disabled={hasCheckedIn || dailyLogin.isPending}
                      className={cn(
                        "inline-flex w-full items-center justify-center gap-2 rounded-[10px] border py-2 font-semibold text-[13px] transition-opacity",
                        hasCheckedIn
                          ? "border-quest-line-2 bg-quest-surface text-quest-muted disabled:cursor-default"
                          : "border-quest-accent-line bg-quest-accent-soft text-quest-accent hover:opacity-90 disabled:opacity-60"
                      )}
                    >
                      {hasCheckedIn ? (
                        <>
                          <Check className="h-4 w-4" />
                          Checked in today
                        </>
                      ) : (
                        "Daily check-in"
                      )}
                    </button>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex flex-col gap-1">
                  <span className="px-1 pb-1 text-[11px] text-quest-muted uppercase tracking-[0.14em]">
                    Navigate
                  </span>
                  {LINKS.map((l) => {
                    const active = isActive(l.href);
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "relative rounded-[10px] px-3 py-3 font-medium text-[15px] transition-colors",
                          active
                            ? "bg-quest-accent-soft font-semibold text-quest-accent"
                            : "text-quest-muted hover:bg-white/[0.05] hover:text-quest-text"
                        )}
                      >
                        {active && (
                          <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-quest-accent shadow-[0_0_8px_var(--color-quest-accent-glow)]" />
                        )}
                        {l.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Disconnect footer — pinned bottom, only when connected */}
              {address && (
                <div className="border-quest-line-2 border-t p-3">
                  <button
                    type="button"
                    onClick={() => {
                      disconnect();
                      setMenuOpen(false);
                    }}
                    className="inline-flex w-full items-center gap-2 rounded-[10px] px-3 py-3 text-red-400 text-sm outline-none transition-colors hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Disconnect
                  </button>
                </div>
              )}
            </aside>
          </div>,
          document.body
        )}
    </nav>
  );
}
