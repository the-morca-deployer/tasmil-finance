import { fireEvent, render, screen } from "@testing-library/react";
import { OnchainEvidenceSection } from "../components/onchain-evidence-section";
import { useOnchainTraction, useOnchainTxs } from "../hooks/use-onchain-traction";
import { describeReason, explorerAddress, type OnchainTraction } from "../onchain";

jest.mock("../hooks/use-onchain-traction", () => ({
  useOnchainTraction: jest.fn(),
  useOnchainTxs: jest.fn(),
}));

jest.mock("@/lib/kubb-backend", () => ({ getBackendBaseUrl: () => "https://api.example" }));

const ROUTER = "CAVQBFDCWGKCAPCLRPCNONGCAF3WFX2XKINQOU4ET7TNZM77FR5LCI3G";
const TX = "ce59f809bea390adde30424912ca5cc818e43bbb5ee1d3fdafba5f71e3b6b686";

const data: OnchainTraction = {
  summary: {
    tvlUsd: 1500,
    volumeUsd: 4200,
    transactions: 12,
    wallets: 5,
    split: {
      vault: { tvlUsd: 1000, volumeUsd: 2000, transactions: 4, wallets: 2 },
      userSigned: { tvlUsd: 500, volumeUsd: 2200, transactions: 8, wallets: 3 },
    },
  },
  series: [],
  range: { fromLedger: 64711790, toLedger: 64712359, fromTime: null, toTime: null },
  contracts: { executionRouter: ROUTER, venues: [] },
  coverage: { state: "PARTIAL", reasons: ["pending_verification:2"] },
  verification: { verified: 12, failed: 0, notFound: 1 },
  methodology: ["Only transactions confirmed successful on Stellar mainnet Horizon are counted."],
  snapshotDay: "2026-10-01",
  updatedAt: "2026-10-01T00:05:00.000Z",
};

const txs = {
  data: {
    pages: [
      {
        items: [
          {
            txHash: TX,
            source: "USER_SIGNED",
            ledger: 64712359,
            closedAt: "2026-10-01T09:39:37.000Z",
            wallet: "GA2GJHIDS4PMVE5IXC4V2THR2KF2KZHSMN43M5KXBIABFNPRLN5GNEJQ",
            kind: "deposit",
            amountUsd: 25,
          },
        ],
        nextCursor: null,
      },
    ],
  },
  isLoading: false,
  isError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(),
};

describe("OnchainEvidenceSection", () => {
  beforeEach(() => {
    (useOnchainTxs as jest.Mock).mockReturnValue(txs);
  });

  it("renders combined KPIs, coverage reasons and explorer links", () => {
    (useOnchainTraction as jest.Mock).mockReturnValue({ data, isLoading: false, isError: false });

    render(<OnchainEvidenceSection />);

    expect(screen.getByText("Coverage: PARTIAL")).toBeInTheDocument();
    expect(screen.getByText("$1.5k")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(
      screen.getByText("2 transaction(s) still awaiting Horizon confirmation")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ce59f8...b686" })).toHaveAttribute(
      "href",
      `https://stellar.expert/explorer/public/tx/${TX}`
    );
    expect(screen.getByRole("link", { name: "CAVQBF...CI3G" })).toHaveAttribute(
      "href",
      `https://stellar.expert/explorer/public/contract/${ROUTER}`
    );
    expect(screen.getByRole("link", { name: "Download evidence (CSV)" })).toHaveAttribute(
      "href",
      "https://api.example/api/public/traction/onchain/export?format=csv"
    );
  });

  it("switches to the user-signed split and labels TVL as net deposits", () => {
    (useOnchainTraction as jest.Mock).mockReturnValue({ data, isLoading: false, isError: false });

    render(<OnchainEvidenceSection />);
    fireEvent.click(screen.getByRole("button", { name: "User-signed via Tasmil" }));

    expect(screen.getByText("$500")).toBeInTheDocument();
    expect(screen.getByText("Net deposits (deposits - withdrawals)")).toBeInTheDocument();
  });

  it("shows a retry card on error without throwing", () => {
    const refetch = jest.fn();
    (useOnchainTraction as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });

    render(<OnchainEvidenceSection />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(screen.getByText("On-chain evidence could not be loaded.")).toBeInTheDocument();
    expect(refetch).toHaveBeenCalled();
  });
});

describe("onchain helpers", () => {
  it("links contracts and accounts to the right explorer path", () => {
    expect(explorerAddress("CABC")).toContain("/contract/CABC");
    expect(explorerAddress("GABC")).toContain("/account/GABC");
  });

  it("describes known coverage reasons in plain language", () => {
    expect(describeReason("router_not_configured")).toMatch(/router not configured/i);
    expect(describeReason("something_else")).toBe("something_else");
  });
});
