import { qAvatar, qHash } from "./avatar";

describe("qHash", () => {
  it("is deterministic for the same seed", () => {
    expect(qHash("GDQI...3I6R")).toBe(qHash("GDQI...3I6R"));
  });

  it("returns a non-negative integer", () => {
    const h = qHash("alice");
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
  });

  it("returns 0 for the empty string", () => {
    expect(qHash("")).toBe(0);
  });

  it("differs across distinct seeds", () => {
    expect(qHash("alice")).not.toBe(qHash("bob"));
  });
});

describe("qAvatar", () => {
  it("is deterministic for the same seed", () => {
    expect(qAvatar("seed-1")).toBe(qAvatar("seed-1"));
  });

  it("produces a radial-gradient with two hsl stops derived from the hash", () => {
    const h = qHash("seed-1");
    const a = h % 360;
    const b = (h * 3 + 90) % 360;
    expect(qAvatar("seed-1")).toBe(
      `radial-gradient(circle at 32% 28%,hsl(${a} 80% 70%),hsl(${b} 75% 42%) 75%)`
    );
  });
});
