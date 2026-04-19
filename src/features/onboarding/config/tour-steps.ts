import type { OnbordaProps } from "onborda";

export const TOUR_NAMES = {
  agents: "agents-tour",
  farming: "farming-tour",
  portfolio: "portfolio-tour",
  aggregator: "aggregator-tour",
} as const;

export const tours: OnbordaProps["steps"] = [
  // ─── Agents Page Tour ──────────────────────────────────────────────────────
  {
    tour: TOUR_NAMES.agents,
    steps: [
      {
        icon: null,
        title: "AI Agents Hub",
        content:
          "This is where you discover all available AI agents. Each agent specializes in different DeFi protocols on Stellar.",
        selector: "[data-onborda='agents-hero']",
        side: "bottom",
        showControls: true,
        pointerPadding: 8,
        pointerRadius: 12,
      },
      {
        icon: null,
        title: "Filter & Search",
        content:
          "Filter agents by type (Protocol or Common) and search by name. Protocol agents execute on-chain, Common agents provide research and analysis.",
        selector: "[data-onborda='agents-filter']",
        side: "bottom",
        showControls: true,
        pointerPadding: 4,
        pointerRadius: 8,
      },
      {
        icon: null,
        title: "Agent Cards",
        content:
          "Click any agent card to start a conversation. The agent can help you execute swaps, lend, bridge, and more.",
        selector: "[data-onborda='agents-grid']",
        side: "top",
        showControls: true,
        pointerPadding: 8,
        pointerRadius: 12,
      },
    ],
  },

  // ─── Farming Page Tour ─────────────────────────────────────────────────────
  {
    tour: TOUR_NAMES.farming,
    steps: [
      {
        icon: null,
        title: "Your Vault Overview",
        content:
          "See your total vault value, current APY, and all-time P&L at a glance. The icon color indicates vault status.",
        selector: "[data-onborda='farming-header']",
        side: "bottom",
        showControls: true,
        pointerPadding: 8,
        pointerRadius: 12,
      },
      {
        icon: null,
        title: "Manage Funds",
        content:
          "Deposit more funds, withdraw available balance, or revoke the session key to stop automation.",
        selector: "[data-onborda='farming-actions']",
        side: "bottom",
        showControls: true,
        pointerPadding: 4,
        pointerRadius: 8,
      },
      {
        icon: null,
        title: "Explore Tabs",
        content:
          "Switch between Overview (allocation chart + activity), Pools (all available pools), and Activity (full transaction history).",
        selector: "[data-onborda='farming-tabs']",
        side: "bottom",
        showControls: true,
        pointerPadding: 4,
        pointerRadius: 8,
      },
    ],
  },

  // ─── Portfolio Page Tour ───────────────────────────────────────────────────
  {
    tour: TOUR_NAMES.portfolio,
    steps: [
      {
        icon: null,
        title: "Portfolio Summary",
        content:
          "Your total portfolio value, broken down by wallet balance and DeFi positions across all Stellar protocols.",
        selector: "[data-onborda='portfolio-header']",
        side: "bottom",
        showControls: true,
        pointerPadding: 8,
        pointerRadius: 12,
      },
      {
        icon: null,
        title: "View Your Data",
        content:
          "Switch between Tokens (balances), Positions (DeFi), NFTs, and Transaction History to explore all your on-chain activity.",
        selector: "[data-onborda='portfolio-tabs']",
        side: "bottom",
        showControls: true,
        pointerPadding: 4,
        pointerRadius: 8,
      },
      {
        icon: null,
        title: "Your Assets",
        content:
          "See all token holdings with real-time prices and USD values. Click 'See Explorer' to view on-chain details.",
        selector: "[data-onborda='portfolio-assets']",
        side: "top",
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 14,
      },
    ],
  },

  // ─── Aggregator Page Tour ──────────────────────────────────────────────────
  {
    tour: TOUR_NAMES.aggregator,
    steps: [
      {
        icon: null,
        title: "DeFi Aggregator",
        content:
          "Swap tokens across multiple DEXes to get the best rates. The aggregator finds the optimal route for your trade.",
        selector: "[data-onborda='aggregator-card']",
        side: "bottom",
        showControls: true,
        pointerPadding: 8,
        pointerRadius: 12,
      },
      {
        icon: null,
        title: "Select Tokens",
        content:
          "Choose the tokens you want to swap — select the input token and amount on top, and the output token below.",
        selector: "[data-onborda='aggregator-inputs']",
        side: "right",
        showControls: true,
        pointerPadding: 8,
        pointerRadius: 12,
      },
      {
        icon: null,
        title: "Execute Swap",
        content:
          "Once tokens and amount are set, click Swap to execute. The aggregator will show you fees and estimated time before confirming.",
        selector: "[data-onborda='aggregator-action']",
        side: "top",
        showControls: true,
        pointerPadding: 4,
        pointerRadius: 8,
      },
    ],
  },
];
