// Diff two PNG files pixel-by-pixel and report the mismatch.
// Used by the page-refactor tasks as the "no visual change" gate:
// capture the live page BEFORE the refactor, refactor, capture AFTER, then
// diff before-vs-after — a real regression stands out against a ~0% baseline.
//
// Usage: node scripts/quest-visual/selfdiff.mjs <beforePng> <afterPng> [diffOut]
import { readFile, writeFile } from "node:fs/promises";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const [beforePath, afterPath, diffOut] = process.argv.slice(2);
if (!beforePath || !afterPath) {
  console.warn("usage: node selfdiff.mjs <beforePng> <afterPng> [diffOut]");
  process.exit(2);
}

const a = PNG.sync.read(await readFile(beforePath));
const b = PNG.sync.read(await readFile(afterPath));
const width = Math.min(a.width, b.width);
const height = Math.min(a.height, b.height);
const diff = new PNG({ width, height });
const mismatch = pixelmatch(a.data, b.data, diff.data, width, height, { threshold: 0.1 });
if (diffOut) await writeFile(diffOut, PNG.sync.write(diff));

const pct = (mismatch / (width * height)) * 100;
console.warn(
  `before=${beforePath} after=${afterPath}: ${mismatch} mismatched px (${pct.toFixed(3)}%)` +
    (a.width !== b.width || a.height !== b.height
      ? ` [size changed ${a.width}x${a.height} -> ${b.width}x${b.height}]`
      : ""),
);
