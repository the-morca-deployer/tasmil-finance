export interface CampaignStep {
  id: string;
  type:
    | "twitter"
    | "discord"
    | "telegram"
    | "verify"
    | "visit"
    | "x_follow"
    | "x_retweet"
    | "x_comment"
    | "x_like"
    | "onchain";
  label: string;
  actionUrl: string;
  completed?: boolean;
  description?: string;
  actionLabel?: string;
  points?: number;
  checkId?: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  fullDescription?: string;
  status: "ongoing" | "closed" | "upcoming";
  banner: string;
  participants: number;
  points: number;
  chain: string;
  startDate?: string;
  endDate?: string;
  avatars?: string[]; // Array of avatar URLs for this campaign (max 5)
  steps?: CampaignStep[];
  reward?: {
    type: "nft" | "token" | "whitelist";
    title: string;
    image: string;
    points: number;
  };
  coverUrl?: string;
}

export interface UserBoost {
  id: string;
  name: string;
  percent: number;
  icon: string;
  cap?: number;
}

export interface UserReward {
  id: string;
  campaignId: string;
  title: string;
  image: string;
  type: "nft" | "token";
  status: "available" | "claimed";
  amount?: string;
  dateEarned: string;
}

export interface UserQuest {
  id: string;
  campaignId: string;
  campaignTitle: string;
  description: string;
  status: "pending" | "claimable" | "claimed" | "missed";
  logo: string;
  rewards: {
    type: "usdt" | "nft" | "points";
    value: string | number;
    label: string; // e.g., "500 USDT", "NFT", "80"
  }[];
  chain?: string;
}

export interface UserProfile {
  address: string;
  username: string;
  rank: number;
  points: number;
  totalMultiplier: number;
  streak: number;
  completedQuests: number;
  referredUsers: number;
  boosts: UserBoost[];
  rewards: UserReward[];
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  address: string;
  avatarSeed: string;
  avatarUrl?: string;
  points: number;
  questsCompleted: number;
  reward: number;
  change: "up" | "down" | "same";
  updatedAt?: string;
}
