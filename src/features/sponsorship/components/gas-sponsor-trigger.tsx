"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSponsorshipMe } from "../hooks/use-sponsorship-me";
import { useSponsorshipVisit } from "../hooks/use-sponsorship-visit";
import { sponsorshipApi } from "../api";
import { GasSponsorModal } from "./gas-sponsor-modal";

interface Props {
  route: "dashboard" | "chat" | "farming";
  authReady: boolean;
}

export function GasSponsorTrigger({ route, authReady }: Props) {
  useSponsorshipVisit(route, authReady);
  const { data } = useSponsorshipMe(authReady);
  const router = useRouter();
  const qc = useQueryClient();
  const [dismissed, setDismissed] = useState(false);

  if (!data || !data.enrolled || data.modalSeen || dismissed) return null;
  if (data.rank == null) return null;

  function close() {
    setDismissed(true);
    qc.setQueryData(["sponsorship", "me"], (prev: unknown) => {
      if (prev && typeof prev === "object") {
        return { ...(prev as Record<string, unknown>), modalSeen: true };
      }
      return prev;
    });
    sponsorshipApi.markModalSeen().catch(() => undefined);
  }

  return (
    <GasSponsorModal
      rank={data.rank}
      cohortSize={data.cohortSize}
      maxTxPerUser={data.config.maxTxPerUser}
      maxXlmPerTx={data.config.maxXlmPerTx}
      onClose={close}
      onPrimaryCta={() => {
        close();
        router.push("/farming");
      }}
      onDetail={() => {
        close();
        router.push("/rewards/gas-sponsorship");
      }}
    />
  );
}
