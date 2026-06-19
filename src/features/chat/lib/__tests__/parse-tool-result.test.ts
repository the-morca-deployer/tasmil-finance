import { parseToolResult } from "../parse-tool-result";

describe("parseToolResult", () => {
  it("parses a JSON string", () => {
    expect(parseToolResult('{"success":true}')).toEqual({ success: true });
  });

  it("returns raw string when not valid JSON", () => {
    expect(parseToolResult("plain text")).toBe("plain text");
  });

  it("extracts text from MCP content-block array", () => {
    expect(parseToolResult([{ type: "text", text: '{"pools":[]}' }])).toEqual({
      pools: [],
    });
  });

  it("returns array as-is when no text block", () => {
    const input = [{ type: "image", data: "..." }];
    expect(parseToolResult(input)).toEqual(input);
  });

  it("unwraps MCP wrapper {content:[{type:text,...}]}", () => {
    expect(parseToolResult({ content: [{ type: "text", text: '{"result":1}' }] })).toEqual({
      result: 1,
    });
  });

  it("returns plain object as-is when no MCP content", () => {
    expect(parseToolResult({ foo: "bar" })).toEqual({ foo: "bar" });
  });

  it("handles JSON string containing MCP block array", () => {
    const inner = [{ type: "text", text: '{"x":1}' }];
    expect(parseToolResult(JSON.stringify(inner))).toEqual({ x: 1 });
  });
});
