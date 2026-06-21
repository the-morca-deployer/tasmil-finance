import { RankMove } from "./RankMove";

interface LeaderboardRowProps {
  rank: number;
  name: string;
  address: string;
  score: number;
  rankMove: number;
  metric: "points" | "streak";
  top10?: boolean;
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

export function LeaderboardRow({
  rank,
  name,
  address,
  score,
  rankMove,
  metric,
  top10,
}: LeaderboardRowProps) {
  return (
    <div className={`row ${top10 ? "top10" : ""}`}>
      <div className="row-rank">
        {rank}
        <RankMove move={rankMove} />
      </div>
      <div className="row-user">
        <span className="row-av" style={{ background: avatarGradient(address) }} />
        <div>
          <div className="row-name">{name}</div>
          <div className="row-addr">{shortAddr(address)}</div>
        </div>
      </div>
      <div className={`row-score ${metric === "streak" ? "streak" : ""}`}>{score}</div>
      {top10 ? <div className="row-reward" /> : null}
    </div>
  );
}
