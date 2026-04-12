// Smoke tests - verify structure without React Query context
describe("useWaitlist module structure", () => {
  it("should export the hook", async () => {
    const mod = await import("../hooks/use-waitlist");
    expect(mod.useWaitlist).toBeDefined();
    expect(typeof mod.useWaitlist).toBe("function");
  });
});