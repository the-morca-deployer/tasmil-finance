import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
await p.goto("http://localhost:3100/quest/campaigns", { waitUntil: "networkidle" });
await p.waitForTimeout(900);
const r = await p.evaluate(() => {
  const card = document.querySelector('a[href*="/quest/campaign/"]');
  const h = (el) => el ? +el.getBoundingClientRect().height.toFixed(1) : null;
  const foot = card.children[2];
  const avstack = foot.children[0];
  const btn = foot.children[1];
  const btnCS = getComputedStyle(btn);
  return { foot: h(foot), avstack: h(avstack), btn: h(btn),
    btnPad: btnCS.padding, btnDisplay: btnCS.display, btnFont: btnCS.fontSize,
    avChild: h(avstack.children[0]) };
});
console.warn(JSON.stringify(r));
await b.close();
