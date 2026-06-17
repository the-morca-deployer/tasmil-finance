import React from "react";
import { ToolRendererRegistry } from "../tool-renderer-registry";

const MockComp = () => null;

describe("ToolRendererRegistry", () => {
  let r: ToolRendererRegistry;
  beforeEach(() => {
    r = new ToolRendererRegistry();
  });

  it("returns null for unknown tool", () => {
    expect(r.get("nope")).toBeNull();
  });

  it("registers and retrieves an info entry", () => {
    r.register("t_info", { kind: "info", component: MockComp, label: "lbl" });
    const e = r.get("t_info");
    expect(e?.kind).toBe("info");
    if (e?.kind === "info") expect(e.label).toBe("lbl");
  });

  it("registers and retrieves an operation entry", () => {
    r.register("t_op", { kind: "operation", component: MockComp, label: "op" });
    expect(r.get("t_op")?.kind).toBe("operation");
  });

  it("registers and retrieves a shared entry", () => {
    const renderFn = () => React.createElement("span");
    r.register("t_sh", { kind: "shared", render: renderFn });
    const e = r.get("t_sh");
    expect(e?.kind).toBe("shared");
    if (e?.kind === "shared") expect(e.render).toBe(renderFn);
  });

  it("registers and retrieves a shared-op entry", () => {
    const renderFn = () => React.createElement("span");
    r.register("t_sop", { kind: "shared-op", render: renderFn });
    const e = r.get("t_sop");
    expect(e?.kind).toBe("shared-op");
    if (e?.kind === "shared-op") expect(e.render).toBe(renderFn);
  });

  it("has() returns true/false correctly", () => {
    r.register("x", { kind: "info", component: MockComp, label: "x" });
    expect(r.has("x")).toBe(true);
    expect(r.has("y")).toBe(false);
  });

  it("size() reflects registration count", () => {
    expect(r.size).toBe(0);
    r.register("a", { kind: "info", component: MockComp, label: "a" });
    r.register("b", { kind: "info", component: MockComp, label: "b" });
    expect(r.size).toBe(2);
  });

  it("later registration overwrites earlier", () => {
    r.register("dup", { kind: "info", component: MockComp, label: "first" });
    r.register("dup", { kind: "info", component: MockComp, label: "second" });
    const e = r.get("dup");
    expect(e?.kind === "info" && e.label).toBe("second");
  });
});
