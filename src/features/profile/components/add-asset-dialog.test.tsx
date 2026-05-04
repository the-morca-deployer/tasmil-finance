import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { AddAssetDialog } from "./add-asset-dialog";
import { useWatchList } from "@/store/use-watch-list";

const FAKE_REGISTRY = {
  tokens: [
    { symbol: "BLND", name: "Blend", chains: ["stellar"], addresses: { stellar: "C..." } },
    { symbol: "AQUA", name: "Aquarius", chains: ["stellar"], addresses: { stellar: "C..." } },
    { symbol: "USDC", name: "USD Coin", chains: ["stellar"], addresses: { stellar: "C..." } },
  ],
};

beforeEach(() => {
  localStorage.clear();
  useWatchList.setState({ items: [] });
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(FAKE_REGISTRY),
    }),
  ) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("AddAssetDialog", () => {
  it("renders with empty state when not searched", async () => {
    render(<AddAssetDialog open={true} onOpenChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/search to add assets/i)).toBeInTheDocument();
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
    expect(useWatchList.getState().items.map((i) => i.symbol)).toContain("BLND");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
