import { expect, test } from "@playwright/test";

test("quest token utility resolves to the arctic-cyan accent", async ({ page }) => {
  await page.goto("/quest/explore");
  const color = await page.evaluate(() => {
    const el = document.createElement("div");
    el.className = "text-quest-accent";
    document.body.appendChild(el);
    const c = getComputedStyle(el).color;
    el.remove();
    return c;
  });
  // #67E8F9 → rgb(103, 232, 249)
  expect(color).toBe("rgb(103, 232, 249)");
});
