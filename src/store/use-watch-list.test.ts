import { act, renderHook } from "@testing-library/react";
import { useWatchList } from "./use-watch-list";

beforeEach(() => {
  localStorage.clear();
  useWatchList.setState({ items: [] });
});

describe("useWatchList", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useWatchList());
    expect(result.current.items).toEqual([]);
  });

  it("addAsset appends and timestamps", () => {
    const { result } = renderHook(() => useWatchList());
    act(() => {
      result.current.addAsset({ symbol: "BLND" });
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]!.symbol).toBe("BLND");
    expect(typeof result.current.items[0]!.addedAt).toBe("number");
  });

  it("addAsset is idempotent on symbol", () => {
    const { result } = renderHook(() => useWatchList());
    act(() => {
      result.current.addAsset({ symbol: "BLND" });
      result.current.addAsset({ symbol: "BLND" });
    });
    expect(result.current.items).toHaveLength(1);
  });

  it("removeAsset drops by symbol", () => {
    const { result } = renderHook(() => useWatchList());
    act(() => {
      result.current.addAsset({ symbol: "BLND" });
      result.current.addAsset({ symbol: "AQUA" });
      result.current.removeAsset("BLND");
    });
    expect(result.current.items.map((i) => i.symbol)).toEqual(["AQUA"]);
  });

  it("isWatched reports correctly", () => {
    const { result } = renderHook(() => useWatchList());
    act(() => result.current.addAsset({ symbol: "BLND" }));
    expect(result.current.isWatched("BLND")).toBe(true);
    expect(result.current.isWatched("XLM")).toBe(false);
  });

  it("persists to localStorage under tasmil.watchlist", () => {
    const { result } = renderHook(() => useWatchList());
    act(() => result.current.addAsset({ symbol: "BLND" }));
    const raw = localStorage.getItem("tasmil.watchlist");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.items[0].symbol).toBe("BLND");
  });
});
