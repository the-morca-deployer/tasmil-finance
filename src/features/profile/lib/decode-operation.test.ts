import { decodeOperation, type RawHorizonOp } from "./decode-operation";

const ADDR = "GA7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7";
const OTHER = "GBOTHER1OTHER1OTHER1OTHER1OTHER1OTHER1OTHER1OTHER1";

function base(over: Partial<RawHorizonOp> = {}): RawHorizonOp {
  return {
    id: "op1",
    type: "payment",
    created_at: "2026-05-04T10:00:00Z",
    transaction_hash: "tx1",
    paging_token: "1",
    transaction_successful: true,
    ...over,
  };
}

const noMeta = () => undefined;

describe("decodeOperation — classic ops", () => {
  it("classifies outgoing payment as send", () => {
    const op = base({
      type: "payment",
      from: ADDR,
      to: OTHER,
      amount: "10.0000000",
      asset_type: "native",
    });
    const r = decodeOperation(op, ADDR, noMeta);
    expect(r.kind).toBe("send");
    expect(r.deltas).toEqual([
      { code: "XLM", amount: "10", isCredit: false, issuer: undefined, contractId: undefined },
    ]);
    expect(r.counterparty).toBe(OTHER);
  });

  it("classifies incoming payment as receive", () => {
    const op = base({
      type: "payment",
      from: OTHER,
      to: ADDR,
      amount: "5.5",
      asset_code: "USDC",
      asset_issuer: "GA_ISSUER",
      asset_type: "credit_alphanum4",
    });
    const r = decodeOperation(op, ADDR, noMeta);
    expect(r.kind).toBe("receive");
    expect(r.deltas[0]).toMatchObject({ code: "USDC", amount: "5.5", isCredit: true });
    expect(r.counterparty).toBe(OTHER);
  });

  it("classifies path_payment as swap", () => {
    const op = base({
      type: "path_payment_strict_send",
      from: ADDR,
      to: ADDR,
      source_amount: "100",
      source_asset_type: "native",
      amount: "23.5",
      asset_code: "USDC",
      asset_issuer: "GA_ISSUER",
      asset_type: "credit_alphanum4",
    });
    const r = decodeOperation(op, ADDR, noMeta);
    expect(r.kind).toBe("swap");
    expect(r.deltas).toEqual([
      { code: "XLM", amount: "100", isCredit: false, issuer: undefined, contractId: undefined },
      { code: "USDC", amount: "23.5", isCredit: true, issuer: "GA_ISSUER", contractId: undefined },
    ]);
  });

  it("classifies create_account when wallet is funded as receive", () => {
    const op = base({
      type: "create_account",
      funder: OTHER,
      account: ADDR,
      starting_balance: "10",
    });
    const r = decodeOperation(op, ADDR, noMeta);
    expect(r.kind).toBe("create-account");
    expect(r.deltas[0]).toMatchObject({ code: "XLM", amount: "10", isCredit: true });
  });

  it("classifies change_trust limit=0 as trustline-remove", () => {
    const op = base({
      type: "change_trust",
      asset_code: "USDC",
      asset_issuer: "GA_ISSUER",
      limit: "0.0000000",
    });
    const r = decodeOperation(op, ADDR, noMeta);
    expect(r.kind).toBe("trustline-remove");
  });

  it("classifies change_trust limit>0 as trustline-add", () => {
    const op = base({
      type: "change_trust",
      asset_code: "USDC",
      asset_issuer: "GA_ISSUER",
      limit: "1000",
    });
    const r = decodeOperation(op, ADDR, noMeta);
    expect(r.kind).toBe("trustline-add");
  });

  it("propagates failed transactions", () => {
    const op = base({
      type: "payment",
      from: ADDR,
      to: OTHER,
      amount: "1",
      asset_type: "native",
      transaction_successful: false,
    });
    const r = decodeOperation(op, ADDR, noMeta);
    expect(r.successful).toBe(false);
  });

  it("classifies manage_sell_offer as dex-offer", () => {
    const r = decodeOperation(base({ type: "manage_sell_offer" }), ADDR, noMeta);
    expect(r.kind).toBe("dex-offer");
  });

  it("classifies liquidity_pool_deposit as lp-deposit (stellar)", () => {
    const r = decodeOperation(base({ type: "liquidity_pool_deposit" }), ADDR, noMeta);
    expect(r.kind).toBe("lp-deposit");
    expect(r.protocol).toBe("stellar");
  });

  it("classifies unknown classic type as classic-other", () => {
    const r = decodeOperation(base({ type: "set_options" }), ADDR, noMeta);
    expect(r.kind).toBe("classic-other");
  });
});
