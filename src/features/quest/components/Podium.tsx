interface PodiumRow { rank: number; name: string; address: string; score: number; }
interface PodiumProps { rows: PodiumRow[]; metric: "points" | "streak"; usdcRewards?: string[]; ptsRewards?: number[]; }

function avatarGradient(addr: string) {
  if (!addr) return "linear-gradient(135deg, #67E8F9, #0EA5E9)";
  const hash = Array.from(addr).reduce((a, c) => a + c.charCodeAt(0), 0);
  const h1 = (hash * 7) % 360;
  return `radial-gradient(circle at 32% 28%, hsl(${h1} 80% 70%), hsl(${(h1 * 3 + 90) % 360} 75% 42%) 75%)`;
}

const fmt = (n: number) => n.toLocaleString("en-US");

export function Podium({ rows, metric, usdcRewards = ["50", "20", "10"], ptsRewards = [5000, 3000, 2000] }: PodiumProps) {
  // Visual order: [2nd (left), 1st (center), 3rd (right)]
  const ordered = [rows.find((r) => r.rank === 2), rows.find((r) => r.rank === 1), rows.find((r) => r.rank === 3)];
  const crownImgs = ["/ranks/golden.png", "/ranks/silver.png", "/ranks/bronze.png"];
  const podClasses = ["pod1", "pod2", "pod3"];
  const placeIdx = [1, 0, 2]; // index into usdc/pts: 0=1st, 1=2nd, 2=3rd

  return (
    <div className="podium-wrap">
      <div className="spotlight-stage" aria-hidden="true" />
      <section className="podium">
        {ordered.map((r, i) => {
          if (!r) return <div key={i} className={`pod ${podClasses[i]}`} />;
          const place = placeIdx[i]!;
          const scoreStr = metric === "points"
            ? `${fmt(r.score)} pts`
            : `${r.score}-day streak`;
          return (
            <div key={r.rank} className={`pod ${podClasses[place]}`}>
              <div className="pod-av-wrap">
                <div className="pod-crown">
                  <img src={crownImgs[place]} alt="" />
                </div>
                <span className="pod-av" style={{ background: avatarGradient(r.address) }} />
              </div>
              <div className="pod-name">{r.name}</div>
              <div className="pod-score">{scoreStr}</div>
              <div className="pod-prize">
                <span className="pp usdc">
                  {usdcRewards[place]}
                  <img src="/token/usdc.png" alt="" className="usdc-coin" />
                  USDC
                </span>
                <span className="pp pts">
                  +{fmt(ptsRewards[place]!)}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: "inline-block", verticalAlign: -2 }}>
                    <linearGradient id="ppGrad" x1="0.15" y1="0.1" x2="0.85" y2="0.9"><stop stopColor="#A5F3FC"/><stop offset="1" stopColor="#0EA5E9"/></linearGradient>
                    <circle cx="12" cy="12" r="9" fill="url(#ppGrad)"/><path d="M12.7 6.4l-4.3 6.05h2.9l-.9 4.45 4.4-6.2h-3z" fill="#04141A"/>
                  </svg>
                  PTS
                </span>
              </div>
              <div className="pod3d">
                <div className="p3-top" />
                <div className="p3-front">
                  <span className="pod-num">{r.rank}</span>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
