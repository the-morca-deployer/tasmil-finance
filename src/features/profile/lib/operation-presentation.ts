import { formatRowDate } from "@/shared/utils/date-group";
import type { RowPresentation, TxGroup } from "./types";

const FAILED_PRESENTATION = {
  title: "Transaction Failed",
  subline: "Failed",
  sublineGlyph: "failed",
  avatar: {
    kind: "bordered-glyph",
    glyph: "wallet",
    corner: { glyph: "x-circle", tone: "destructive" },
  },
  amount: { kind: "none" },
} as const;

function moreOpsLabel(group: TxGroup): string | undefined {
  if (group.ops.length <= 1) return undefined;
  return ` + ${group.ops.length - 1} ops`;
}

export function presentRow(group: TxGroup, _viewer: string): RowPresentation {
  const date = formatRowDate(new Date(group.createdAt));
  const more = moreOpsLabel(group);
  const withCommon = <T extends Omit<RowPresentation, "date" | "moreOpsLabel">>(
    base: T,
  ): RowPresentation => ({
    ...base,
    date,
    ...(more !== undefined ? { moreOpsLabel: more } : {}),
  });

  if (!group.successful) {
    return withCommon({ ...FAILED_PRESENTATION });
  }

  const primary = group.primary;
  const deltas = primary.deltas;
  const dst = deltas.find((d) => d.isCredit) ?? deltas[0];
  const src = deltas.find((d) => !d.isCredit) ?? deltas[0];

  switch (primary.kind) {
    case "send": {
      const code = dst?.code ?? "XLM";
      return withCommon({
        title: code,
        subline: "Sent",
        sublineGlyph: "sent",
        avatar: { kind: "token", code },
        amount: dst
          ? { kind: "single", value: dst.amount, code: dst.code, isCredit: false }
          : { kind: "none" },
      });
    }
    case "receive": {
      const code = dst?.code ?? "XLM";
      return withCommon({
        title: code,
        subline: "Received",
        sublineGlyph: "received",
        avatar: { kind: "token", code },
        amount: dst
          ? { kind: "single", value: dst.amount, code: dst.code, isCredit: true }
          : { kind: "none" },
      });
    }
    case "swap": {
      const srcCode = src?.code ?? "XLM";
      const dstCode = dst?.code ?? "XLM";
      return withCommon({
        title: `${srcCode} to ${dstCode}`,
        subline: "Swapped",
        sublineGlyph: "swap",
        avatar: { kind: "swap-dual", src: srcCode, dst: dstCode },
        amount: dst
          ? { kind: "single", value: dst.amount, code: dst.code, isCredit: true }
          : { kind: "none" },
      });
    }
    default:
      return withCommon({
        title: primary.rawType,
        subline: "Operation",
        sublineGlyph: "generic",
        avatar: { kind: "bordered-glyph", glyph: "user" },
        amount: { kind: "none" },
      });
  }
}
