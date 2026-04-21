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

  it("builds AI proxy rewrites for browser-facing routes", async () => {
    process.env.AI_INTERNAL_URL = "http://ai:8001/";

    const { getAiProxyRewrites } = await import("./runtime-urls");

    expect(getAiProxyRewrites()).toEqual([
      {
        source: "/assistants/:path*",
        destination: "http://ai:8001/assistants/:path*",
      },
      {
        source: "/threads/:path*",
        destination: "http://ai:8001/threads/:path*",
      },
      {
        source: "/runs/:path*",
        destination: "http://ai:8001/runs/:path*",
      },
      {
        source: "/info",
        destination: "http://ai:8001/info",
      },
      {
        source: "/ok",
        destination: "http://ai:8001/ok",
      },
    ]);
  });
});
