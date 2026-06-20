import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(__dirname, "quest.css"), "utf8");

// Extract the body of the FIRST `.quest-scope { ... }` rule block.
function questScopeBlock(source: string): string {
  const start = source.indexOf(".quest-scope {");
  expect(start).toBeGreaterThanOrEqual(0);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error("unterminated .quest-scope block");
}

describe("quest design tokens", () => {
  const block = questScopeBlock(css);

  it("declares the cyan accent palette inside .quest-scope", () => {
    expect(block).toContain("--accent: #67e8f9");
    expect(block).toContain("--accent-2: #0ea5e9");
    expect(block).toContain("--accent-ink: #04141a");
  });

  it("declares radius / easing / gradient tokens inside .quest-scope", () => {
    expect(block).toContain("--r-card: 22px");
    expect(block).toContain("--r-pill: 100px");
    expect(block).toContain("--ease: cubic-bezier(0.22, 1, 0.36, 1)");
    expect(block).toContain("--grad: linear-gradient(");
  });

  it("points quest fonts at the scoped Next font variables", () => {
    expect(block).toContain("--font: var(--font-quest-sans)");
    expect(block).toContain("--font-mono: var(--font-quest-mono)");
  });

  it("does NOT leak accent tokens to global :root", () => {
    expect(css).not.toMatch(/:root\s*{[^}]*--accent\b/);
  });
});
