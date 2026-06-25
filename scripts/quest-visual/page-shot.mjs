// Full-page screenshot with reveal-modal dismissal. Usage: node page-shot.mjs <path> <label>
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
const path = process.argv[2], label = process.argv[3] ?? "x";
const BASE = process.env.APP_BASE ?? "http://localhost:3100";
const OUT = new URL("./out/", import.meta.url);
await mkdir(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
await p.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
await p.keyboard.press("Escape").catch(() => {});
for (const s of ['button[aria-label="Close"]', ".card-close", ".rank-reveal-backdrop"])
  await p.click(s, { timeout: 500 }).catch(() => {});
await p.waitForTimeout(500);
const name = path.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
await p.screenshot({ path: new URL(`${name}.${label}.png`, OUT).pathname, fullPage: true });
console.warn(`${name}.${label}.png`);
await b.close();
