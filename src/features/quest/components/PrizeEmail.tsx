"use client";

/**
 * Prize Email component — matches reference Tasmil Prize Emails.html.
 * Shows a rank-specific reward email card with ticket + sent bar.
 */

const RANK_DATA: Record<
  number,
  { headline: string; body1: string; body2: string; usdc?: string; medal?: string }
> = {
  1: {
    headline: "You're the Champion of Season 3",
    body1:
      "Congratulations! You finished at the very top of the leaderboard. Your strategy and consistency paid off in a big way.",
    body2:
      "Your reward has been sent directly to your connected wallet. Keep the momentum going — Season 4 starts soon.",
    usdc: "$50",
    medal: "/ranks/golden.png",
  },
  2: {
    headline: "Silver Medal Finish — Outstanding",
    body1:
      "You pushed hard and claimed the #2 spot. That's an incredible achievement against thousands of questers.",
    body2:
      "Your reward has been sent to your wallet. One more push next season and the crown is yours.",
    usdc: "$20",
    medal: "/ranks/silver.png",
  },
  3: {
    headline: "Bronze Medal — Podium Finish",
    body1: "Top 3 is elite. You fought through every campaign and earned your place on the podium.",
    body2: "Your reward has been sent. Use it as fuel for Season 4.",
    usdc: "$10",
    medal: "/ranks/bronze.png",
  },
  4: {
    headline: "Top 5 Finish — You're Elite",
    body1:
      "You landed in the top 5, an incredible feat among thousands of competitors. Your dedication to the Tasmil ecosystem has been rewarded.",
    body2: "Your points have been credited to your account. Keep climbing.",
  },
  5: {
    headline: "Top 5 Finish — Impressive Run",
    body1: "You secured a top 5 position with consistent participation and smart questing.",
    body2: "Your reward is in your account. Season 4 awaits.",
  },
  6: {
    headline: "Top 10 — Strong Performance",
    body1:
      "You made it into the top 10. That's no small feat — you're in the top fraction of a percent of all questers.",
    body2: "Your points have been credited. Push for top 5 next season.",
  },
  7: {
    headline: "Top 10 — Consistent Contender",
    body1: "You held your ground and finished in the top 10. Well played.",
    body2: "Your reward is ready. Keep building that streak.",
  },
  8: {
    headline: "Top 10 — Making Waves",
    body1: "Your name is on the leaderboard where it matters. Top 10 is a serious achievement.",
    body2: "Points credited. Next season: aim higher.",
  },
  9: {
    headline: "Top 10 — You Belong Here",
    body1:
      "You earned your spot in the top 10 through consistent effort across multiple campaigns.",
    body2: "Your reward has been sent. See you in Season 4.",
  },
  10: {
    headline: "Top 10 — Rounding Out the Elite",
    body1: "You secured the final top 10 spot. Every point counted — and you made yours count.",
    body2: "Points credited. The next season starts soon.",
  },
};

interface PrizeEmailProps {
  rank: number;
  username?: string;
  pointsReward?: number;
  usdcReward?: string;
}

export function PrizeEmail({
  rank,
  username = "Quester",
  pointsReward = 0,
  usdcReward,
}: PrizeEmailProps) {
  const data = RANK_DATA[rank] ?? {
    headline: `Rank #${rank}`,
    body1: `You finished at rank #${rank} in this season's leaderboard.`,
    body2: "Your reward has been credited to your account.",
  };
  const hasUsdc = !!(data.usdc || usdcReward);

  return (
    <article className={`mail${rank === 1 ? " gold-golden" : ""}`}>
      <div className="mbody">
        {/* Header */}
        <div className="lh">
          <div className="lh-brand">
            <div className="lh-mark">
              <img src="/tasmil-tf-logo.png" alt="Tasmil" />
            </div>
            <div>
              <div className="lh-name">Tasmil Finance</div>
              <div className="lh-tag">AI-managed portfolios on Stellar</div>
            </div>
          </div>
          <span className="lh-pill paid">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Reward Sent
          </span>
        </div>

        <div className="seam" />

        <h1 className="mhead">{data.headline}</h1>
        <p className="mtext">Hi {username},</p>
        <p className="mtext">{data.body1}</p>
        <p className="mtext">{data.body2}</p>

        {/* Ticket */}
        <div className="ticket">
          <div className="ticket-main">
            {data.medal ? (
              <img className="tk-medal" src={data.medal} alt="" />
            ) : (
              <span className="tk-chip">{rank}</span>
            )}
            <div className="tk-col">
              <span className="lab">Final Rank</span>
              <span className="num">#{rank}</span>
              {pointsReward > 0 && <span className="sub">{pointsReward.toLocaleString()} PTS</span>}
            </div>
          </div>
          <div className="ticket-perf" />
          <div className="ticket-side">
            <div className="ts-row">
              <div className="t">Reward</div>
              <div className="v amt">
                {hasUsdc && <span>{data.usdc || usdcReward} USDC</span>}
                {hasUsdc && pointsReward > 0 && <span> + </span>}
                {pointsReward > 0 && <span>{pointsReward.toLocaleString()} PTS</span>}
              </div>
            </div>
            <div className="ts-row">
              <div className="t">Status</div>
              <div className="v sent">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Sent
              </div>
            </div>
          </div>
        </div>

        <button className="cta" type="button">
          View Points Balance
        </button>
      </div>
    </article>
  );
}
