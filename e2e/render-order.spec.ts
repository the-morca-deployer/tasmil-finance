import { expect, test } from "@playwright/test";

/**
 * Render order test for chat turn collapse.
 *
 * Regression: supervisor text and "Thinking..." were visible simultaneously —
 * user saw text → Thinking... (wrong order).
 *
 * Fix: intermediate AI messages in a turn are hidden while loading; only
 * the last message is shown (as "Thinking..." → streaming text).
 *
 * This test verifies:
 * 1. When "Thinking..." appears, substantive AI text is NOT simultaneously visible
 * 2. After "Thinking..." disappears, the final response text is present
 *
 * Note: requires a live AI service. Skipped automatically when the AI does not
 * invoke a sub-agent (simple responses show no "Thinking..." indicator).
 */
test("Render order: Thinking... and AI text never appear simultaneously", async ({ page }) => {
  const log: { type: string; elapsed: number; content?: string }[] = [];
  const debugLog: string[] = [];
  const t0 = Date.now();

  page.on("console", (msg) => {
    if (msg.text().includes("[render-debug]")) {
      debugLog.push(`+${Date.now() - t0}ms: ${msg.text()}`);
    }
  });

  await page.goto("/chat/new", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("textarea", { timeout: 8000 });

  // Type character-by-character so React onChange fires
  const textarea = page.locator("textarea");
  await textarea.click();
  await textarea.pressSequentially("hi");
  // Brief wait for React state update
  await page.waitForTimeout(400);
  await page.keyboard.press("Enter");
  log.push({ type: "message-sent", elapsed: Date.now() - t0 });

  let thinkingAt: number | null = null;
  let simultaneousViolation: string | null = null;
  let finalTextAfterThinking: string | null = null;

  // Poll for 80 seconds max
  for (let i = 0; i < 800; i++) {
    await page.waitForTimeout(100);

    // Single atomic DOM snapshot to avoid race conditions between queries
    const snapshot = await page.evaluate(() => {
      const thinkingEls = [...document.querySelectorAll("*")].filter(
        (el) => el.childNodes.length > 0 && el.textContent?.trim() === "Thinking..."
      );
      const aiMsgEls = document.querySelectorAll('[data-testid="ai-message"]');
      const aiTexts: string[] = [];
      aiMsgEls.forEach((el) => {
        const t = (el.textContent ?? "").trim();
        if (t.length > 10 && !t.includes("Thinking...")) aiTexts.push(t.slice(0, 80));
      });
      return { thinkingVisible: thinkingEls.length > 0, aiTexts };
    });

    const { thinkingVisible, aiTexts } = snapshot;
    const substantiveText = aiTexts[0] ?? "";

    if (thinkingVisible) {
      if (thinkingAt === null) {
        thinkingAt = Date.now();
        log.push({ type: "thinking-appeared", elapsed: thinkingAt - t0 });
        await page.screenshot({ path: "e2e/test-results/render-02-thinking.png" });
      }

      // THE REGRESSION CHECK: in one atomic snapshot, Thinking... and AI text must NOT coexist
      if (substantiveText.length > 0 && simultaneousViolation === null) {
        simultaneousViolation = substantiveText;
        log.push({ type: "simultaneous-violation", elapsed: Date.now() - t0, content: substantiveText });
        await page.screenshot({ path: "e2e/test-results/render-violation.png" });
      }
    }

    // Once Thinking... has appeared and then gone, capture the final text
    if (thinkingAt !== null && !thinkingVisible && finalTextAfterThinking === null && substantiveText.length > 0) {
      finalTextAfterThinking = substantiveText;
      log.push({ type: "final-text-after-thinking", elapsed: Date.now() - t0, content: substantiveText });
      await page.screenshot({ path: "e2e/test-results/render-03-final.png" });
      break;
    }
  }

  await page.screenshot({ path: "e2e/test-results/render-04-end.png" });

  console.log("\n=== RENDER DEBUG LOG ===");
  for (const d of debugLog) console.log(" ", d);

  console.log("\n=== RENDER ORDER REPORT ===");
  for (const e of log) {
    const c = e.content ? ` → "${e.content}"` : "";
    console.log(`  [${e.type}] +${e.elapsed}ms${c}`);
  }

  // If AI never showed Thinking..., the AI didn't use sub-agents — inconclusive, not a failure
  if (thinkingAt === null) {
    console.log("\n⚠️  Thinking... never appeared — AI responded without sub-agents (inconclusive)");
    test.skip();
    return;
  }

  // THE CORE REGRESSION ASSERTION
  expect(
    simultaneousViolation,
    `REGRESSION: AI text visible while "Thinking..." shown: "${simultaneousViolation}"`
  ).toBeNull();

  expect(
    finalTextAfterThinking,
    "No final text appeared after Thinking... completed"
  ).not.toBeNull();

  console.log(`\n✅ Thinking at +${thinkingAt - t0}ms, final text: "${finalTextAfterThinking}"`);
});
