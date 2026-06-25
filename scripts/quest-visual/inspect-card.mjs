// One-off: capture BEFORE screenshots of explore+campaigns and dump the live
// CampaignCard DOM + computed styles, so the Tailwind conversion is faithful.
// Usage: node scripts/quest-visual/inspect-card.mjs <label>   (label e.g. "before" | "after")
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const label = process.argv[2] ?? "before";
const BASE = process.env.APP_BASE ?? "http://localhost:3100";
const OUT = new URL("./out/", import.meta.url);
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();

async function dismissReveal(page) {
  // The RankRevealGate can auto-open a modal; close it for a clean shot.
  await page.keyboard.press("Escape").catch(() => {});
  for (const sel of ['button[aria-label="Close"]', ".card-close", ".rank-reveal-backdrop"]) {
    await page.click(sel, { timeout: 600 }).catch(() => {});
  }
  await page.waitForTimeout(400);
}

async function shot(path, file) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await dismissReveal(page);
  await page.screenshot({ path: new URL(`${file}.${label}.png`, OUT).pathname, fullPage: true });
  return page;
}

await (await shot("/quest/explore", "explore")).close();
const camp = await shot("/quest/campaigns", "campaigns");

// Dump the first campaign card's DOM + computed styles (campaigns page still open)
const dump = await camp.evaluate(() => {
  const card = document.querySelector(".camp-card");
  if (!card) return { error: "no .camp-card found" };
  const pick = (el, props) => {
    if (!el) return null;
    const c = getComputedStyle(el);
    return Object.fromEntries(props.map((p) => [p, c.getPropertyValue(p)]));
  };
  const box = ["position", "display", "width", "height", "padding", "border", "border-radius",
    "background-image", "background-color", "object-fit", "inset", "top", "left", "right",
    "flex", "overflow", "background"];
  return {
    cardHTML: card.outerHTML.slice(0, 2000),
    camp_card: pick(card, box),
    cc_cover: pick(card.querySelector(".cc-cover"), box),
    brand_mark: pick(card.querySelector(".brand-mark"), box),
    brand_mark_img: pick(card.querySelector(".brand-mark img"), box),
    ph_tag: pick(card.querySelector(".ph-tag"), box),
    status_badge: pick(card.querySelector(".cc-cover [class*='badge'], .cc-cover > div"), box),
    cc_badge_pts: pick(card.querySelector(".cc-badge-pts"), box),
    cc_body: pick(card.querySelector(".cc-body"), box),
    cc_title: pick(card.querySelector(".cc-title"), box),
    cc_foot: pick(card.querySelector(".cc-foot"), box),
  };
});
console.warn(JSON.stringify(dump, null, 2));
await camp.close();
await browser.close();
