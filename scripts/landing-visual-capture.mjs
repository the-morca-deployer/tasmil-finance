// Landing page visual-capture script (Phase 0 baseline + later "after" diffs).
//
// Captures the canonical 12-shot list at fixed viewports/states and writes
// full-page PNGs to a given output directory. Every later migration phase MUST
// run this exact script (same browser binary, headless, viewport, scale,
// fullPage) so "after" shots diff cleanly against the baseline.
//
// Usage:
//   node scripts/landing-visual-capture.mjs <outDir> [baseUrl]
//
//   <outDir>   Required. Directory to write the 12 PNGs + MANIFEST.md into
//              (created if missing).
//   [baseUrl]  Optional. Defaults to http://localhost:3000. The dev server
//              must already be serving the landing routes.
//
// Renderer lock (must match the baseline — do not change for diffs):
//   - Browser:          Playwright bundled Chromium 1223 (chrome-mac-arm64)
//   - headless:         true
//   - viewport:         <width> x 900
//   - deviceScaleFactor: 1
//   - fullPage:         true
//
// The script resolves playwright-core and the chromium binary from this repo's
// node_modules / the Playwright browser cache so it is reproducible without a
// system Chrome install.

import { createRequire } from "module";
import { existsSync, mkdirSync, writeFileSync, readdirSync } from "fs";
import { setTimeout as sleep } from "timers/promises";
import path from "path";
import os from "os";

const require = createRequire(import.meta.url);

// --- CLI args ---------------------------------------------------------------
const OUT_DIR = process.argv[2];
const BASE_URL = process.argv[3] || "http://localhost:3000";

if (!OUT_DIR) {
  console.error("Usage: node scripts/landing-visual-capture.mjs <outDir> [baseUrl]");
  process.exit(2);
}
mkdirSync(OUT_DIR, { recursive: true });

// --- Locked renderer settings ----------------------------------------------
const HEADLESS = true;
const HEIGHT = 900;
const DEVICE_SCALE_FACTOR = 1;
const FULL_PAGE = true;

// --- Resolve Playwright + bundled Chromium ---------------------------------
// playwright-core ships from this repo's node_modules.
const { chromium } = require("playwright-core");

// Locate the bundled Chromium 1223 binary in the Playwright browser cache.
function resolveChromiumExecutable() {
  const cacheRoot =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    path.join(os.homedir(), "Library", "Caches", "ms-playwright");
  const candidates = [
    path.join(
      cacheRoot,
      "chromium-1223",
      "chrome-mac-arm64",
      "Google Chrome for Testing.app",
      "Contents",
      "MacOS",
      "Google Chrome for Testing",
    ),
    path.join(cacheRoot, "chromium-1223", "chrome-linux", "chrome"),
    path.join(
      cacheRoot,
      "chromium-1223",
      "chrome-win",
      "chrome.exe",
    ),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  // Fall back to Playwright's own resolution (executablePath()).
  return undefined;
}

const CHROMIUM_EXE = resolveChromiumExecutable();

// --- Canonical 12-shot list -------------------------------------------------
const SHOTS = [
  { name: "home-1440", route: "/", width: 1440, height: HEIGHT, state: "none" },
  { name: "home-768", route: "/", width: 768, height: HEIGHT, state: "none" },
  { name: "home-390", route: "/", width: 390, height: HEIGHT, state: "none" },
  { name: "home-1440-scrolled", route: "/", width: 1440, height: HEIGHT, state: "scroll-600" },
  { name: "home-390-sidebar", route: "/", width: 390, height: HEIGHT, state: "open-sidebar" },
  { name: "home-1440-faq-open", route: "/", width: 1440, height: HEIGHT, state: "faq-open" },
  { name: "home-1440-cta-hover", route: "/", width: 1440, height: HEIGHT, state: "cta-hover" },
  { name: "home-1440-features", route: "/", width: 1440, height: HEIGHT, state: "features-scroll" },
  { name: "waitlist-1440", route: "/waitlist", width: 1440, height: HEIGHT, state: "none" },
  { name: "waitlist-390", route: "/waitlist", width: 390, height: HEIGHT, state: "none" },
  { name: "access-1440", route: "/access", width: 1440, height: HEIGHT, state: "none" },
  { name: "access-390", route: "/access", width: 390, height: HEIGHT, state: "none" },
];

const manifest = [];
const concerns = [];

async function driveState(page, shot) {
  switch (shot.state) {
    case "none":
      return ["Navigate to route, no interaction"];

    case "scroll-600":
      await page.evaluate(() => window.scrollTo(0, 600));
      await sleep(500);
      return ["window.scrollTo(0, 600) — nav enters scrolled state"];

    case "open-sidebar": {
      const burger = await page.$(".nav-burger");
      if (burger) {
        await burger.click();
        await sleep(400);
        return ["Clicked .nav-burger — sidebar opened"];
      }
      const alt = await page.$(
        '[aria-label*="menu" i], [aria-label*="burger" i], button.hamburger, .hamburger, .mobile-menu-btn, [class*="burger"], [class*="hamburger"]',
      );
      if (alt) {
        await alt.click();
        await sleep(400);
        return ["Clicked mobile menu button (alt selector) — sidebar opened"];
      }
      concerns.push(`${shot.name}: .nav-burger not found, sidebar not opened`);
      return ["COULD NOT FIND .nav-burger or alt selector — shot captured without sidebar open"];
    }

    case "faq-open": {
      const faqSection = await page.$('#faq, section.faq, [class*="faq"], [id*="faq"]');
      if (faqSection) {
        await faqSection.scrollIntoViewIfNeeded();
        await sleep(300);
      } else {
        await page.evaluate(() => window.scrollTo(0, 2000));
        await sleep(300);
      }
      const faqQuestion = await page.$(
        '.faq-question, [class*="faq"] button, [class*="faq"] [role="button"], details summary, .accordion-trigger, [data-accordion-trigger]',
      );
      if (faqQuestion) {
        await faqQuestion.click();
        await sleep(400);
        return ["Scrolled to FAQ section; clicked first FAQ question — expanded"];
      }
      concerns.push(`${shot.name}: FAQ question selector not found`);
      return [
        "COULD NOT FIND FAQ question selector — shot captured at scroll position without expansion",
      ];
    }

    case "cta-hover": {
      const ctaSection = await page.$('.cta-section, section.cta, [class*="cta-section"], [id*="cta"]');
      if (ctaSection) {
        await ctaSection.scrollIntoViewIfNeeded();
        await sleep(300);
      } else {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 1200));
        await sleep(300);
      }
      const ctaBtn = await page.$(
        '.cta-section .btn, .cta-section a, .cta-button, [class*="cta"] a[class*="btn"], [class*="cta"] button',
      );
      if (ctaBtn) {
        await ctaBtn.hover();
        await sleep(300);
        return ["Scrolled to CTA section; hovered primary CTA button"];
      }
      const anyBtn = await page.$('[class*="cta"] a, [class*="cta"] button');
      if (anyBtn) {
        await anyBtn.hover();
        await sleep(300);
        return ["Scrolled to CTA section; hovered CTA element (generic selector)"];
      }
      concerns.push(`${shot.name}: CTA button selector not found`);
      return ["COULD NOT FIND CTA button — shot captured at scroll position without hover state"];
    }

    case "features-scroll": {
      const featSection = await page.$(
        '#features, section.features, [class*="features-section"], [id*="features"]',
      );
      if (featSection) {
        await featSection.scrollIntoViewIfNeeded();
      } else {
        await page.evaluate(() => window.scrollTo(0, 800));
      }
      await sleep(2000); // let demos settle
      return ["Scrolled to Features section; waited 2s for demos to settle"];
    }

    default:
      return [`Unknown state: ${shot.state}`];
  }
}

async function captureShot(browser, shot) {
  console.log(`\nCapturing: ${shot.name} (${shot.width}x${shot.height}) state=${shot.state}`);

  const context = await browser.newContext({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
  });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}${shot.route}`, { waitUntil: "networkidle", timeout: 30000 });
  await sleep(500);

  const stateSteps = await driveState(page, shot);

  const filePath = path.join(OUT_DIR, `${shot.name}.png`);
  await page.screenshot({ path: filePath, fullPage: FULL_PAGE });
  console.log(`  Saved: ${filePath}`);

  manifest.push({
    name: shot.name,
    route: shot.route,
    viewport: `${shot.width}x${shot.height}`,
    stateSteps,
  });

  await context.close();
}

function writeManifest() {
  const manifestPath = path.join(OUT_DIR, "MANIFEST.md");
  let md = `# Landing Page Visual Baseline — MANIFEST\n\n`;
  md += `Captured: ${new Date().toISOString()}\n`;
  md += `Base URL: ${BASE_URL}\n`;
  md += `Branch: feat/landing-tailwind-shadcn-migration\n\n`;
  md += `## Capture Method (must match for "after" diffs)\n\n`;
  md += `- Browser: Playwright bundled Chromium 1223 (chrome-mac-arm64 — "Google Chrome for Testing")\n`;
  md += `- Executable: \`${CHROMIUM_EXE || "(playwright default resolution)"}\`\n`;
  md += `- headless: ${HEADLESS}\n`;
  md += `- viewport: <width> x ${HEIGHT}\n`;
  md += `- deviceScaleFactor: ${DEVICE_SCALE_FACTOR}\n`;
  md += `- fullPage: ${FULL_PAGE}\n`;
  md += `- Reproduce: \`node scripts/landing-visual-capture.mjs <outDir> [baseUrl]\`\n\n`;
  md += `## Shot List\n\n`;
  md += `| name | route | viewport | state steps |\n`;
  md += `|---|---|---|---|\n`;
  for (const s of manifest) {
    md += `| \`${s.name}\` | \`${s.route}\` | ${s.viewport} | ${s.stateSteps.join("; ")} |\n`;
  }
  md += `\n## Concerns\n\n`;
  if (concerns.length === 0) {
    md += `None — all states driven successfully.\n`;
  } else {
    for (const c of concerns) md += `- ${c}\n`;
  }
  writeFileSync(manifestPath, md, "utf8");
  console.log(`\nManifest written: ${manifestPath}`);
}

async function main() {
  console.log("Launching Chromium (1223, headless)...");
  const browser = await chromium.launch({
    executablePath: CHROMIUM_EXE, // undefined => Playwright default resolution
    headless: HEADLESS,
  });

  for (const shot of SHOTS) {
    await captureShot(browser, shot);
  }

  await browser.close();
  writeManifest();

  const pngCount = readdirSync(OUT_DIR).filter((f) => f.endsWith(".png")).length;
  console.log(`\nPNG count: ${pngCount}`);
  if (concerns.length) {
    console.log("\nCONCERNS:");
    concerns.forEach((c) => console.log(" -", c));
  }
  console.log("\nDONE");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
