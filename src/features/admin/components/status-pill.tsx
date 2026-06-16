const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: "rgba(110,231,183,0.12)", color: "#6EE7B7" },
  REVOKED: { bg: "rgba(251,113,133,0.12)", color: "#FB7185" },
  EXHAUSTED: { bg: "rgba(255,255,255,0.06)", color: "rgba(245,248,252,0.4)" },
  PENDING: { bg: "rgba(250,204,21,0.12)", color: "#FACC15" },
  CONFIRMED: { bg: "rgba(110,231,183,0.12)", color: "#6EE7B7" },
  ACCESS_SENT: { bg: "rgba(96,165,250,0.12)", color: "#60A5FA" },
  UNSUBSCRIBED: { bg: "rgba(255,255,255,0.06)", color: "rgba(245,248,252,0.4)" },
  BOUNCED: { bg: "rgba(251,113,133,0.12)", color: "#FB7185" },
  RUNNING: { bg: "rgba(96,165,250,0.12)", color: "#60A5FA" },
  COMPLETED: { bg: "rgba(110,231,183,0.12)", color: "#6EE7B7" },
  FAILED: { bg: "rgba(251,113,133,0.12)", color: "#FB7185" },
};

const FALLBACK = { bg: "rgba(255,255,255,0.06)", color: "rgba(245,248,252,0.4)" };

export function StatusPill({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? FALLBACK;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: s.color,
        background: s.bg,
        borderRadius: 99,
        padding: "3px 10px",
      }}
    >
      {status}
    </span>
  );
}
