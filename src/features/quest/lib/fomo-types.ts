export interface FomoActive {
  id: string;
  title: string;
  description?: string | null;
  endAt: string;
  multiplier: number;
  countdownDays: number;
  isInCountdown: boolean;
  secondsRemaining: number;
}

export interface DailyMission {
  taskId: string;
  campaignId: string;
  type: "LOGIN_CHECKIN" | "STRATEGY_CHECKIN" | "REFERRAL";
  title: string;
  description?: string | null;
  pointReward: number;
  order: number;
  completedToday: boolean;
  pointsAwarded: number | null;
}
