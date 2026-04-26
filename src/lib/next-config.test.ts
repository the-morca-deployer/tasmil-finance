describe("next.config proxy rewrites", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      AI_INTERNAL_URL: "http://ai:8001",
      BACKEND_INTERNAL_URL: "http://backend:6756",
      NEXT_PUBLIC_STELLAR_TESTNET: "true",
    };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns the AI and backend proxy rewrites without reintroducing the removed Aquarius proxy", async () => {
    const { default: nextConfig } = await import("../../next.config");
    const rewrites = await nextConfig.rewrites?.();

    expect(rewrites).toEqual(
      expect.arrayContaining([
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
        {
          source: "/api/account/:path*",
          destination: "http://backend:6756/api/account/:path*",
        },
        {
          source: "/api/pools/:path*",
          destination: "http://backend:6756/api/pools/:path*",
        },
      ]),
    );
    expect(rewrites).not.toEqual(
      expect.arrayContaining([
        {
          source: "/api/aquarius/:path*",
          destination: "https://amm-api-testnet.aqua.network/api/external/v1/:path*",
        },
        {
          source: "/api/waitlist/:path*",
          destination: expect.any(String),
        },
        {
          source: "/api/admin/:path*",
          destination: expect.any(String),
        },
      ]),
    );
  });
});
