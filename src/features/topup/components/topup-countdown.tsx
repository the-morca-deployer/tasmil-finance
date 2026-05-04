"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  expiresAt: string;
}

export function TopupCountdown({ expiresAt }: CountdownProps) {
  const [remainingSec, setRemainingSec] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemainingSec(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    }, 1_000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const mm = Math.floor(remainingSec / 60)
    .toString()
    .padStart(2, "0");
  const ss = (remainingSec % 60).toString().padStart(2, "0");

  return (
    <span data-testid="topup-countdown" className="font-mono">
      {mm}:{ss}
    </span>
  );
}
