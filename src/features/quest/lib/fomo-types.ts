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
  id: string;
  code: string;
  title: string;
  description?: string | null;
  type: "LOGIN_CHECKIN" | "STRATEGY_CHECKIN" | "REFERRAL";
  pointReward: number;
  order: number;
  completedToday: boolean;
  pointsAwarded: number | null;
}
