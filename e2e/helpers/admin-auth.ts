import { type Page } from "@playwright/test";

/**
 * Synthesize an unsigned JWT whose `exp` claim is in the future. The
 * AdminAuthGuard (src/features/admin-auth/components/admin-auth-guard.tsx)
 * only inspects `exp` client-side - signature is not verified there - so
 * this is sufficient to satisfy the guard. The backend `/api/admin/**`
 * endpoints are mocked via page.route() in the spec so the JWT never
 * reaches a real verifier.
 */
function fakeAdminJwt(expSecondsFromNow = 60 * 60): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "admin-e2e",
      role: "admin",
      exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
    })
  ).toString("base64url");
  return `${header}.${payload}.`;
}

export interface AdminLoginOpts {
  email?: string;
  role?: string;
}

/**
 * Seed `admin-auth-storage` via addInitScript so AdminAuthGuard treats
 * this page as authenticated. Must be called BEFORE page.goto().
 */
export async function loginAsAdmin(page: Page, opts: AdminLoginOpts = {}): Promise<void> {
  const token = fakeAdminJwt();
  const email = opts.email ?? "admin-e2e@example.com";
  const role = opts.role ?? "superadmin";

  await page.addInitScript(
    ({ token, email, role }) => {
      localStorage.setItem(
        "admin-auth-storage",
        JSON.stringify({
          state: {
            token,
            admin: { id: "admin-e2e", email, role },
            isAuthenticated: true,
            hasHydrated: true,
          },
          version: 0,
        })
      );
    },
    { token, email, role }
  );
}
