import { TextDecoder, TextEncoder } from "node:util";

Object.assign(globalThis, {
  TextDecoder,
  TextEncoder,
});

describe("parseSigningError", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_STELLAR_NETWORK: "mainnet",
    };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("maps Horizon not_found responses to an account activation hint", async () => {
    const { parseSigningError } = await import("./stellar-network-check");

    expect(
      parseSigningError({
        type: "https://stellar.org/horizon-errors/not_found",
        title: "Resource Missing",
        status: 404,
        detail: "The resource at the url requested was not found.",
      }),
    ).toBe(
      "Stellar account was not found on Mainnet. Fund or activate this address on Mainnet, then try again.",
    );
  });
});
