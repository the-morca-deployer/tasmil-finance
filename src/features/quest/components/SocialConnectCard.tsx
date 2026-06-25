"use client";

import type { ReactNode } from "react";
import { Button } from "@/features/quest/components/ui/button";

interface SocialConnectCardProps {
  provider: string; // "Twitter", "Discord", "Telegram"
  icon: ReactNode; // lucide icon or svg element
  connected: boolean;
  handle?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function SocialConnectCard({
  provider,
  icon,
  connected,
  handle,
  onConnect,
  onDisconnect,
}: SocialConnectCardProps) {
  return (
    <div className="social-card">
      <div className="social-card-head">
        <span className="social-card-icon">{icon}</span>
        <span className="social-card-name">{provider}</span>
      </div>
      <div className="social-card-body">
        {connected ? (
          <div className="social-card-handle">
            Connected as <strong>{handle ?? "user"}</strong>
          </div>
        ) : (
          <div className="social-card-msg">Connect to verify and earn quest points.</div>
        )}
      </div>
      <div className="social-card-foot">
        {connected ? (
          <Button type="button" variant="ghost" size="sm" onClick={onDisconnect}>
            Disconnect
          </Button>
        ) : (
          <Button type="button" variant="primary" size="sm" onClick={onConnect}>
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
