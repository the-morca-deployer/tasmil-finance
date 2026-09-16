import { readFileSync } from "node:fs";
import { join } from "node:path";

// Quest styles were relocated to globals.css (quest.css deleted in refactor).
// The design tokens live under the `.quest-scope { --bg: ... }` block inside
// the Quest feature section of globals.css.
const css = readFileSync(join(__dirname, "../../app/globals.css"), "utf8");

// Extract the body of the `.quest-scope` block that contains the design tokens
// (i.e., the one that declares --bg, not the tiny --quest-grad helper block).
function questScopeBlock(source: string): string {
  // Find the quest-scope block that contains the design tokens (--bg token is
  // the distinguishing marker - the small helper block only has --quest-grad).
  let searchFrom = 0;
  while (true) {
    const start = source.indexOf(".quest-scope {", searchFrom);
    expect(start).toBeGreaterThanOrEqual(0);
    const open = source.indexOf("{", start);
    let depth = 0;
    let end = -1;
    for (let i = open; i < source.length; i++) {
      if (source[i] === "{") depth++;
      else if (source[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) throw new Error("unterminated .quest-scope block");
    const block = source.slice(open + 1, end);
    // The token block contains --bg; the helper block does not.
    if (block.includes("--bg:")) return block;
    searchFrom = end + 1;
  }
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
    expect(block).toContain("--font: var(--font-sans)");
    expect(block).toContain("--font-mono: var(--font-mono)");
  });

  it("does NOT leak quest accent tokens outside .quest-scope", () => {
    // Verify quest tokens are scoped: the block itself should contain --accent
    // (proving it's in the right block), and no bare --accent appears on :root
    // that could override the app theme (the app :root uses hsl() not hex).
    expect(block).toContain("--accent: #67e8f9");
    // The app-level :root --accent uses an hsl() value (Shadcn token), not the
    // quest hex color, so quest's aqua accent never leaks to the global theme.
    expect(css).not.toContain("--accent: #67e8f9\n");
  });
});
