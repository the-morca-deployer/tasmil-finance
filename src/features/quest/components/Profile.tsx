"use client";

import { CheckCircle2, Copy, Edit2, Loader2, Upload, Users, Wallet, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { LedgerRow } from "@/features/quest/components/LedgerRow";
import { Rise } from "@/features/quest/components/Rise";
import { SocialConnectCard } from "@/features/quest/components/SocialConnectCard";
import { StatRing } from "@/features/quest/components/StatRing";
import { TelegramButton } from "@/features/quest/components/TelegramButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/features/quest/components/ui/avatar";
import { Badge } from "@/features/quest/components/ui/badge";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/features/quest/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/features/quest/components/ui/dialog";
import { Input } from "@/features/quest/components/ui/input";
import { Separator } from "@/features/quest/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/quest/components/ui/tabs";
import { useWallet } from "@/features/quest/context/wallet-context";
import { mapApiCampaignToCampaign } from "@/features/quest/lib/campaign-mapper";
import { withAuth } from "@/features/quest/lib/kubb-config";
import { useQuestAuthStore } from "@/features/quest/store/use-quest-auth";
import {
  useReferralControllerGetMyReferral,
  useSocialAccountsControllerFindAll,
  useSocialAccountsControllerLinkAccount,
  useSocialAccountsControllerUnlinkAccount,
  useUsersControllerGetMyCampaigns,
  useUsersControllerGetPointsHistory,
  useUsersControllerGetReferrals,
  useUsersControllerUpdateProfile,
} from "@/gen-quest/hooks";
import type { SocialAccountsControllerLinkAccountMutationRequest } from "@/gen-quest/types/social-accounts-controller-link-account";

const SHOW_REFERRALS = true;

// ---- Local interfaces for typed API response parsing ----

interface SocialAccount {
  id: string;
  platform: "X" | "Discord" | "Telegram";
  platformUserId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  connectedAt: string;
}

interface ApiCampaign {
  id: string;
  title: string;
  description?: string;
  rewardPoints?: number;
  metadata?: { rewardPoints?: number };
  logoUrl?: string;
  coverUrl?: string;
  questersCount?: number;
  avatars?: string[];
}

interface CampaignsEnvelope {
  success?: boolean;
  data?: { items?: ApiCampaign[] };
  items?: ApiCampaign[];
}

interface LedgerEnvelope {
  data?: { items?: unknown[] };
  items?: unknown[];
}

interface RawLedgerEntry {
  createdAt?: string;
  occurredAt?: string;
  source?: string;
  description?: string;
  campaignTitle?: string;
  points?: number;
  delta?: number;
}

interface ReferralEnvelope {
  data?: { items?: unknown[] };
  items?: unknown[];
}

interface RawReferral {
  username?: string;
  referredUsername?: string;
  createdAt?: string;
  joinedAt?: string;
  questPoints?: number;
  totalPoints?: number;
  ptsEarned?: number;
  earnedPoints?: number;
  status?: string;
}

// ---- Social SVGs ----

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 127.14 96.36" className={className} fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c2.36-24.44-5.42-48.18-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

// ---- Component ----

const Profile: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, address, points, user, connect } = useWallet();
  const { updateUser } = useQuestAuthStore();

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);

  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newUsername, setNewUsername] = useState("");
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  const [referralCopied, setReferralCopied] = useState(false);

  const currentAvatar =
    user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${address || "default"}`;

  const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  const { data: socialAccountsData, refetch: refetchSocialAccounts } =
    useSocialAccountsControllerFindAll({
      ...withAuth,
      query: {
        enabled: isAuthenticated,
      },
    });

  const socialAccounts: SocialAccount[] = useMemo(
    () =>
      ((socialAccountsData as { data?: SocialAccount[] } | undefined)?.data ||
        (socialAccountsData as SocialAccount[] | undefined) ||
        []) as SocialAccount[],
    [socialAccountsData]
  );

  const linkAccountMutation = useSocialAccountsControllerLinkAccount({
    client: withAuth.client,
    mutation: {
      onSuccess: () => {
        refetchSocialAccounts();
      },
    },
  });

  const unlinkAccountMutation = useSocialAccountsControllerUnlinkAccount({
    client: withAuth.client,
    mutation: {
      onSuccess: () => {
        refetchSocialAccounts();
      },
    },
  });

  const updateProfileMutation = useUsersControllerUpdateProfile({
    client: withAuth.client,
    mutation: {
      onSuccess: () => {
        toast.success("Profile updated successfully!");
      },
      onError: () => {
        toast.error("Failed to update profile");
      },
    },
  });

  const { data: myReferralData } = useReferralControllerGetMyReferral({
    ...withAuth,
    query: {
      enabled: isAuthenticated && SHOW_REFERRALS,
    },
  });

  const { data: referralListData } = useUsersControllerGetReferrals({
    ...withAuth,
    query: {
      enabled: isAuthenticated && SHOW_REFERRALS,
    },
  });

  const { data: pointsHistoryData } = useUsersControllerGetPointsHistory(user?.id, undefined, {
    ...withAuth,
    query: {
      enabled: isAuthenticated && !!user?.id,
    },
  });

  const ledgerEntries: Array<{
    occurredAt: string;
    source: string;
    delta: number;
  }> = useMemo(() => {
    const phd = pointsHistoryData as LedgerEnvelope | undefined;
    const raw: unknown[] = phd?.data?.items ?? phd?.items ?? [];
    return raw.slice(0, 5).map((e) => {
      const entry = e as RawLedgerEntry;
      return {
        occurredAt: String(entry.createdAt ?? entry.occurredAt ?? new Date().toISOString()),
        source: String(
          entry.source ?? entry.description ?? entry.campaignTitle ?? "Quest activity"
        ),
        delta: Number(entry.points ?? entry.delta ?? 0),
      };
    });
  }, [pointsHistoryData]);

  const referralCode: string = (() => {
    const mrd = myReferralData as { data?: { code?: string }; code?: string } | undefined;
    return String(mrd?.data?.code ?? mrd?.code ?? user?.referralCode ?? user?.username ?? "");
  })();

  const referralRedemptions: Array<{
    username: string;
    joined: string;
    questPoints: number;
    ptsEarned: number;
    status: string;
  }> = useMemo(() => {
    const rld = referralListData as ReferralEnvelope | undefined;
    const raw: unknown[] = rld?.data?.items ?? rld?.items ?? [];
    return raw.map((r) => {
      const entry = r as RawReferral;
      return {
        username: String(entry.username ?? entry.referredUsername ?? "Unknown"),
        joined: String(entry.createdAt ?? entry.joinedAt ?? new Date().toISOString()),
        questPoints: Number(entry.questPoints ?? entry.totalPoints ?? 0),
        ptsEarned: Number(entry.ptsEarned ?? entry.earnedPoints ?? 0),
        status: String(entry.status ?? "active"),
      };
    });
  }, [referralListData]);

  const handleAvatarSelect = (seed: string) => {
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    setSelectedAvatar(newAvatar);
    setPreviewImage(null);
  };

  const handleConfirmAvatar = async () => {
    const avatarToSave = previewImage || selectedAvatar;
    if (!avatarToSave) {
      setIsAvatarModalOpen(false);
      return;
    }

    setIsUpdatingAvatar(true);
    try {
      updateProfileMutation.mutate(
        { data: { avatarUrl: avatarToSave } },
        {
          onSuccess: () => {
            updateUser({ avatarUrl: avatarToSave });
            setIsAvatarModalOpen(false);
            setSelectedAvatar(null);
            setPreviewImage(null);
            setIsUpdatingAvatar(false);
          },
          onError: () => {
            setIsUpdatingAvatar(false);
          },
        }
      );
    } catch (error) {
      console.error("Failed to update avatar:", error);
      setIsUpdatingAvatar(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setSelectedAvatar(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    setIsUpdatingUsername(true);
    updateProfileMutation.mutate(
      { data: { username: newUsername.trim() } },
      {
        onSuccess: () => {
          updateUser({ username: newUsername.trim() });
          setIsUsernameModalOpen(false);
          setNewUsername("");
          setIsUpdatingUsername(false);
        },
        onError: (error: unknown) => {
          console.error("Failed to update username:", error);
          if (error && typeof error === "object" && "response" in error) {
            const axiosError = error as { response?: { status?: number } };
            if (axiosError.response?.status === 409) {
              toast.error("Username is already taken");
            } else {
              toast.error("Failed to update username");
            }
          } else {
            toast.error("Failed to update username");
          }
          setIsUpdatingUsername(false);
        },
      }
    );
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied!");
    }
  };

  const copyReferral = () => {
    const code = referralCode;
    if (code) {
      const link = `https://quest.tasmil.finance/r/${code}`;
      navigator.clipboard.writeText(link);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 1400);
      toast.success("Referral link copied!");
    }
  };

  const handleConnectSocial = (provider: "X" | "Discord" | "Telegram") => {
    if (provider === "Telegram") return;
    window.location.href = `/api/auth/${provider.toLowerCase()}`;
  };

  const handleDisconnectSocial = async (platform: string) => {
    unlinkAccountMutation.mutate(
      { platform: platform as "X" | "Discord" | "Telegram" },
      {
        onSuccess: () => {
          toast.success(`${platform} account disconnected`);
        },
        onError: (error) => {
          console.error("Failed to disconnect social account:", error);
          toast.error(`Failed to disconnect ${platform}`);
        },
      }
    );
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const platform = params.get("oauth_platform") as "X" | "Discord" | null;
    const oauthError = params.get("oauth_error");

    if (oauthError) {
      toast.error(`Failed to connect: ${oauthError.replace(/_/g, " ")}`);
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (!platform) return;

    const accountData: SocialAccountsControllerLinkAccountMutationRequest = {
      platformUserId: params.get("oauth_userId") ?? "",
      username: params.get("oauth_username") ?? "",
      displayName: params.get("oauth_displayName") ?? "",
    };

    window.history.replaceState({}, "", window.location.pathname);

    linkAccountMutation.mutate(
      { platform, data: accountData },
      {
        onSuccess: () => {
          toast.success(`${platform} account linked successfully!`);
          refetchSocialAccounts();
        },
        onError: (error: unknown) => {
          const axiosError = error as { response?: { status?: number } };
          if (axiosError.response?.status === 409) {
            toast.info("Account is already linked");
          } else {
            toast.error("Failed to link account");
            console.error("Link account error:", error);
          }
          refetchSocialAccounts();
        },
      }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const AVATAR_SEEDS = [
    "Felix",
    "Aneka",
    "Zoe",
    "Jack",
    "Callie",
    "Sam",
    "Milo",
    "Bella",
    "Lola",
    "Rocky",
    "Ginger",
    "Abby",
    "Bailey",
    "Bandit",
    "Bear",
    "Blue",
    "Bo",
    "Boomer",
    "Brady",
    "Brody",
    "Bruno",
    "Buster",
    "Casey",
    "Champ",
    "Chance",
    "Charlie",
    "Chase",
    "Chester",
    "Chico",
    "Coco",
    "Cody",
    "Cooper",
    "Copper",
    "Daisy",
    "Dexter",
    "Diesel",
    "Duke",
    "Elvis",
    "Finn",
    "Frankie",
    "George",
    "Gizmo",
    "Gunner",
    "Gus",
    "Hank",
    "Harley",
    "Harvey",
    "Hazel",
    "Heidi",
    "Henry",
  ];

  const [questTab, setQuestTab] = useState<"pending" | "claimable" | "claimed">("pending");

  const { data: pendingData, isLoading: isLoadingPending } = useUsersControllerGetMyCampaigns(
    { status: "pending" },
    {
      ...withAuth,
      query: { enabled: isAuthenticated && questTab === "pending" },
    }
  );

  const { data: claimableData, isLoading: isLoadingClaimable } = useUsersControllerGetMyCampaigns(
    { status: "claimable" },
    {
      ...withAuth,
      query: { enabled: isAuthenticated && questTab === "claimable" },
    }
  );

  const { data: claimedData, isLoading: isLoadingClaimed } = useUsersControllerGetMyCampaigns(
    { status: "claimed" },
    {
      ...withAuth,
      query: { enabled: isAuthenticated && questTab === "claimed" },
    }
  );

  const getCampaignsForTab = (status: "pending" | "claimable" | "claimed"): ApiCampaign[] => {
    let responseData: unknown;
    switch (status) {
      case "pending":
        responseData = pendingData;
        break;
      case "claimable":
        responseData = claimableData;
        break;
      case "claimed":
        responseData = claimedData;
        break;
    }
    if (!responseData) return [];
    const wrapped = responseData as CampaignsEnvelope;
    if (wrapped?.success && wrapped?.data?.items) return wrapped.data.items;
    if (wrapped?.items) return wrapped.items;
    return [];
  };

  const getQuestCount = (status: "pending" | "claimable" | "claimed") =>
    getCampaignsForTab(status).length;

  const getSocialAccount = (platform: string) =>
    socialAccounts.find((acc) => acc.platform.toUpperCase() === platform.toUpperCase());

  const userPoints = user?.totalPoints ?? points ?? 0;

  const rankDisplay = "#--";
  const rankPercentile = 0;

  const NEXT_RANK_POINTS = 5000;
  const progressPercent = Math.min((userPoints / NEXT_RANK_POINTS) * 100, 100);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm px-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Connect your wallet</h2>
            <p className="text-muted-foreground">View your quests, points, and rewards.</p>
          </div>
          <button type="button" className="btn btn-primary gap-2" onClick={connect}>
            <Wallet size={18} />
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 pb-12 animate-in fade-in duration-500">
      {/* Profile header */}
      <div className="profile-hero">
        <div className="profile-hero-av-wrap">
          <Avatar className="profile-hero-av">
            <AvatarImage src={currentAvatar} className="object-cover" />
            <AvatarFallback>{user?.username?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
          <button
            onClick={() => setIsAvatarModalOpen(true)}
            className="profile-hero-av-edit"
            aria-label="Change avatar"
          >
            <Edit2 size={14} />
          </button>
        </div>
        <div className="profile-hero-info">
          <div className="profile-hero-name-row">
            <h1 className="profile-hero-name">{user?.username ?? "Anonymous"}</h1>
            <button
              onClick={() => {
                setNewUsername(user?.username ?? "");
                setIsUsernameModalOpen(true);
              }}
              className="profile-hero-pencil"
              aria-label="Edit username"
            >
              <Edit2 size={14} />
            </button>
          </div>
          <button onClick={copyAddress} className="profile-hero-addr">
            {displayAddress}
            <Copy size={12} />
          </button>
          {user?.tier && (
            <Badge variant="default" className="mt-2 text-xs">
              {user.tier}
            </Badge>
          )}
        </div>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="mb-8 border-b border-line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quests">My Quests</TabsTrigger>
          {SHOW_REFERRALS && <TabsTrigger value="referrals">Referrals</TabsTrigger>}
          <TabsTrigger value="social">Social Accounts</TabsTrigger>
        </TabsList>

        {/* ===== OVERVIEW ===== */}
        <TabsContent value="overview">
          <Rise>
            <div className="profile-ov-grid">
              <div className="profile-stat-rings">
                <StatRing value={rankPercentile} label="RANK" display={rankDisplay} size={130} />
                <div className="profile-stat-number">
                  <div className="profile-stat-num-value">{userPoints.toLocaleString()}</div>
                  <div className="profile-stat-num-label">POINTS</div>
                </div>
                <div className="profile-stat-number">
                  <div className="profile-stat-num-value flex items-center gap-1">
                    <Zap size={18} className="text-amber-400 fill-amber-400" />
                    {user?.loginStreak ?? 0}
                  </div>
                  <div className="profile-stat-num-label">STREAK</div>
                </div>
              </div>

              <Card className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-brand-mid">Level Progress</span>
                  <span className="text-sm font-bold">
                    {userPoints.toLocaleString()} / {NEXT_RANK_POINTS.toLocaleString()} PTS
                  </span>
                </div>
                <div className="h-3 bg-black/40 rounded-full border border-white/5 overflow-hidden">
                  <div
                    className="h-full bg-brand-gradient rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="text-xs text-muted mt-2 text-center">
                  <span className="text-brand-mid font-bold">
                    {(NEXT_RANK_POINTS - userPoints).toLocaleString()} PTS
                  </span>{" "}
                  needed to reach next rank
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-4">Recent Activity</h3>
                {ledgerEntries.length === 0 ? (
                  <p className="text-muted text-sm">No activity yet.</p>
                ) : (
                  <div className="space-y-1">
                    {ledgerEntries.map((entry, i) => (
                      <LedgerRow
                        key={i}
                        occurredAt={entry.occurredAt}
                        source={entry.source}
                        delta={entry.delta}
                      />
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </Rise>
        </TabsContent>

        {/* ===== MY QUESTS ===== */}
        <TabsContent value="quests">
          <Rise>
            <Tabs
              value={questTab}
              onValueChange={(v) => setQuestTab(v as "pending" | "claimable" | "claimed")}
              className="space-y-6"
            >
              <TabsList className="w-full justify-start bg-transparent border-b border-border p-0 h-auto rounded-none gap-8 overflow-x-auto">
                {(["Pending", "Claimable", "Claimed"] as const).map((tab) => {
                  const status = tab.toLowerCase() as "pending" | "claimable" | "claimed";
                  const count = getQuestCount(status);
                  return (
                    <TabsTrigger
                      key={tab}
                      value={status}
                      className="rounded-none border-b-2 border-transparent px-0 py-3 text-base data-[state=active]:border-brand-mid data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-white text-muted hover:text-white transition-colors"
                    >
                      {tab}
                      {count > 0 && (
                        <span className="ml-2 text-xs bg-white/10 px-2 py-0.5 rounded-full text-muted">
                          {count}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {(["pending", "claimable", "claimed"] as const).map((status) => {
                const campaigns = getCampaignsForTab(status);
                const isLoading =
                  status === "pending"
                    ? isLoadingPending
                    : status === "claimable"
                      ? isLoadingClaimable
                      : isLoadingClaimed;
                const isCurrentTab = questTab === status;

                return (
                  <TabsContent key={status} value={status} className="pt-2">
                    {isLoading && isCurrentTab ? (
                      <div className="col-span-2 text-center py-12">
                        <Loader2 className="animate-spin mx-auto mb-4" size={32} />
                        <p className="text-muted">Loading campaigns...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {campaigns.map((campaign: ApiCampaign) => {
                          const mappedCampaign = mapApiCampaignToCampaign(campaign);
                          const totalPoints =
                            campaign.rewardPoints ?? campaign.metadata?.rewardPoints ?? 0;
                          const coverImage =
                            campaign.logoUrl ?? campaign.coverUrl ?? mappedCampaign.banner;

                          return (
                            <Card
                              key={campaign.id}
                              hoverEffect
                              onClick={() => router.push(`/quest/campaign/${campaign.id}`)}
                              className="flex flex-col h-full overflow-hidden border-border"
                            >
                              <div className="relative h-40 w-full border-b border-border">
                                <img
                                  src={coverImage}
                                  alt={campaign.title}
                                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                />
                                <div className="absolute top-4 left-4">
                                  <Badge variant="default">
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </Badge>
                                </div>
                              </div>

                              <CardHeader className="flex-grow pb-4">
                                <CardTitle className="text-lg line-clamp-1 mb-2">
                                  {campaign.title}
                                </CardTitle>
                                <CardDescription className="line-clamp-2">
                                  {campaign.description ?? ""}
                                </CardDescription>
                              </CardHeader>

                              <div className="px-6">
                                <Separator />
                              </div>

                              <CardFooter className="pt-4 justify-between text-sm">
                                <div className="flex items-center gap-4">
                                  <div className="flex -space-x-2 items-center">
                                    {campaign.avatars && campaign.avatars.length > 0
                                      ? campaign.avatars
                                          .slice(0, 3)
                                          .map((avatar: string, i: number) => (
                                            <Avatar
                                              key={i}
                                              className="w-6 h-6 border-2 border-card"
                                            >
                                              <AvatarImage src={avatar} />
                                              <AvatarFallback>U</AvatarFallback>
                                            </Avatar>
                                          ))
                                      : null}
                                    {(() => {
                                      const shown = campaign.avatars?.length
                                        ? Math.min(campaign.avatars.length, 3)
                                        : 0;
                                      const remaining = (campaign.questersCount ?? 0) - shown;
                                      return remaining > 0 ? (
                                        <div className="w-6 h-6 rounded-full border-2 border-card bg-muted/10 flex items-center justify-center text-[8px] font-bold text-muted">
                                          +
                                          {remaining > 999
                                            ? `${Math.floor(remaining / 1000)}k`
                                            : remaining}
                                        </div>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-success font-medium">
                                  <span>{totalPoints} PTS</span>
                                </div>
                              </CardFooter>
                            </Card>
                          );
                        })}
                        {campaigns.length === 0 && (
                          <div className="col-span-2 text-center py-12 text-muted border border-dashed border-border rounded-xl">
                            No {status} quests found.
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </Rise>
        </TabsContent>

        {/* ===== REFERRALS ===== */}
        {SHOW_REFERRALS && (
          <TabsContent value="referrals">
            <Rise>
              <div className="space-y-8">
                <Card className="p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={18} className="text-brand-mid" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted">
                      Referral Program
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">
                    Invite Friends, Earn Up to <span className="text-brand-mid">10%</span> of their
                    Quest Points
                  </h2>
                  <p className="text-muted text-sm mb-6">
                    Earn from your referrals quest points across three layers, forever. No expiry
                    and no minimum.
                  </p>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted">
                      Your Referral Code
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={referralCode ? `https://quest.tasmil.finance/r/${referralCode}` : ""}
                        placeholder="Loading..."
                        className="font-mono text-xs h-10 bg-background/50"
                      />
                      <button
                        type="button"
                        onClick={copyReferral}
                        className="btn btn-primary btn-sm shrink-0 gap-2"
                      >
                        {referralCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                        {referralCopied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </Card>

                <div>
                  <h3 className="font-bold text-lg mb-4">Your Referrals</h3>
                  {referralRedemptions.length === 0 ? (
                    <div className="text-center py-12 text-muted border border-dashed border-border rounded-xl text-sm">
                      No referrals yet. Share your code to get started.
                    </div>
                  ) : (
                    <div className="referral-table">
                      <div className="referral-table-head">
                        <span>Username</span>
                        <span>Joined</span>
                        <span className="text-right">Quest PTS</span>
                        <span className="text-right">PTS Earned</span>
                        <span>Status</span>
                      </div>
                      {referralRedemptions.map((r, i) => (
                        <div className="referral-table-row" key={i}>
                          <span className="font-medium">{r.username}</span>
                          <span className="text-muted text-sm">
                            {new Date(r.joined).toLocaleDateString()}
                          </span>
                          <span className="text-right font-mono text-sm">
                            {r.questPoints.toLocaleString()}
                          </span>
                          <span className="text-right font-mono text-sm text-brand-mid">
                            {r.ptsEarned.toLocaleString()}
                          </span>
                          <span>
                            <Badge variant={r.status === "active" ? "ongoing" : "closed"}>
                              {r.status}
                            </Badge>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Rise>
          </TabsContent>
        )}

        {/* ===== SOCIAL ACCOUNTS ===== */}
        <TabsContent value="social">
          <Rise>
            <div className="space-y-4">
              <h2 className="font-bold text-xl">Social Accounts</h2>
              <p className="text-muted text-sm">
                Connect your social accounts to verify and earn quest points.
              </p>
              <div className="social-cards-grid">
                {(() => {
                  const discordAccount = getSocialAccount("Discord");
                  return (
                    <SocialConnectCard
                      provider="Discord"
                      icon={<DiscordIcon className="w-5 h-5 text-[#5865F2]" />}
                      connected={!!discordAccount}
                      handle={discordAccount?.username ?? discordAccount?.displayName}
                      onConnect={() => handleConnectSocial("Discord")}
                      onDisconnect={() => handleDisconnectSocial("Discord")}
                    />
                  );
                })()}

                {(() => {
                  const xAccount = getSocialAccount("X");
                  return (
                    <SocialConnectCard
                      provider="X"
                      icon={<XIcon className="w-4 h-4 text-white" />}
                      connected={!!xAccount}
                      handle={xAccount?.username ? `@${xAccount.username}` : xAccount?.displayName}
                      onConnect={() => handleConnectSocial("X")}
                      onDisconnect={() => handleDisconnectSocial("X")}
                    />
                  );
                })()}

                {(() => {
                  const telegramAccount = getSocialAccount("Telegram");
                  return telegramAccount ? (
                    <SocialConnectCard
                      provider="Telegram"
                      icon={<TelegramIcon className="w-5 h-5 text-[#24A1DE]" />}
                      connected={true}
                      handle={
                        telegramAccount.username
                          ? `@${telegramAccount.username}`
                          : telegramAccount.displayName
                      }
                      onDisconnect={() => handleDisconnectSocial("Telegram")}
                    />
                  ) : (
                    <div className="social-card">
                      <div className="social-card-head">
                        <span className="social-card-icon">
                          <TelegramIcon className="w-5 h-5 text-[#24A1DE]" />
                        </span>
                        <span className="social-card-name">Telegram</span>
                      </div>
                      <div className="social-card-body">
                        <div className="social-card-msg">
                          Connect to verify and earn quest points.
                        </div>
                      </div>
                      <div className="social-card-foot">
                        <TelegramButton
                          size="small"
                          variant="outline"
                          onSuccess={(accountData) => {
                            if (accountData) {
                              const payload: SocialAccountsControllerLinkAccountMutationRequest = {
                                platformUserId: accountData.id,
                                username: accountData.username,
                                displayName: accountData.displayName,
                                avatarUrl: accountData.avatarUrl,
                              };
                              linkAccountMutation.mutate(
                                { platform: "Telegram", data: payload },
                                {
                                  onSuccess: () => {
                                    toast.success("Telegram account linked successfully!");
                                    refetchSocialAccounts();
                                  },
                                  onError: (error: unknown) => {
                                    const axiosError = error as { response?: { status?: number } };
                                    if (axiosError.response?.status === 409) {
                                      toast.info("Telegram account is already linked");
                                    } else {
                                      toast.error("Failed to link Telegram account");
                                      console.error("Link account error:", error);
                                    }
                                    refetchSocialAccounts();
                                  },
                                }
                              );
                            }
                          }}
                          disabled={
                            (linkAccountMutation.isPending ?? false) ||
                            (unlinkAccountMutation.isPending ?? false)
                          }
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </Rise>
        </TabsContent>
      </Tabs>

      {/* Avatar Modal */}
      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] !flex !flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Change Avatar</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="style" className="flex-1 flex flex-col min-h-0 mt-4 overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 bg-muted/20 p-1 mb-6 rounded-lg shrink-0">
              <TabsTrigger value="style">Pick your style</TabsTrigger>
              <TabsTrigger value="upload">Upload image</TabsTrigger>
            </TabsList>

            <TabsContent
              value="style"
              className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar"
            >
              <h4 className="font-bold text-sm mb-4 sticky top-0 bg-card py-2 z-10">
                Dope Characters
              </h4>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 pb-4">
                {AVATAR_SEEDS.map((seed) => {
                  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                  const isSelected = selectedAvatar === avatarUrl;
                  return (
                    <button
                      key={seed}
                      onClick={() => handleAvatarSelect(seed)}
                      className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${
                        isSelected
                          ? "border-brand-mid ring-4 ring-brand-mid/20"
                          : "border-transparent hover:border-white/20"
                      }`}
                    >
                      <img src={avatarUrl} alt={seed} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <CheckCircle2 size={24} className="text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent
              value="upload"
              className="flex-1 flex flex-col items-center justify-center py-8 min-h-0 overflow-y-auto"
            >
              <div
                className="w-full h-64 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center hover:border-brand-mid/50 hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden"
                onClick={triggerFileUpload}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />

                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload size={24} className="text-muted group-hover:text-white" />
                    </div>
                    <p className="font-medium text-lg">Click to upload</p>
                    <p className="text-sm text-muted mt-2">SVG, PNG, JPG or GIF (max. 2MB)</p>
                  </>
                )}

                {previewImage && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <p className="font-bold">Click to change</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-4 pt-4 border-t border-border shrink-0">
            <button
              type="button"
              onClick={handleConfirmAvatar}
              className="btn btn-primary text-sm"
              disabled={
                isUpdatingAvatar ||
                updateProfileMutation.isPending ||
                (!selectedAvatar && !previewImage)
              }
            >
              {isUpdatingAvatar ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Confirm"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Username Modal */}
      <Dialog open={isUsernameModalOpen} onOpenChange={setIsUsernameModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Username</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Username</label>
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter new username"
                maxLength={50}
              />
              <p className="text-xs text-muted">Username must be unique and max 50 characters.</p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsUsernameModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleUpdateUsername}
                disabled={
                  isUpdatingUsername || updateProfileMutation.isPending || !newUsername.trim()
                }
              >
                {isUpdatingUsername ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
