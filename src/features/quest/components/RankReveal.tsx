"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons";

type Tier = "gold" | "silver" | "bronze" | "aqua";

const fmt = (n: number) => n.toLocaleString("en-US");

const CROWN: Record<Tier, string> = {
  gold: "/ranks/golden.png",
  silver: "/ranks/silver.png",
  bronze: "/ranks/bronze.png",
  aqua: "/ranks/aqua-crown.png",
};

function tierFor(rank: number, badge?: string): Tier {
  const b = (badge ?? "").toLowerCase();
  if (b === "gold" || b === "silver" || b === "bronze" || b === "aqua") return b;
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "aqua";
}

// ── Confetti ──
const PALETTES: Record<Tier, string[]> = {
  gold: ["#FBC54A", "#FFE9A6", "#ffffff", "#67E8F9"],
  silver: ["#C9D4E0", "#ffffff", "#9FB0C2", "#67E8F9"],
  bronze: ["#E0915A", "#FFD2AC", "#ffffff", "#67E8F9"],
  aqua: ["#67E8F9", "#0EA5E9", "#ffffff", "#6EE7B7"],
};

function fireConfetti(container: HTMLElement, tier: Tier) {
  const cols = PALETTES[tier];
  for (let i = 0; i < 22; i++) {
    const piece = document.createElement("span");
    piece.className = "cf";
    piece.style.width = `${i % 2 ? 5 : 4}px`;
    piece.style.height = `${i % 3 ? 10 : 6}px`;
    piece.style.background = cols[i % cols.length]!;
    container.appendChild(piece);
    const ang = (-90 + (Math.random() * 340 - 170)) * (Math.PI / 180);
    const dist = 80 + Math.random() * 120;
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
      { duration: 1000 + Math.random() * 500, easing: "cubic-bezier(0.18,0.7,0.3,1)" }
    ).onfinish = () => piece.remove();
  }
}

// ── Crown fly-in ──
function flyCrown(img: HTMLImageElement) {
  const fromX = (Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 40);
  img.style.opacity = "0";
  const a = img.animate(
    [
      {
        transform: `translate(${fromX}px,-210px) rotate(${fromX > 0 ? 40 : -40}deg) scale(0.35)`,
        opacity: 0,
      },
      {
        transform: `translate(${fromX * 0.18}px,-40px) rotate(${fromX > 0 ? 10 : -10}deg) scale(0.8)`,
        opacity: 1,
        offset: 0.45,
      },
      { transform: "translate(0,5px) rotate(3deg) scale(1.14)", opacity: 1, offset: 0.78 },
      { transform: "translate(0,0) rotate(0deg) scale(1)", opacity: 1 },
    ],
    { duration: 1000, easing: "cubic-bezier(0.34,1.4,0.5,1)", fill: "forwards" }
  );
  a.onfinish = () => {
    a.cancel();
    img.style.opacity = "1";
    img.style.transform = "";
    img.classList.add("bob");
  };
}

// ── Count 100 → target ──
function animateCount(el: HTMLElement, target: number, done: () => void) {
  const start = 100;
  const dur = 1600;
  const t0 = performance.now();
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = `#${Math.round(start + (target - start) * ease(p))}`;
    if (p < 1) requestAnimationFrame(step);
    else {
      el.textContent = `#${target}`;
      done();
    }
  };
  requestAnimationFrame(step);
}

// ── Component ──
export interface RankRevealProps {
  rank: number;
  usdcReward: string;
  pointsReward: number;
  badge?: string;
  seasonName: string;
  onClaim: () => void;
  onClose?: () => void;
  open: boolean;
}

export function RankReveal({
  rank,
  usdcReward,
  pointsReward,
  badge,
  seasonName,
  onClaim,
  onClose,
  open,
}: RankRevealProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const crownRef = useRef<HTMLImageElement>(null);
  const plinthRef = useRef<HTMLSpanElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const ranRef = useRef(false);
  const tier = tierFor(rank, badge);
  const hasUsdc = Number(usdcReward) > 0;

  const play = useCallback(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const card = cardRef.current;
    const reveal = revealRef.current;
    const crown = crownRef.current;
    const plinth = plinthRef.current;
    const copyBlock = copyRef.current;
    const list = listRef.current;
    const btn = btnRef.current;
    if (!card || !reveal || !crown || !plinth || !copyBlock || !list || !btn) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      card.classList.add("in");
      plinth.textContent = `#${rank}`;
      crown.style.opacity = "1";
      crown.classList.add("bob");
      copyBlock.classList.add("in");
      list.querySelectorAll(".ci").forEach((c) => c.classList.add("in"));
      btn.classList.add("in");
      return;
    }

    // Phase 1: Card CSS transition via .in class
    card.classList.add("in");

    // Phase 2: Start count after 420ms
    plinth.textContent = "#100";
    reveal.classList.add("show-slot");
    copyBlock.classList.add("in");

    setTimeout(() => {
      animateCount(plinth, rank, () => {
        plinth.classList.add("pop");
        reveal.classList.remove("show-slot");
        fireConfetti(reveal, tier);
        flyCrown(crown);

        // Phase 3: Stagger checklist
        const items = list.querySelectorAll(".ci");
        items.forEach((c, i) => {
          setTimeout(() => c.classList.add("in"), 520 + i * 130);
        });
        setTimeout(() => btn.classList.add("in"), 520 + items.length * 130);
      });
    }, 420);
  }, [rank, tier]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(play, 480);
    return () => clearTimeout(t);
  }, [open, play]);

  if (!open) return null;

  return createPortal(
    // .rank-reveal-backdrop: fixed; inset:0; z-index:100; grid place-items-center; padding:32px;
    //   backdrop-filter:blur(16px); background: radial-gradient+rgba(0,0,0,0.85)
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
      {/* .rank-card: relative; width:min(540px,100%); border-radius:28px; padding:38px 40px 36px;
           background: radial-gradient+linear-gradient; border:1px solid var(--line); box-shadow:…; text-align:center;
           opacity:0; transform:scale(.93) translateY(10px); transition:opacity .5s,transform .5s ease-out
           .rank-card.in: opacity:1; transform:none
           NOTE: opacity/transform/transition kept in quest.css only (inline styles override .in class) */}
      <div className={`rank-card t-${tier}`} ref={cardRef}>
        {onClose && (
          // .card-close: absolute; top:18px; right:18px; width:38px; height:38px; border-radius:50%;
          //   grid place-items-center; cursor:pointer; background:rgba(255,255,255,0.05); border:1px solid var(--line-2);
          //   color:var(--muted); transition:background .2s,color .2s,transform .2s; z-index:1
          //   :hover: background:rgba(255,255,255,0.09); color:var(--text); transform:rotate(90deg)
          <button type="button" className="card-close" onClick={onClose} aria-label="Close">
            <Icon.close width={17} height={17} />
          </button>
        )}

        {/* .reveal: relative; width:100%; height:172px; margin:6px auto; grid place-items-center */}
        {/* .reveal.show-slot .crown-slot: opacity:.7 */}
        {/* t-* class on reveal controls glow color via quest.css */}
        <div
          className={`reveal t-${tier}`}
          ref={revealRef}
          style={{
            position: "relative",
            width: "100%",
            height: "172px",
            margin: "6px auto",
            display: "grid",
            placeItems: "center",
          }}
        >
          {/* .reveal-glow: absolute; top:42px; width:180px; height:120px; border-radius:50%;
               background:radial-gradient(…accent-glow…); opacity:.32; filter:blur(8px); pointer-events:none
               t-* variants override background — kept via quest.css */}
          <div className="reveal-glow" />

          {/* .crown-slot: absolute; top:8px; left:50%; transform:translateX(-50%); width:74px; height:60px;
               border-radius:14px 14px 50% 50%; border:1.5px dashed var(--line-2); opacity:0;
               transition:opacity .35s; .show-slot → opacity:.7 */}
          <div className="crown-slot" />

          {/* .reveal-crown: absolute; top:-6px; left:50%; transform:translateX(-50%); z-index:6; width:72px
               t-silver/bronze/aqua: width:60px; top:2px */}
          <div className="reveal-crown">
            {/* img.bob animation: reveal-crownbob 3s infinite — kept via quest.css @keyframes */}
            <img ref={crownRef} src={CROWN[tier]} alt="" />
          </div>

          {/* .plinth: relative; margin-top:64px; flex col; align-items:center */}
          <div className="plinth">
            {/* .plinth-num: font-weight:800; letter-spacing:-0.04em; line-height:1; font-size:84px;
                 -webkit-background-clip:text; color:transparent; filter:drop-shadow(…)
                 t-* variants set background-image — kept via quest.css
                 .pop animation: numpop .5s — kept via quest.css @keyframes */}
            <span className="plinth-num" ref={plinthRef}>
              #{rank}
            </span>
          </div>
        </div>

        {/* .reveal-out: opacity:0; transform:translateY(10px); transition:opacity .5s,transform .5s ease-out
             .reveal-out.in: opacity:1; transform:none */}
        <div className="reveal-out" ref={copyRef}>
          {/* .eyebrow (rank-card variant): inline-flex; align-items:center; gap:11px; font-size:12px; font-weight:700;
               letter-spacing:0.22em; text-transform:uppercase; color:var(--accent); margin-bottom:13px
               ::before/::after: content:""; width:24px; height:1px; background:var(--accent); opacity:.55 */}
          <div className="text-[12px] font-bold tracking-[0.22em] uppercase text-quest-accent inline-flex items-center gap-[11px] before:content-[''] before:w-[24px] before:h-px before:bg-quest-accent before:opacity-55 after:content-[''] after:w-[24px] after:h-px after:bg-quest-accent after:opacity-55">
            {seasonName} Season
          </div>
          {/* .title: font-size:38px; font-weight:800; letter-spacing:-0.035em; line-height:1.04
               .grad: gradient text */}
          <h2 className="title">
            {rank === 1 ? (
              <>
                You&rsquo;re the <span className="grad">champion</span>
              </>
            ) : rank <= 3 ? (
              <>
                You made the <span className="grad">podium</span>
              </>
            ) : (
              <>
                You finished <span className="grad">top 10</span>
              </>
            )}
          </h2>
          {/* .sub: margin-top:14px; font-size:16px; color:var(--muted); line-height:1.55; max-width:380px; mx-auto */}
          <p className="sub">Here is everything you have earned this season.</p>
        </div>

        {/* .divider: height:1px; background:var(--line); margin:26px 4px 22px */}
        <div className="divider" />

        {/* .checklist: flex flex-col; gap:16px; text-align:left; padding:0 6px */}
        <div className="checklist" ref={listRef}>
          {hasUsdc && (
            // .ci: flex; align-items:center; gap:15px; font-size:16px; color:var(--text);
            //   opacity:0; transform:translateY(8px); transition:opacity .45s,transform .45s ease-out
            //   .ci.in: opacity:1; transform:none
            <div className="ci">
              {/* .tick: flex:none; width:30px; height:30px; border-radius:50%; grid place-items-center;
                   background:var(--accent-soft); border:1px solid var(--accent-line); color:var(--accent) */}
              <span className="tick">
                <Icon.check width={15} height={15} />
              </span>
              <span>
                <b>{usdcReward} USDC</b> sent to your wallet
              </span>
            </div>
          )}
          <div className="ci">
            <span className="tick">
              <Icon.check width={15} height={15} />
            </span>
            <span>
              <b>+{fmt(pointsReward)} PTS</b> added to your balance
            </span>
          </div>
          <div className="ci">
            <span className="tick">
              <Icon.check width={15} height={15} />
            </span>
            <span>Season badge unlocked</span>
          </div>
        </div>

        {/* .claim-btn: flex; align-items:center; justify-content:center; gap:10px; width:100%; margin-top:26px;
             padding:18px; border-radius:100px; border:none; cursor:pointer; font-size:17px; font-weight:700;
             letter-spacing:-0.01em; color:var(--accent-ink); background:var(--grad);
             box-shadow:0 0 40px -12px var(--accent-glow);
             transition:transform .35s var(--ease),box-shadow .35s var(--ease);
             opacity:0; transform:translateY(10px);
             .claim-btn.in: opacity:1; transform:none
             :hover: transform:translateY(-2px); box-shadow:0 14px 44px -10px var(--accent-glow)
             .arr: transition:transform .35s var(--ease)  :hover .arr: translateX(4px) */}
        <button type="button" className="claim-btn" ref={btnRef} onClick={onClaim}>
          <span>{hasUsdc ? "Claim my reward" : "Claim my points"}</span>
          <span className="arr">
            <Icon.arrow width={18} height={18} />
          </span>
        </button>
      </div>
    </div>,
    document.getElementById("quest-overlay") ?? document.body
  );
}
