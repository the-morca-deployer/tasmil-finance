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
  const scoreDisplay = metric === "points"
    ? `${score.toLocaleString()} pts`
    : `${score}-day streak`;

  const reward = top10 && ptsRewards[rank]
    ? `+${ptsRewards[rank]!.toLocaleString()} PTS`
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
          <span className="reward-badge">{reward}</span>
          <div className="reward-tip">Earn <b>{reward}</b> if you hold rank #{rank} at month end</div>
        </div>
      ) : <span />}
      <div className={`row-score${metric === "streak" ? " streak" : ""}`}>{scoreDisplay}</div>
    </div>
  );
}
