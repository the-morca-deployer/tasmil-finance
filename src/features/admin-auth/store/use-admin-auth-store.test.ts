describe("AdminAuthStore", () => {
  it("should store token and admin on setAuth", () => {
    const { useAdminAuthStore } = require("@/features/admin-auth/store/use-admin-auth-store");

    useAdminAuthStore.getState().setAuth("token-123", {
      id: "admin-1",
      email: "admin@zyf.ai",
      role: "SUPER_ADMIN",
    });

    const state = useAdminAuthStore.getState();
    expect(state.token).toBe("token-123");
    expect(state.admin?.email).toBe("admin@zyf.ai");
    expect(state.isAuthenticated).toBe(true);
  });

  it("should clear auth on clearAuth", () => {
    const { useAdminAuthStore } = require("@/features/admin-auth/store/use-admin-auth-store");

    useAdminAuthStore.getState().setAuth("token-123", {
      id: "admin-1",
      email: "admin@zyf.ai",
      role: "SUPER_ADMIN",
    });

    useAdminAuthStore.getState().clearAuth();

    const state = useAdminAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.admin).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});