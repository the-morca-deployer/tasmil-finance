import { act, renderHook } from "@testing-library/react";
import { keyOf, useWatchList } from "./use-watch-list";

beforeEach(() => {
  localStorage.clear();
  useWatchList.setState({ items: [] });
});

describe("useWatchList", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useWatchList());
    expect(result.current.items).toEqual([]);
  });

  it("addAsset appends and timestamps with default chain", () => {
    const { result } = renderHook(() => useWatchList());
    act(() => {
      result.current.addAsset({ symbol: "BLND", contractId: "C_BLND" });
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]!.symbol).toBe("BLND");
    expect(result.current.items[0]!.chain).toBe("stellar");
    expect(typeof result.current.items[0]!.addedAt).toBe("number");
  });

  it("addAsset is idempotent on composite key", () => {
    const { result } = renderHook(() => useWatchList());
    act(() => {
      result.current.addAsset({ symbol: "BLND", contractId: "C_BLND" });
      result.current.addAsset({ symbol: "BLND", contractId: "C_BLND" });
    });
    expect(result.current.items).toHaveLength(1);
  });

  it("addAsset allows same symbol on different chain", () => {
    const { result } = renderHook(() => useWatchList());
    act(() => {
      result.current.addAsset({ symbol: "USDC", chain: "stellar", contractId: "C_USDC" });
      result.current.addAsset({ symbol: "USDC", chain: "ethereum", contractId: "0xUSDC" });
    });
    expect(result.current.items).toHaveLength(2);
  });

  it("removeAsset drops by composite key", () => {
    const { result } = renderHook(() => useWatchList());
    act(() => {
      result.current.addAsset({ symbol: "BLND", contractId: "C_BLND" });
      result.current.addAsset({ symbol: "AQUA", contractId: "C_AQUA" });
      result.current.removeAsset(keyOf({ symbol: "BLND", chain: "stellar", contractId: "C_BLND" }));
    });
    expect(result.current.items.map((i) => i.symbol)).toEqual(["AQUA"]);
  });

  it("isWatched reports correctly by composite key", () => {
    const { result } = renderHook(() => useWatchList());
    act(() => result.current.addAsset({ symbol: "BLND", contractId: "C_BLND" }));
    expect(
      result.current.isWatched(keyOf({ symbol: "BLND", chain: "stellar", contractId: "C_BLND" }))
    ).toBe(true);
    expect(result.current.isWatched(keyOf({ symbol: "XLM", chain: "stellar" }))).toBe(false);
  });

  it("persists to localStorage under tasmil.watchlist", () => {
    const { result } = renderHook(() => useWatchList());
    act(() => result.current.addAsset({ symbol: "BLND", contractId: "C_BLND" }));
    const raw = localStorage.getItem("tasmil.watchlist");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.items[0].symbol).toBe("BLND");
    expect(parsed.state.items[0].chain).toBe("stellar");
    expect(parsed.version).toBe(2);
  });

  it("keyOf builds chain:contractId|issuer|symbol composite", () => {
    expect(keyOf({ symbol: "USDC", chain: "stellar", contractId: "C_USDC" })).toBe(
      "stellar:C_USDC"
    );
    expect(keyOf({ symbol: "EURT", chain: "stellar", issuer: "G_EURT" })).toBe("stellar:G_EURT");
    expect(keyOf({ symbol: "XLM", chain: "stellar" })).toBe("stellar:XLM");
  });

  it("migrates v1 persisted items by defaulting chain to stellar", async () => {
    // Seed localStorage with a v1-shaped fixture (no `chain` field, version: 1)
    const v1Fixture = {
      state: {
        items: [
          { symbol: "BLND", contractId: "C_BLND", addedAt: 1000 },
          { symbol: "AQUA", addedAt: 2000 },
        ],
      },
      version: 1,
    };
    localStorage.setItem("tasmil.watchlist", JSON.stringify(v1Fixture));

    // Force the persist middleware to rehydrate from the seeded value
    await useWatchList.persist.rehydrate();

    const items = useWatchList.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ symbol: "BLND", chain: "stellar", contractId: "C_BLND" });
    expect(items[1]).toMatchObject({ symbol: "AQUA", chain: "stellar" });

    // After rehydrate the persisted version must have been bumped
    const raw = JSON.parse(localStorage.getItem("tasmil.watchlist")!);
    expect(raw.version).toBe(2);
  });
});
