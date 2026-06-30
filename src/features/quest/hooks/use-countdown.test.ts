import { renderHook } from "@testing-library/react";
import { useCountdown } from "./use-countdown";

describe("useCountdown", () => {
  it("reports ended for a past date", () => {
    const { result } = renderHook(() => useCountdown("2000-01-01T00:00:00Z"));
    expect(result.current.ended).toBe(true);
  });

  it("reports not-ended for a far-future date", () => {
    const { result } = renderHook(() => useCountdown("2999-01-01T00:00:00Z"));
    expect(result.current.ended).toBe(false);
  });
});
