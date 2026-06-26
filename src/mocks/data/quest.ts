/**
 * Mock data for quest API endpoints.
 * Response formats match the NestJS envelope the components expect:
 *   { data: {...} }  or  { success: true, data: { items: [], meta: {} } }
 */

// ============================================================
// Campaigns — returned as { success: true, data: { items, meta } }
// ============================================================

// Helper to generate ISO dates relative to now
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

const RAW_CAMPAIGNS = [
  {
    // Ongoing — started in past, ends in future
    id: "tasmil-launch",
    title: "Mission Bring TASMIL Home",
    description: "Support the Tasmil ecosystem by participating in our grand launch event.",
    descriptionDetail:
      "As the crypto ecosystem awaits the launch of Tasmil Mainnet, we're teaming up with leading partners to help users show their support for the Tasmil ecosystem.",
    logoUrl: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1600&h=900",
    coverUrl: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1600&h=900",
    questersCount: 124932,
    rewardPoints: 150,
    category: "DeFi",
    startAt: daysFromNow(-30),
    endAt: daysFromNow(30),
    isFeatured: true,
    avatars: [],
    tasks: [
      { id: "s1", type: "twitter", name: "Follow @tasmilfinance on X", title: "Follow @tasmilfinance on X", actionUrl: "https://x.com/tasmilfinance", actionLabel: "Follow", description: "Follow our official X account for latest updates.", pointReward: 25 },
      { id: "s2", type: "discord", name: "Join Tasmil Discord", title: "Join Tasmil Discord", actionUrl: "https://discord.gg/tasmil", actionLabel: "Join Server", description: "Join our Discord community and get roles.", pointReward: 25 },
      { id: "s3", type: "telegram", name: "Join @tasmil on Telegram", title: "Join @tasmil on Telegram", actionUrl: "https://t.me/tasmil", actionLabel: "Join Channel", description: "Subscribe to our Telegram for real-time alerts.", pointReward: 25 },
      { id: "s4", type: "verify", name: "Verify Wallet Activity", title: "Verify Wallet Activity", actionUrl: "#", actionLabel: "Check Status", description: "We'll verify you have at least one transaction on the Stellar network.", pointReward: 75 },
    ],
  },
  {
    // Ongoing
    id: "defi-summer",
    title: "Tasmil DeFi Summer",
    description: "Explore the hottest DeFi protocols launching on Tasmil this summer.",
    logoUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=1600&h=900",
    questersCount: 45200,
    rewardPoints: 80,
    category: "DeFi",
    startAt: daysFromNow(-10),
    endAt: daysFromNow(45),
    isFeatured: true,
    avatars: [],
    tasks: [],
  },
  {
    // Closed — ended in the past
    id: "nft-madness",
    title: "NFT Madness: Collect & Win",
    description: "Mint, trade, and collect exclusive NFTs to climb the leaderboard.",
    logoUrl: "https://images.unsplash.com/photo-1620321023374-d1a68fddadb3?auto=format&fit=crop&q=80&w=1600&h=900",
    questersCount: 8900,
    rewardPoints: 500,
    category: "NFT",
    startAt: daysFromNow(-60),
    endAt: daysFromNow(-15),
    isFeatured: false,
    avatars: [],
    tasks: [],
  },
  {
    // Ongoing
    id: "social-surge",
    title: "The Social Surge",
    description: "Grow your social presence and earn rewards for engaging.",
    logoUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1600&h=900",
    questersCount: 2334,
    rewardPoints: 50,
    category: "Other",
    startAt: daysFromNow(-20),
    endAt: daysFromNow(14),
    isFeatured: true,
    avatars: [],
    tasks: [],
  },
  {
    // Ongoing
    id: "phoenix-trade",
    title: "Phoenix Trading Challenge",
    description: "Trade on Phoenix DEX for massive rewards.",
    logoUrl: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&q=80&w=1600&h=900",
    questersCount: 12000,
    rewardPoints: 200,
    category: "DeFi",
    startAt: daysFromNow(-5),
    endAt: daysFromNow(20),
    isFeatured: false,
    avatars: [],
    tasks: [],
  },
  {
    // Upcoming — starts in the future
    id: "upcoming-stellar",
    title: "Stellar Evolution: Next Frontier",
    description: "Be among the first to explore the next generation of Stellar protocols. Early registrants earn bonus points.",
    logoUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1600&h=900",
    questersCount: 9210,
    rewardPoints: 300,
    category: "Infra",
    startAt: daysFromNow(7),
    endAt: daysFromNow(37),
    isFeatured: true,
    avatars: [],
    tasks: [],
  },
  {
    // Upcoming
    id: "soroswap-pro",
    title: "Soroswap Pro League",
    description: "Competitive liquidity provision with amplified rewards for top LPs.",
    logoUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=1600&h=900",
    questersCount: 4800,
    rewardPoints: 250,
    category: "DeFi",
    startAt: daysFromNow(14),
    endAt: daysFromNow(44),
    isFeatured: false,
    avatars: [],
    tasks: [],
  },
  {
    // Closed
    id: "cross-chain",
    title: "Cross-Chain Explorer",
    description: "Bridge assets across chains with Allbridge.",
    logoUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1600&h=900",
    questersCount: 3800,
    rewardPoints: 120,
    category: "Infra",
    startAt: daysFromNow(-90),
    endAt: daysFromNow(-30),
    isFeatured: false,
    avatars: [],
    tasks: [],
  },
];

// NestJS envelope for list endpoints
function listEnvelope(items: unknown[]) {
  return { success: true, data: { items, meta: { total: items.length, page: 1, limit: 20 } } };
}

// All campaigns in envelope
export const MOCK_CAMPAIGNS_ENVELOPE = listEnvelope(RAW_CAMPAIGNS);

// Filtered helpers
export function getCampaignsEnvelope(filter: (c: typeof RAW_CAMPAIGNS[number]) => boolean) {
  return listEnvelope(RAW_CAMPAIGNS.filter(filter));
}

export function getCampaignById(id: string) {
  const c = RAW_CAMPAIGNS.find((c) => c.id === id);
  if (!c) return { status: 404 };
  return {
    success: true,
    data: {
      campaign: c,
      participation: { joinedAt: daysFromNow(-5), status: "active" },
      meta: { avatars: c.avatars || [] },
    },
  };
}

export function getNotJoinedEnvelope() {
  return listEnvelope(RAW_CAMPAIGNS.filter((c) => c.id !== "tasmil-launch"));
}

// ============================================================
// Users — returned as { data: {...} }
// ============================================================

export const MOCK_USER_ME = {
  data: {
    id: "user-001",
    walletAddress: "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R",
    username: "stellar_nomad",
    totalPoints: 12450,
    loginStreak: 7,
    avatarUrl: null,
    tier: "Silver",
    referralCode: "TASMIL-X7K9",
    role: "user",
  },
};

export const MOCK_CHECK_IN_STATUS = {
  data: {
    hasCheckedIn: true,
  },
};

export const MOCK_DAILY_LOGIN_RESULT = {
  data: {
    pointsAwarded: 25,
  },
};

export const MOCK_POINTS_HISTORY = {
  data: {
    items: [
      { id: "ph-1", type: "campaign_complete", points: 150, campaign: "Mission Bring TASMIL Home", date: new Date(Date.now() - 86400000).toISOString() },
      { id: "ph-2", type: "daily_login", points: 25, date: new Date(Date.now() - 86400000).toISOString() },
      { id: "ph-3", type: "referral", points: 100, referee: "trader_mike", date: new Date(Date.now() - 172800000).toISOString() },
      { id: "ph-4", type: "campaign_complete", points: 500, campaign: "NFT Madness", date: new Date(Date.now() - 259200000).toISOString() },
      { id: "ph-5", type: "streak_bonus", points: 50, date: new Date(Date.now() - 432000000).toISOString() },
      { id: "ph-6", type: "campaign_complete", points: 80, campaign: "Tasmil DeFi Summer", date: new Date(Date.now() - 604800000).toISOString() },
    ],
  },
};

export const MOCK_MY_CAMPAIGNS_PENDING = {
  success: true,
  data: {
    items: [
      { id: "mc-1", campaignId: "tasmil-launch", title: "Mission Bring TASMIL Home", status: "pending", progress: 2, total: 4, rewardPoints: 150, logoUrl: RAW_CAMPAIGNS[0]!.logoUrl },
      { id: "mc-2", campaignId: "defi-summer", title: "Tasmil DeFi Summer", status: "pending", progress: 1, total: 2, rewardPoints: 80, logoUrl: RAW_CAMPAIGNS[1]!.logoUrl },
    ],
  },
};

export const MOCK_MY_CAMPAIGNS_CLAIMABLE = {
  success: true,
  data: {
    items: [
      { id: "mc-4", campaignId: "social-surge", title: "The Social Surge", status: "claimable", rewardPoints: 50, logoUrl: RAW_CAMPAIGNS[3]!.logoUrl },
    ],
  },
};

export const MOCK_MY_CAMPAIGNS_CLAIMED = {
  success: true,
  data: {
    items: [
      { id: "mc-5", campaignId: "nft-madness", title: "NFT Madness: Collect & Win", status: "claimed", rewardPoints: 500, logoUrl: RAW_CAMPAIGNS[2]!.logoUrl },
    ],
  },
};

// ============================================================
// Leaderboard — returned as { data: [...] }
// ============================================================

export const MOCK_LEADERBOARD = {
  data: [
    { username: "Kianna Torff", walletAddress: "G32A2B3C4D5E6F7G8H9I0J1a1b2c3d4", totalPoints: 42000, loginStreak: 38 },
    { username: "Abram Mango", walletAddress: "G89B2C3D4E5F6G7H8I9J0K1c4d5e6f7", totalPoints: 41500, loginStreak: 25 },
    { username: "Alfonso Lubin", walletAddress: "G12C3D4E5F6G7H8I9J0K1L2e6f7g8h9", totalPoints: 39000, loginStreak: 19 },
    { username: "Maren Gouse", walletAddress: "G56D4E5F6G7H8I9J0K1L2M3g8h9i0j1", totalPoints: 38500, loginStreak: 30 },
    { username: "Desirae Herwitz", walletAddress: "G90E5F6G7H8I9J0K1L2M3N4i0j1k2l3", totalPoints: 36000, loginStreak: 12 },
    { username: "Max Cooper", walletAddress: "G78G6H7I8J9K0L1M2N3O4P5m4n5o6p7", totalPoints: 29000, loginStreak: 21 },
    { username: "Livia Siphron", walletAddress: "G11H7I8J9K0L1M2N3O4P5Q6o6p7q8r9", totalPoints: 28500, loginStreak: 14 },
    { username: "Brandon Botosh", walletAddress: "G22I8J9K0L1M2N3O4P5Q6R7q8r9s0t1", totalPoints: 26000, loginStreak: 9 },
    { username: "Cooper Geidt", walletAddress: "G33J9K0L1M2N3O4P5Q6R7S8s0t1u2v3", totalPoints: 25000, loginStreak: 17 },
    { username: "stellar_nomad", walletAddress: "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KO3JU3FNUP6HBDHUGWA3I6R", totalPoints: 12450, loginStreak: 7 },
    { username: "Zaire Korsgaard", walletAddress: "G44K0L1M2N3O4P5Q6R7S8T9u2v3w4x5", totalPoints: 23800, loginStreak: 11 },
  ],
};

export const MOCK_STREAK_LEADERBOARD = {
  data: [
    { username: "Kianna Torff", walletAddress: "G32A...a1b2", totalPoints: 42000, loginStreak: 38 },
    { username: "Maren Gouse", walletAddress: "G56D...g8h9", totalPoints: 38500, loginStreak: 30 },
    { username: "Abram Mango", walletAddress: "G89B...c4d5", totalPoints: 41500, loginStreak: 25 },
    { username: "Max Cooper", walletAddress: "G78G...m4n5", totalPoints: 29000, loginStreak: 21 },
    { username: "Alfonso Lubin", walletAddress: "G12C...e6f7", totalPoints: 39000, loginStreak: 19 },
  ],
};

// ============================================================
// Seasons — { data: {...} }
// ============================================================

export const MOCK_CURRENT_SEASON = {
  data: {
    id: "season-3",
    name: "Season 3: Stellar Rise",
    status: "ACTIVE",
    startAt: "2024-06-01T00:00:00Z",
    endAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    prizePoolUsdc: "5000",
    rankRewards: [
      { rankFrom: 1, rankTo: 1, usdc: "2500", points: 5000, badge: "Champion" },
      { rankFrom: 2, rankTo: 3, usdc: "1500", points: 3000 },
      { rankFrom: 4, rankTo: 10, usdc: "500", points: 1000 },
    ],
  },
};

export const MOCK_MY_SEASON_RESULT = {
  data: {
    season: { id: "season-3", name: "Season 3: Stellar Rise", status: "ACTIVE" },
    finalRank: 1,
    finalPoints: 5000,
    usdcReward: "2500",
    pointsReward: 5000,
    badge: "gold",
    payoutStatus: "PENDING",
    revealed: false,
  },
};

// ============================================================
// Referrals — { data: {...} }
// ============================================================

export const MOCK_REFERRAL = {
  data: {
    code: "TASMIL-X7K9",
    referralLink: "https://tasmil-finance.xyz/r/TASMIL-X7K9",
    totalReferrals: 14,
    activeReferrals: 9,
    totalEarned: 1250,
    rates: [
      { layer: 1, rateBps: 1000 },
      { layer: 2, rateBps: 300 },
      { layer: 3, rateBps: 100 },
    ],
  },
};

export const MOCK_REFERRALS_LIST = {
  data: [
    // Layer 1 (direct, 10%)
    { id: "ref-1", username: "trader_mike", layer: 1, joinedAt: "2024-05-01T00:00:00Z", points: 2300, ptsEarned: 230, status: "active" },
    { id: "ref-2", username: "stargazer99", layer: 1, joinedAt: "2024-05-15T00:00:00Z", points: 1800, ptsEarned: 180, status: "active" },
    { id: "ref-3", username: "nftcollector", layer: 1, joinedAt: "2024-06-01T00:00:00Z", points: 1200, ptsEarned: 120, status: "inactive" },
    // Layer 2 (indirect, 3%)
    { id: "ref-4", username: "yield_hunter", layer: 2, joinedAt: "2024-06-10T00:00:00Z", points: 1500, ptsEarned: 45, status: "active" },
    { id: "ref-5", username: "moonshot_max", layer: 2, joinedAt: "2024-06-18T00:00:00Z", points: 900, ptsEarned: 27, status: "active" },
    // Layer 3 (deep network, 1%)
    { id: "ref-6", username: "defi_degen", layer: 3, joinedAt: "2024-06-22T00:00:00Z", points: 1100, ptsEarned: 11, status: "active" },
    { id: "ref-7", username: "stellar_sam", layer: 3, joinedAt: "2024-06-25T00:00:00Z", points: 600, ptsEarned: 6, status: "inactive" },
  ],
};

// Nested referral tree (L1 -> L2 -> L3) for the "Referral Tree" view.
export const MOCK_REFERRAL_TREE = {
  data: {
    rates: [
      { layer: 1, rateBps: 1000 },
      { layer: 2, rateBps: 300 },
      { layer: 3, rateBps: 100 },
    ],
    totalCommissionPoints: 619,
    tree: [
      {
        userId: "u1", name: "trader_mike", layer: 1, q: 2300, e: 230, status: "active",
        children: [
          {
            userId: "u4", name: "yield_hunter", layer: 2, q: 1500, e: 45, status: "active",
            children: [
              { userId: "u6", name: "defi_degen", layer: 3, q: 1100, e: 11, status: "active", children: [] },
            ],
          },
          {
            userId: "u5", name: "moonshot_max", layer: 2, q: 900, e: 27, status: "active",
            children: [
              { userId: "u7", name: "stellar_sam", layer: 3, q: 600, e: 6, status: "inactive", children: [] },
            ],
          },
        ],
      },
      { userId: "u2", name: "stargazer99", layer: 1, q: 1800, e: 180, status: "active", children: [] },
      { userId: "u3", name: "nftcollector", layer: 1, q: 1200, e: 120, status: "inactive", children: [] },
    ],
  },
};

// ============================================================
// Social Accounts — { data: [...] }
// ============================================================

export const MOCK_SOCIAL_ACCOUNTS = {
  data: [
    { id: "sa-1", platform: "X" as const, platformUserId: "123456", username: "@stellar_nomad", displayName: "Stellar Nomad", avatarUrl: null, connectedAt: "2024-05-01T00:00:00Z" },
    { id: "sa-2", platform: "Discord" as const, platformUserId: "789012", username: "stellar_nomad#1234", displayName: "stellar_nomad", avatarUrl: null, connectedAt: "2024-05-02T00:00:00Z" },
  ],
};

// ============================================================
// Tasks
// ============================================================

export function buildTaskStatus(taskId: string) {
  const completed = ["s1", "s2", "ds1", "ss1"];
  return {
    data: {
      taskId,
      status: completed.includes(taskId) ? "COMPLETED" : "PENDING",
      verifiedAt: completed.includes(taskId) ? new Date().toISOString() : null,
    },
  };
}

export function buildTaskClaimStatus(taskId: string) {
  const claimed = ["s1", "ss1"];
  return {
    data: {
      taskId,
      claimed: claimed.includes(taskId),
      claimedAt: claimed.includes(taskId) ? new Date().toISOString() : null,
      points: claimed.includes(taskId) ? 25 : 0,
    },
  };
}

export const MUTATION_SUCCESS = { success: true, data: { ok: true } };
