"use client";

import type { ReactNode } from "react";

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
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDisconnect}>
            Disconnect
          </button>
        ) : (
          <button type="button" className="btn btn-primary btn-sm" onClick={onConnect}>
            Connect
          </button>
        )}
      </div>
    </div>
  );
}
