"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { RANK_STYLES, type QuestRank } from "../lib/tier";
import { Icon } from "./icons";

// ── Confetti ──────────────────────────────────────────────────────────────────

const PALETTES: Record<string, string[]> = {
  bronze: ["#E0915A", "#FFD2AC", "#ffffff", "#67E8F9"],
  silver: ["#C9D4E0", "#ffffff", "#9FB0C2", "#67E8F9"],
  gold: ["#FBC54A", "#FFE9A6", "#ffffff", "#67E8F9"],
  platinum: ["#E2EBF6", "#A8BCCF", "#ffffff", "#67E8F9"],
  emerald: ["#34D399", "#6EE7B7", "#ffffff", "#67E8F9"],
  diamond: ["#818CF8", "#A5B4FC", "#67E8F9", "#ffffff"],
  master: ["#F472B6", "#EC4899", "#FBC54A", "#ffffff"],
  muted: ["#94A3B8", "#CBD5E1", "#ffffff", "#67E8F9"],
};

function fireConfetti(container: HTMLElement, cssKey: string) {
  const cols = PALETTES[cssKey] ?? PALETTES["muted"]!;
  for (let i = 0; i < 20; i++) {
    const piece = document.createElement("span");
    piece.className = "cf";
    piece.style.width = `${i % 2 ? 5 : 4}px`;
    piece.style.height = `${i % 3 ? 10 : 6}px`;
    piece.style.background = cols[i % cols.length]!;
    container.appendChild(piece);
    const ang = (-90 + (Math.random() * 340 - 170)) * (Math.PI / 180);
    const dist = 70 + Math.random() * 110;
    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist + 40;
    const rot = Math.random() * 720 - 360;
    piece.animate(
      [
        { transform: "translate(-50%,-50%) translate(0,0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(-50%,-50%) translate(${dx * 0.6}px,${dy * 0.55 - 50}px) rotate(${rot * 0.6}deg)`,
          opacity: 1,
          offset: 0.55,
        },
        {
          transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) rotate(${rot}deg)`,
          opacity: 0,
        },
      ],
      { duration: 900 + Math.random() * 500, easing: "cubic-bezier(0.18,0.7,0.3,1)" }
    ).onfinish = () => piece.remove();
  }
}

// ── Badge fly-in ──────────────────────────────────────────────────────────────

function flyBadge(img: HTMLImageElement) {
  img.style.opacity = "0";
  const a = img.animate(
    [
      { transform: "scale(0.3) translateY(-80px)", opacity: 0 },
      { transform: "scale(1.12) translateY(4px)", opacity: 1, offset: 0.72 },
      { transform: "scale(1) translateY(0)", opacity: 1 },
    ],
    { duration: 850, easing: "cubic-bezier(0.34,1.4,0.5,1)", fill: "forwards" }
  );
  a.onfinish = () => {
    a.cancel();
    img.style.opacity = "1";
    img.style.transform = "";
    img.classList.add("bob");
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface TierRewardRevealProps {
  tier: QuestRank;
  points: number;
  open: boolean;
  loading?: boolean;
  onClaim: () => void;
  onClose?: () => void;
}

export function TierRewardReveal({
  tier,
  points,
  open,
  loading,
  onClaim,
  onClose,
}: TierRewardRevealProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLImageElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const ranRef = useRef(false);

  const style = RANK_STYLES[tier];

  const play = useCallback(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const card = cardRef.current;
    const reveal = revealRef.current;
    const badge = badgeRef.current;
    const copyBlock = copyRef.current;
    const item = itemRef.current;
    const btn = btnRef.current;
    if (!card || !reveal || !badge || !copyBlock || !item || !btn) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      card.classList.add("in");
      badge.style.opacity = "1";
      badge.classList.add("bob");
      copyBlock.classList.add("in");
      item.classList.add("in");
      btn.classList.add("in");
      return;
    }

    card.classList.add("in");
    copyBlock.classList.add("in");

    setTimeout(() => {
      flyBadge(badge);
      fireConfetti(reveal, style.cssKey);

      setTimeout(() => item.classList.add("in"), 500);
      setTimeout(() => btn.classList.add("in"), 650);
    }, 380);
  }, [style.cssKey]);

  useEffect(() => {
    if (!open) return;
    // reset for re-use across sequential tiers
    ranRef.current = false;
    const t = setTimeout(play, 440);
    return () => clearTimeout(t);
  }, [open, play, tier]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center p-8"
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        background: [
          "radial-gradient(680px 420px at 50% -8%,var(--accent-soft),transparent 70%)",
          "radial-gradient(900px 600px at 50% 120%,rgba(14,165,233,0.08),transparent 70%)",
          "rgba(0,0,0,0.85)",
        ].join(", "),
      }}
    >
      <div className={`rank-card t-${style.cssKey}`} ref={cardRef}>
        {onClose && (
          <button type="button" className="card-close" onClick={onClose} aria-label="Close">
            <Icon.close width={17} height={17} />
          </button>
        )}

        {/* Badge area */}
        <div
          ref={revealRef}
          style={{
            position: "relative",
            width: "100%",
            height: "160px",
            margin: "6px auto",
            display: "grid",
            placeItems: "center",
          }}
        >
          <div className="reveal-glow" />
          <div className="reveal-crown">
            <img ref={badgeRef} src={style.asset} alt={tier} width={72} height={72} />
          </div>
        </div>

        {/* Copy block */}
        <div className="reveal-out" ref={copyRef}>
          <div className="text-[12px] font-bold tracking-[0.22em] uppercase text-quest-accent inline-flex items-center gap-[11px] before:content-[''] before:w-[24px] before:h-px before:bg-quest-accent before:opacity-55 after:content-[''] after:w-[24px] after:h-px after:bg-quest-accent after:opacity-55">
            Tier Milestone
          </div>
          <h2 className="title">
            You reached <span className="grad">{style.label}</span>
          </h2>
          <p className="sub">Claim your tier reward below.</p>
        </div>

        <div className="divider" />

        {/* Reward checklist */}
        <div className="checklist" ref={undefined}>
          <div className="ci" ref={itemRef}>
            <span className="tick">
              <Icon.check width={15} height={15} />
            </span>
            <span>
              <b>+{points.toLocaleString("en-US")} PTS</b> milestone reward
            </span>
          </div>
        </div>

        <button
          type="button"
          className="claim-btn"
          ref={btnRef}
          onClick={onClaim}
          disabled={loading}
        >
          <span>{loading ? "Claiming…" : "Claim reward"}</span>
          <span className="arr">
            <Icon.arrow width={18} height={18} />
          </span>
        </button>
      </div>
    </div>,
    document.getElementById("quest-overlay") ?? document.body
  );
}
