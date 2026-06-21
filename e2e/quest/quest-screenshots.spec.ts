import { test } from "@playwright/test";

const SCREENS: { path: string; name: string }[] = [
  { path: "/quest", name: "explore" },
  { path: "/quest/campaigns", name: "campaigns" },
  { path: "/quest/campaign/seed-defindex", name: "campaign-detail" },
  { path: "/quest/leaderboard", name: "leaderboard" },
  { path: "/quest/profile", name: "profile" },
];

for (const s of SCREENS) {
  test(`screenshot ${s.name}`, async ({ page }, testInfo) => {
    await page.goto(s.path);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: testInfo.outputPath(`${s.name}.png`), fullPage: true });
  });
}
