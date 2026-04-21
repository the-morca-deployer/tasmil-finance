describe("next.config AI proxy rewrites", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      AI_INTERNAL_URL: "http://ai:8001",
      NEXT_PUBLIC_STELLAR_TESTNET: "true",
    };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns the AI proxy rewrites without reintroducing the removed Aquarius proxy", async () => {
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
      ]),
    );
    expect(rewrites).not.toEqual(
      expect.arrayContaining([
        {
          source: "/api/aquarius/:path*",
          destination: expect.any(String),
        },
      ]),
    );
  });
});
