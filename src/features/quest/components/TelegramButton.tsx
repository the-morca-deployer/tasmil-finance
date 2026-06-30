// @ts-nocheck
"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { buttonClasses } from "@/features/quest/components/ui/button";

declare global {
  interface Window {
    onTelegramAuth?: (user: {
      id: string;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
      auth_date: number;
      hash: string;
    }) => void;
  }
}

type ButtonSize = "small" | "medium" | "large";

interface TelegramAccountData {
  id: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  [key: string]: unknown;
}

interface TelegramButtonProps {
  size?: ButtonSize;
  botUsername?: string;
  onSuccess?: (accountData?: TelegramAccountData) => void;
  className?: string;
  variant?: "default" | "outline" | "secondary";
  disabled?: boolean;
}

export function TelegramButton({
  size = "small",
  botUsername: customBotUsername,
  onSuccess,
  className = "",
  variant = "outline",
  disabled = false,
}: TelegramButtonProps) {
  const router = useRouter();
  const scriptLoaded = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const botUsername = customBotUsername || process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  // Size configurations
  const sizeConfig = {
    small: {
      button: "h-8 px-3 text-xs",
      container: "h-8",
      widgetSize: "large",
    },
    medium: {
      button: "h-10 px-4 text-sm",
      container: "h-10",
      widgetSize: "large",
    },
    large: {
      button: "h-12 px-6 text-base",
      container: "h-12",
      widgetSize: "large",
    },
  };

  const config = sizeConfig[size];
  const widgetSize = config.widgetSize;
  const btnVariant = variant === "default" ? "primary" : "ghost";
  const btnSize = size === "small" ? "sm" : size === "large" ? "lg" : "default";

  useEffect(() => {
    if (!scriptLoaded.current && containerRef.current) {
      if (!botUsername) {
        setError("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is not set");
        return;
      }

      const cleanBotUsername = botUsername.replace(/^@/, "").trim();

      if (!cleanBotUsername) {
        setError("Bot username cannot be empty");
        return;
      }

      containerRef.current.innerHTML = "";

      // Create Telegram widget script
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute("data-telegram-login", cleanBotUsername);
      script.setAttribute("data-size", widgetSize);
      script.setAttribute("data-radius", "0");
      script.setAttribute("data-userpic", "false");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      script.setAttribute("data-request-access", "write");
      script.async = true;

      script.onerror = () => {
        setError("Failed to load Telegram widget script");
        scriptLoaded.current = false;
      };

      script.onload = () => {
        setError(null);

        // Style iframe after it loads
        setTimeout(() => {
          const iframe = containerRef.current?.querySelector("iframe");
          const button = buttonRef.current;
          const container = containerRef.current;

          if (!iframe || !button || !container) return;
          const buttonRect = button.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();

          // Center iframe in container
          const centerTop = (containerRect.height - buttonRect.height) / 2;
          const centerLeft = (containerRect.width - buttonRect.width) / 2;

          // Apply styles to iframe
          iframe.style.cssText = `
            opacity: 0 !important;
            position: absolute !important;
            top: ${centerTop}px !important;
            left: ${centerLeft}px !important;
            width: ${buttonRect.width}px !important;
            height: ${buttonRect.height}px !important;
            min-width: ${buttonRect.width}px !important;
            max-width: ${buttonRect.width}px !important;
            min-height: ${buttonRect.height}px !important;
            max-height: ${buttonRect.height}px !important;
            z-index: 20 !important;
            pointer-events: auto !important;
            cursor: pointer !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          `;

          // Set attributes
          iframe.setAttribute("width", `${buttonRect.width}`);
          iframe.setAttribute("height", `${buttonRect.height}`);

          // Prevent extension injection
          iframe.setAttribute("data-extension-inject", "false");
          iframe.setAttribute("data-no-extension", "true");

          container.style.overflow = "hidden";
        }, 200);
      };

      containerRef.current.appendChild(script);
      scriptLoaded.current = true;
    }

    // Telegram auth callback
    window.onTelegramAuth = async (user) => {
      setIsLoading(true);
      try {
        const initData = new URLSearchParams({
          id: user.id.toString(),
          first_name: user.first_name,
          last_name: user.last_name || "",
          username: user.username || "",
          photo_url: user.photo_url || "",
          auth_date: user.auth_date.toString(),
          hash: user.hash,
        }).toString();

        const response = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.accountData) {
            // Call onSuccess callback with accountData so parent can link the account
            onSuccess?.(result.accountData);
            router.refresh();
          } else {
            toast.error("Login failed");
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error?.message || "Login failed");
        }
      } catch (error) {
        console.error("Telegram auth error:", error);
        toast.error("An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    return () => {
      if (window.onTelegramAuth) {
        delete window.onTelegramAuth;
      }
    };
  }, [router, botUsername, widgetSize, onSuccess]);

  return (
    <div className={`relative ${config.container} flex items-center justify-center ${className}`}>
      {/* Custom Button (Background) */}
      <button
        ref={buttonRef}
        type="button"
        disabled={isLoading || !!error || disabled}
        className={buttonClasses({
          variant: btnVariant,
          size: btnSize,
          className: `relative z-10 ${config.button} pointer-events-none`,
        })}
        style={{ pointerEvents: "none" }}
      >
        {isLoading ? (
          <span className="flex items-center gap-2 whitespace-nowrap">
            <Loader2 className="animate-spin h-4 w-4" />
            <span>Connecting...</span>
          </span>
        ) : (
          <span className="whitespace-nowrap">Connect Telegram</span>
        )}
      </button>

      {/* Telegram Widget Overlay (Receives clicks) */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
        style={{ zIndex: 20 }}
      />

      {/* Error Message */}
      {error && (
        <div className="absolute -bottom-6 left-0 right-0 text-red-400 text-xs text-center z-30">
          {error}
        </div>
      )}
    </div>
  );
}
