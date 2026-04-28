"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import type { TopupSnapshot } from "../lib/fetch-topup";
import { TopupCountdown } from "./topup-countdown";

interface FiatPendingCardProps {
  snapshot: TopupSnapshot;
}

export function FiatPendingCard({ snapshot }: FiatPendingCardProps) {
  const bank = snapshot.bankAccount ?? {
    name: "",
    bank: "",
    swift: "",
    iban: "",
    country: "",
  };

  return (
    <Card data-testid="fiat-pending-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bank transfer pending</span>
          <span className="text-muted-foreground text-sm">
            expires in <TopupCountdown expiresAt={snapshot.expiresAt} />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p>
          Send <strong data-testid="fiat-amount-usd">${snapshot.pricing.usd}</strong> to:
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt>Bank name</dt>
          <dd>{bank.bank}</dd>
          <dt>Account name</dt>
          <dd>{bank.name}</dd>
          <dt>SWIFT</dt>
          <dd className="font-mono">{bank.swift}</dd>
          <dt>IBAN</dt>
          <dd className="font-mono">{bank.iban}</dd>
          <dt>Country</dt>
          <dd>{bank.country}</dd>
          <dt>Reference</dt>
          <dd data-testid="fiat-reference" className="font-mono">
            {snapshot.reference}
          </dd>
        </dl>
        <p className="text-muted-foreground text-sm">
          We'll email you when the funds arrive (typically 1–3 business days).
        </p>
      </CardContent>
    </Card>
  );
}
