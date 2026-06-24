"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, X } from "lucide-react";
import React, { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useQuestAuthStore } from "@/features/quest/store/use-quest-auth";

// Social Icons
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

export type SocialProvider = "X" | "Discord" | "Telegram";

interface SocialAccount {
  id: string;
  provider: SocialProvider;
  providerId: string;
  username?: string;
}

interface SocialConnectCardProps {
  provider: SocialProvider;
  linkedAccount?: SocialAccount;
  onConnect: () => void;
  onDisconnect: () => void;
  isLoading?: boolean;
}

const providerConfig = {
  X: {
    icon: XIcon,
    color: "#000000",
    bgColor: "bg-white/5",
    iconClass: "text-white",
    label: "X (Twitter)",
  },
  Discord: {
    icon: DiscordIcon,
    color: "#5865F2",
    bgColor: "bg-[#5865F2]/10",
    iconClass: "text-[#5865F2]",
    label: "Discord",
  },
  Telegram: {
    icon: TelegramIcon,
    color: "#24A1DE",
    bgColor: "bg-[#24A1DE]/10",
    iconClass: "text-[#24A1DE]",
    label: "Telegram",
  },
};

export const SocialConnectCard: React.FC<SocialConnectCardProps> = ({
  provider,
  linkedAccount,
  onConnect,
  onDisconnect,
  isLoading = false,
}) => {
  const config = providerConfig[provider];
  const Icon = config.icon;
  const isConnected = !!linkedAccount;

  return (
    <div className="bg-[#151617] border border-border rounded-xl p-4 flex items-center justify-between group hover:border-white/20 transition-all">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center ${config.iconClass}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-sm">{config.label}</div>
          <div className={`text-xs ${isConnected ? config.iconClass : "text-muted"}`}>
            {isConnected ? linkedAccount.username || "Connected" : "Not connected"}
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted" />
      ) : isConnected ? (
        <div className="flex items-center gap-2">
          <CheckCircle2 size={20} className="text-success" />
          <button
            type="button"
            className="btn btn-ghost h-8 w-8 p-0 text-muted hover:text-danger hover:bg-danger/10 flex items-center justify-center"
            onClick={onDisconnect}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm h-8 text-xs" onClick={onConnect}>
          Connect
        </button>
      )}
    </div>
  );
};

interface SocialConnectSectionProps {
  socialAccounts: SocialAccount[];
  onRefetch: () => void;
}

export const SocialConnectSection: React.FC<SocialConnectSectionProps> = ({
  socialAccounts,
  onRefetch,
}) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useQuestAuthStore();
  const [loadingProvider, setLoadingProvider] = React.useState<SocialProvider | null>(null);

  const getLinkedAccount = (provider: SocialProvider) => {
    return socialAccounts.find((acc) => acc.provider === provider);
  };

  // Listen for OAuth popup messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "X_AUTH_SUCCESS" ||
        event.data?.type === "DISCORD_AUTH_SUCCESS" ||
        event.data?.type === "TELEGRAM_AUTH_SUCCESS"
      ) {
        setLoadingProvider(null);
        if (event.data.success) {
          toast.success("Account connected successfully!");
          onRefetch();
          queryClient.invalidateQueries({
            queryKey: ["social-accounts-controller-get-social-accounts"],
          });
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onRefetch, queryClient]);

  const openOAuthPopup = useCallback((provider: SocialProvider) => {
    setLoadingProvider(provider);

    const urls: Record<SocialProvider, string> = {
      X: "/api/auth/x",
      Discord: "/api/auth/discord",
      Telegram: "/api/auth/telegram",
    };

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // For Telegram, we need to handle it differently using the Login Widget
    if (provider === "Telegram") {
      openTelegramWidget();
      return;
    }

    const popup = window.open(
      urls[provider],
      `${provider}OAuth`,
      `width=${width},height=${height},left=${left},top=${top},popup=1`
    );

    // Check if popup was blocked
    if (!popup || popup.closed) {
      setLoadingProvider(null);
      toast.error("Popup was blocked. Please allow popups for this site.");
      return;
    }

    // Monitor popup closing
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setLoadingProvider(null);
      }
    }, 500);
  }, []);

  const openTelegramWidget = useCallback(() => {
    // Dynamically load and trigger Telegram Login Widget
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      toast.error("Telegram not configured");
      setLoadingProvider(null);
      return;
    }

    const callbackUrl = `${window.location.origin}/api/auth/callback/telegram`;

    // Create Telegram script for widget
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-auth-url", callbackUrl);
    script.setAttribute("data-request-access", "write");
    script.async = true;

    // Create a hidden container and trigger the widget
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "-9999px";
    container.appendChild(script);
    document.body.appendChild(container);

    // Alternative: Use Telegram's window.TelegramLogin
    // @ts-ignore
    if (window.Telegram?.Login) {
      // @ts-ignore
      window.Telegram.Login.auth(
        { bot_id: botUsername, request_access: "write" },
        (data: Record<string, string>) => {
          if (data) {
            // Redirect to callback with data
            const params = new URLSearchParams(data as Record<string, string>);
            window.location.href = `${callbackUrl}?${params.toString()}`;
          } else {
            setLoadingProvider(null);
            toast.error("Telegram login cancelled");
          }
        }
      );
    } else {
      // Fallback: Open Telegram OAuth in popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      window.open(
        `https://oauth.telegram.org/auth?bot_id=${botUsername}&origin=${encodeURIComponent(window.location.origin)}&request_access=write`,
        "TelegramOAuth",
        `width=${width},height=${height},left=${left},top=${top},popup=1`
      );
    }

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(container);
    }, 1000);
  }, []);

  const handleDisconnect = useCallback(
    async (provider: SocialProvider) => {
      if (!isAuthenticated) {
        toast.error("Please login first");
        return;
      }

      setLoadingProvider(provider);

      try {
        // Cookie-based auth — no Bearer token needed
        const res = await fetch(
          `/api/quest/social-accounts/${provider}`,
          { method: "DELETE", credentials: "include" }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error?.message || "Failed to disconnect");
        }

        toast.success(`${provider} account disconnected`);
        onRefetch();
        queryClient.invalidateQueries({
          queryKey: ["social-accounts-controller-get-social-accounts"],
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to disconnect account");
      } finally {
        setLoadingProvider(null);
      }
    },
    [isAuthenticated, onRefetch, queryClient]
  );

  const providers: SocialProvider[] = ["Discord", "X", "Telegram"];

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg px-2">Social Accounts</h3>
      <div className="space-y-3">
        {providers.map((provider) => (
          <SocialConnectCard
            key={provider}
            provider={provider}
            linkedAccount={getLinkedAccount(provider)}
            onConnect={() => openOAuthPopup(provider)}
            onDisconnect={() => handleDisconnect(provider)}
            isLoading={loadingProvider === provider}
          />
        ))}
      </div>
    </div>
  );
};

export default SocialConnectSection;
