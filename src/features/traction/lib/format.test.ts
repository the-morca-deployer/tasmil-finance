import { fmtDate, fmtUsd } from "./format";

describe("fmtUsd", () => {
  it("rounds to a whole dollar with thousands separators", () => {
    expect(fmtUsd(1234.5)).toBe("$1,235");
    expect(fmtUsd(0)).toBe("$0");
  });
});

describe("fmtDate", () => {
  it("formats an ISO timestamp as a short UTC date", () => {
    expect(fmtDate("2026-07-02T12:00:00.000Z")).toBe("Jul 2, 2026");
  });
});
