import { Card, CardContent } from "@/shared/ui/card";
import type { TractionData } from "../evidence";

function exactBaseUnits(value: string): string {
  return `${BigInt(value).toLocaleString("en-US")} base units`;
}

function summarizeVenueValues(values: string[]): string {
  if (values.length === 0) return "0 base units";
  if (values.length === 1) return exactBaseUnits(values[0] as string);
  return `${values.length} venue totals`;
}

function LedgerKpi({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
      <p data-ledger-kpi={id} className="mt-1 break-all font-semibold text-lg">
        {value}
      </p>
    </div>
  );
}

export function LedgerProvenance({ data }: { data: TractionData }) {
  const { publicLedger: ledger, reconciliation, updatedAt } = data;
  const volumeValues = ledger.volumeByVenue.map(({ amountBaseUnits }) => amountBaseUnits);
  const tvlValues = ledger.tvlByVenue.map(({ balanceBaseUnits }) => balanceBaseUnits);
  const explorerContract = `https://stellar.expert/explorer/public/contract/${ledger.sourceContract}`;
  const complete = ledger.state === "FULL";
  const rangeText = `Stellar mainnet · Ledgers ${ledger.range.effectiveStartLedger}–${ledger.range.latestLedger}`;
  const partialText = `Partial: requested ${ledger.range.requestedStartLedger}, available from ${ledger.range.effectiveStartLedger}${ledger.range.truncated ? "; 10,000-event limit reached" : ""}.`;
  const horizonText =
    ledger.horizon.state === "UNAVAILABLE"
      ? "Horizon verification unavailable"
      : `${ledger.horizon.state === "VERIFIED" ? "Verified" : "Partially verified"}: ${ledger.horizon.verifiedTransactions}/${ledger.transactionCount} transactions`;
  const reconciliationText = `Internal index: ${reconciliation.cachedTransactionCount.toLocaleString("en-US")} transactions; public ledger: ${reconciliation.publicLedgerTransactionCount.toLocaleString("en-US")}; delta: ${reconciliation.transactionCountDelta.toLocaleString("en-US")}. Registered users: ${reconciliation.registeredUsers.toLocaleString("en-US")}; public-ledger wallets: ${reconciliation.publicLedgerWallets.toLocaleString("en-US")}.`;

  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-base">Public-ledger evidence</h2>
            <p className="text-muted-foreground text-xs">
              Direct Soroban RPC events on Stellar mainnet; amounts remain exact base-unit integers.
            </p>
          </div>
          <span className="rounded bg-blue-500/10 px-2 py-1 font-semibold text-[11px] text-blue-300">
            {complete ? "Complete RPC range" : "Partial RPC range"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <LedgerKpi
            id="volume"
            label="On-chain volume"
            value={summarizeVenueValues(volumeValues)}
          />
          <LedgerKpi id="tvl" label="On-chain TVL" value={summarizeVenueValues(tvlValues)} />
          <LedgerKpi
            id="transactions"
            label="On-chain transactions"
            value={String(ledger.transactionCount)}
          />
          <LedgerKpi id="wallets" label="On-chain wallets" value={String(ledger.walletCount)} />
        </div>

        {(ledger.volumeByVenue.length > 0 || ledger.tvlByVenue.length > 0) && (
          <div className="grid gap-3 text-xs md:grid-cols-2">
            <div>
              <h3 className="font-medium">Volume by venue</h3>
              <ul className="mt-2 space-y-2">
                {ledger.volumeByVenue.map(({ venue, amountBaseUnits }) => (
                  <li key={venue} className="break-all text-muted-foreground">
                    <a
                      href={`https://stellar.expert/explorer/public/contract/${venue}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {venue}
                    </a>{" "}
                    — {exactBaseUnits(amountBaseUnits)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium">TVL by venue</h3>
              <ul className="mt-2 space-y-2">
                {ledger.tvlByVenue.map(({ venue, balanceBaseUnits }) => (
                  <li key={venue} className="break-all text-muted-foreground">
                    <a
                      href={`https://stellar.expert/explorer/public/contract/${venue}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {venue}
                    </a>{" "}
                    — {exactBaseUnits(balanceBaseUnits)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <dl className="grid gap-3 text-xs md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Network and range</dt>
            <dd className="mt-1">{rangeText}</dd>
            {!complete && <dd className="mt-1 text-amber-300">{partialText}</dd>}
          </div>
          <div>
            <dt className="text-muted-foreground">Generated</dt>
            <dd className="mt-1">{new Date(updatedAt).toUTCString()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Source contract</dt>
            <dd className="mt-1 break-all">
              <a
                href={explorerContract}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline"
              >
                {ledger.sourceContract}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Horizon cross-check</dt>
            <dd className="mt-1">
              <span>{horizonText}</span>
              {" · "}
              <a
                href={ledger.horizon.endpoint}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline"
              >
                endpoint
              </a>
            </dd>
          </div>
        </dl>

        <div className="rounded-md border border-border p-3 text-xs">
          <p className="font-medium">Internal index reconciliation</p>
          <p className="mt-1 text-muted-foreground">{reconciliationText}</p>
          <p className="mt-2 break-all text-muted-foreground">
            Raw event digest (SHA-256): {ledger.rawEventDigest}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
