#!/usr/bin/env node
/**
 * Downloads a NestJS OpenAPI spec (/api-json) for a codegen target into a temp
 * file that kubb.config.ts picks up. NestJS serves the spec at /api-json when
 * SwaggerModule uses path 'api'.
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
const OUTPUT_PATH = path.join(__dirname, "../..", target.temp);

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
  console.log(`Downloading ${key} OpenAPI spec from: ${OPENAPI_URL}`);
  try {
    const spec = await downloadSpec();
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(spec, null, 2));
    console.log(`✓ ${key} OpenAPI spec saved to: ${target.temp}`);
  } catch (err) {
    console.error(`✗ ${err.message}`);
    console.error(`  Make sure the ${key} service is running and reachable.`);
    process.exit(1);
  }
}

main();
