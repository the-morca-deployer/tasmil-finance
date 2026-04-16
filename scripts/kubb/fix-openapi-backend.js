#!/usr/bin/env node
/**
 * Downloads and fixes the NestJS backend OpenAPI spec before Kubb processing.
 * NestJS serves the spec at /api-json when SwaggerModule is configured with path 'api'.
 */

const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");
const http = require("node:http");

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6756";
const OPENAPI_URL = `${BACKEND_URL.replace(/\/$/, "")}/api-json`;
const OUTPUT_PATH = path.join(__dirname, "../../temp-openapi-backend.json");

function downloadSpec() {
  return new Promise((resolve, reject) => {
    const client = OPENAPI_URL.startsWith("https") ? https : http;
    client.get(OPENAPI_URL, (res) => {
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
    }).on("error", (e) => reject(new Error(`Download failed: ${e.message}`)));
  });
}

async function main() {
  console.log(`Downloading backend OpenAPI spec from: ${OPENAPI_URL}`);
  try {
    const spec = await downloadSpec();
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(spec, null, 2));
    console.log(`✓ Backend OpenAPI spec saved to: ${OUTPUT_PATH}`);
  } catch (err) {
    console.error(`✗ ${err.message}`);
    console.error("  Make sure the backend is running: cd apps/backend && pnpm dev");
    process.exit(1);
  }
}

main();
