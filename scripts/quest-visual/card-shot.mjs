// Screenshot just the first campaign card element (deterministic — no page chrome).
// Usage: node scripts/quest-visual/card-shot.mjs <label>
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const label = process.argv[2] ?? "x";
const BASE = process.env.APP_BASE ?? "http://localhost:3100";
const OUT = new URL("./out/", import.meta.url);
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
await page.goto(`${BASE}/quest/campaigns`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.keyboard.press("Escape").catch(() => {});
await page.waitForTimeout(300);

const card = page.locator('a[href*="/quest/campaign/"]').first();
await card.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
const box = await card.boundingBox();
await card.screenshot({ path: new URL(`card.${label}.png`, OUT).pathname });
console.warn(`card.${label}.png  box=${JSON.stringify(box)}`);
await browser.close();
