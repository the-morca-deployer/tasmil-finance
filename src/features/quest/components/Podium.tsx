import { cn } from "@/lib/utils";

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
    <div className="relative">
      <div
        className="absolute top-[-330px] left-1/2 -translate-x-1/2 w-screen h-[1020px] pointer-events-none z-0 overflow-visible"
        aria-hidden="true"
      />
      <section
        className="relative z-[1] grid items-end gap-[10px] max-w-[680px] mx-auto mt-[78px] mb-[64px] overflow-visible [grid-template-columns:1fr_1.18fr_1fr]"
      >
        {ordered.map((r, i) => {
          if (!r) return <div key={i} className={`pod ${podClasses[i]}`} />;
          const place = placeIdx[i]!;
          const scoreStr = metric === "points"
            ? `${fmt(r.score)} pts`
            : `${r.score}-day streak`;

          const is1st = place === 0;
          const is2nd = place === 1;
          const is3rd = place === 2;

          return (
            <div key={r.rank} className="flex flex-col items-center min-w-0 overflow-visible">
              <div className="relative mb-[11px] overflow-visible">
                <div
                  className={cn(
                    // Centering + crownbob animation come from the global `.pod-crown`
                    // rule (left:50%; transform:translateX(-50%)). Do NOT add a Tailwind
                    // translate here or it double-shifts the crown off-center.
                    "pod-crown absolute z-[3] pointer-events-none",
                    is1st && "top-[-74px] w-[74px]",
                    is2nd && "top-[-54px] w-[52px] [animation-delay:.25s]",
                    is3rd && "top-[-54px] w-[52px] [animation-delay:.5s]",
                  )}
                >
                  <img src={crownImgs[place]} alt="" className="block w-full h-auto" />
                </div>
                <span
                  className={cn(
                    "block w-[64px] h-[64px] rounded-full",
                    is1st && "w-[92px] h-[92px] border-[3px] border-quest-gold [box-shadow:0_0_48px_rgba(251,197,74,0.5),inset_0_0_18px_rgba(0,0,0,0.18)]",
                    is2nd && "border-[3px] border-quest-silver [box-shadow:0_0_24px_rgba(201,212,224,0.28)]",
                    is3rd && "border-[3px] border-quest-bronze [box-shadow:0_0_24px_rgba(224,145,90,0.3)]",
                  )}
                  style={{ background: avatarGradient(r.address) }}
                />
              </div>
              <div
                className={cn(
                  "text-[17px] font-bold tracking-[-0.01em] text-center max-w-[130px] overflow-hidden text-ellipsis whitespace-nowrap",
                  is1st && "text-[19px]",
                )}
              >
                {r.name}
              </div>
              <div className="font-mono text-[14px] text-quest-dim mt-[3px]">{scoreStr}</div>
              <div className="flex items-center justify-center mt-[9px]">
                <span className="inline-flex items-center gap-[5px] font-mono text-[13px] font-bold py-[5px] px-[12px] rounded-quest-pill whitespace-nowrap text-quest-accent bg-quest-accent-soft border border-quest-accent-line">
                  {usdcRewards[place]}
                  <img src="/token/usdc.png" alt="" className="inline-block flex-none w-[15px] h-[15px] rounded-full" />
                  <span className="text-quest-dim">+</span>
                  {fmt(ptsRewards[place]!)}
                  <svg className="inline-block flex-none w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <linearGradient id="ppGrad" x1="0.15" y1="0.1" x2="0.85" y2="0.9"><stop stopColor="#A5F3FC"/><stop offset="1" stopColor="#0EA5E9"/></linearGradient>
                    <circle cx="12" cy="12" r="9" fill="url(#ppGrad)"/><path d="M12.7 6.4l-4.3 6.05h2.9l-.9 4.45 4.4-6.2h-3z" fill="#04141A"/>
                  </svg>
                </span>
              </div>
              <div className="relative w-full mt-[20px] flex flex-col">
                <div
                  className={cn(
                    "h-[38px] mb-0 [clip-path:polygon(0_100%,100%_100%,86%_0,14%_0)] [background:linear-gradient(180deg,#303036,#1c1c21)]",
                    is1st && "h-[50px] [background:linear-gradient(180deg,#3c3c45,#232329)]",
                  )}
                />
                <div
                  className={cn(
                    "relative rounded-b-[13px] grid place-items-center overflow-hidden after:content-[''] after:absolute after:top-0 after:left-0 after:right-0 after:h-[55%] after:[background:linear-gradient(180deg,rgba(255,255,255,0.09),transparent)] after:pointer-events-none",
                    !is1st && "[background:linear-gradient(180deg,#19191d,#0d0d10)] [box-shadow:inset_0_2px_0_rgba(255,255,255,0.13),inset_1px_0_0_rgba(255,255,255,0.06),inset_-2px_0_14px_-7px_rgba(0,0,0,0.6),inset_0_-18px_30px_-18px_rgba(0,0,0,0.7),0_34px_52px_-26px_#000]",
                    is1st && "h-[170px] [background:linear-gradient(180deg,#23232a,#0e0e12)] [box-shadow:inset_0_2px_0_rgba(255,255,255,0.18),inset_1px_0_0_rgba(255,255,255,0.12),inset_0_-18px_32px_-18px_rgba(0,0,0,0.7),0_0_88px_-24px_rgba(150,162,178,0.18),0_36px_56px_-24px_#000]",
                    is2nd && "h-[122px]",
                    is3rd && "h-[98px]",
                  )}
                >
                  <span
                    className={cn(
                      "relative z-[1] font-extrabold tracking-[-0.04em] leading-none text-[58px] [-webkit-background-clip:text] [background-clip:text] text-transparent [filter:drop-shadow(0_3px_3px_rgba(0,0,0,0.55))]",
                      is1st && "text-[92px] [background-image:linear-gradient(180deg,#FFF4CC_0%,#FBC54A_52%,#C8860B_100%)] [filter:drop-shadow(0_3px_4px_rgba(0,0,0,0.5))_drop-shadow(0_0_24px_rgba(251,197,74,0.55))]",
                      is2nd && "[background-image:linear-gradient(180deg,#FFFFFF_0%,#CBD6E2_52%,#8F9EAE_100%)]",
                      is3rd && "[background-image:linear-gradient(180deg,#FFDDBE_0%,#E0915A_52%,#AA5C2C_100%)]",
                    )}
                  >
                    {r.rank}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
