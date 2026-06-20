import { act, renderHook } from "@testing-library/react";
import { useSeasonCountdown } from "./use-season-countdown";

describe("useSeasonCountdown", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-20T00:00:00.000Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("formats remaining time zero-padded for d/h/m/s", () => {
    // 1 day, 1 hour, 1 minute, 1 second ahead = 90061s
    const endAt = new Date(Date.now() + 90_061 * 1000).toISOString();
    const { result } = renderHook(() => useSeasonCountdown(endAt));
    expect(result.current.d).toBe("01");
    expect(result.current.h).toBe("01");
    expect(result.current.m).toBe("01");
    expect(result.current.s).toBe("01");
    expect(result.current.ended).toBe(false);
  });

  it("decrements every second", () => {
    const endAt = new Date(Date.now() + 5 * 1000).toISOString();
    const { result } = renderHook(() => useSeasonCountdown(endAt));
    expect(result.current.s).toBe("05");
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.s).toBe("03");
  });

  it("reports ended with all zeros past endAt", () => {
    const endAt = new Date(Date.now() - 1000).toISOString();
    const { result } = renderHook(() => useSeasonCountdown(endAt));
    expect(result.current.ended).toBe(true);
    expect(result.current.d).toBe("00");
    expect(result.current.h).toBe("00");
    expect(result.current.m).toBe("00");
    expect(result.current.s).toBe("00");
  });

  it("reports ended when endAt is undefined", () => {
    const { result } = renderHook(() => useSeasonCountdown(undefined));
    expect(result.current.ended).toBe(true);
    expect(result.current.s).toBe("00");
  });
});
