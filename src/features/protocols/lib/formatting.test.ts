describe("toNumberish", () => {
  it("keeps supported number-like values and rejects unsupported ones", async () => {
    const { toNumberish } = await import("./formatting");

    expect(toNumberish(0.125)).toBe(0.125);
    expect(toNumberish("0.25")).toBe("0.25");
    expect(toNumberish(null)).toBeNull();
    expect(toNumberish(undefined)).toBeUndefined();
    expect(toNumberish({ value: 1 })).toBeUndefined();
    expect(toNumberish(["1"])).toBeUndefined();
    expect(toNumberish(true)).toBeUndefined();
  });
});
