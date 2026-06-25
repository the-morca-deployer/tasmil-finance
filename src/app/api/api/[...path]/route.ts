/**
 * Mock API route — intercepts /api/api/* when NEXT_PUBLIC_MOCK_API=true.
 * Returns mock data for quest backend endpoints.
 */
import { NextResponse } from "next/server";

// Static imports — only bundled when this file is loaded (client-side we're not using it)
const MOCK_ENABLED = process.env.NEXT_PUBLIC_MOCK_API === "true";

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!MOCK_ENABLED) return NextResponse.json({ error: "mock disabled" }, { status: 404 });
  const path = (await params).path;
  return handleMock(path.join("/"), _req);
}

export async function POST(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!MOCK_ENABLED) return NextResponse.json({ error: "mock disabled" }, { status: 404 });
  const path = (await params).path;
  return handleMock(path.join("/"), req, "POST");
}

export async function PUT(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!MOCK_ENABLED) return NextResponse.json({ error: "mock disabled" }, { status: 404 });
  const path = (await params).path;
  return handleMock(path.join("/"), req, "PUT");
}

// ── Mock data handler ──

function handleMock(fullPath: string, req: Request, method = "GET") {
  const url = new URL(req.url);
  // Strip quest/ prefix if present
  const p = fullPath.replace(/^quest\//, "");

  // Campaigns
  if (p === "campaigns" && method === "GET") return json(mockCampaigns(url));
  if (p === "campaigns/not-joined" && method === "GET") return json(mockNotJoined());
  const campMatch = p.match(/^campaigns\/([^/]+)$/);
  if (campMatch && method === "GET") return json(mockCampaignDetail(campMatch[1]!));
  if (p.match(/^campaigns\/[^/]+\/join$/) && method === "POST") return json({ success: true, data: { ok: true } });
  if (p.match(/^campaigns\/[^/]+\/claim$/) && method === "POST") return json({ success: true, data: { claimed: true, points: 150 } });

  // Tasks
  const taskStatus = p.match(/^tasks\/([^/]+)\/status$/);
  if (taskStatus && method === "GET") return json(mockTaskStatus(taskStatus[1]!));
  const taskClaim = p.match(/^tasks\/([^/]+)\/claim-status$/);
  if (taskClaim && method === "GET") return json(mockTaskClaimStatus(taskClaim[1]!));
  if (p.match(/^tasks\/[^/]+\/verify$/) && method === "POST") return json({ success: true, data: { success: true, message: "Verified!" } });
  if (p.match(/^tasks\/[^/]+\/claim$/) && method === "POST") return json({ success: true, data: { claimed: true, points: 25 } });
  if (p.match(/^tasks\/[^/]+\/record-visit$/) && method === "POST") return json({ success: true, data: { ok: true } });

  // Users
  if (p === "users/me" && method === "GET") return json(MOCK_USER_ME);
  if (p === "users/me/social-accounts" && method === "GET") return json(MOCK_SOCIAL_ACCOUNTS);
  if (p === "users/referrals" && method === "GET") return json(MOCK_REFERRALS_LIST);
  if (p === "users/check-in-status" && method === "GET") return json(MOCK_CHECK_IN_STATUS);
  if (p === "users/me/check-in-status" && method === "GET") return json(MOCK_CHECK_IN_STATUS);
  if (p.match(/^users\/[^/]+\/points-history$/) && method === "GET") return json(MOCK_POINTS_HISTORY);
  if (p.match(/^users\/[^/]+\/profile$/) && method === "PUT") return json({ success: true, data: { ok: true } });
  if (p === "users/my-campaigns" && method === "GET") {
    const status = url.searchParams.get("status");
    if (status === "claimable") return json(MOCK_MY_CAMPAIGNS_CLAIMABLE);
    if (status === "claimed") return json(MOCK_MY_CAMPAIGNS_CLAIMED);
    return json(MOCK_MY_CAMPAIGNS_PENDING);
  }
  if (p === "users/daily-login" && method === "POST") return json(MOCK_DAILY_LOGIN_RESULT);

  // Leaderboard
  if ((p === "analytics/global-leaderboard" || p === "leaderboard/global") && method === "GET") return json(MOCK_LEADERBOARD);
  if ((p === "analytics/streak-leaderboard" || p === "leaderboard/streak") && method === "GET") return json(MOCK_STREAK_LEADERBOARD);

  // Seasons
  if (p === "seasons/current" && method === "GET") return json(MOCK_CURRENT_SEASON);
  if (p === "seasons/me" && method === "GET") return json(MOCK_MY_SEASON_RESULT);

  // Referrals
  if (p === "referral/my-referral" && method === "GET") return json(MOCK_REFERRAL);
  if (p === "referral/leaderboard" && method === "GET") return json(MOCK_LEADERBOARD);

  // Social
  if (p === "social-accounts" && method === "GET") return json(MOCK_SOCIAL_ACCOUNTS);
  if (p === "social-accounts" && method === "POST") return json({ success: true, data: { ok: true } });
  if (p === "social-accounts/unlink" && method === "POST") return json({ success: true, data: { ok: true } });

  // Auth
  if (p === "auth/wallet-nonce" && method === "GET") return json({ nonce: "mock-nonce-abc123" });
  if (p.match(/^auth\/(wallet-login|username-login)$/) && method === "POST") {
    return json({ success: true, data: { accessToken: "mock-jwt", refreshToken: "mock-refresh", user: MOCK_USER_ME.data } });
  }
  if (p === "auth/refresh" && method === "POST") return json({ success: true, data: { accessToken: "mock-jwt", refreshToken: "mock-refresh" } });
  if (p === "auth/logout" && method === "POST") return json({ success: true, data: { ok: true } });

  // Notifications
  if (p === "notifications" && method === "GET") return json({ data: [] });

  return NextResponse.json({ error: "no mock for: " + p }, { status: 404 });
}

function json(data: unknown) { return NextResponse.json(data); }

// ── Mock data ──

const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

const RAW_CAMPAIGNS = [
  { id: "tasmil-launch", title: "Mission Bring TASMIL Home", description: "Support the Tasmil ecosystem.", descriptionDetail: "Join the grand launch event.", logoUrl: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1600&h=900", coverUrl: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1600&h=900", questersCount: 124932, rewardPoints: 150, category: "DeFi", startAt: daysFromNow(-30), endAt: daysFromNow(30), isFeatured: true, avatars: [], tasks: [{ id: "s1", type: "twitter", name: "Follow @tasmilfinance on X", title: "Follow @tasmilfinance on X", actionUrl: "https://x.com/tasmilfinance", actionLabel: "Follow", description: "Follow our official X account.", pointReward: 25 }, { id: "s2", type: "discord", name: "Join Tasmil Discord", title: "Join Tasmil Discord", actionUrl: "https://discord.gg/tasmil", actionLabel: "Join Server", description: "Join our Discord community.", pointReward: 25 }, { id: "s3", type: "telegram", name: "Join @tasmil on Telegram", title: "Join @tasmil on Telegram", actionUrl: "https://t.me/tasmil", actionLabel: "Join Channel", description: "Subscribe to our Telegram.", pointReward: 25 }, { id: "s4", type: "verify", name: "Verify Wallet Activity", title: "Verify Wallet Activity", actionUrl: "#", actionLabel: "Check Status", description: "Verify one transaction on Stellar.", pointReward: 75 }] },
  { id: "defi-summer", title: "Tasmil DeFi Summer", description: "Explore the hottest DeFi protocols.", logoUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=1600&h=900", questersCount: 45200, rewardPoints: 80, category: "DeFi", startAt: daysFromNow(-10), endAt: daysFromNow(45), isFeatured: true, avatars: [], tasks: [] },
  { id: "nft-madness", title: "NFT Madness: Collect & Win", description: "Mint, trade, and collect exclusive NFTs.", logoUrl: "https://images.unsplash.com/photo-1620321023374-d1a68fddadb3?auto=format&fit=crop&q=80&w=1600&h=900", questersCount: 8900, rewardPoints: 500, category: "NFT", startAt: daysFromNow(-60), endAt: daysFromNow(-15), isFeatured: false, avatars: [], tasks: [] },
  { id: "social-surge", title: "The Social Surge", description: "Grow your social presence and earn rewards.", logoUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1600&h=900", questersCount: 2334, rewardPoints: 50, category: "Other", startAt: daysFromNow(-20), endAt: daysFromNow(14), isFeatured: true, avatars: [], tasks: [] },
  { id: "phoenix-trade", title: "Phoenix Trading Challenge", description: "Trade on Phoenix DEX for massive rewards.", logoUrl: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&q=80&w=1600&h=900", questersCount: 12000, rewardPoints: 200, category: "DeFi", startAt: daysFromNow(-5), endAt: daysFromNow(20), isFeatured: false, avatars: [], tasks: [] },
  { id: "upcoming-stellar", title: "Stellar Evolution: Next Frontier", description: "Be among the first to explore next-gen Stellar.", logoUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1600&h=900", questersCount: 9210, rewardPoints: 300, category: "Infra", startAt: daysFromNow(7), endAt: daysFromNow(37), isFeatured: true, avatars: [], tasks: [] },
  { id: "soroswap-pro", title: "Soroswap Pro League", description: "Competitive liquidity provision.", logoUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=1600&h=900", questersCount: 4800, rewardPoints: 250, category: "DeFi", startAt: daysFromNow(14), endAt: daysFromNow(44), isFeatured: false, avatars: [], tasks: [] },
  { id: "cross-chain", title: "Cross-Chain Explorer", description: "Bridge assets across chains with Allbridge.", logoUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1600&h=900", questersCount: 3800, rewardPoints: 120, category: "Infra", startAt: daysFromNow(-90), endAt: daysFromNow(-30), isFeatured: false, avatars: [], tasks: [] },
];

function listEnvelope(items: unknown[]) { return { success: true, data: { items, meta: { total: items.length, page: 1, limit: 20 } } }; }

function mockCampaigns(url: URL) {
  const active = url.searchParams.get("active");
  const isFeatured = url.searchParams.get("isFeatured");
  let list = RAW_CAMPAIGNS;
  if (active === "true") list = list.filter(c => new Date(c.endAt) > new Date());
  if (active === "false") list = list.filter(c => new Date(c.endAt) < new Date());
  if (isFeatured === "true") list = list.filter(c => c.isFeatured);
  return listEnvelope(list);
}

function mockNotJoined() { return listEnvelope(RAW_CAMPAIGNS.filter(c => c.id !== "tasmil-launch")); }

function mockCampaignDetail(id: string) {
  const c = RAW_CAMPAIGNS.find(c => c.id === id);
  if (!c) return NextResponse.json(null, { status: 404 });
  return { success: true, data: { campaign: c, participation: { joinedAt: daysFromNow(-5), status: "active" }, meta: { avatars: [] } } };
}

function mockTaskStatus(taskId: string) {
  const completed = ["s1", "s2"];
  return { data: { taskId, status: completed.includes(taskId) ? "COMPLETED" : "PENDING", verifiedAt: completed.includes(taskId) ? new Date().toISOString() : null } };
}

function mockTaskClaimStatus(taskId: string) {
  const claimed = ["s1"];
  return { data: { taskId, claimed: claimed.includes(taskId), claimedAt: claimed.includes(taskId) ? new Date().toISOString() : null, points: claimed.includes(taskId) ? 25 : 0 } };
}

const MOCK_USER_ME = { data: { id: "user-001", walletAddress: "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R", username: "stellar_nomad", totalPoints: 12450, loginStreak: 7, avatarUrl: null, tier: "Silver", referralCode: "TASMIL-X7K9", role: "user" } };
const MOCK_CHECK_IN_STATUS = { data: { hasCheckedIn: true } };
const MOCK_DAILY_LOGIN_RESULT = { data: { pointsAwarded: 25 } };
const MOCK_POINTS_HISTORY = { data: { items: [{ id: "ph-1", type: "campaign_complete", points: 150, campaign: "Mission Bring TASMIL Home", date: new Date().toISOString() }] } };
const MOCK_MY_CAMPAIGNS_PENDING = { success: true, data: { items: [{ id: "mc-1", campaignId: "tasmil-launch", title: "Mission Bring TASMIL Home", status: "pending", progress: 2, total: 4, rewardPoints: 150, logoUrl: RAW_CAMPAIGNS[0]!.logoUrl }] } };
const MOCK_MY_CAMPAIGNS_CLAIMABLE = { success: true, data: { items: [{ id: "mc-4", campaignId: "social-surge", title: "The Social Surge", status: "claimable", rewardPoints: 50, logoUrl: RAW_CAMPAIGNS[3]!.logoUrl }] } };
const MOCK_MY_CAMPAIGNS_CLAIMED = { success: true, data: { items: [{ id: "mc-5", campaignId: "nft-madness", title: "NFT Madness", status: "claimed", rewardPoints: 500, logoUrl: RAW_CAMPAIGNS[2]!.logoUrl }] } };

const MOCK_LEADERBOARD = {
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
    { username: "stellar_nomad", walletAddress: "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R", totalPoints: 12450, loginStreak: 7 },
  ],
};

const MOCK_STREAK_LEADERBOARD = {
  data: [
    { username: "Kianna Torff", walletAddress: "G32A...a1b2", totalPoints: 42000, loginStreak: 38 },
    { username: "Maren Gouse", walletAddress: "G56D...g8h9", totalPoints: 38500, loginStreak: 30 },
    { username: "Abram Mango", walletAddress: "G89B...c4d5", totalPoints: 41500, loginStreak: 25 },
    { username: "Max Cooper", walletAddress: "G78G...m4n5", totalPoints: 29000, loginStreak: 21 },
    { username: "Alfonso Lubin", walletAddress: "G12C...e6f7", totalPoints: 39000, loginStreak: 19 },
  ],
};

const MOCK_CURRENT_SEASON = {
  data: { id: "season-3", name: "Season 3: Stellar Rise", status: "ACTIVE", startAt: "2024-06-01T00:00:00Z", endAt: daysFromNow(14), prizePoolUsdc: "5000", rankRewards: [{ rankFrom: 1, rankTo: 1, usdc: "2500", points: 5000 }, { rankFrom: 2, rankTo: 3, usdc: "1500", points: 3000 }, { rankFrom: 4, rankTo: 10, usdc: "500", points: 1000 }] },
};

const MOCK_MY_SEASON_RESULT = {
  data: { season: { id: "season-3", name: "Season 3: Stellar Rise", status: "ACTIVE" }, finalRank: 1, finalPoints: 5000, usdcReward: "2500", pointsReward: 5000, badge: "gold", payoutStatus: "PENDING", revealed: false },
};

const MOCK_REFERRAL = {
  data: { code: "TASMIL-X7K9", referralLink: "https://tasmil-finance.xyz/r/TASMIL-X7K9", totalReferrals: 14, activeReferrals: 9, totalEarned: 1250, rates: [{ layer: 1, rateBps: 1000 }, { layer: 2, rateBps: 300 }, { layer: 3, rateBps: 100 }] },
};

const MOCK_REFERRALS_LIST = {
  data: [{ id: "ref-1", username: "trader_mike", layer: 1, joinedAt: "2024-05-01", points: 2300, ptsEarned: 230, status: "active" }, { id: "ref-2", username: "stargazer99", layer: 1, joinedAt: "2024-05-15", points: 1800, ptsEarned: 180, status: "active" }],
};

const MOCK_SOCIAL_ACCOUNTS = {
  data: [{ id: "sa-1", platform: "X", platformUserId: "123456", username: "@stellar_nomad", displayName: "Stellar Nomad", avatarUrl: null, connectedAt: "2024-05-01" }, { id: "sa-2", platform: "Discord", platformUserId: "789012", username: "stellar_nomad#1234", displayName: "stellar_nomad", avatarUrl: null, connectedAt: "2024-05-02" }],
};
