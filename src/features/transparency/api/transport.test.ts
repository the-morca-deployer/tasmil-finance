import { unwrapBackendData } from "./transport";

describe("unwrapBackendData", () => {
  it("unwraps a standard backend response", () => {
    const payload = { items: [] };

    expect(unwrapBackendData({ success: true, data: payload })).toBe(payload);
  });

  it("unwraps a legacy controller response wrapped by the global interceptor", () => {
    const payload = { vaults: [{ accountId: "vault-1" }] };

    expect(
      unwrapBackendData({
        success: true,
        data: { success: true, data: payload },
      })
    ).toBe(payload);
  });

  it("unwraps a legacy transport wrapper without an explicit success flag", () => {
    const payload = { value: 1 };

    expect(unwrapBackendData({ data: payload })).toBe(payload);
  });
});
