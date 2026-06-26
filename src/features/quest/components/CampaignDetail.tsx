"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Gift,
  Loader2,
  MessageSquare,
  Share2,
  ShieldCheck,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { AvatarStack } from "@/features/quest/components/AvatarStack";
import { Badge } from "@/features/quest/components/ui/badge";
import { Button } from "@/features/quest/components/ui/button";

import { useWallet } from "@/features/quest/context/wallet-context";
import {
  mapApiCampaignsResponse,
  mapApiCampaignToCampaign,
} from "@/features/quest/lib/campaign-mapper";
import { $, withAuth } from "@/features/quest/lib/kubb-config";
import type { CampaignStep } from "@/features/quest/types";
import {
  useCampaignsControllerClaimCampaign,
  useCampaignsControllerFindOne,
  useCampaignsControllerGetNotJoinedCampaigns,
  useCampaignsControllerJoinCampaign,
  usersControllerGetMeQueryKey,
  useSocialAccountsControllerFindAll,
  useSocialAccountsControllerLinkAccount,
  useTasksControllerClaimTask,
  useTasksControllerGetClaimStatus,
  useTasksControllerGetStatus,
  useTasksControllerVerifyTask,
  useUsersControllerGetMe,
} from "@/gen-quest/hooks";
import type { LinkSocialAccountDto } from "@/gen-quest/types/link-social-account-dto";
import { cn } from "@/lib/utils";
import type { CampaignCardData } from "./CampaignCard";
import { Rise } from "./Rise";
import { TelegramButton } from "./TelegramButton";

// ---------------------------------------------------------------------------
// Narrow response-shape interfaces for the loosely-typed gen-quest hooks.
// These describe only the fields actually read off each response.
// ---------------------------------------------------------------------------

/** Per-task status response read off useTasksControllerGetStatus. */
interface TaskStatusData {
  status?: string;
  pointsEarned?: number;
}

/** Per-task claim response read off useTasksControllerGetClaimStatus. */
interface TaskClaimData {
  claimed?: boolean;
  claim?: { pointsEarned?: number };
}

/** Verify-task mutation response (wrapped: { data: { success, message } }). */
interface VerifyTaskResponse {
  data?: { success?: boolean; message?: string };
}

/** Axios-style error envelope returned by the backend on failure. */
interface ApiErrorEnvelope {
  response?: {
    status?: number;
    data?: { error?: { message?: string }; message?: string };
  };
}

/** A single social account linked to the current user. */
interface SocialAccount {
  id: string;
  platform: string;
  platformUserId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  connectedAt: string;
}

/** Account payload returned from an OAuth / Telegram link flow. */
interface LinkAccountData {
  id: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  [key: string]: unknown;
}

/** Raw task object from the campaign findOne response. */
interface ApiTask {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  type?: string;
  taskType?: string;
  urlAction?: string;
  actionUrl?: string;
  actionLabel?: string;
  pointReward?: number;
  metadata?: { urlAction?: string; checkId?: string };
}

/** Wrapped / flat campaign findOne response shape. */
interface CampaignDetailResponse {
  data?: CampaignDetailPayload;
  campaign?: unknown;
  participation?: unknown;
  meta?: { avatars?: string[] };
  id?: string;
  tasks?: ApiTask[];
}

interface CampaignDetailPayload {
  campaign?: unknown;
  participation?: unknown;
  meta?: { avatars?: string[] };
  id?: string;
  tasks?: ApiTask[];
}

/** Mutation variables for linking a social account. */
type LinkAccountVariables = { platform: string; data: LinkSocialAccountDto };

const toLinkDto = (accountData: LinkAccountData | LinkSocialAccountDto): LinkSocialAccountDto =>
  accountData as unknown as LinkSocialAccountDto;

const extractApiErrorMessage = (error: unknown, fallback: string): string => {
  const envelope = error as ApiErrorEnvelope;
  return envelope.response?.data?.error?.message ?? envelope.response?.data?.message ?? fallback;
};

// Social SVGs (Keeping inline for specific colors)
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 127.14 96.36" className={className} fill="currentColor" aria-hidden="true">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c2.36-24.44-5.42-48.18-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

interface QuestItemProps {
  step: CampaignStep;
  taskId?: string;
  isAuthenticated?: boolean;
  onVerified?: () => void;
  onProfileUpdate?: () => void;
  socialAccounts?: SocialAccount[];
  onConnectSocial?: (provider: "X" | "Discord" | "Telegram") => void;
  onLinkTelegramAccount?: (accountData: LinkAccountData) => void;
}

const QuestItem: React.FC<QuestItemProps> = ({
  step,
  taskId,
  isAuthenticated,
  onVerified,
  onProfileUpdate,
  socialAccounts = [],
  onConnectSocial,
  onLinkTelegramAccount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<"idle" | "verifying" | "completed" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch task status to check if verified
  const { data: taskStatusRaw, refetch: refetchTaskStatus } = useTasksControllerGetStatus(
    taskId || "",
    {
      ...withAuth,
      query: {
        enabled: !!taskId && isAuthenticated,
        staleTime: 30 * 1000,
      },
    }
  );

  // Fetch claim status
  const { data: claimStatusRaw, refetch: refetchClaimStatus } = useTasksControllerGetClaimStatus(
    taskId || "",
    {
      ...withAuth,
      query: {
        enabled: !!taskId && isAuthenticated,
        staleTime: 30 * 1000,
      },
    }
  );

  const taskStatus = (taskStatusRaw as { data?: TaskStatusData } | undefined)?.data;
  const claimStatus = (claimStatusRaw as { data?: TaskClaimData } | undefined)?.data;

  // Claim task mutation
  const claimTaskMutation = useTasksControllerClaimTask({
    ...withAuth,
    mutation: {
      onSuccess: async () => {
        toast.success("Task reward claimed successfully!");
        refetchClaimStatus();
        refetchTaskStatus();
        await queryClient.invalidateQueries({
          queryKey: usersControllerGetMeQueryKey(),
          refetchType: "active",
        });
        await queryClient.refetchQueries({
          queryKey: usersControllerGetMeQueryKey(),
        });
        onProfileUpdate?.();
      },
      onError: (error: unknown) => {
        console.error("Claim task error:", error);
        toast.error(
          extractApiErrorMessage(error, "Failed to claim task reward. Please try again.")
        );
      },
    },
  });

  const handleClaimTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!taskId) {
      toast.error("Task ID is missing");
      return;
    }
    claimTaskMutation.mutate({ id: taskId });
  };

  // Update status based on task status from API
  useEffect(() => {
    const s = taskStatus?.status?.toUpperCase();
    if (s === "COMPLETED" || s === "APPROVED") {
      setStatus("completed");
    } else if (s === "PENDING" || s === "IN_PROGRESS") {
      setStatus("idle");
    }
  }, [taskStatus]);

  // Real API verification using generated hook
  const verifyTaskMutation = useTasksControllerVerifyTask({
    ...withAuth,
    mutation: {
      onSuccess: (data: unknown) => {
        const innerData = (data as VerifyTaskResponse)?.data;
        if (innerData?.success) {
          setStatus("completed");
          toast.success(innerData.message || "Task verified successfully!");
          onVerified?.();
          refetchTaskStatus();
        } else {
          setStatus("error");
          const message = innerData?.message || "Verification failed";
          setErrorMessage(message);
          toast.error(message);
          setTimeout(() => setStatus("idle"), 2000);
        }
      },
      onError: (error: unknown) => {
        console.error("Verify task error:", error);
        setStatus("error");
        const message = extractApiErrorMessage(error, "Failed to verify task. Please try again.");
        setErrorMessage(message);
        toast.error(message);
        setTimeout(() => setStatus("idle"), 2000);
      },
    },
  });

  const handleVerify = () => {
    if (!taskId) {
      toast.error("Task ID is missing");
      return;
    }
    if (!isAuthenticated) {
      toast.error("Please connect your wallet first");
      return;
    }
    setStatus("verifying");
    setErrorMessage(null);
    verifyTaskMutation.mutate({ id: taskId });
  };

  useEffect(() => {
    if (verifyTaskMutation.isPending) {
      setStatus("verifying");
    }
  }, [verifyTaskMutation.isPending]);

  const getStepIcon = (type: string, checkId?: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType === "visit" && checkId) {
      if (checkId === "wallet_connect") return <Wallet size={20} className="text-brand-mid" />;
      if (checkId === "sign_message") return <ShieldCheck size={20} className="text-brand-mid" />;
      if (checkId === "first_chat") return <MessageSquare size={20} className="text-brand-mid" />;
      if (checkId === "vault_preview") return <BarChart2 size={20} className="text-brand-mid" />;
    }
    switch (lowerType) {
      case "twitter":
      case "x":
      case "x_follow":
      case "x_retweet":
      case "x_comment":
      case "x_like":
        return <XIcon className="w-4 h-4 text-white" />;
      case "discord":
        return <DiscordIcon className="w-5 h-5 text-[#5865F2]" />;
      case "telegram":
        return <TelegramIcon className="w-5 h-5 text-[#24A1DE]" />;
      case "verify":
        return <ShieldCheck size={20} className="text-success" />;
      case "onchain":
        return <Gift size={20} className="text-brand-mid" />;
      case "visit":
        return <ExternalLink size={20} className="text-brand-mid" />;
      default:
        return <ExternalLink size={20} className="text-muted" />;
    }
  };

  const getRequiredPlatform = (type: string): "X" | "Discord" | "Telegram" | null => {
    const lowerType = type.toLowerCase();
    if (
      lowerType === "x_follow" ||
      lowerType === "x_retweet" ||
      lowerType === "x_comment" ||
      lowerType === "x_like" ||
      lowerType === "twitter" ||
      lowerType === "x"
    ) {
      return "X";
    }
    if (lowerType === "discord") return "Discord";
    if (lowerType === "telegram") return "Telegram";
    return null;
  };

  const hasRequiredSocialAccount = (type: string): boolean => {
    const requiredPlatform = getRequiredPlatform(type);
    if (!requiredPlatform) return true;
    return socialAccounts.some((acc) => acc.platform === requiredPlatform);
  };

  const getActionLabel = (type: string) => {
    if (step.actionLabel) return step.actionLabel;
    const lowerType = type.toLowerCase();
    if (lowerType === "visit" && step.checkId) {
      if (step.checkId === "wallet_connect") return "Connect Wallet";
      if (step.checkId === "sign_message") return "Sign and Verify";
      if (step.checkId === "first_chat") return "Chat with Agent";
      if (step.checkId === "vault_preview") return "Explore Vault";
    }
    switch (lowerType) {
      case "twitter":
      case "x":
      case "x_follow":
        return "Follow on X";
      case "x_retweet":
        return "Retweet on X";
      case "x_comment":
        return "Comment on X";
      case "x_like":
        return "Like on X";
      case "discord":
        return "Join Discord";
      case "telegram":
        return "Join Telegram";
      case "onchain":
        return "Interact with Contract";
      case "visit":
        return "Visit Link";
      default:
        return "Open Link";
    }
  };

  const handleVerifyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleVerify();
  };

  const handleConnectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const requiredPlatform = getRequiredPlatform(step.type);
    if (requiredPlatform && onConnectSocial) {
      onConnectSocial(requiredPlatform);
    }
  };

  const isClaimed = claimStatus?.claimed || false;

  return (
    <div
      className={cn(
        "border border-quest-line [border-left-width:2px] [border-left-color:var(--color-quest-line)] rounded-quest-sm bg-quest-surface-2 overflow-hidden transition-[border-color,background] duration-300",
        isExpanded && "[border-left-color:var(--color-quest-accent)] [background:rgba(20,20,22,0.75)]",
        (isClaimed || status === "completed") && "[border-color:var(--color-quest-green-line)] [border-left-color:var(--color-quest-green)]"
      )}
    >
      <button
        type="button"
        className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-[14px] px-[18px] py-4 cursor-pointer w-full text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-[10px] grid place-items-center bg-quest-surface border border-quest-line-2 text-quest-text flex-none",
            (isClaimed || status === "completed") && "bg-quest-green-soft border-quest-green-line text-quest-green"
          )}
        >
          {isClaimed || status === "completed" ? (
            <CheckCircle2 size={18} />
          ) : (
            getStepIcon(step.type, step.checkId)
          )}
        </div>
        <span className="text-[15px] font-semibold tracking-[-0.01em]">
          {step.label}
        </span>

        {step.points ? (
          <span
            className={cn(
              "text-[13px] font-bold font-mono text-quest-accent inline-flex items-center gap-[3px] whitespace-nowrap",
              (isClaimed || status === "completed") && "text-quest-green"
            )}
          >
            +{step.points}
          </span>
        ) : <span />}
        <div
          className={cn(
            "w-2 h-2 border-r-2 border-b-2 border-quest-muted [transform:rotate(45deg)] transition-transform duration-300 ease-quest mr-1",
            isExpanded && "[transform:rotate(-135deg)]"
          )}
        />
      </button>

      {isExpanded && (
        <div className="overflow-hidden">
          <div className="pt-0 pr-[18px] pb-[18px] pl-[68px]">
            {step.description && (
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="text-[13.5px] text-quest-muted leading-[1.55] mb-[14px]">
                      {children}
                    </p>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {step.description}
              </ReactMarkdown>
            )}

            <div className="flex gap-[10px] flex-wrap">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const skipTracking =
                    step.checkId === "wallet_connect" || step.checkId === "sign_message";
                  if (step.type === "visit" && taskId && !skipTracking) {
                    const trackingUrl = `/quest/visit/${taskId}?url=${encodeURIComponent(step.actionUrl)}`;
                    window.open(trackingUrl, "_blank");
                  } else {
                    window.open(step.actionUrl, "_blank");
                  }
                }}
              >
                {getActionLabel(step.type)}
                <ExternalLink size={12} />
              </Button>

              {(() => {
                const requiredPlatform = getRequiredPlatform(step.type);
                const needsSocialAccount = requiredPlatform && !hasRequiredSocialAccount(step.type);
                const rawStatus = taskStatus?.status?.toUpperCase();
                const isVerified =
                  status === "completed" || rawStatus === "COMPLETED" || rawStatus === "APPROVED";

                if (needsSocialAccount) {
                  if (requiredPlatform === "Telegram") {
                    return (
                      <TelegramButton
                        size="small"
                        variant="default"
                        onSuccess={(accountData) => {
                          if (accountData && onLinkTelegramAccount) {
                            onLinkTelegramAccount(accountData as LinkAccountData);
                          }
                        }}
                      />
                    );
                  }
                  return (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleConnectClick}
                    >
                      Connect {requiredPlatform}
                    </Button>
                  );
                }

                if (isVerified && !isClaimed) {
                  const pointsEarned = taskStatus?.pointsEarned || 0;
                  return (
                    <Button
                      type="button"
                      variant="green"
                      size="sm"
                      disabled={claimTaskMutation.isPending}
                      onClick={handleClaimTask}
                    >
                      {claimTaskMutation.isPending ? (
                        <>
                          <span className="w-[13px] h-[13px] border-2 border-current border-t-transparent rounded-full inline-block animate-[quest-spin_0.7s_linear_infinite]" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <Gift size={14} />
                          Claim {pointsEarned} PTS
                        </>
                      )}
                    </Button>
                  );
                }

                if (isClaimed) {
                  const pointsEarned =
                    taskStatus?.pointsEarned || claimStatus?.claim?.pointsEarned || 0;
                  return (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled
                      style={{ opacity: 0.55 }}
                    >
                      <CheckCircle2 size={14} />
                      Claimed {pointsEarned} PTS
                    </Button>
                  );
                }

                return (
                  <Button
                    type="button"
                    variant={status === "error" ? "accent" : "primary"}
                    size="sm"
                    disabled={
                      status === "verifying" || status === "completed" || verifyTaskMutation.isPending
                    }
                    onClick={handleVerifyClick}
                  >
                    {status === "verifying" ? (
                      <>
                        <span className="w-[13px] h-[13px] border-2 border-current border-t-transparent rounded-full inline-block animate-[quest-spin_0.7s_linear_infinite]" />
                        Verifying...
                      </>
                    ) : status === "completed" ? (
                      <>
                        <CheckCircle2 size={14} />
                        Verified
                      </>
                    ) : status === "error" ? (
                      <>Retry Verify</>
                    ) : (
                      <>Verify Task</>
                    )}
                  </Button>
                );
              })()}
            </div>

            {errorMessage && status === "error" && (
              <p style={{ color: "var(--amber)", fontSize: 12, marginTop: 8 }}>{errorMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Related campaigns strip (sidebar)
const RelatedCampaigns: React.FC<{ currentCampaignId: string }> = ({ currentCampaignId }) => {
  const { isAuthenticated } = useWallet();

  const { data: notJoinedData, isLoading } = useCampaignsControllerGetNotJoinedCampaigns(
    {},
    {
      ...withAuth,
      query: {
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    }
  );

  const relatedCampaigns = useMemo<CampaignCardData[]>(() => {
    if (!notJoinedData) return [];
    const campaigns = mapApiCampaignsResponse(notJoinedData);
    return campaigns
      .filter((c) => c.id !== currentCampaignId)
      .slice(0, 3)
      .map((c) => ({
        id: c.id,
        title: c.title,
        sponsor: c.title.split(" ").pop() || "Tasmil",
        pointsReward: c.points,
        status: c.status === "closed" ? ("closed" as const) : ("ongoing" as const),
        endsAt: c.endDate || "",
        coverUrl: c.coverUrl || null,
        description: c.description,
        participants: c.participants,
        participantAvatars: c.avatars,
      }));
  }, [notJoinedData, currentCampaignId]);

  if (isLoading) {
    return (
      <div className="mt-6">
        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-quest-dim" style={{ marginBottom: 13 }}>
          More for you
        </div>
        <div className="flex flex-col gap-[10px]">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-[14px] p-3 border border-quest-line rounded-quest-sm bg-quest-surface-2 transition-[border-color,transform] duration-300 hover:border-quest-accent-line hover:-translate-y-0.5" style={{ opacity: 0.5 }}>
              <div className="w-[54px] h-[54px] rounded-[11px] flex-none grid place-items-center [background:repeating-linear-gradient(135deg,rgba(255,255,255,0.04)_0_8px,transparent_8px_16px),linear-gradient(160deg,rgba(103,232,249,0.14),rgba(14,165,233,0.05))] border border-quest-line overflow-hidden" />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: 14,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 6,
                    marginBottom: 6,
                  }}
                />
                <div
                  style={{
                    height: 12,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 6,
                    width: "60%",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!relatedCampaigns.length) return null;

  return (
    <div className="mt-6">
      <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-quest-dim" style={{ marginBottom: 13 }}>
        More for you
      </div>
      <div className="flex flex-col gap-[10px]">
        {relatedCampaigns.map((c) => (
          <Link
            key={c.id}
            href={`/quest/campaign/${c.id}`}
            className="group flex items-center gap-[14px] p-3 border border-quest-line rounded-quest-sm bg-quest-surface-2 transition-[border-color,transform] duration-300 hover:border-quest-accent-line hover:-translate-y-0.5"
          >
            <div className="w-[54px] h-[54px] rounded-[11px] flex-none grid place-items-center [background:repeating-linear-gradient(135deg,rgba(255,255,255,0.04)_0_8px,transparent_8px_16px),linear-gradient(160deg,rgba(103,232,249,0.14),rgba(14,165,233,0.05))] border border-quest-line overflow-hidden">
              {c.coverUrl ? <img src={c.coverUrl} alt="" className="w-full h-full object-cover" /> : null}
            </div>
            <div>
              <div className="text-[14px] font-bold tracking-[-0.01em] transition-colors duration-[250ms] group-hover:text-quest-accent">{c.title}</div>
              <div className="text-[12px] font-mono text-quest-accent mt-[3px] inline-flex items-center gap-[3px]">
                +{c.pointsReward.toLocaleString("en-US")}
                <svg
                  className="inline-block flex-none"
                  style={{ verticalAlign: -3, marginLeft: 4 }}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="ptsCoinMfy" x1="0.15" y1="0.1" x2="0.85" y2="0.9">
                      <stop stopColor="#A5F3FC" />
                      <stop offset="1" stopColor="#0EA5E9" />
                    </linearGradient>
                  </defs>
                  <circle cx="12" cy="12" r="9" fill="url(#ptsCoinMfy)" />
                  <path d="M12.7 6.4l-4.3 6.05h2.9l-.9 4.45 4.4-6.2h-3z" fill="#04141A" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

// Points coin inline SVG
function PtsCoin({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="ptsCoinDetail" x1="0.15" y1="0.1" x2="0.85" y2="0.9">
          <stop stopColor="#A5F3FC" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" fill="url(#ptsCoinDetail)" />
      <path d="M12.7 6.4l-4.3 6.05h2.9l-.9 4.45 4.4-6.2h-3z" fill="#04141A" />
    </svg>
  );
}

const mapTaskType = (taskType?: string): CampaignStep["type"] => {
  if (!taskType) return "verify";
  const lowerType = taskType.toLowerCase();
  if (lowerType === "x_follow") return "x_follow";
  if (lowerType === "x_retweet") return "x_retweet";
  if (lowerType === "x_comment") return "x_comment";
  if (lowerType === "x_like") return "x_like";
  if (lowerType === "twitter" || lowerType === "x") return "twitter";
  if (lowerType === "discord" || lowerType === "discord_join") return "discord";
  if (lowerType === "telegram" || lowerType === "telegram_join") return "telegram";
  if (lowerType === "onchain" || lowerType === "volume_swap") return "onchain";
  if (lowerType === "agent_chat" || lowerType === "browse") return "visit";
  if (lowerType === "verify" || lowerType === "verification") return "verify";
  return "visit";
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "TBD";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const CampaignDetail: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [sharedCopied, setSharedCopied] = useState(false);
  const { isConnected, isAuthenticated, connect } = useWallet();
  const queryClient = useQueryClient();

  const { refetch: refetchUserProfile } = useUsersControllerGetMe({
    ...withAuth,
    query: {
      enabled: isAuthenticated,
      staleTime: 0,
    },
  });

  const { data: socialAccountsData, refetch: refetchSocialAccounts } =
    useSocialAccountsControllerFindAll({
      ...withAuth,
      query: {
        enabled: isAuthenticated,
      },
    });

  const socialAccounts = useMemo<SocialAccount[]>(() => {
    const wrapped = socialAccountsData as { data?: SocialAccount[] } | SocialAccount[] | undefined;
    if (Array.isArray(wrapped)) return wrapped;
    return wrapped?.data ?? [];
  }, [socialAccountsData]);

  const linkAccountMutation = useSocialAccountsControllerLinkAccount({
    ...withAuth,
    mutation: {
      onSuccess: () => {
        refetchSocialAccounts();
      },
    },
  });

  const handleConnectSocial = (provider: "X" | "Discord" | "Telegram") => {
    if (provider === "Telegram") return;
    const width = 500;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
      `/api/auth/${provider.toLowerCase()}`,
      `${provider} Login`,
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === "X_AUTH_SUCCESS" || event.data?.type === "DISCORD_AUTH_SUCCESS") {
        if (event.data?.status === "success" && event.data?.accountData) {
          try {
            const platform = (event.data.platform ||
              event.data.type.replace("_AUTH_SUCCESS", "")) as "X" | "Discord";
            const variables: LinkAccountVariables = {
              platform,
              data: toLinkDto(event.data.accountData as LinkAccountData),
            };
            linkAccountMutation.mutate(variables, {
              onSuccess: () => {
                toast.success(`${platform} account linked successfully!`);
                refetchSocialAccounts();
              },
              onError: (error: unknown) => {
                const envelope = error as ApiErrorEnvelope;
                if (envelope.response?.status === 409) {
                  toast.info(extractApiErrorMessage(error, "Account is already linked"));
                } else {
                  toast.error(extractApiErrorMessage(error, "Failed to link account"));
                  console.error("Link account error:", error);
                }
                refetchSocialAccounts();
              },
            });
          } catch (error: unknown) {
            console.error("Link account error:", error);
            refetchSocialAccounts();
          }
        } else {
          refetchSocialAccounts();
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [linkAccountMutation, refetchSocialAccounts]);

  const {
    data: campaignData,
    isLoading: isLoadingCampaign,
    error: campaignError,
    refetch: refetchCampaign,
  } = useCampaignsControllerFindOne(id, {
    ...$,
    query: {
      enabled: !!id,
    },
  });

  // Normalize the wrapped/flat findOne payload once.
  const payload = useMemo<CampaignDetailPayload | null>(() => {
    if (!campaignData) return null;
    const response = campaignData as CampaignDetailResponse;
    return response.data ?? response;
  }, [campaignData]);

  const campaign = useMemo(() => {
    if (!payload) return null;
    // Nested: { campaign: {...} }
    if (payload.campaign) {
      return mapApiCampaignToCampaign(payload.campaign);
    }
    // Flat: payload itself is the campaign object.
    if (payload.id) {
      return mapApiCampaignToCampaign(payload);
    }
    return null;
  }, [payload]);

  const participation = useMemo(() => payload?.participation ?? null, [payload]);

  const avatarsFromMeta = useMemo<string[]>(() => payload?.meta?.avatars ?? [], [payload]);

  const tasks = useMemo<ApiTask[]>(() => {
    if (!payload) return [];
    const nestedTasks = (payload.campaign as { tasks?: ApiTask[] } | undefined)?.tasks;
    return nestedTasks ?? payload.tasks ?? [];
  }, [payload]);

  const hasJoined = !!participation;

  const claimCampaignMutation = useCampaignsControllerClaimCampaign({
    ...withAuth,
    mutation: {
      onSuccess: async () => {
        toast.success("Campaign reward claimed successfully!");
        refetchCampaign();
        await queryClient.invalidateQueries({
          queryKey: usersControllerGetMeQueryKey(),
          refetchType: "active",
        });
        await queryClient.refetchQueries({
          queryKey: usersControllerGetMeQueryKey(),
        });
        refetchUserProfile();
      },
      onError: (error: unknown) => {
        console.error("Claim campaign error:", error);
        toast.error(
          extractApiErrorMessage(error, "Failed to claim campaign reward. Please try again.")
        );
      },
    },
  });

  const joinCampaignMutation = useCampaignsControllerJoinCampaign({
    ...withAuth,
    mutation: {
      onSuccess: () => {
        toast.success("Successfully joined the campaign!");
        refetchCampaign();
      },
      onError: (error: unknown) => {
        console.error("Join campaign error:", error);
        const envelope = error as ApiErrorEnvelope;
        if (envelope.response?.status === 409) {
          toast.info(extractApiErrorMessage(error, "You have already joined this campaign"));
        } else if (envelope.response?.status === 401) {
          toast.error("Please connect your wallet first");
        } else {
          toast.error(extractApiErrorMessage(error, "Failed to join campaign. Please try again."));
        }
      },
    },
  });

  const handleJoinCampaign = () => {
    if (!isAuthenticated) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!id) {
      toast.error("Campaign ID is missing");
      return;
    }
    joinCampaignMutation.mutate({ id });
  };

  // Compute time remaining from endDate client-side.
  const timeRemainingLabel = useMemo(() => {
    if (!campaign?.endDate) return null;
    const end = new Date(campaign.endDate);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return null;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `${diffDays}d left`;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 0) return `${diffHours}h left`;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins}m left`;
  }, [campaign?.endDate]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = campaign ? `Join me on this quest: ${campaign.title} on Tasmil Finance!` : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setSharedCopied(true);
    setTimeout(() => setSharedCopied(false), 1300);
  };

  const handleClaimReward = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!id) {
      toast.error("Campaign ID is missing");
      return;
    }
    claimCampaignMutation.mutate({ id });
  };

  const openSocialShare = (platform: "twitter" | "telegram" | "facebook" | "linkedin") => {
    let url = "";
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }
    window.open(url, "_blank");
  };

  const handleLinkTelegramAccount = (accountData: LinkAccountData) => {
    const variables: LinkAccountVariables = {
      platform: "Telegram",
      data: toLinkDto(accountData),
    };
    linkAccountMutation.mutate(variables, {
      onSuccess: () => {
        toast.success("Telegram account linked successfully!");
        refetchSocialAccounts();
      },
      onError: (error: unknown) => {
        const envelope = error as ApiErrorEnvelope;
        if (envelope.response?.status === 409) {
          toast.info("Telegram account is already linked");
        } else {
          toast.error("Failed to link Telegram account");
          console.error("Link account error:", error);
        }
        refetchSocialAccounts();
      },
    });
  };

  const handleProfileUpdate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["users", "me"] });
    refetchUserProfile();
  };

  // Loading state
  if (isLoadingCampaign) {
    return (
      <div>
        <div className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-quest-muted mb-6 transition-colors duration-200 hover:text-quest-accent" style={{ opacity: 0.5 }}>
          <ArrowLeft size={16} />
          Back to Explore
        </div>
        <div className="grid grid-cols-[8fr_4fr] max-[920px]:grid-cols-1 gap-[30px] items-start">
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                height: 56,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 12,
                animation: "pulse 1.4s ease infinite",
              }}
            />
            <div
              style={{
                height: 24,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 8,
                width: "70%",
                animation: "pulse 1.4s ease infinite",
              }}
            />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 70,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 14,
                  animation: "pulse 1.4s ease infinite",
                }}
              />
            ))}
          </div>
          <div
            style={{
              height: 320,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 22,
              animation: "pulse 1.4s ease infinite",
            }}
          />
        </div>
      </div>
    );
  }

  // Error state
  if (campaignError || !campaign) {
    return (
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}
      >
        <div className="flex flex-col items-center text-center py-[80px] px-5 gap-[14px]">
          <Gift size={56} style={{ color: "var(--color-dim)" }} />
          <div className="text-[18px] font-bold tracking-[-0.02em] text-quest-text">Campaign not found</div>
          <div className="text-[14px] text-quest-muted">This campaign may have ended or the link is incorrect.</div>
          <Link href="/quest/explore">
            <Button type="button" variant="ghost" size="sm" style={{ marginTop: 8 }}>
              <ArrowLeft size={14} />
              Back to Explore
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Auth guard: show connect-wallet prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div>
        <Link href="/quest/explore" className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-quest-muted mb-6 transition-colors duration-200 hover:text-quest-accent">
          <ArrowLeft size={16} />
          Back to Explore
        </Link>

        <Rise>
          <div className="grid grid-cols-[8fr_4fr] max-[920px]:grid-cols-1 gap-[30px] items-start">
            <div>
              <div className="flex items-center gap-[10px] flex-wrap mb-4">
                <Badge variant={campaign.status === "ongoing" ? "ongoing" : "closed"} className="text-[14px] py-[9px] px-[22px] gap-[6px]">
                  {campaign.status === "ongoing" ? "Ongoing" : "Closed"}
                </Badge>
                {timeRemainingLabel && (
                  <Badge variant="closed" className="text-[14px] py-[9px] px-[22px] gap-[6px] [&_svg]:w-[13px] [&_svg]:h-[13px]">
                    <Clock size={13} />
                    {timeRemainingLabel}
                  </Badge>
                )}
              </div>
              <h1 className="text-[clamp(34px,5vw,52px)] font-extrabold tracking-[-0.04em] leading-[1.02]">{campaign.title}</h1>
              {campaign.description && (
                <p className="mt-[14px] text-[17px] text-quest-muted leading-[1.6] max-w-[60ch]">{campaign.description}</p>
              )}
              <div className="mt-5 flex items-center gap-3">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Users size={16} style={{ color: "var(--color-muted)" }} />
                  <span className="text-[14px] text-quest-muted">
                    <b>{campaign.participants.toLocaleString()}</b> participants
                  </span>
                </div>
                <span
                  className="text-[14px] text-quest-muted"
                  style={{
                    color: "var(--color-accent)",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {campaign.points} PTS
                </span>
              </div>
            </div>

            <div>
              <div className="border border-quest-line rounded-quest-card [background:var(--quest-card-grad)] overflow-hidden">
                <div className="relative h-[172px] border-b border-quest-line bg-[#0c0e10] overflow-hidden">
                  <div className="absolute inset-0">
                    {campaign.coverUrl && (
                      <img src={campaign.coverUrl} alt="" className="w-full h-full object-cover opacity-[0.92]" />
                    )}
                  </div>
                  <span className="absolute top-[13px] right-[13px] text-[10px] font-bold tracking-[0.14em] uppercase text-quest-text px-[11px] py-[6px] rounded-quest-pill bg-[rgba(8,10,12,0.7)] backdrop-blur-[6px] border border-quest-line-2">Points</span>
                </div>
                <div className="px-[22px] py-5">
                  <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-quest-muted">Reward points</div>
                  <div className="text-[34px] font-extrabold tracking-[-0.03em] text-quest-accent inline-flex items-center gap-[6px] mt-[5px] leading-none">
                    {campaign.points.toLocaleString("en-US")}
                    <PtsCoin />
                  </div>
                </div>
                <div className="px-[22px] py-[18px] flex flex-col gap-[10px]">
                  <Button type="button" variant="primary" block onClick={connect}>
                    <Wallet size={18} />
                    Connect Wallet to Join
                  </Button>
                  <p className="text-sm text-muted mt-3">
                    Connect your wallet to join this campaign and start earning rewards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Rise>
      </div>
    );
  }

  // Pre-join state: authenticated but not joined yet
  if (isAuthenticated && !hasJoined) {
    const campaignAvatars = avatarsFromMeta.length > 0 ? avatarsFromMeta : campaign?.avatars || [];

    return (
      <div>
        <Link href="/quest/explore" className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-quest-muted mb-6 transition-colors duration-200 hover:text-quest-accent">
          <ArrowLeft size={16} />
          Back to Explore
        </Link>

        <Rise>
          <div className="grid grid-cols-[8fr_4fr] max-[920px]:grid-cols-1 gap-[30px] items-start">
            <div>
              <div className="flex items-center gap-[10px] flex-wrap mb-4">
                <Badge variant={campaign.status === "ongoing" ? "ongoing" : "closed"} className="text-[14px] py-[9px] px-[22px] gap-[6px]">
                  {campaign.status === "ongoing" ? "Ongoing" : "Closed"}
                </Badge>
                {timeRemainingLabel && (
                  <Badge variant="closed" className="text-[14px] py-[9px] px-[22px] gap-[6px] [&_svg]:w-[13px] [&_svg]:h-[13px]">
                    <Clock size={13} />
                    {timeRemainingLabel}
                  </Badge>
                )}
              </div>
              <h1 className="text-[clamp(34px,5vw,52px)] font-extrabold tracking-[-0.04em] leading-[1.02]">{campaign.title}</h1>
              {campaign.description && (
                <p className="mt-[14px] text-[17px] text-quest-muted leading-[1.6] max-w-[60ch]">{campaign.description}</p>
              )}
              <div className="mt-5 flex items-center gap-3">
                <AvatarStack
                  seed={campaign.id}
                  avatars={campaignAvatars}
                  total={campaign.participants}
                  showCount={false}
                />
                <span className="text-[14px] text-quest-muted">
                  <b>{campaign.participants.toLocaleString()}</b> questers joined
                </span>
              </div>

              <div className="grid grid-cols-3 gap-[14px] mb-[22px]" style={{ marginTop: 28 }}>
                <div className="border border-quest-line rounded-quest-sm bg-quest-surface p-[18px] flex gap-[13px] items-center">
                  <div className="w-[42px] h-[42px] rounded-[11px] flex-none grid place-items-center bg-quest-accent-soft border border-quest-accent-line text-quest-accent">
                    <Trophy size={21} />
                  </div>
                  <div>
                    <div className="text-[22px] font-extrabold font-mono tracking-[-0.02em] leading-none">{campaign.points.toLocaleString("en-US")}</div>
                    <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-quest-dim mt-[5px]">Points</div>
                  </div>
                </div>
                <div className="border border-quest-line rounded-quest-sm bg-quest-surface p-[18px] flex gap-[13px] items-center">
                  <div className="w-[42px] h-[42px] rounded-[11px] flex-none grid place-items-center bg-quest-accent-soft border border-quest-accent-line text-quest-accent">
                    <Users size={21} />
                  </div>
                  <div>
                    <div className="text-[22px] font-extrabold font-mono tracking-[-0.02em] leading-none">{campaign.participants.toLocaleString()}</div>
                    <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-quest-dim mt-[5px]">Participants</div>
                  </div>
                </div>
                <div className="border border-quest-line rounded-quest-sm bg-quest-surface p-[18px] flex gap-[13px] items-center">
                  <div className="w-[42px] h-[42px] rounded-[11px] flex-none grid place-items-center bg-quest-accent-soft border border-quest-accent-line text-quest-accent">
                    <Gift size={21} />
                  </div>
                  <div>
                    <div className="text-[22px] font-extrabold font-mono tracking-[-0.02em] leading-none">{tasks.length || "?"}</div>
                    <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-quest-dim mt-[5px]">Tasks</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="border border-quest-line rounded-quest-card [background:var(--quest-card-grad)] overflow-hidden">
                <div className="relative h-[172px] border-b border-quest-line bg-[#0c0e10] overflow-hidden">
                  <div className="absolute inset-0">
                    {campaign.coverUrl && (
                      <img src={campaign.coverUrl} alt="" className="w-full h-full object-cover opacity-[0.92]" />
                    )}
                  </div>
                  <span className="absolute top-[13px] right-[13px] text-[10px] font-bold tracking-[0.14em] uppercase text-quest-text px-[11px] py-[6px] rounded-quest-pill bg-[rgba(8,10,12,0.7)] backdrop-blur-[6px] border border-quest-line-2">Points</span>
                </div>
                <div className="px-[22px] py-5">
                  <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-quest-muted">Reward points</div>
                  <div className="text-[34px] font-extrabold tracking-[-0.03em] text-quest-accent inline-flex items-center gap-[6px] mt-[5px] leading-none">
                    {campaign.points.toLocaleString("en-US")}
                    <PtsCoin />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-[14px] px-[22px] py-[18px] border-t border-b border-quest-line">
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-quest-dim mb-[5px]">Start date</div>
                    <div className="text-[14px] font-semibold">{formatDate(campaign.startDate)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-quest-dim mb-[5px]">End date</div>
                    <div className="text-[14px] font-semibold">{formatDate(campaign.endDate)}</div>
                  </div>
                </div>
                <div className="px-[22px] py-[18px] flex flex-col gap-[10px]">
                  <Button
                    type="button"
                    variant="primary"
                    block
                    onClick={handleJoinCampaign}
                    disabled={joinCampaignMutation.isPending}
                  >
                    {joinCampaignMutation.isPending ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Users size={18} />
                        Join Campaign
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <RelatedCampaigns currentCampaignId={campaign.id} />
            </div>
          </div>
        </Rise>
      </div>
    );
  }

  // Full campaign detail (joined, authenticated)
  const campaignAvatars = avatarsFromMeta.length > 0 ? avatarsFromMeta : campaign?.avatars || [];

  return (
    <>
      <div>
      <Link href="/quest/explore" className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-quest-muted mb-6 transition-colors duration-200 hover:text-quest-accent">
        <ArrowLeft size={16} />
        Back to Explore
      </Link>

      <div className="grid grid-cols-[8fr_4fr] max-[920px]:grid-cols-1 gap-[30px] items-start">
        {/* Main content */}
        <div>
          {/* Title hero */}
          <Rise delay={0}>
            <div className="flex items-center gap-[10px] flex-wrap mb-4">
              <Badge variant={campaign.status === "ongoing" ? "ongoing" : "closed"} className="text-[14px] py-[9px] px-[22px] gap-[6px]">
                {campaign.status === "ongoing" ? "Ongoing" : "Closed"}
              </Badge>
              {timeRemainingLabel && (
                <Badge variant="closed" className="text-[14px] py-[9px] px-[22px] gap-[6px] [&_svg]:w-[13px] [&_svg]:h-[13px]">
                  <Clock size={13} />
                  {timeRemainingLabel}
                </Badge>
              )}
            </div>
            <h1 className="text-[clamp(34px,5vw,52px)] font-extrabold tracking-[-0.04em] leading-[1.02]">{campaign.title}</h1>
            {campaign.description && (
              <p className="mt-[14px] text-[17px] text-quest-muted leading-[1.6] max-w-[60ch]">{campaign.description}</p>
            )}

            <div className="mt-5 flex items-center gap-3">
              <AvatarStack
                seed={campaign.id}
                avatars={campaignAvatars}
                total={campaign.participants}
                showCount={false}
              />
              <span className="text-[14px] text-quest-muted">
                <b>{campaign.participants.toLocaleString()}</b> questers joined
              </span>
            </div>
          </Rise>

          {/* Quest steps */}
          <Rise delay={0.08}>
            <div className="mt-[30px] mb-[26px]">
              <div className="flex items-center justify-between mb-[9px]">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-quest-muted">Quest progress</span>
                <span className="text-[12px] font-mono font-bold text-quest-accent">
                  {tasks.length > 0
                    ? `${tasks.length} tasks`
                    : campaign.steps?.length
                      ? `${campaign.steps.length} tasks`
                      : "0 tasks"}
                </span>
              </div>
              <div className="h-[9px] rounded-quest-pill bg-black/45 border border-quest-line overflow-hidden">
                <div className="h-full rounded-quest-pill [background:var(--quest-grad)] shadow-[0_0_16px_-2px_var(--color-quest-accent-glow)] transition-[width] duration-[800ms] ease-quest-out" style={{ width: "0%" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {tasks && tasks.length > 0 ? (
                tasks.map((task: ApiTask, index: number) => (
                  <QuestItem
                    key={task.id}
                    taskId={task.id}
                    isAuthenticated={isAuthenticated}
                    socialAccounts={socialAccounts}
                    onConnectSocial={handleConnectSocial}
                    onLinkTelegramAccount={handleLinkTelegramAccount}
                    onProfileUpdate={handleProfileUpdate}
                    step={{
                      id: task.id,
                      label: task.title || task.name || `Task ${index + 1}`,
                      description: task.description,
                      type: mapTaskType(task.type || task.taskType),
                      actionUrl:
                        task.metadata?.urlAction || task.urlAction || task.actionUrl || "#",
                      actionLabel: task.actionLabel,
                      points: task.pointReward || undefined,
                      checkId: task.metadata?.checkId,
                    }}
                  />
                ))
              ) : campaign.steps && campaign.steps.length > 0 ? (
                campaign.steps.map((step) => (
                  <QuestItem
                    key={step.id}
                    taskId={step.id}
                    isAuthenticated={isAuthenticated}
                    socialAccounts={socialAccounts}
                    onConnectSocial={handleConnectSocial}
                    onLinkTelegramAccount={handleLinkTelegramAccount}
                    onProfileUpdate={handleProfileUpdate}
                    step={step}
                  />
                ))
              ) : (
                <div style={{ color: "var(--muted)", fontStyle: "italic", padding: 16 }}>
                  No specific quests listed for this campaign.
                </div>
              )}
            </div>
          </Rise>

          {/* Full description */}
          {(campaign.fullDescription || campaign.description) && (
            <Rise delay={0.14}>
              <div style={{ marginTop: 32 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ width: 4, height: 24, borderRadius: 2, background: "var(--accent)" }} />
                  Description
                </h3>
                <div style={{
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r-sm)",
                  background: "var(--surface-2)",
                  padding: 24,
                  fontSize: 14,
                  color: "var(--muted)",
                  lineHeight: 1.7,
                }}>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p style={{ color: "var(--muted)", marginBottom: 16 }}>{children}</p>,
                      a: ({ href, children }) => (
                        <a href={href} style={{ color: "var(--accent)" }} target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {campaign.fullDescription || campaign.description || "No description available."}
                  </ReactMarkdown>
                </div>
              </div>
            </Rise>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <Rise delay={0.1}>
            <div className="border border-quest-line rounded-quest-card [background:var(--quest-card-grad)] overflow-hidden">
              <div className="relative h-[172px] border-b border-quest-line bg-[#0c0e10] overflow-hidden">
                <div className="absolute inset-0">
                  {campaign.coverUrl && (
                    <img src={campaign.coverUrl} alt="" className="w-full h-full object-cover opacity-[0.92]" />
                  )}
                </div>
                <span className="absolute top-[13px] right-[13px] text-[10px] font-bold tracking-[0.14em] uppercase text-quest-text px-[11px] py-[6px] rounded-quest-pill bg-[rgba(8,10,12,0.7)] backdrop-blur-[6px] border border-quest-line-2">Points</span>
              </div>
              <div className="px-[22px] py-5">
                <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-quest-muted">Reward points</div>
                <div className="text-[34px] font-extrabold tracking-[-0.03em] text-quest-accent inline-flex items-center gap-[6px] mt-[5px] leading-none">
                  {campaign.points.toLocaleString("en-US")}
                  <PtsCoin />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-[14px] px-[22px] py-[18px] border-t border-b border-quest-line">
                <div>
                  <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-quest-dim mb-[5px]">Start date</div>
                  <div className="text-[14px] font-semibold">{formatDate(campaign.startDate)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-quest-dim mb-[5px]">End date</div>
                  <div className="text-[14px] font-semibold">{formatDate(campaign.endDate)}</div>
                </div>
              </div>
              <div className="px-[22px] py-[18px] flex flex-col gap-[10px]">
                <Button
                  type="button"
                  variant="primary"
                  block
                  disabled={claimCampaignMutation.isPending}
                  onClick={handleClaimReward}
                >
                  {claimCampaignMutation.isPending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Gift size={18} />
                      Claim Reward
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  block
                  onClick={() => setIsShareDialogOpen(true)}
                >
                  <Share2 size={18} />
                  Share Campaign
                </Button>
              </div>
            </div>

            <RelatedCampaigns currentCampaignId={campaign.id} />
          </Rise>
        </div>
      </div>

    </div>
      <ShareDialog
        open={isShareDialogOpen}
        shareUrl={shareUrl}
        onClose={() => setIsShareDialogOpen(false)}
        onCopy={copyToClipboard}
        sharedCopied={sharedCopied}
        onShare={openSocialShare}
      />
    </>
  );
};

const ShareDialog = ({ open, shareUrl, onClose, onCopy, sharedCopied, onShare }: {
  open: boolean; shareUrl: string; onClose: () => void; onCopy: () => void; sharedCopied: boolean;
  onShare: (p: "twitter" | "telegram" | "facebook" | "linkedin") => void;
}) => {
  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-[4px] flex items-center justify-center p-6 animate-[modalfade_.25s_cubic-bezier(0.16,1,0.3,1)]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-[min(420px,100%)] border border-quest-line-2 rounded-quest-card bg-[#141416] p-[26px] shadow-[0_40px_100px_-30px_#000] animate-[modalscale_.25s_cubic-bezier(0.16,1,0.3,1)]">
        <h3 className="text-[19px] font-bold tracking-[-0.02em]">Share campaign</h3>
        <p className="text-[13.5px] text-quest-muted mt-[6px] mb-5">Invite friends to quest with you and earn referral points.</p>
        <div className="grid grid-cols-4 gap-[10px] mb-4">
          <button
            type="button"
            className="flex flex-col items-center gap-2 px-[6px] py-[14px] border border-quest-line-2 rounded-quest-sm bg-quest-surface cursor-pointer transition-[border-color,background] duration-[250ms] text-quest-text hover:border-quest-accent hover:bg-quest-accent-soft"
            onClick={() => onShare("twitter")}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span className="text-[11px] text-quest-muted">X</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-2 px-[6px] py-[14px] border border-quest-line-2 rounded-quest-sm bg-quest-surface cursor-pointer transition-[border-color,background] duration-[250ms] text-quest-text hover:border-quest-accent hover:bg-quest-accent-soft"
            onClick={() => onShare("telegram")}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            <span className="text-[11px] text-quest-muted">Telegram</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-2 px-[6px] py-[14px] border border-quest-line-2 rounded-quest-sm bg-quest-surface cursor-pointer transition-[border-color,background] duration-[250ms] text-quest-text hover:border-quest-accent hover:bg-quest-accent-soft"
            onClick={() => onShare("facebook")}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <span className="text-[11px] text-quest-muted">Facebook</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-2 px-[6px] py-[14px] border border-quest-line-2 rounded-quest-sm bg-quest-surface cursor-pointer transition-[border-color,background] duration-[250ms] text-quest-text hover:border-quest-accent hover:bg-quest-accent-soft"
            onClick={onCopy}
          >
            <Copy size={18} />
            <span className="text-[11px] text-quest-muted">{sharedCopied ? "Copied" : "Copy"}</span>
          </button>
        </div>
        <div className="flex gap-[10px] items-center bg-quest-surface border border-quest-line-2 rounded-quest-sm py-[6px] pr-[6px] pl-[14px]">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent border-none outline-none text-quest-muted font-mono text-[12.5px]"
          />
          <Button type="button" variant="accent" size="sm" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>,
    document.getElementById("quest-overlay") ?? document.body
  );
};

export default CampaignDetail;
