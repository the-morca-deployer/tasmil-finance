import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
await p.goto("http://localhost:3100/quest/campaigns", { waitUntil: "networkidle" });
await p.waitForTimeout(900);
const r = await p.evaluate(() => {
  const card = document.querySelector('a[href*="/quest/campaign/"]');
  const foot = card.children[2];
  const cs = getComputedStyle(foot);
  // does an arbitrary util exist in any stylesheet?
  let hasPt14 = false, hasPb18 = false;
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of rules) {
      const t = rule.cssText || "";
      if (t.includes("padding-top: 14px") || t.includes("padding-top:14px")) hasPt14 = true;
      if (t.includes("padding-bottom: 18px") || t.includes("padding-bottom:18px")) hasPb18 = true;
    }
  }
  return { className: foot.className, paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom,
    paddingLeft: cs.paddingLeft, hasPt14ruleSomewhere: hasPt14, hasPb18ruleSomewhere: hasPb18 };
});
console.warn(JSON.stringify(r, null, 2));
await b.close();
