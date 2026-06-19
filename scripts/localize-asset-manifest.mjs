#!/usr/bin/env node
// Rewrite asset-manifest.json so every entry points at the local file in
// public/token/ or public/protocols/, matching by lowercased symbol/name.
// Entries with no matching local file keep their existing URL (so the
// letter-avatar fallback in <TokenImage> still kicks in).
//
// Usage: node scripts/localize-asset-manifest.mjs

import { readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, extname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = resolve(ROOT, "src/shared/constants/asset-manifest.json");
const TOKEN_DIR = resolve(ROOT, "public/token");
const PROTOCOLS_DIR = resolve(ROOT, "public/protocols");

async function indexDir(dir) {
  const out = new Map();
  try {
    for (const f of await readdir(dir)) {
      const base = f.toLowerCase();
      const key = base.slice(0, base.length - extname(base).length);
      out.set(key, f);
    }
  } catch {
    // ignore
  }
  return out;
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  const tokenIdx = await indexDir(TOKEN_DIR);
  const protoIdx = await indexDir(PROTOCOLS_DIR);

  const out = { tokens: {}, protocols: {} };
  let tokHit = 0, tokMiss = 0, protHit = 0, protMiss = 0;

  for (const [sym, url] of Object.entries(manifest.tokens || {})) {
    const f = tokenIdx.get(sym.toLowerCase());
    if (f) {
      out.tokens[sym] = `/token/${f}`;
      tokHit++;
    } else {
      out.tokens[sym] = url;
      tokMiss++;
    }
  }
  for (const [name, url] of Object.entries(manifest.protocols || {})) {
    const f = protoIdx.get(name.toLowerCase());
    if (f) {
      out.protocols[name] = `/protocols/${f}`;
      protHit++;
    } else {
      out.protocols[name] = url;
      protMiss++;
    }
  }

  await writeFile(MANIFEST_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`tokens:    ${tokHit} localized, ${tokMiss} kept CDN`);
  console.log(`protocols: ${protHit} localized, ${protMiss} kept CDN`);
}

main().catch((e) => { console.error(e); process.exit(1); });
