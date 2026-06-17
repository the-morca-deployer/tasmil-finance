import { parseFlowResult } from "../parse-flow-result";

describe("parseFlowResult", () => {
  it("returns null for null", () => {
    expect(parseFlowResult(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(parseFlowResult(undefined)).toBeNull();
  });

  it("parses a JSON string with 'kind' key", () => {
    expect(parseFlowResult(JSON.stringify({ kind: "error", message: "oops" }))).toEqual({
      kind: "error",
      message: "oops",
    });
  });

  it("returns object with 'kind' key directly", () => {
    const obj = { kind: "plan_preview", plan: {} };
    expect(parseFlowResult(obj)).toBe(obj);
  });

  it("returns object with 'questions' key directly", () => {
    const obj = { questions: [] };
    expect(parseFlowResult(obj)).toBe(obj);
  });

  it("returns object with 'plan' key directly", () => {
    const obj = { plan: { steps: [] } };
    expect(parseFlowResult(obj)).toBe(obj);
  });

  it("returns null for object missing expected keys", () => {
    expect(parseFlowResult({ foo: "bar" })).toBeNull();
  });

  it("unwraps MCP content-block array", () => {
    const input = [{ type: "text", text: JSON.stringify({ kind: "tx_ready" }) }];
    expect(parseFlowResult(input)).toEqual({ kind: "tx_ready" });
  });

  it("unwraps object with content array", () => {
    const input = { content: [{ type: "text", text: JSON.stringify({ kind: "cross_chain_plan" }) }] };
    expect(parseFlowResult(input)).toEqual({ kind: "cross_chain_plan" });
  });

  it("unwraps object with content string", () => {
    const input = { content: JSON.stringify({ kind: "plan_preview", plan: {} }) };
    expect(parseFlowResult(input)).toEqual({ kind: "plan_preview", plan: {} });
  });

  it("handles double-serialized JSON", () => {
    const inner = JSON.stringify({ kind: "error", message: "fail" });
    expect(parseFlowResult(JSON.stringify(inner))).toEqual({ kind: "error", message: "fail" });
  });

  it("returns null for unparseable string", () => {
    expect(parseFlowResult("not json")).toBeNull();
  });

  it("returns null for JSON string containing an array", () => {
    expect(parseFlowResult(JSON.stringify([1, 2, 3]))).toBeNull();
  });

  it("returns null for content string containing an array", () => {
    expect(parseFlowResult({ content: JSON.stringify([1, 2, 3]) })).toBeNull();
  });

  it("returns object with 'question' key directly", () => {
    const obj = { question: "Which pool?" };
    expect(parseFlowResult(obj)).toBe(obj);
  });

  it("returns object with 'step' key directly", () => {
    const obj = { step: 1, description: "do thing" };
    expect(parseFlowResult(obj)).toBe(obj);
  });
});
