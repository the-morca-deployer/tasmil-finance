// scripts/quest-visual/compare.mjs
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const KEY = process.argv[2];
const cfg = JSON.parse(await readFile(new URL("./pages.json", import.meta.url)))[KEY];
if (!cfg) throw new Error(`unknown page key: ${KEY}`);

const APP = process.env.APP_BASE ?? "http://localhost:3000";
const MOCK = "http://localhost:4599";
const OUT = new URL("./out/", import.meta.url);
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
async function shot(url, w, h, file) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(800); // let entrance animations settle
  await page.screenshot({ path: file, fullPage: false });
  await page.close();
}

for (const [w, h] of cfg.viewports) {
  const tag = `${KEY}.${w}x${h}`;
  const mk = new URL(`${tag}.mockup.png`, OUT).pathname;
  const ap = new URL(`${tag}.app.png`, OUT).pathname;
  await shot(`${MOCK}/${encodeURIComponent(cfg.mockup)}`, w, h, mk);
  await shot(`${APP}${cfg.app}`, w, h, ap);

  const a = PNG.sync.read(await readFile(mk));
  const b = PNG.sync.read(await readFile(ap));
  const width = Math.min(a.width, b.width);
  const height = Math.min(a.height, b.height);
  const diff = new PNG({ width, height });
  const mismatch = pixelmatch(a.data, b.data, diff.data, width, height, { threshold: 0.1 });
  await writeFile(new URL(`${tag}.diff.png`, OUT).pathname, PNG.sync.write(diff));
  console.warn(`${tag}: ${mismatch} mismatched px (${((mismatch / (width * height)) * 100).toFixed(2)}%)`);
}
await browser.close();
