import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useWatchList } from "@/store/use-watch-list";
import { AddAssetDialog } from "./add-asset-dialog";

const FAKE_REGISTRY = {
  tokens: [
    { symbol: "BLND", name: "Blend", chains: ["stellar"], addresses: { stellar: "C_BLND" } },
    { symbol: "AQUA", name: "Aquarius", chains: ["stellar"], addresses: { stellar: "C_AQUA" } },
    { symbol: "USDC", name: "USD Coin", chains: ["stellar"], addresses: { stellar: "C_USDC" } },
  ],
};

beforeEach(() => {
  localStorage.clear();
  useWatchList.setState({ items: [] });
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(FAKE_REGISTRY),
    })
  ) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("AddAssetDialog", () => {
  it("renders search input and curated default list", async () => {
    render(<AddAssetDialog open={true} onOpenChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("BLND")).toBeInTheDocument();
    });
  });

  it("renders curated default rows when no query is typed", async () => {
    render(<AddAssetDialog open={true} onOpenChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
    // Curated set intersects the FAKE_REGISTRY at BLND, AQUA, USDC. With no query
    // typed, all three should be visible.
    await waitFor(() => {
      expect(screen.getByText("BLND")).toBeInTheDocument();
      expect(screen.getByText("AQUA")).toBeInTheDocument();
      expect(screen.getByText("USDC")).toBeInTheDocument();
    });
    // Empty-state placeholder must NOT be present
    expect(screen.queryByText(/search to add assets/i)).toBeNull();
  });

  it("filters results by typed query (debounced)", async () => {
    render(<AddAssetDialog open={true} onOpenChange={() => {}} />);
    const input = await screen.findByPlaceholderText(/search/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: "BL" } });
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 250));
    });
    expect(screen.getByText("BLND")).toBeInTheDocument();
    expect(screen.queryByText("AQUA")).toBeNull();
  });

  it("renders 'Watching' disabled state when asset is already watched", async () => {
    // Seed the store with BLND already watched
    useWatchList.getState().addAsset({ symbol: "BLND", contractId: "C_BLND" });

    render(<AddAssetDialog open={true} onOpenChange={() => {}} />);
    const input = await screen.findByPlaceholderText(/search/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: "BL" } });
      await new Promise((r) => setTimeout(r, 250));
    });

    const watchingBtn = screen.getByRole("button", { name: /watching/i });
    expect(watchingBtn).toBeDisabled();
    // Must not also show a clickable "Watch" button for BLND
    expect(screen.queryByRole("button", { name: /^watch$/i })).toBeNull();
  });

  it("clicking Watch adds to store and closes dialog", async () => {
    const onOpenChange = jest.fn();
    render(<AddAssetDialog open={true} onOpenChange={onOpenChange} />);
    const input = await screen.findByPlaceholderText(/search/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: "BL" } });
      await new Promise((r) => setTimeout(r, 250));
    });
    const watchBtn = screen.getByRole("button", { name: /watch/i });
    await act(async () => {
      fireEvent.click(watchBtn);
    });
    const stored = useWatchList.getState().items;
    expect(stored).toHaveLength(1);
    expect(stored[0]!.symbol).toBe("BLND");
    expect(stored[0]!.chain).toBe("stellar");
    expect(stored[0]!.contractId).toBe("C_BLND");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
