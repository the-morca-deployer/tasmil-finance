import { cn } from "@/lib/utils";

interface LeaderboardRowProps {
  rank: number; name: string; address: string; score: number; rankMove: number;
  metric: "points" | "streak"; top10?: boolean;
}

function shortAddr(a: string) {
  if (!a) return "";
  return a.length <= 10 ? a : `${a.slice(0, 4)}...${a.slice(-4)}`;
}

function avatarGradient(addr: string) {
  if (!addr) return "linear-gradient(135deg, #67E8F9, #0EA5E9)";
  const hash = Array.from(addr).reduce((a, c) => a + c.charCodeAt(0), 0);
  const h1 = (hash * 7) % 360;
  return `radial-gradient(circle at 32% 28%, hsl(${h1} 80% 70%), hsl(${(h1 * 3 + 90) % 360} 75% 42%) 75%)`;
}

const ptsRewards: Record<number, number> = { 4: 1500, 5: 1200, 6: 1000, 7: 800, 8: 600, 9: 400, 10: 200 };

const CHEV_UP = '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14l6-6 6 6"/></svg>';
const CHEV_DN = '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10l6 6 6-6"/></svg>';

export function LeaderboardRow({ rank, name, address, score, rankMove, metric, top10 }: LeaderboardRowProps) {
  const scoreDisplay = metric === "points" ? (
    <>{score.toLocaleString()}<svg className="pcoin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <linearGradient id="rowPts" x1="0.15" y1="0.1" x2="0.85" y2="0.9"><stop stopColor="#A5F3FC"/><stop offset="1" stopColor="#0EA5E9"/></linearGradient>
      <circle cx="12" cy="12" r="9" fill="url(#rowPts)"/><path d="M12.7 6.4l-4.3 6.05h2.9l-.9 4.45 4.4-6.2h-3z" fill="#04141A"/>
    </svg></>
  ) : (
    <>{score}<svg className="pcoin" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--amber)" }}>
      <linearGradient id="rowFlame" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0" stopColor="#FCD34D"/><stop offset="0.5" stopColor="#FB923C"/><stop offset="1" stopColor="#F43F5E"/></linearGradient>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="url(#rowFlame)"/>
    </svg></>
  );

  const reward = top10 && ptsRewards[rank]
    ? <span className="inline-flex items-center gap-[5px] text-[12px] font-bold font-mono py-[5px] px-[12px] rounded-quest-pill bg-quest-accent-soft border border-quest-accent-line text-quest-accent cursor-default [&_svg]:w-[12px] [&_svg]:h-[12px]">+{ptsRewards[rank]!.toLocaleString()}<svg className="pcoin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <linearGradient id="rewPts" x1="0.15" y1="0.1" x2="0.85" y2="0.9"><stop stopColor="#A5F3FC"/><stop offset="1" stopColor="#0EA5E9"/></linearGradient>
        <circle cx="12" cy="12" r="9" fill="url(#rewPts)"/><path d="M12.7 6.4l-4.3 6.05h2.9l-.9 4.45 4.4-6.2h-3z" fill="#04141A"/>
      </svg></span>
    : null;

  return (
    <div
      className={cn(
        "grid items-center gap-[16px] px-[24px] py-[13px] relative transition-[background] duration-200 [grid-template-columns:46px_1fr_auto_auto] hover:bg-quest-accent-soft",
        "[&+&]:border-t [&+&]:border-quest-line",
      )}
    >
      {/* row-rank */}
      <div className={cn(
        "font-mono text-[15px] font-bold text-quest-dim text-center flex items-center justify-center gap-[5px]",
        top10 && "text-quest-text",
      )}>
        {rank}
        {rankMove > 0 && <span className="rank-move up bounce" dangerouslySetInnerHTML={{ __html: CHEV_UP + rankMove }} />}
        {rankMove < 0 && <span className="rank-move down" dangerouslySetInnerHTML={{ __html: CHEV_DN + (-rankMove) }} />}
      </div>
      {/* row-user */}
      <div className="flex items-center gap-[13px] min-w-0">
        <span className="block w-[40px] h-[40px] rounded-full flex-none" style={{ background: avatarGradient(address) }} />
        <div>
          <div className="text-[14.5px] font-semibold tracking-[-0.01em]">{name}</div>
          <div className="font-mono text-[11.5px] text-quest-dim mt-[2px]">{shortAddr(address)}</div>
        </div>
      </div>
      {/* row-reward */}
      {reward ? (
        <div className="relative group">
          {reward}
          <div className="absolute bottom-[calc(100%+9px)] right-0 whitespace-nowrap text-[12px] font-medium py-[8px] px-[12px] rounded-[9px] bg-[#0A0D14] border border-quest-line-2 shadow-[0_12px_30px_-12px_#000] opacity-0 pointer-events-none translate-y-1 transition-[opacity,transform] duration-200 z-[5] group-hover:opacity-100 group-hover:translate-y-0">
            Earn <b className="text-quest-accent">+{ptsRewards[rank]!.toLocaleString()} PTS</b> if you hold rank #{rank} at month end
          </div>
        </div>
      ) : <span />}
      {/* row-score */}
      <div
        className={cn(
          "font-mono text-[14px] font-bold text-right min-w-[96px] [&_.unit]:text-quest-dim [&_.unit]:font-normal [&_.unit]:text-[12px] [&_.unit]:ml-[3px] [&_svg]:inline-block [&_svg]:[vertical-align:-0.3em] [&_svg]:w-[1.35em] [&_svg]:h-[1.35em] [&_svg]:ml-[3px]",
          top10 && "text-quest-text",
          metric === "streak" && "text-quest-amber",
        )}
      >
        {scoreDisplay}
      </div>
    </div>
  );
}
