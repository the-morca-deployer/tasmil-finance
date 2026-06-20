describe("runtime URL helpers", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.AI_INTERNAL_URL;
    delete process.env.BACKEND_INTERNAL_URL;
    delete process.env.NEXT_PUBLIC_AI_URL;
    delete process.env.NEXT_PUBLIC_BACKEND_URL;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("strips the trailing slash from the public AI URL", async () => {
    process.env.NEXT_PUBLIC_AI_URL = "http://localhost:3000/";

    const { getPublicAiBaseUrl } = await import("./runtime-urls");

    expect(getPublicAiBaseUrl()).toBe("http://localhost:3000");
  });

  it("prefers the current browser origin for browser-side AI traffic", async () => {
    const { getBrowserAiBaseUrl } = await import("./runtime-urls");

    expect(getBrowserAiBaseUrl(process.env, "https://app.tasmil.ai/")).toBe(
      "https://app.tasmil.ai"
    );
  });

  it("prefers the current browser origin for browser-side backend traffic", async () => {
    const { getBrowserBackendBaseUrl } = await import("./runtime-urls");

    expect(getBrowserBackendBaseUrl(process.env, "https://app.tasmil.ai/")).toBe(
      "https://app.tasmil.ai"
    );
  });

  it("prefers AI_INTERNAL_URL for server-side AI traffic", async () => {
    process.env.AI_INTERNAL_URL = "http://ai:8001/";
    process.env.NEXT_PUBLIC_AI_URL = "http://localhost:3000/";

    const { getServerAiBaseUrl } = await import("./runtime-urls");

    expect(getServerAiBaseUrl()).toBe("http://ai:8001");
  });

  it("falls back to the local AI service instead of the public frontend origin", async () => {
    process.env.NEXT_PUBLIC_AI_URL = "http://localhost:3000/";

    const { getServerAiBaseUrl } = await import("./runtime-urls");

    expect(getServerAiBaseUrl()).toBe("http://localhost:8001");
  });

  it("prefers BACKEND_INTERNAL_URL for server-side backend traffic", async () => {
    process.env.BACKEND_INTERNAL_URL = "http://backend:6756/";
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:6756/";

    const { getServerBackendBaseUrl } = await import("./runtime-urls");

    expect(getServerBackendBaseUrl()).toBe("http://backend:6756");
  });

  // Rewrites are built from the declarative PROXY_TARGETS table, so these tests
  // assert the BUILDER behaviour (prefix → `/:path*`, exact verbatim, correct
  // base) rather than a hand-copied list that drifts whenever a route is added.

  it("maps AI prefixes to wildcard rewrites against the server AI base", async () => {
    process.env.AI_INTERNAL_URL = "http://ai:8001/";

    const { getAiProxyRewrites } = await import("./runtime-urls");
    const rewrites = getAiProxyRewrites();

    // every destination points at the resolved AI base (trailing slash stripped)
    expect(rewrites.every((r) => r.destination.startsWith("http://ai:8001/"))).toBe(true);
    // prefixes become `<prefix>/:path*`
    expect(rewrites).toContainEqual({
      source: "/agui/:path*",
      destination: "http://ai:8001/agui/:path*",
    });
    // exact endpoints are forwarded verbatim (no wildcard)
    expect(rewrites).toContainEqual({ source: "/ok", destination: "http://ai:8001/ok" });
  });

  it("maps backend prefixes to wildcard rewrites against the server backend base", async () => {
    process.env.BACKEND_INTERNAL_URL = "http://backend:6756/";

    const { getBackendProxyRewrites } = await import("./runtime-urls");
    const rewrites = getBackendProxyRewrites();

    expect(rewrites.every((r) => r.destination.startsWith("http://backend:6756/"))).toBe(true);
    expect(rewrites).toContainEqual({
      source: "/api/auth/:path*",
      destination: "http://backend:6756/api/auth/:path*",
    });
    expect(rewrites).toContainEqual({
      source: "/api/health",
      destination: "http://backend:6756/api/health",
    });
  });

  it("getProxyRewrites combines backend + AI + quest-backend rewrites", async () => {
    process.env.AI_INTERNAL_URL = "http://ai:8001/";
    process.env.BACKEND_INTERNAL_URL = "http://backend:6756/";
    process.env.QUEST_BACKEND_INTERNAL_URL = "http://quest-backend:5555/";

    const {
      getProxyRewrites,
      getAiProxyRewrites,
      getBackendProxyRewrites,
      getQuestBackendProxyRewrites,
    } = await import("./runtime-urls");

    expect(getProxyRewrites()).toHaveLength(
      getAiProxyRewrites().length +
        getBackendProxyRewrites().length +
        getQuestBackendProxyRewrites().length
    );

    // Quest-backend rewrites must come BEFORE main-backend rewrites so the
    // more-specific /api/admin/referral path wins over /api/admin.
    const all = getProxyRewrites();
    const questIdx = all.findIndex((r) => r.source === "/api/admin/referral/:path*");
    const adminIdx = all.findIndex((r) => r.source === "/api/admin/:path*");
    expect(questIdx).toBeGreaterThanOrEqual(0);
    expect(adminIdx).toBeGreaterThanOrEqual(0);
    expect(questIdx).toBeLessThan(adminIdx);
  });
});
