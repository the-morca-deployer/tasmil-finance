interface PodiumRow {
  rank: number;
  name: string;
  address: string;
  score: number;
}
interface PodiumProps {
  rows: PodiumRow[];
  metric: "points" | "streak";
}

function shortAddr(a: string) {
  if (!a) return "";
  return a.length <= 10 ? a : `${a.slice(0, 4)}...${a.slice(-4)}`;
}

function avatarGradient(addr: string) {
  if (!addr) return "linear-gradient(135deg, #67E8F9, #0EA5E9)";
  const hash = Array.from(addr).reduce((a, c) => a + c.charCodeAt(0), 0);
  const h1 = (hash * 7) % 360;
  const h2 = (hash * 13) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 70%, 60%), hsl(${h2}, 70%, 45%))`;
}

export function Podium({ rows, metric }: PodiumProps) {
  // Visual order: 2 (silver left), 1 (gold center), 3 (bronze right)
  const byRank = [
    rows.find((r) => r.rank === 2),
    rows.find((r) => r.rank === 1),
    rows.find((r) => r.rank === 3),
  ].filter(Boolean) as PodiumRow[];
  return (
    <div className="podium">
      {byRank.map((r) => (
        <div key={r.rank} className={`pod pod${r.rank}`}>
          <div className="pod-av-wrap">
            <span className="pod-av" style={{ background: avatarGradient(r.address) }} />
          </div>
          <div className="pod-name">{r.name || shortAddr(r.address)}</div>
          <div className="pod-score">
            {r.score} {metric === "points" ? "pts" : "d"}
          </div>
          <div className="pod3d">
            <div className="p3-top" />
            <div className="p3-front">
              <div className="pod-num">{r.rank}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
