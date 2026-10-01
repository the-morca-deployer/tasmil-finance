#!/usr/bin/env node
/**
 * Materializes a NestJS OpenAPI spec into a temp file that kubb.config.ts
 * picks up. Backend generation is reproducible by default: it reads the pinned
 * SOW2 snapshot. Set OPENAPI_SOURCE=remote to fetch a running service instead.
 *
 * Usage: node scripts/kubb/fix-openapi-nest.js --target=backend|quest
 */

const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");
const http = require("node:http");

const TARGETS = {
  backend: {
    url: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6756",
    temp: "temp-openapi-backend.json",
    pinned: "openapi/backend-sow2.json",
  },
  quest: {
    // Quest routes live on the main backend (port 6756); align with kubb.config.ts
    url: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6756",
    temp: "temp-openapi-quest.json",
  },
};

const key = (process.argv.find((a) => a.startsWith("--target=")) || "--target=backend").split(
  "="
)[1];
const target = TARGETS[key];
if (!target) {
  console.error(`Unknown --target=${key} (expected: ${Object.keys(TARGETS).join(", ")})`);
  process.exit(1);
}

const OPENAPI_URL = `${target.url.replace(/\/$/, "")}/api-json`;
const PROJECT_ROOT = path.join(__dirname, "../..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, target.temp);
const SOURCE = process.env.OPENAPI_SOURCE || (target.pinned ? "pinned" : "remote");

function readPinnedSpec() {
  const sourcePath = path.join(PROJECT_ROOT, target.pinned);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Pinned OpenAPI spec not found: ${target.pinned}`);
  }
  return JSON.parse(fs.readFileSync(sourcePath, "utf8"));
}

function downloadSpec() {
  return new Promise((resolve, reject) => {
    const client = OPENAPI_URL.startsWith("https") ? https : http;
    client
      .get(OPENAPI_URL, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} from ${OPENAPI_URL}`));
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e.message}`));
          }
        });
      })
      .on("error", (e) => reject(new Error(`Download failed: ${e.message}`)));
  });
}

async function main() {
  try {
    let spec;
    if (SOURCE === "pinned") {
      if (!target.pinned) {
        throw new Error(`${key} does not define a pinned OpenAPI spec`);
      }
      console.log(`Reading ${key} OpenAPI spec from: ${target.pinned}`);
      spec = readPinnedSpec();
    } else if (SOURCE === "remote") {
      console.log(`Downloading ${key} OpenAPI spec from: ${OPENAPI_URL}`);
      spec = await downloadSpec();
    } else {
      throw new Error(`Unknown OPENAPI_SOURCE=${SOURCE} (expected: pinned or remote)`);
    }
    fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(spec, null, 2)}\n`);
    console.log(`✓ ${key} OpenAPI spec saved to: ${target.temp}`);
  } catch (err) {
    console.error(`✗ ${err.message}`);
    if (SOURCE === "remote") {
      console.error(`  Make sure the ${key} service is running and reachable.`);
    }
    process.exit(1);
  }
}

main();
