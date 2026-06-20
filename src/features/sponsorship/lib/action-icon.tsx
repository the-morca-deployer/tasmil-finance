import type { SponsorshipAction } from "../types";

export function ActionIcon({
  action,
  className,
}: {
  action: SponsorshipAction;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
  switch (action) {
    case "DEPOSIT":
      return (
        <svg {...common}>
          <path d="M12 5v12M7 12l5 5 5-5" />
        </svg>
      );
    case "WITHDRAW":
      return (
        <svg {...common}>
          <path d="M12 19V7M7 12l5-5 5 5" />
        </svg>
      );
    case "REBALANCE":
      return (
        <svg {...common}>
          <path d="M4 9h13l-3-3M20 15H7l3 3" />
        </svg>
      );
    case "HARVEST":
      return (
        <svg {...common}>
          <path d="M3 12c4-6 14-6 18 0M3 12c4 6 14 6 18 0" />
        </svg>
      );
  }
}
