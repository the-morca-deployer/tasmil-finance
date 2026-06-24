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
    <>{score.toLocaleString()} <svg className="pcoin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: "inline-block", verticalAlign: -3 }}>
      <linearGradient id="rowPts" x1="0.15" y1="0.1" x2="0.85" y2="0.9"><stop stopColor="#A5F3FC"/><stop offset="1" stopColor="#0EA5E9"/></linearGradient>
      <circle cx="12" cy="12" r="9" fill="url(#rowPts)"/><path d="M12.7 6.4l-4.3 6.05h2.9l-.9 4.45 4.4-6.2h-3z" fill="#04141A"/>
    </svg></>
  ) : (
    <>{score} <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true" style={{ display: "inline-block", verticalAlign: -3, color: "var(--amber)" }}>
      <linearGradient id="rowFlame" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0" stopColor="#FCD34D"/><stop offset="0.5" stopColor="#FB923C"/><stop offset="1" stopColor="#F43F5E"/></linearGradient>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="url(#rowFlame)"/>
    </svg></>
  );

  const reward = top10 && ptsRewards[rank]
    ? <span className="reward-badge">+{ptsRewards[rank]!.toLocaleString()}<svg className="pcoin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: "inline-block", verticalAlign: -3 }}>
        <linearGradient id="rewPts" x1="0.15" y1="0.1" x2="0.85" y2="0.9"><stop stopColor="#A5F3FC"/><stop offset="1" stopColor="#0EA5E9"/></linearGradient>
        <circle cx="12" cy="12" r="9" fill="url(#rewPts)"/><path d="M12.7 6.4l-4.3 6.05h2.9l-.9 4.45 4.4-6.2h-3z" fill="#04141A"/>
      </svg></span>
    : null;

  return (
    <div className={`row${top10 ? " top10" : ""}`}>
      <div className="row-rank">
        {rank}
        {rankMove > 0 && <span className="rank-move up bounce" dangerouslySetInnerHTML={{ __html: CHEV_UP + rankMove }} />}
        {rankMove < 0 && <span className="rank-move down" dangerouslySetInnerHTML={{ __html: CHEV_DN + (-rankMove) }} />}
      </div>
      <div className="row-user">
        <span className="row-av" style={{ background: avatarGradient(address) }} />
        <div>
          <div className="row-name">{name}</div>
          <div className="row-addr">{shortAddr(address)}</div>
        </div>
      </div>
      {reward ? (
        <div className="row-reward">
          {reward}
          <div className="reward-tip">Earn <b>+{ptsRewards[rank]!.toLocaleString()} PTS</b> if you hold rank #{rank} at month end</div>
        </div>
      ) : <span />}
      <div className={`row-score${metric === "streak" ? " streak" : ""}`}>{scoreDisplay}</div>
    </div>
  );
}
