"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Flame, Layers } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import type { CardMode } from "../../schemas/common.schema";
import type { PhoenixPoolCardProps } from "../../schemas/phoenix.schema";
import { CardHeader } from "../base/indicators";
import { EmptyState, ProtocolCard } from "../base/protocol-card";

interface PhoenixPoolsCardProps {
  pools: PhoenixPoolCardProps[];
  mode?: CardMode;
}

function feeLabel(feeBps: number | null | undefined): string | null {
  if (feeBps == null || !Number.isFinite(feeBps)) return null;
  return `${(feeBps / 100).toFixed(2)}%`;
}

export function PhoenixPoolsCard({ pools, mode = "playground" }: PhoenixPoolsCardProps) {
  const [open, setOpen] = useState<Set<number>>(new Set(mode === "playground" ? [0] : []));
  const flip = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  if (!pools.length) {
    return (
      <ProtocolCard data-testid="card-phoenix-pools" mode={mode} title="Phoenix Pools" icon={Flame}>
        <EmptyState icon={Layers} text="No pools found" />
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard
      data-testid="card-phoenix-pools"
      mode={mode}
      title={mode === "chat" ? "Phoenix Pools" : undefined}
      icon={mode === "chat" ? Flame : undefined}
      iconColor="text-orange-500"
      iconBg="bg-orange-500/10"
    >
      {mode === "playground" && (
        <CardHeader
          icon={<Flame className="h-3.5 w-3.5" />}
          title="Phoenix Pools"
          right={<span className="text-muted-foreground text-xs">{pools.length}</span>}
        />
      )}
      {pools.map((pool, i) => {
        const isOpen = open.has(i);
        const fee = feeLabel(pool.feeBps);
        return (
          <div key={pool.address || i} className={cn(i > 0 && "border-border border-t")}>
            <button
              type="button"
              onClick={() => flip(i)}
              className="flex w-full items-center gap-2 px-4 py-2.5 transition-colors hover:bg-muted/30"
            >
              <ChevronDown
                className={cn(
                  "h-3 w-3 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
              <span className="flex-1 truncate text-left font-medium text-[13px] text-foreground">
                {pool.name}
              </span>
              {fee && (
                <span className="rounded-md bg-muted px-1.5 py-px font-medium text-[10px] text-muted-foreground">
                  {fee} fee
                </span>
              )}
            </button>
            {pool.address && (
              <span className="block break-all px-4 pb-2 pl-9 font-mono text-[10px] text-muted-foreground/50">
                {pool.address}
              </span>
            )}
            {mode === "playground" ? (
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <PoolDetail pool={pool} />
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              isOpen && <PoolDetail pool={pool} />
            )}
          </div>
        );
      })}
    </ProtocolCard>
  );
}

function PoolDetail({ pool }: { pool: PhoenixPoolCardProps }) {
  const tokens = pool.tokens ?? [];

  return (
    <div className="space-y-1.5 px-4 pb-2 pl-9">
      {/* The stake contract is a separate deployment from the pool contract.
          Users bonding LP shares need it, and resolve_pool always returns it,
          so it belongs on the card rather than only in the model's prose. */}
      {pool.stakeAddress && <AddressRow label="Stake contract" value={pool.stakeAddress} />}
      {pool.lpShareAddress && <AddressRow label="LP share token" value={pool.lpShareAddress} />}
      {tokens.length > 0 && (
        <div className="space-y-1 pt-0.5">
          {tokens.map((t, j) => (
            <div key={t.address || j} className="flex items-start gap-2.5 py-1">
              <TokenImage src={null} alt={t.symbol ?? "?"} className="h-5 w-5 rounded-full" />
              <div className="min-w-0">
                <span className="block font-medium text-foreground text-xs">
                  {t.symbol ?? t.address.slice(0, 8)}
                  {t.amount != null && t.amount !== "" && (
                    <span className="ml-1.5 text-muted-foreground tabular-nums">{t.amount}</span>
                  )}
                </span>
                <span className="block break-all font-mono text-[10px] text-muted-foreground/50">
                  {t.address}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddressRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] text-muted-foreground/50 uppercase">{label}</p>
      <span className="block break-all font-mono text-[10px] text-muted-foreground/70">
        {value}
      </span>
    </div>
  );
}
