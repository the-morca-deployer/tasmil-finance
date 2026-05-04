import { formatGroupDate, groupByDate } from "./date-group";

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-05-04T12:00:00"));
});
afterAll(() => {
  jest.useRealTimers();
});

describe("formatGroupDate", () => {
  it("returns 'Today' for today", () => {
    expect(formatGroupDate(new Date("2026-05-04T10:00:00"))).toBe("Today");
  });

  it("returns 'Yesterday' for yesterday", () => {
    expect(formatGroupDate(new Date("2026-05-03T18:00:00"))).toBe("Yesterday");
  });

  it("returns weekday + month-day for this-week", () => {
    const out = formatGroupDate(new Date("2026-05-01T09:00:00"));
    expect(out).toMatch(/[A-Za-z]+, [A-Za-z]+ \d+/);
  });

  it("returns full date for older items", () => {
    const out = formatGroupDate(new Date("2026-01-15T10:00:00"));
    expect(out).toMatch(/2026/);
  });
});

describe("groupByDate", () => {
  it("returns empty array for empty input", () => {
    expect(groupByDate([])).toEqual([]);
  });

  it("groups items by calendar day", () => {
    const items = [
      { id: "a", createdAt: "2026-05-04T10:00:00" },
      { id: "b", createdAt: "2026-05-04T22:00:00" },
      { id: "c", createdAt: "2026-05-03T10:00:00" },
    ];
    const out = groupByDate(items);
    expect(out).toHaveLength(2);
    expect(out[0]!.items).toHaveLength(2);
    expect(out[1]!.items).toHaveLength(1);
  });

  it("preserves insertion order within a group", () => {
    const items = [
      { id: "a", createdAt: "2026-05-04T10:00:00" },
      { id: "b", createdAt: "2026-05-04T22:00:00" },
    ];
    const out = groupByDate(items);
    expect(out[0]!.items.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("accepts createdAt as Date or number", () => {
    const items = [
      { id: "a", createdAt: new Date("2026-05-04T10:00:00") },
      { id: "b", createdAt: new Date("2026-05-04T22:00:00").getTime() },
    ];
    const out = groupByDate(items);
    expect(out).toHaveLength(1);
  });

  it("buckets items across local-time day rollover into separate groups", () => {
    // Pin "now" to 2026-05-04 12:00 local. The 23:59-vs-00:01 boundary is the
    // failure mode the implementation handles via toDateString(): if either
    // side were truncated by raw ms-arithmetic instead, both items would
    // collapse into one bucket.
    const items = [
      { id: "late", createdAt: "2026-05-03T23:59:00" }, // Yesterday
      { id: "early", createdAt: "2026-05-04T00:01:00" }, // Today
    ];
    const out = groupByDate(items);
    expect(out).toHaveLength(2);
    expect(out.map((g) => g.items.map((i) => i.id))).toEqual([["late"], ["early"]]);
    expect(out.map((g) => g.label)).toEqual(["Yesterday", "Today"]);
  });
});
