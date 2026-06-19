// @ts-nocheck
"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  CheckCircle2,
  Edit2,
  Upload,
  Users,
  Shield,
  Crown,
  Zap,
  Trophy,
  Loader2,
  X,
  Wallet,
} from "lucide-react";
import { Button } from "@/features/quest/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/features/quest/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/features/quest/components/ui/card-v2";
import { Avatar, AvatarImage, AvatarFallback } from "@/features/quest/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/features/quest/components/ui/dialog";
import { Input } from "@/features/quest/components/ui/input";
import { Separator } from "@/features/quest/components/ui/separator";
import { Badge } from "@/features/quest/components/ui/badge";
import { toast } from "sonner";
import { useWallet } from "@/features/quest/context/wallet-context";
import { useQuestAuthStore } from "@/features/quest/store/use-quest-auth";
import { 
  useSocialAccountsControllerFindAll,
  useSocialAccountsControllerLinkAccount,
  useSocialAccountsControllerUnlinkAccount,
  useUsersControllerUpdateProfile,
  useUsersControllerGetMyCampaigns,
} from "@/gen-quest/hooks";
import { withAuth } from "@/features/quest/lib/kubb-config";
import { mapApiCampaignToCampaign } from "@/features/quest/lib/campaign-mapper";
import { TelegramButton } from "./TelegramButton";

// Social SVGs
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 127.14 96.36" className={className} fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c2.36-24.44-5.42-48.18-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

interface SocialAccount {
  id: string;
  platform: "X" | "Discord" | "Telegram";
  platformUserId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  connectedAt: string;
}

const Profile: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, address, points, user, connect } = useWallet();
  const { updateUser } = useQuestAuthStore();

  // State for modals
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);

  // State for avatar
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for username
  const [newUsername, setNewUsername] = useState("");
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  // Get current avatar URL
  const currentAvatar =
    user?.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${address || "default"}`;

  // Format display address
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  // Fetch social accounts
  const {
    data: socialAccountsData,
    refetch: refetchSocialAccounts,
  } = useSocialAccountsControllerFindAll({
    ...withAuth,
    query: {
    enabled: isAuthenticated,
    },
  });

  const socialAccounts: SocialAccount[] = useMemo(
    () => (socialAccountsData?.data || socialAccountsData || []) as SocialAccount[],
    [socialAccountsData]
  );

  // Link account mutation
  const linkAccountMutation = useSocialAccountsControllerLinkAccount({
    ...withAuth,
    mutation: {
    onSuccess: () => {
      refetchSocialAccounts();
      },
    },
  });

  // Unlink account mutation
  const unlinkAccountMutation = useSocialAccountsControllerUnlinkAccount({
    ...withAuth,
    mutation: {
    onSuccess: () => {
      refetchSocialAccounts();
      },
    },
  });

  const handleAvatarSelect = (seed: string) => {
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    setSelectedAvatar(newAvatar);
    setPreviewImage(null);
  };

  // Update profile mutation
  const updateProfileMutation = useUsersControllerUpdateProfile({
    ...withAuth,
    mutation: {
      onSuccess: () => {
        toast.success("Profile updated successfully!");
      },
      onError: () => {
        toast.error("Failed to update profile");
      },
    },
  });

  const handleConfirmAvatar = async () => {
    const avatarToSave = previewImage || selectedAvatar;
    if (!avatarToSave) {
      setIsAvatarModalOpen(false);
      return;
    }

    setIsUpdatingAvatar(true);
    try {
      updateProfileMutation.mutate({
        data: {
        avatarUrl: avatarToSave,
        },
      }, {
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
      });
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
    updateProfileMutation.mutate({
      data: {
        username: newUsername.trim(),
      },
    }, {
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
  });
  };
  

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied!");
    }
  };

  const copyReferral = () => {
    const code = user?.referralCode || user?.username;
    if (code) {
      const link = `https://quest.tasmil.finance/r/${code}`;
      navigator.clipboard.writeText(link);
      toast.success("Referral link copied!");
    }
  };

  const handleConnectSocial = (provider: "X" | "Discord" | "Telegram") => {
    if (provider === "Telegram") {
      return;
    }
    window.location.href = `/api/auth/${provider.toLowerCase()}`;
  };

  const handleDisconnectSocial = async (platform: string) => {
    unlinkAccountMutation.mutate({ platform: platform as "X" | "Discord" | "Telegram" }, {
      onSuccess: () => {
      toast.success(`${platform} account disconnected`);
      },
      onError: (error) => {
      console.error("Failed to disconnect social account:", error);
      toast.error(`Failed to disconnect ${platform}`);
      },
    });
  };

  // Handle OAuth redirect-back: read query params and link account
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

    const accountData = {
      platformUserId: params.get("oauth_userId") ?? "",
      username: params.get("oauth_username") ?? "",
      displayName: params.get("oauth_displayName") ?? "",
    };

    window.history.replaceState({}, "", window.location.pathname);

    linkAccountMutation.mutate({ platform, data: accountData } as any, {
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
    });
  }, []);

  // 50 Avatars
  const AVATAR_SEEDS = [
    "Felix", "Aneka", "Zoe", "Jack", "Callie", "Sam", "Milo", "Bella", "Lola", "Rocky",
    "Ginger", "Abby", "Bailey", "Bandit", "Bear", "Blue", "Bo", "Boomer", "Brady", "Brody",
    "Bruno", "Buster", "Casey", "Champ", "Chance", "Charlie", "Chase", "Chester", "Chico", "Coco",
    "Cody", "Cooper", "Copper", "Daisy", "Dexter", "Diesel", "Duke", "Elvis", "Finn", "Frankie",
    "George", "Gizmo", "Gunner", "Gus", "Hank", "Harley", "Harvey", "Hazel", "Heidi", "Henry",
  ];

  // State for active tab
  const [activeTab, setActiveTab] = useState<"pending" | "claimable" | "claimed">("pending");

  // Fetch campaigns for each status
  const { data: pendingData, isLoading: isLoadingPending } = useUsersControllerGetMyCampaigns(
    { status: "pending" },
    {
      ...withAuth,
      query: {
        enabled: isAuthenticated && activeTab === "pending",
      },
    }
  );

  const { data: claimableData, isLoading: isLoadingClaimable } = useUsersControllerGetMyCampaigns(
    { status: "claimable" },
    {
      ...withAuth,
      query: {
        enabled: isAuthenticated && activeTab === "claimable",
      },
    }
  );

  const { data: claimedData, isLoading: isLoadingClaimed } = useUsersControllerGetMyCampaigns(
    { status: "claimed" },
    {
      ...withAuth,
      query: {
        enabled: isAuthenticated && activeTab === "claimed",
      },
    }
  );

  // Get current tab data
  const getCurrentTabData = () => {
    switch (activeTab) {
      case "pending":
        return { data: pendingData, isLoading: isLoadingPending };
      case "claimable":
        return { data: claimableData, isLoading: isLoadingClaimable };
      case "claimed":
        return { data: claimedData, isLoading: isLoadingClaimed };
      default:
        return { data: null, isLoading: false };
    }
  };

  // Extract campaigns from API response
  const getCampaignsForTab = (status: "pending" | "claimable" | "claimed") => {
    let responseData;
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

    // Handle wrapped response from ResponseInterceptor
    const wrappedResponse = responseData as any;
    if (wrappedResponse?.success && wrappedResponse?.data?.items) {
      return wrappedResponse.data.items;
    }
    
    // Fallback: direct structure
    if (wrappedResponse?.items) {
      return wrappedResponse.items;
    }

    return [];
  };

  const getQuestCount = (status: "pending" | "claimable" | "claimed") => {
    const campaigns = getCampaignsForTab(status);
    return campaigns.length;
  };

  const NEXT_RANK_POINTS = 5000;
  const userPoints = user?.totalPoints || points || 0;
  const progressPercent = Math.min((userPoints / NEXT_RANK_POINTS) * 100, 100);

  const getSocialAccount = (platform: string) => {
    return socialAccounts.find(
      (acc) => acc.platform.toUpperCase() === platform.toUpperCase()
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm px-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Connect your wallet</h2>
            <p className="text-muted-foreground">
              View your quests, points, and rewards.
            </p>
          </div>
          <Button variant="gradient" size="lg" onClick={connect} className="gap-2">
            <Wallet size={18} />
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 pb-12 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar - Profile Info (Approx 30%) */}
        <div className="lg:col-span-4 space-y-8">
          {/* User Card */}
          <Card className="p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative group">
                <Avatar className="w-28 h-28 border-4 border-card bg-background overflow-hidden relative z-10">
                  <AvatarImage src={currentAvatar} className="object-cover" />
                  <AvatarFallback>
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <button
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="absolute bottom-0 right-0 z-20 w-8 h-8 rounded-full bg-surface text-foreground flex items-center justify-center border-2 border-white/20 hover:scale-110 transition-transform shadow-sm"
                >
                  <Edit2 size={14} />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold leading-none">
                    {user?.username || "Anonymous"}
                  </h1>
                  <button
                    onClick={() => {
                      setNewUsername(user?.username || "");
                      setIsUsernameModalOpen(true);
                    }}
                    className="p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <Edit2 size={14} className="text-muted" />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={copyAddress}
                    className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 text-xs font-mono text-muted hover:text-white transition-colors"
                  >
                    {displayAddress}
                    <Copy size={12} />
                  </button>
                </div>
              </div>

              {user?.tier && (
                <Badge variant="default" className="text-sm">
                  {user.tier}
                </Badge>
              )}
            </div>
          </Card>

          {/* Referral Section - temporarily hidden */}
          {/* <Card className="p-6 space-y-4">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Users size={20} className="text-brand-mid" />
                Referral Program
              </h3>
              <p className="text-sm text-muted">
                Invite friends and earn 10% of their quest points forever.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`https://quest.tasmil.finance/r/${user?.referralCode || user?.username || ""}`}
                className="bg-background/50 h-9 font-mono text-xs"
              />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0"
                variant="gradient"
                onClick={copyReferral}
              >
                <Copy size={14} />
              </Button>
            </div>
          </Card> */}

          {/* Social Accounts */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg px-2">Social Accounts</h3>
            <div className="space-y-3">
              {/* Discord */}
              {(() => {
                const discordAccount = getSocialAccount("Discord");
                return (
                  <Card className="p-4 flex items-center justify-between group hover:border-white/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#5865F2]/10 flex items-center justify-center text-[#5865F2]">
                        <DiscordIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">Discord</div>
                        <div className="text-xs text-[#5865F2]">
                          {discordAccount?.username || discordAccount?.displayName || "Not connected"}
                        </div>
                      </div>
                    </div>
                    {discordAccount ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-success" />
                        <button
                          onClick={() => handleDisconnectSocial("Discord")}
                          className="p-1 rounded-full hover:bg-white/10 transition-colors"
                        >
                          <X size={14} className="text-muted hover:text-danger" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleConnectSocial("Discord")}
                        disabled={linkAccountMutation.isPending || unlinkAccountMutation.isPending}
                      >
                        Connect
                      </Button>
                    )}
                  </Card>
                );
              })()}

              {/* X */}
              {(() => {
                const xAccount = getSocialAccount("X");
                return (
                  <Card className="p-4 flex items-center justify-between group hover:border-white/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
                        <XIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">X</div>
                        <div className="text-xs text-muted">
                          {xAccount?.username ? `@${xAccount.username}` : xAccount?.displayName || "Not connected"}
                        </div>
                      </div>
                    </div>
                    {xAccount ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-success" />
                        <button
                          onClick={() => handleDisconnectSocial("X")}
                          className="p-1 rounded-full hover:bg-white/10 transition-colors"
                        >
                          <X size={14} className="text-muted hover:text-danger" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleConnectSocial("X")}
                        disabled={linkAccountMutation.isPending || unlinkAccountMutation.isPending}
                      >
                        Connect
                      </Button>
                    )}
                  </Card>
                );
              })()}

              {/* Telegram */}
              {(() => {
                const telegramAccount = getSocialAccount("Telegram");
                return (
                  <Card className="p-4 flex items-center justify-between group hover:border-white/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#24A1DE]/10 flex items-center justify-center text-[#24A1DE]">
                        <TelegramIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">Telegram</div>
                        <div className="text-xs text-[#24A1DE]">
                          {telegramAccount?.username ? `@${telegramAccount.username}` : telegramAccount?.displayName || "Not connected"}
                        </div>
                      </div>
                    </div>
                    {telegramAccount ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-success" />
                        <button
                          onClick={() => handleDisconnectSocial("Telegram")}
                          className="p-1 rounded-full hover:bg-white/10 transition-colors"
                        >
                          <X size={14} className="text-muted hover:text-danger" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <TelegramButton
                          size="small"
                          variant="outline"
                          onSuccess={(accountData) => {
                            if (accountData) {
                              linkAccountMutation.mutate({
                                platform: "Telegram",
                                data: accountData,
                              } as any, {
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
                              });
                            }
                          }}
                          disabled={linkAccountMutation.isPending || unlinkAccountMutation.isPending}
                        />
                      </div>
                    )}
                  </Card>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right Content - Stats & Quests (Approx 70%) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Stats Grid */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg px-2">Your Stats</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Enhanced Progress Card (Full Width) */}
              <div className="col-span-2 sm:col-span-4 bg-[#151617] border border-border rounded-xl p-6 relative overflow-hidden group shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-mid/5 to-transparent opacity-50"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                  {/* Current Rank */}
                  <div className="flex flex-col items-center gap-2 min-w-[100px]">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-white/10 flex items-center justify-center shadow-lg">
                      <Shield size={32} className="text-gray-300" />
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted font-bold uppercase tracking-wider">
                        Current
                      </div>
                      <div className="font-bold text-white">
                        {user?.tier || "Bronze"}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar Area */}
                  <div className="flex-1 w-full space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-medium text-brand-mid">
                        Level Progress
                      </span>
                      <span className="text-sm font-bold text-white">
                        {userPoints.toLocaleString()} /{" "}
                        {NEXT_RANK_POINTS.toLocaleString()} PTS
                      </span>
                    </div>
                    <div className="h-4 bg-black/40 rounded-full border border-white/5 overflow-hidden relative">
                      <div
                        className="h-full bg-brand-gradient rounded-full shadow-[0_0_15px_rgba(54,177,255,0.5)] transition-all duration-1000 ease-out relative overflow-hidden"
                        style={{ width: `${progressPercent}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                    <div className="text-xs text-muted text-center">
                      <span className="text-brand-mid font-bold">
                        {(NEXT_RANK_POINTS - userPoints).toLocaleString()} PTS
                      </span>{" "}
                      needed to reach next rank
                    </div>
                  </div>

                  {/* Next Rank */}
                  <div className="flex flex-col items-center gap-2 min-w-[100px] opacity-60">
                    <div className="w-16 h-16 rounded-full bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center">
                      <Crown size={32} className="text-yellow-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted font-bold uppercase tracking-wider">
                        Next Rank
                      </div>
                      <div className="font-bold text-yellow-500">Silver</div>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="p-4 space-y-1 hover:border-white/20 transition-colors">
                <div className="text-muted text-xs font-medium uppercase tracking-wide">
                  Points
                </div>
                <div className="text-2xl font-bold text-[#C7FF2C] flex items-center gap-2">
                  {userPoints.toLocaleString()}
                </div>
              </Card>
              <Card className="p-4 space-y-1 hover:border-white/20 transition-colors">
                <div className="text-muted text-xs font-medium uppercase tracking-wide">
                  Streak
                </div>
                <div className="text-2xl font-bold text-[#FF9F1C] flex items-center gap-2">
                  <Zap size={20} className="fill-current" />{" "}
                  {user?.loginStreak || 0}
                </div>
              </Card>
              <Card className="p-4 space-y-1 hover:border-white/20 transition-colors">
                <div className="text-muted text-xs font-medium uppercase tracking-wide">
                  Tier
                </div>
                <div className="text-2xl font-bold text-white flex items-center gap-2">
                  {user?.tier || "Bronze"}
                </div>
              </Card>
              <Card className="p-4 space-y-1 hover:border-white/20 transition-colors">
                <div className="text-muted text-xs font-medium uppercase tracking-wide">
                  Role
                </div>
                <div className="text-2xl font-bold text-white flex items-center gap-2 capitalize">
                  {user?.role || "User"}
                </div>
              </Card>
            </div>
          </div>

          {/* Quests Tabs */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg px-2">My Quests</h3>
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as "pending" | "claimable" | "claimed")}
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
                const campaigns = getCampaignsForTab(status as "pending" | "claimable" | "claimed");
                const { isLoading } = status === activeTab ? getCurrentTabData() : { isLoading: false };
                const isCurrentTab = activeTab === status;

                return (
                  <TabsContent key={status} value={status} className="pt-2">
                    {isLoading && isCurrentTab ? (
                      <div className="col-span-2 text-center py-12">
                        <Loader2 className="animate-spin mx-auto mb-4" size={32} />
                        <p className="text-muted">Loading campaigns...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {campaigns.map((campaign: any) => {
                          const mappedCampaign = mapApiCampaignToCampaign(campaign);
                          const totalPoints = campaign.rewardPoints || (campaign.metadata as any)?.rewardPoints || 0;
                          const coverImage = campaign.logoUrl || campaign.coverUrl || mappedCampaign.banner;

                          return (
                            <Card
                              key={campaign.id}
                              hoverEffect
                              onClick={() =>
                                router.push(`/quest/campaign/${campaign.id}`)
                              }
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
                                  {campaign.description || ""}
                                </CardDescription>
                              </CardHeader>

                              <div className="px-6">
                                <Separator />
                              </div>

                              <CardFooter className="pt-4 justify-between text-sm">
                                <div className="flex items-center gap-4">
                                  <div className="flex -space-x-2 items-center">
                                    {campaign.avatars && campaign.avatars.length > 0 ? (
                                      campaign.avatars.slice(0, 3).map((avatar: string, i: number) => (
                                        <Avatar
                                          key={i}
                                          className="w-6 h-6 border-2 border-card"
                                        >
                                          <AvatarImage src={avatar} />
                                          <AvatarFallback>U</AvatarFallback>
                                        </Avatar>
                                      ))
                                    ) : null}
                                    {(() => {
                                      const shown = campaign.avatars?.length > 0 ? Math.min(campaign.avatars.length, 3) : 0;
                                      const remaining = (campaign.questersCount || 0) - shown;
                                      return remaining > 0 ? (
                                        <div className="w-6 h-6 rounded-full border-2 border-card bg-muted/10 flex items-center justify-center text-[8px] font-bold text-muted">
                                          +{remaining > 999 ? `${Math.floor(remaining / 1000)}k` : remaining}
                                        </div>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 text-success font-medium">
                                  <Trophy size={14} />
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
          </div>
        </div>
      </div>

      {/* Avatar Modal Dialog */}
      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] !flex !flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Change Avatar</DialogTitle>
          </DialogHeader>

          <Tabs
            defaultValue="style"
            className="flex-1 flex flex-col min-h-0 mt-4 overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2 bg-muted/20 p-1 mb-6 rounded-lg shrink-0">
              <TabsTrigger value="style">Pick your style</TabsTrigger>
              <TabsTrigger value="upload">Upload image</TabsTrigger>
            </TabsList>

            {/* Style Tab */}
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
                      className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${isSelected ? "border-brand-mid ring-4 ring-brand-mid/20" : "border-transparent hover:border-white/20"}`}
                    >
                      <img
                        src={avatarUrl}
                        alt={seed}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <CheckCircle2
                            size={24}
                            className="text-white drop-shadow-md"
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            {/* Upload Tab */}
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
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload
                        size={24}
                        className="text-muted group-hover:text-white"
                      />
                    </div>
                    <p className="font-medium text-lg">Click to upload</p>
                    <p className="text-sm text-muted mt-2">
                      SVG, PNG, JPG or GIF (max. 2MB)
                    </p>
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
            <Button
              onClick={handleConfirmAvatar}
              variant="gradient"
              size="lg"
              disabled={isUpdatingAvatar || updateProfileMutation.isPending || (!selectedAvatar && !previewImage)}
            >
              {isUpdatingAvatar ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Username Modal Dialog */}
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
              <p className="text-xs text-muted">
                Username must be unique and max 50 characters.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsUsernameModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                onClick={handleUpdateUsername}
                disabled={isUpdatingUsername || updateProfileMutation.isPending || !newUsername.trim()}
              >
                {isUpdatingUsername ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
