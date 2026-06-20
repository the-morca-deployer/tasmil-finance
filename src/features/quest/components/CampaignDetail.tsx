// @ts-nocheck
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Share2, ExternalLink, Gift, Clock, ShieldCheck, ChevronDown, Loader2, CheckCircle2, Copy, Facebook, Linkedin, Users, Trophy, Wallet, MessageSquare, BarChart2 } from 'lucide-react';
import { Button } from '@/features/quest/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent } from '@/features/quest/components/ui/card-v2';
import { Badge } from '@/features/quest/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/features/quest/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/features/quest/components/ui/avatar';
import { Input } from '@/features/quest/components/ui/input';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CAMPAIGNS } from '@/features/quest/data/mock'; // Keep for fallback/mock data
import { CampaignStep } from '@/features/quest/types';
import { toast } from 'sonner';
import { useWallet } from '@/features/quest/context/wallet-context';
import { 
  useCampaignsControllerFindOne,
  useCampaignsControllerJoinCampaign,
  useCampaignsControllerGetNotJoinedCampaigns,
  useCampaignsControllerClaimCampaign,
  useTasksControllerVerifyTask,
  useTasksControllerGetStatus,
  useTasksControllerGetClaimStatus,
  useTasksControllerClaimTask,
  useSocialAccountsControllerFindAll,
  useSocialAccountsControllerLinkAccount,
  useUsersControllerGetMe,
  usersControllerGetMeQueryKey,
} from '@/gen-quest/hooks';
import { $, withAuth } from '@/features/quest/lib/kubb-config';
import { mapApiCampaignToCampaign, mapApiCampaignsResponse, mapTaskState } from '@/features/quest/lib/campaign-mapper';
import { TelegramButton } from './TelegramButton';

// Social SVGs (Keeping inline for specific colors)
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 127.14 96.36" className={className} fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c2.36-24.44-5.42-48.18-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

interface QuestItemProps {
  step: CampaignStep;
  taskId?: string;
  isAuthenticated?: boolean;
  onVerified?: () => void;
  onProfileUpdate?: () => void;
  socialAccounts?: Array<{
    id: string;
    platform: string;
    platformUserId: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    connectedAt: string;
  }>;
  onConnectSocial?: (provider: "X" | "Discord" | "Telegram") => void;
  onLinkTelegramAccount?: (accountData: { id: string; username?: string; displayName?: string; avatarUrl?: string; [key: string]: unknown }) => void;
}

const QuestItem: React.FC<QuestItemProps> = ({ step, taskId, isAuthenticated, onVerified, onProfileUpdate, socialAccounts = [], onConnectSocial, onLinkTelegramAccount }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch task status to check if verified
  const { data: taskStatusData, refetch: refetchTaskStatus } = useTasksControllerGetStatus(
    taskId || '',
    {
      ...withAuth,
      query: {
        enabled: !!taskId && isAuthenticated,
        staleTime: 30 * 1000, // 30 seconds
      },
    }
  );

  // Fetch claim status
  const { data: claimStatusData, refetch: refetchClaimStatus } = useTasksControllerGetClaimStatus(
    taskId || '',
    {
      ...withAuth,
      query: {
        enabled: !!taskId && isAuthenticated,
        staleTime: 30 * 1000,
      },
    }
  );

  // Claim task mutation
  const claimTaskMutation = useTasksControllerClaimTask({
    ...withAuth,
    mutation: {
      onSuccess: async () => {
        toast.success("Task reward claimed successfully!");
        refetchClaimStatus();
        refetchTaskStatus();
        // Invalidate and refetch user query to update Navbar points
        await queryClient.invalidateQueries({ 
          queryKey: usersControllerGetMeQueryKey(),
          refetchType: 'active' 
        });
        await queryClient.refetchQueries({ 
          queryKey: usersControllerGetMeQueryKey() 
        });
        onProfileUpdate?.(); // Refresh profile points
      },
      onError: (error: unknown) => {
        console.error('Claim task error:', error);
        const axiosError = error as { response?: { data?: { error?: { message?: string }; message?: string } } };
        // Backend returns error in format: { success: false, data: null, error: { code, message } }
        const message = axiosError.response?.data?.error?.message || axiosError.response?.data?.message || 'Failed to claim task reward. Please try again.';
        toast.error(message);
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
    if (taskStatusData?.data) {
      const s = (taskStatusData.data as { status?: string }).status?.toUpperCase();
      if (s === 'COMPLETED' || s === 'APPROVED') {
        setStatus('completed');
      } else if (s === 'PENDING' || s === 'IN_PROGRESS') {
        setStatus('idle');
      }
    }
  }, [taskStatusData]);

  // Real API verification using generated hook
  const verifyTaskMutation = useTasksControllerVerifyTask({
    ...withAuth,
    mutation: {
      onSuccess: (data) => {
        // Response structure: { success: true, data: { success: false, message: "..." } }
        // The response is wrapped, so we need to check data.data.success
        const responseData = data as { data?: { success?: boolean; message?: string } };
        const innerData = responseData?.data;
        if (innerData?.success) {
          setStatus('completed');
          toast.success(innerData.message || "Task verified successfully!");
          onVerified?.();
          // Refetch task status after successful verification
          refetchTaskStatus();
        } else {
          setStatus('error');
          const message = innerData?.message || 'Verification failed';
          setErrorMessage(message);
          toast.error(message);
          // Reset to idle after showing error so user can retry
          setTimeout(() => setStatus('idle'), 2000);
        }
      },
      onError: (error: unknown) => {
        console.error('Verify task error:', error);
        setStatus('error');
        const axiosError = error as { response?: { data?: { error?: { message?: string }; message?: string } } };
        // Backend returns error in format: { success: false, data: null, error: { code, message } }
        const message = axiosError.response?.data?.error?.message || axiosError.response?.data?.message || 'Failed to verify task. Please try again.';
        setErrorMessage(message);
        toast.error(message);
        // Reset to idle after showing error so user can retry
        setTimeout(() => setStatus('idle'), 2000);
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

    setStatus('verifying');
    setErrorMessage(null);
    verifyTaskMutation.mutate({ id: taskId });
  };

  // Update status based on mutation state
  useEffect(() => {
    if (verifyTaskMutation.isPending) {
      setStatus('verifying');
    }
  }, [verifyTaskMutation.isPending]);

  const getStepIcon = (type: string, checkId?: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType === 'visit' && checkId) {
      if (checkId === 'wallet_connect') return <Wallet size={20} className="text-brand-mid" />;
      if (checkId === 'sign_message') return <ShieldCheck size={20} className="text-brand-mid" />;
      if (checkId === 'first_chat') return <MessageSquare size={20} className="text-brand-mid" />;
      if (checkId === 'vault_preview') return <BarChart2 size={20} className="text-brand-mid" />;
    }
    switch (lowerType) {
      case 'twitter':
      case 'x':
      case 'x_follow':
      case 'x_retweet':
      case 'x_comment':
      case 'x_like':
        return <XIcon className="w-4 h-4 text-white" />;
      case 'discord': return <DiscordIcon className="w-5 h-5 text-[#5865F2]" />;
      case 'telegram': return <TelegramIcon className="w-5 h-5 text-[#24A1DE]" />;
      case 'verify': return <ShieldCheck size={20} className="text-success" />;
      case 'onchain': return <Gift size={20} className="text-brand-mid" />;
      case 'visit': return <ExternalLink size={20} className="text-brand-mid" />;
      default: return <ExternalLink size={20} className="text-muted" />;
    }
  };

  // Get required social platform for task type
  const getRequiredPlatform = (type: string): "X" | "Discord" | "Telegram" | null => {
    const lowerType = type.toLowerCase();
    if (lowerType === 'x_follow' || lowerType === 'x_retweet' || lowerType === 'x_comment' || lowerType === 'x_like' || lowerType === 'twitter' || lowerType === 'x') {
      return 'X';
    }
    if (lowerType === 'discord') {
      return 'Discord';
    }
    if (lowerType === 'telegram') {
      return 'Telegram';
    }
    return null;
  };

  // Check if user has required social account linked
  const hasRequiredSocialAccount = (type: string): boolean => {
    const requiredPlatform = getRequiredPlatform(type);
    if (!requiredPlatform) return true; // No social account required
    return socialAccounts.some(acc => acc.platform === requiredPlatform);
  };

  const getActionLabel = (type: string) => {
    if (step.actionLabel) return step.actionLabel;
    const lowerType = type.toLowerCase();
    if (lowerType === 'visit' && step.checkId) {
      if (step.checkId === 'wallet_connect') return 'Connect Wallet';
      if (step.checkId === 'sign_message') return 'Sign & Verify';
      if (step.checkId === 'first_chat') return 'Chat with Agent';
      if (step.checkId === 'vault_preview') return 'Explore Vault';
    }
    switch (lowerType) {
      case 'twitter':
      case 'x':
      case 'x_follow':
        return 'Follow on X';
      case 'x_retweet':
        return 'Retweet on X';
      case 'x_comment':
        return 'Comment on X';
      case 'x_like':
        return 'Like on X';
      case 'discord': return 'Join Discord';
      case 'telegram': return 'Join Telegram';
      case 'onchain': return 'Interact with Contract';
      case 'visit': return 'Visit Link';
      default: return 'Open Link';
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

  return (
    <div className={`rounded-xl transition-all duration-300 border ${isExpanded ? 'bg-card border-brand-mid/30 shadow-lg' : 'bg-card border-border hover:border-white/10'}`}>
      <div
        className="p-4 flex items-center justify-between cursor-pointer select-none group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${claimStatusData?.data?.claimed ? 'bg-success/10 border-success/30' : status === 'completed' ? 'bg-success/10 border-success/30' : 'bg-background border-border group-hover:bg-white/5'}`}>
            {claimStatusData?.data?.claimed ? <CheckCircle2 size={20} className="text-success" /> : status === 'completed' ? <CheckCircle2 size={20} className="text-success" /> : getStepIcon(step.type, step.checkId)}
          </div>
          <span className={`font-medium transition-colors ${claimStatusData?.data?.claimed ? 'text-muted line-through' : 'text-primary'}`}>
            {step.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {step.points ? (
            <span className="text-xs font-bold text-accent-ink bg-primary rounded-full px-3 py-1">
              +{step.points} PTS
            </span>
          ) : null}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-white/10 rotate-180' : 'hover:bg-white/5'}`}>
            <ChevronDown size={18} className="text-muted" />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-5 pl-[72px] space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
          {step.description && (
            <div className="text-sm text-muted leading-relaxed prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="text-muted mb-2">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 text-muted space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 text-muted space-y-1">{children}</ol>,
                  a: ({ href, children }) => (
                    <a href={href} className="text-brand-mid hover:underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {step.description}
              </ReactMarkdown>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={(e) => {
                e.stopPropagation();
                // wallet_connect and sign_message are auto-completed by WalletContext — open directly
                const skipTracking = step.checkId === 'wallet_connect' || step.checkId === 'sign_message';
                if (step.type === 'visit' && taskId && !skipTracking) {
                  const trackingUrl = `/visit/${taskId}?url=${encodeURIComponent(step.actionUrl)}`;
                  window.open(trackingUrl, '_blank');
                } else {
                  window.open(step.actionUrl, '_blank');
                }
              }}
            >
              {getActionLabel(step.type)}
              <ExternalLink size={12} className="ml-2 opacity-50" />
            </Button>

            {(() => {
              const requiredPlatform = getRequiredPlatform(step.type);
              const needsSocialAccount = requiredPlatform && !hasRequiredSocialAccount(step.type);
              const isClaimed = claimStatusData?.data?.claimed || false;
              const rawStatus = (taskStatusData?.data as { status?: string })?.status;
              // Derive the canonical UI state from the shared state-machine mapping.
              // Local `status === 'completed'` (set after a successful verify) is folded
              // in so the button reacts immediately without waiting for a refetch.
              const uiState = mapTaskState({
                status: status === 'completed' ? 'COMPLETED' : rawStatus,
                claimed: isClaimed,
                verifyFailed: status === 'error',
              });

              if (needsSocialAccount) {
                // Show Connect button if social account is required but not linked
                // Use TelegramButton for Telegram, regular button for others
                if (requiredPlatform === "Telegram") {
                  return (
                    <div className="relative min-w-[120px]">
                      <TelegramButton
                        size="small"
                        variant="default"
                        className="text-xs"
                        onSuccess={(accountData) => {
                          if (accountData && onLinkTelegramAccount) {
                            onLinkTelegramAccount(accountData);
                          }
                        }}
                      />
                    </div>
                  );
                }
                return (
                  <Button
                    variant="default"
                    size="sm"
                    className="text-xs min-w-[120px]"
                    onClick={handleConnectClick}
                  >
                    Connect {requiredPlatform}
                  </Button>
                );
              }
              
              // If task is verified but not claimed, show Claim button with points
              if (uiState === 'claimable') {
                const pointsEarned = taskStatusData?.data?.pointsEarned || 0;
                return (
                  <Button
                    variant="default"
                    size="sm"
                    className="text-xs min-w-[120px] bg-success hover:bg-success/90"
                    disabled={claimTaskMutation.isPending}
                    onClick={handleClaimTask}
                  >
                    {claimTaskMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-3 w-3" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <Gift className="mr-2 h-3 w-3" />
                        Claim {pointsEarned} PTS
                      </>
                    )}
                  </Button>
                );
              }
              
              // If task is claimed, show Claimed button (disabled) with points
              if (uiState === 'claimed') {
                const pointsEarned = taskStatusData?.data?.pointsEarned || claimStatusData?.data?.claim?.pointsEarned || 0;
                return (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs min-w-[120px] opacity-75 cursor-not-allowed"
                    disabled
                  >
                    <CheckCircle2 className="mr-2 h-3 w-3" />
                    Claimed {pointsEarned} PTS
                  </Button>
                );
              }
              
              // Show Verify button if task is not verified
              return (
                <Button
                  variant={status === 'error' ? 'destructive' : 'default'}
                  size="sm"
                  className={`text-xs min-w-[120px] ${status === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={status === 'verifying' || status === 'completed' || verifyTaskMutation.isPending}
                  onClick={handleVerifyClick}
                >
                  {status === 'verifying' ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-3 w-3" />
                      Verifying...
                    </>
                  ) : status === 'completed' ? (
                    <>
                      <CheckCircle2 className="mr-2 h-3 w-3" />
                      Verified
                    </>
                  ) : status === 'error' ? (
                    <>
                      Retry Verify
                    </>
                  ) : (
                    <>
                      Verify Task
                    </>
                  )}
                </Button>
              );
            })()}
          </div>
          
          {/* Error message display */}
          {errorMessage && status === 'error' && (
            <div className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// More For You Section Component
  // TODO: Uncomment after running pnpm run generate:api in frontend
const MoreForYouSection: React.FC<{ currentCampaignId: string }> = ({ currentCampaignId }) => {
  const { isAuthenticated } = useWallet();
  
  // TODO: Uncomment after running generate:api
  // Fetch campaigns user has not joined
  const { data: notJoinedData, isLoading } = useCampaignsControllerGetNotJoinedCampaigns(
    {}, // Empty object instead of undefined
    {
      ...withAuth,
      query: {
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    }
  );

  const notJoinedCampaigns = useMemo(() => {
    if (!notJoinedData) return [];
    const campaigns = mapApiCampaignsResponse(notJoinedData);
    // Filter out current campaign and limit to 2
    return campaigns.filter(c => c.id !== currentCampaignId).slice(0, 2);
  }, [notJoinedData, currentCampaignId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-muted uppercase tracking-wider">More For You</h4>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-4 p-3 rounded-xl border border-border animate-pulse">
              <div className="w-16 h-16 rounded-lg bg-muted/20 shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted/20 rounded w-3/4"></div>
                <div className="h-3 bg-muted/20 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isLoading && notJoinedCampaigns.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-muted uppercase tracking-wider">More For You</h4>
      <div className="space-y-3">
        {notJoinedCampaigns.map(c => (
          <Link 
            key={c.id} 
            href={`/quest/campaign/${c.id}`} 
            className="flex gap-4 p-3 rounded-xl bg-card border border-border hover:border-white/20 transition-all items-center group"
          >
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted/10">
              <img src={c.banner || c.coverUrl || 'https://res.cloudinary.com/drjdgtxvh/image/upload/v1781589395/banner-campaign_dwrtkw.png'} alt={c.title} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h5 className="font-bold text-sm truncate group-hover:text-brand-mid transition-colors">{c.title}</h5>
              <p className="text-xs text-muted truncate">{c.points} Points</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const CampaignDetail: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const { isConnected, isAuthenticated, connect } = useWallet();
  const queryClient = useQueryClient();
  
  // Get user profile refetch function
  const { refetch: refetchUserProfile } = useUsersControllerGetMe({
    ...withAuth,
    query: {
      enabled: isAuthenticated,
      staleTime: 0, // Always refetch when called
    },
  });

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

  const socialAccounts = useMemo(
    () => (socialAccountsData?.data || socialAccountsData || []) as Array<{
      id: string;
      platform: string;
      platformUserId: string;
      username?: string;
      displayName?: string;
      avatarUrl?: string;
      connectedAt: string;
    }>,
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

  const handleConnectSocial = (provider: "X" | "Discord" | "Telegram") => {
    // Telegram is handled by TelegramButton component
    if (provider === "Telegram") {
      return;
    }

    // Open OAuth popup for Discord and X
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

  // Listen for OAuth success messages and link accounts
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (
        event.data?.type === "X_AUTH_SUCCESS" ||
        event.data?.type === "DISCORD_AUTH_SUCCESS"
      ) {
        if (event.data?.status === "success" && event.data?.accountData) {
          try {
            const platform = (event.data.platform || event.data.type.replace("_AUTH_SUCCESS", "")) as "X" | "Discord";
            linkAccountMutation.mutate({
              platform,
              data: event.data.accountData,
            } as any, {
              onSuccess: () => {
                toast.success(`${platform} account linked successfully!`);
                refetchSocialAccounts();
              },
              onError: (error: unknown) => {
                const axiosError = error as { response?: { status?: number; data?: { error?: { message?: string }; message?: string } } };
                if (axiosError.response?.status === 409) {
                  const message = axiosError.response?.data?.error?.message || axiosError.response?.data?.message || "Account is already linked";
                  toast.info(message);
                } else {
                  // Backend returns error in format: { success: false, data: null, error: { code, message } }
                  const message = axiosError.response?.data?.error?.message || axiosError.response?.data?.message || "Failed to link account";
                  toast.error(message);
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

  // Fetch campaign data from API
  const { 
    data: campaignData, 
    isLoading: isLoadingCampaign,
    error: campaignError,
    refetch: refetchCampaign
  } = useCampaignsControllerFindOne(id, {
    ...$,
    query: {
      enabled: !!id,
    },
  });

  // Extract campaign and participation from API response
  interface CampaignResponse {
    data?: {
      campaign?: unknown;
      participation?: unknown;
      meta?: {
        avatars?: string[];
      };
    };
    campaign?: unknown;
    participation?: unknown;
    meta?: {
      avatars?: string[];
    };
  }

  const campaign = useMemo(() => {
    if (!campaignData) return null;
    // Handle wrapped response structure
    const data = (campaignData as CampaignResponse)?.data || (campaignData as CampaignResponse);
    if (data?.campaign) {
      return mapApiCampaignToCampaign(data.campaign);
    }
    return null;
  }, [campaignData]);

  const participation = useMemo(() => {
    if (!campaignData) return null;
    const data = (campaignData as CampaignResponse)?.data || (campaignData as CampaignResponse);
    return data?.participation || null;
  }, [campaignData]);

  // Extract avatars from meta (for findOne, avatars are in meta, not in campaign object)
  const avatarsFromMeta = useMemo(() => {
    if (!campaignData) return [];
    const data = (campaignData as CampaignResponse)?.data || (campaignData as CampaignResponse);
    return data?.meta?.avatars || [];
  }, [campaignData]);

  interface Task {
    id: string;
    name?: string;
    title?: string;
    description?: string;
    taskType?: string;
    urlAction?: string;
    actionUrl?: string;
    actionLabel?: string;
  }

  const tasks = useMemo(() => {
    if (!campaignData) return [];
    const data = (campaignData as CampaignResponse)?.data || (campaignData as CampaignResponse);
    return (data?.campaign as { tasks?: Task[] })?.tasks || [];
  }, [campaignData]);

  // Check if user has joined
  const hasJoined = !!participation;

  // Claim campaign mutation - must be called unconditionally at the top level
  const claimCampaignMutation = useCampaignsControllerClaimCampaign({
    ...withAuth,
    mutation: {
      onSuccess: async () => {
        toast.success("Campaign reward claimed successfully!");
        refetchCampaign();
        // Invalidate and refetch user query to update Navbar points
        await queryClient.invalidateQueries({ 
          queryKey: usersControllerGetMeQueryKey(),
          refetchType: 'active' 
        });
        await queryClient.refetchQueries({ 
          queryKey: usersControllerGetMeQueryKey() 
        });
        refetchUserProfile();
      },
      onError: (error: unknown) => {
        console.error("Claim campaign error:", error);
        const axiosError = error as { response?: { data?: { error?: { message?: string }; message?: string } } };
        // Backend returns error in format: { success: false, data: null, error: { code, message } }
        const message = axiosError.response?.data?.error?.message || axiosError.response?.data?.message || 'Failed to claim campaign reward. Please try again.';
        toast.error(message);
      },
    },
  });

  // Join campaign mutation
  const joinCampaignMutation = useCampaignsControllerJoinCampaign({
    ...withAuth,
    mutation: {
      onSuccess: () => {
        toast.success("Successfully joined the campaign!");
        // Refetch campaign data to get updated participation status
        refetchCampaign();
      },
      onError: (error: unknown) => {
        console.error("Join campaign error:", error);
        const axiosError = error as { response?: { status?: number; data?: { error?: { message?: string }; message?: string } } };
        if (axiosError.response?.status === 409) {
          const message = axiosError.response?.data?.error?.message || axiosError.response?.data?.message || "You have already joined this campaign";
          toast.info(message);
        } else if (axiosError.response?.status === 401) {
          toast.error("Please connect your wallet first");
        } else {
          // Backend returns error in format: { success: false, data: null, error: { code, message } }
          const message = axiosError.response?.data?.error?.message || axiosError.response?.data?.message || 'Failed to join campaign. Please try again.';
          toast.error(message);
        }
      },
    },
  });

  // Handle join campaign
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

  // Skeleton loading component
  const QuestSkeleton = () => (
    <div className="rounded-xl border bg-card border-border animate-pulse">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted/20"></div>
          <div className="h-5 w-48 bg-muted/20 rounded"></div>
        </div>
        <div className="w-8 h-8 rounded-full bg-muted/20"></div>
      </div>
    </div>
  );

  // Loading state with skeleton
  if (isLoadingCampaign) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8">
        <div className="mb-8">
          <div className="h-6 w-32 bg-muted/20 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-8 space-y-10">
            <div className="space-y-6">
              <div className="h-12 w-64 bg-muted/20 rounded animate-pulse"></div>
              <div className="h-6 w-full bg-muted/20 rounded animate-pulse"></div>
              <div className="h-6 w-3/4 bg-muted/20 rounded animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="h-7 w-24 bg-muted/20 rounded animate-pulse"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => <QuestSkeleton key={i} />)}
              </div>
            </div>
          </div>
          <div className="lg:col-span-4">
            <Card className="shadow-2xl shadow-brand-mid/5">
              <CardContent className="p-6 space-y-6">
                <div className="h-48 w-full bg-muted/20 rounded-xl animate-pulse"></div>
                <div className="h-20 w-full bg-muted/20 rounded-lg animate-pulse"></div>
                <div className="h-12 w-full bg-muted/20 rounded-lg animate-pulse"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (campaignError || !campaign) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted mb-4">Campaign not found</p>
          <Link href="/quest">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Explore
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show connect-wallet prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8">
        <div className="mb-8">
          <Link href="/quest" className="inline-flex items-center text-muted hover:text-primary transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Back to Explore
          </Link>
        </div>
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center space-y-6">
            <div className="space-y-4">
              {campaign?.banner && (
                <div className="relative h-64 w-full rounded-xl overflow-hidden">
                  <img
                    src={campaign.banner}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h1 className="text-3xl font-bold text-white mb-2">{campaign.title}</h1>
                    <p className="text-white/80 text-sm line-clamp-2">{campaign.description}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-brand-mid/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-brand-mid" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-muted uppercase tracking-wide">Reward Points</div>
                    <div className="text-lg font-bold text-success">{campaign?.points} PTS</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-brand-mid/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-brand-mid" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-muted uppercase tracking-wide">Participants</div>
                    <div className="text-lg font-bold">{campaign?.participants?.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full text-lg py-6 gap-2"
                  onClick={connect}
                >
                  <Wallet className="h-5 w-5" />
                  Connect Wallet to Join
                </Button>
                <p className="text-sm text-muted mt-3">
                  Connect your wallet to join this campaign and start earning rewards.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Show join page if user hasn't joined
  if (isAuthenticated && !hasJoined) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8">
        {/* Breadcrumb / Back */}
        <div className="mb-8">
          <Link href="/quest" className="inline-flex items-center text-muted hover:text-primary transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Back to Explore
          </Link>
        </div>

        {/* Join Campaign Page */}
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center space-y-6">
            <div className="space-y-4">
              {/* Campaign Banner */}
              <div className="relative h-64 w-full rounded-xl overflow-hidden">
                <img
                  src={campaign.banner}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <Badge variant={campaign.status === 'ongoing' ? 'default' : 'secondary'} className="mb-3">
                    {campaign.status === 'ongoing' ? 'Ongoing' : 'Closed'}
                  </Badge>
                  <h1 className="text-3xl font-bold text-white mb-2">{campaign.title}</h1>
                  <p className="text-white/80 text-sm line-clamp-2">{campaign.description}</p>
                </div>
              </div>

              {/* Campaign Info */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-brand-mid/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-brand-mid" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-muted uppercase tracking-wide">Reward Points</div>
                    <div className="text-lg font-bold text-success">{campaign.points} PTS</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-brand-mid/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-brand-mid" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-muted uppercase tracking-wide">Participants</div>
                    <div className="text-lg font-bold">{campaign.participants.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Join Button */}
              <div className="pt-4">
                <Button
                  variant="default"
                  size="lg"
                  className="w-full text-lg py-6"
                  onClick={handleJoinCampaign}
                  disabled={joinCampaignMutation.isPending}
                >
                  {joinCampaignMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      Joining Campaign...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-5 w-5" />
                      Join Campaign
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted mt-3">
                  By joining, you&apos;ll be able to participate in quests and earn rewards
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const maxAvatars = 5;
  // Use avatars from meta (for findOne) or from campaign.avatars (fallback)
  const campaignAvatars = avatarsFromMeta.length > 0 ? avatarsFromMeta : (campaign?.avatars || []);
  const avatarsToShow = campaignAvatars.slice(0, maxAvatars);
  const remainingCount = campaign.participants - avatarsToShow.length;
  const formattedRemaining = remainingCount > 1000 
    ? `+${(remainingCount / 1000).toFixed(0)}k` 
    : remainingCount > 0 
      ? `+${remainingCount}` 
      : '';

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Join me on this quest: ${campaign.title} on Tasmil Finance!`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
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

  const openSocialShare = (platform: 'twitter' | 'telegram' | 'facebook' | 'linkedin') => {
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }
    window.open(url, '_blank');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8">

      {/* Breadcrumb / Back */}
      <div className="mb-8">
        <Link href="/quest" className="inline-flex items-center text-muted hover:text-primary transition-colors">
          <ArrowLeft size={16} className="mr-2" />
          Back to Explore
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

        {/* Main Content (Left) */}
        <div className="lg:col-span-8 space-y-10">

          {/* Header */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={campaign.status === 'ongoing' ? 'default' : 'secondary'}>
                {campaign.status === 'ongoing' ? 'Ongoing' : 'Closed'}
              </Badge>
              {campaign.endDate && (
                <div className="flex items-center gap-1.5 text-muted bg-card px-3 py-1 rounded-full text-sm border border-border">
                  <Clock size={14} />
                  <span>Until {formatDate(campaign.endDate)}</span>
                </div>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">{campaign.title}</h1>
            
            {campaign.description && (
              <p className="text-lg text-muted leading-relaxed">{campaign.description}</p>
            )}

            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {avatarsToShow.length > 0 ? avatarsToShow.map((avatar: string, i: number) => (
                  <Avatar key={i} className="w-10 h-10 border-2 border-background ring-2 ring-border/50">
                    <AvatarImage src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${campaign.id}-${i}`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )) : Array.from({ length: Math.min(campaign.participants, 4) }).map((_, i) => (
                  <Avatar key={i} className="w-10 h-10 border-2 border-background ring-2 ring-border/50">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${campaign.id}-${i}`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                ))}
                {(() => {
                  const shownCount = avatarsToShow.length > 0 ? avatarsToShow.length : Math.min(campaign.participants, 4);
                  const extra = campaign.participants - shownCount;
                  if (extra <= 0) return null;
                  const label = extra > 1000 ? `+${(extra / 1000).toFixed(0)}k` : `+${extra}`;
                  return (
                    <div className="w-10 h-10 rounded-full border-2 border-background bg-muted/20 flex items-center justify-center text-[10px] font-bold text-muted ring-2 ring-border/50">
                      {label}
                    </div>
                  );
                })()}
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-bold text-white text-lg">{campaign.participants.toLocaleString()}</span>
                <span className="text-xs text-muted uppercase tracking-wide font-medium">Participants</span>
              </div>
            </div>
          </div>

          {/* Quests List */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="w-1 h-6 bg-brand-mid rounded-full"></span>
              Quests
            </h3>

            <div className="space-y-3">
              {isLoadingCampaign ? (
                [1, 2, 3].map(i => <QuestSkeleton key={i} />)
              ) : tasks && tasks.length > 0 ? (
                tasks.map((task: Task) => {
                  // Map taskType to CampaignStep type
                  const mapTaskType = (taskType?: string): 'twitter' | 'discord' | 'telegram' | 'verify' | 'visit' | 'x_follow' | 'x_retweet' | 'x_comment' | 'x_like' | 'onchain' => {
                    if (!taskType) return 'verify';
                    const lowerType = taskType.toLowerCase();
                    if (lowerType === 'x_follow') return 'x_follow';
                    if (lowerType === 'x_retweet') return 'x_retweet';
                    if (lowerType === 'x_comment') return 'x_comment';
                    if (lowerType === 'x_like') return 'x_like';
                    if (lowerType === 'twitter' || lowerType === 'x') return 'twitter';
                    if (lowerType === 'discord' || lowerType === 'discord_join') return 'discord';
                    if (lowerType === 'telegram' || lowerType === 'telegram_join') return 'telegram';
                    if (lowerType === 'onchain' || lowerType === 'volume_swap') return 'onchain';
                    if (lowerType === 'agent_chat' || lowerType === 'browse') return 'visit';
                    if (lowerType === 'verify' || lowerType === 'verification') return 'verify';
                    return 'visit';
                  };
                  
                  return (
                    <QuestItem 
                      key={task.id} 
                      taskId={task.id}
                      isAuthenticated={isAuthenticated}
                      socialAccounts={socialAccounts}
                      onConnectSocial={handleConnectSocial}
                      onLinkTelegramAccount={(accountData) => {
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
                      }}
                      onProfileUpdate={async () => {
                        // Invalidate user query to update Navbar points
                        await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
                        refetchUserProfile();
                      }}
                      step={{
                        id: task.id,
                        label: task.title || task.name || 'Task',
                        description: task.description,
                        type: mapTaskType((task as any).type || task.taskType),
                        actionUrl: (task as any).metadata?.urlAction || task.urlAction || task.actionUrl || '#',
                        actionLabel: task.actionLabel,
                        points: (task as any).pointReward || undefined,
                        checkId: (task as any).metadata?.checkId,
                      }}
                    />
                  );
                })
              ) : (
                campaign.steps?.map((step) => (
                  <QuestItem 
                    key={step.id} 
                    step={step}
                    isAuthenticated={isAuthenticated}
                    socialAccounts={socialAccounts}
                    onConnectSocial={handleConnectSocial}
                    onLinkTelegramAccount={(accountData) => {
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
                    }}
                    onProfileUpdate={async () => {
                      // Invalidate user query to update Navbar points
                      await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
                      refetchUserProfile();
                    }}
                  />
                ))
              )}
              {(!tasks || tasks.length === 0) && !campaign.steps && (
                <div className="text-muted italic p-4">No specific quests listed for this campaign.</div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="w-1 h-6 bg-brand-mid rounded-full"></span>
              Description
            </h3>
            <div className="prose prose-invert prose-p:text-muted prose-a:text-brand-mid max-w-none bg-card border border-border rounded-xl p-6">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="text-muted mb-4">{children}</p>,
                  h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold text-white mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-bold text-white mb-2">{children}</h3>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-4 text-muted space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-4 text-muted space-y-2">{children}</ol>,
                  li: ({ children }) => <li className="text-muted">{children}</li>,
                  a: ({ href, children }) => (
                    <a href={href} className="text-brand-mid hover:underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                  code: ({ children }) => (
                    <code className="bg-background/50 px-1.5 py-0.5 rounded text-sm font-mono text-brand-mid">
                      {children}
                    </code>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-brand-mid pl-4 italic text-muted my-4">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {campaign.fullDescription || campaign.description || 'No description available.'}
              </ReactMarkdown>
            </div>
          </div>

        </div>

        {/* Sidebar (Right) */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-28 space-y-6">

            <Card className="shadow-2xl shadow-brand-mid/5">
              <CardContent className="p-6 space-y-6">
                {/* Campaign Cover Image */}
                {campaign.coverUrl && (
                  <div className="relative h-48 w-full rounded-xl overflow-hidden bg-background group">
                    <img 
                      src={campaign.coverUrl} 
                      alt={campaign.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  </div>
                )}

                {campaign.reward && (
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-background group">
                    <img src={campaign.reward.image} alt="Reward" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4 text-center">
                      <div className="inline-block bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-xs font-medium mb-2">
                        {campaign.reward.type.toUpperCase()}
                      </div>
                      <h4 className="font-bold text-lg leading-tight">{campaign.reward.title}</h4>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                    <span className="text-muted text-sm">Reward Points</span>
                    <div className="flex items-center gap-1.5 text-success font-bold">
                      <Gift size={16} />
                      <span>{campaign.points} PTS</span>
                    </div>
                  </div>

                  {/* Date Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-surface rounded-lg border border-border space-y-1">
                      <span className="text-xs text-muted block">Start Date</span>
                      <span className="text-sm font-medium">{formatDate(campaign.startDate)}</span>
                    </div>
                    <div className="p-3 bg-surface rounded-lg border border-border space-y-1">
                      <span className="text-xs text-muted block">End Date</span>
                      <span className="text-sm font-medium">{formatDate(campaign.endDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 flex flex-col items-center">
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full"
                    disabled={claimCampaignMutation.isPending}
                    onClick={handleClaimReward}
                  >
                    {claimCampaignMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" /> Claiming...
                      </>
                    ) : (
                      <>
                        <Gift className="mr-2 h-4 w-4" />
                        Claim Reward
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="lg" className="w-full gap-2" onClick={() => setIsShareDialogOpen(true)}>
                    <Share2 size={18} />
                    Share Campaign
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Other Campaigns Preview - Not Joined */}
            <MoreForYouSection currentCampaignId={campaign.id} />

          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Campaign</DialogTitle>
            <DialogDescription>Spread the word and invite friends to join this quest.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-4 py-4">
            <button onClick={() => openSocialShare('twitter')} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <XIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-muted">X</span>
            </button>
            <button onClick={() => openSocialShare('telegram')} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:bg-[#0088cc]/20 transition-colors">
                <TelegramIcon className="w-6 h-6 text-[#24A1DE]" />
              </div>
              <span className="text-xs text-muted">Telegram</span>
            </button>
            <button onClick={() => openSocialShare('facebook')} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:bg-[#1877F2]/20 transition-colors">
                <Facebook size={20} className="text-white" />
              </div>
              <span className="text-xs text-muted">Facebook</span>
            </button>
            <button onClick={() => openSocialShare('linkedin')} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:bg-[#0A66C2]/20 transition-colors">
                <Linkedin size={20} className="text-white" />
              </div>
              <span className="text-xs text-muted">LinkedIn</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Input readOnly value={shareUrl} />
            </div>
            <Button type="submit" size="icon" variant="secondary" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignDetail;
