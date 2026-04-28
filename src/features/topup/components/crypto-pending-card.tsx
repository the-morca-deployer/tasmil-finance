"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useCallback } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import type { TopupSnapshot } from "../lib/fetch-topup";
import { TopupCountdown } from "./topup-countdown";

interface CryptoPendingCardProps {
  snapshot: TopupSnapshot;
}

export function CryptoPendingCard({ snapshot }: CryptoPendingCardProps) {
  const copy = useCallback((value: string, label: string) => {
    navigator.clipboard.writeText(value).catch(() => undefined);
    console.warn(`copied:${label}`);
  }, []);

  const { destination, memo, amount } = snapshot;
  if (!destination || !memo || !amount) {
    return (
      <Card data-testid="crypto-pending-malformed">
        <CardContent>Topup is missing crypto rail fields. Contact support.</CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="crypto-pending-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Send XLM to top up</span>
          <span className="text-muted-foreground text-sm">
            expires in <TopupCountdown expiresAt={snapshot.expiresAt} />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <QRCodeCanvas value={destination} size={196} />
        <dl className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 text-sm">
          <dt>Destination</dt>
          <dd data-testid="crypto-destination" className="break-all font-mono">
            {destination}
          </dd>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copy(destination, "destination")}
            data-testid="copy-destination"
          >
            Copy
          </Button>

          <dt>Memo</dt>
          <dd data-testid="crypto-memo" className="font-mono">
            {memo}
          </dd>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copy(memo, "memo")}
            data-testid="copy-memo"
          >
            Copy
          </Button>

          <dt>Amount</dt>
          <dd data-testid="crypto-amount" className="font-mono">
            {amount} XLM
          </dd>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copy(amount, "amount")}
            data-testid="copy-amount"
          >
            Copy
          </Button>
        </dl>
      </CardContent>
    </Card>
  );
}
