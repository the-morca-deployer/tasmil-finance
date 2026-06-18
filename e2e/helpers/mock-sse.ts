// tasmil-finance/e2e/helpers/mock-sse.ts
import type { Page } from "@playwright/test";

export interface VestingInfo {
  currentWeek: number;
  totalWeeks: number;
  lockedPercent: number;
  lockedAmount: number;
  unlockDate: string;
}

export interface ReinvestProjection {
  amount: number;
  byDate: string;
}

export type AgUiEvent =
  | { type: "text"; data: { content: string } }
  | { type: "card"; data: { name: string; payload: unknown } }
  | {
      type: "milestone-nudge";
      data: { variant: "five-dollar" | "day-30" | "pool-full"; topPercent?: number; spotsLeft?: number };
    }
  | {
      type: "withdrawal-intent";
      data: { vesting: VestingInfo; reinvestProjection: ReinvestProjection | null };
    };

export async function mockAgUiStream(page: Page, events: AgUiEvent[]): Promise<void> {
  const body =
    events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("") + "data: [DONE]\n\n";
  await page.route("**/agui/**", (route) =>
    route.fulfill({
      status: 200,
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      body,
    }),
  );
}

export function clarifyCardEvent(kind: "asset" | "pool", options: string[]): AgUiEvent {
  return { type: "card", data: { name: "card-clarify", payload: { kind, options } } };
}

export function milestoneNudgeEvent(
  variant: "five-dollar" | "day-30" | "pool-full",
  extra: { topPercent?: number; spotsLeft?: number } = {},
): AgUiEvent {
  return { type: "milestone-nudge", data: { variant, ...extra } };
}

export function withdrawalIntentEvent(
  vesting: VestingInfo,
  reinvestProjection: ReinvestProjection | null = null,
): AgUiEvent {
  return { type: "withdrawal-intent", data: { vesting, reinvestProjection } };
}
