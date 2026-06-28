// Unified Kubb codegen config for every upstream OpenAPI service.
//
// One config, one factory. Pick the target with KUBB_TARGET:
//   KUBB_TARGET=ai|backend kubb --config kubb.config.ts
//
// Each target differs only in: spec source, output dir, and the client import
// path (FastAPI services use the default axios client; NestJS services use the
// shared @/lib/kubb-backend-client). Everything else is shared below.

import fs from "node:fs";
import { defineConfig } from "@kubb/core";
import { pluginClient } from "@kubb/plugin-client";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginReactQuery } from "@kubb/plugin-react-query";
import { pluginTs } from "@kubb/plugin-ts";

const toKebabCase = (str: string): string =>
  !str ? str : str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

// Generated file names are kebab-cased; symbol names are left untouched.
const fileNameTransformer = {
  name: (name: string, type: string) => (name && type === "file" ? toKebabCase(name) : name),
};

type Target = {
  /** Output directory for the generated client. */
  dir: string;
  /** Local spec file written by scripts/kubb/fix-openapi*.js (preferred if present). */
  tempSpec: string;
  /** Remote spec URL fallback when no local spec exists. */
  specUrl: () => string;
  /** Runtime client the generated functions import from. */
  clientImportPath: string;
};

const stripSlash = (u: string) => u.replace(/\/$/, "");

const TARGETS: Record<string, Target> = {
  // FastAPI (LangGraph) — default axios client.
  ai: {
    dir: "./src/gen-ai",
    tempSpec: "./temp-openapi.json",
    specUrl: () =>
      `${stripSlash(process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8001")}/openapi.json`,
    clientImportPath: "@kubb/plugin-client/clients/axios",
  },
  // NestJS main backend — shared custom client.
  backend: {
    dir: "./src/gen-backend",
    tempSpec: "./temp-openapi-backend.json",
    specUrl: () =>
      `${stripSlash(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6756")}/api-json`,
    clientImportPath: "@/lib/kubb-backend-client",
  },
  // Quest routes live on the MAIN backend (port 6756); the frontend proxies
  // /api/quest/* there. Shared custom client (JWT auth via kubb-backend-client).
  quest: {
    dir: "./src/gen-quest",
    tempSpec: "./temp-openapi-quest.json",
    specUrl: () =>
      `${stripSlash(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6756")}/api-json`,
    clientImportPath: "@/lib/kubb-backend-client",
  },
};

const key = process.env.KUBB_TARGET ?? "";
const target = TARGETS[key];
if (!target) {
  throw new Error(`Set KUBB_TARGET to one of: ${Object.keys(TARGETS).join(", ")} (got "${key}")`);
}

export default defineConfig({
  input: { path: fs.existsSync(target.tempSpec) ? target.tempSpec : target.specUrl() },
  output: { path: target.dir, clean: true, write: true, format: false },
  hooks: { done: [`echo "✓ ${key} API generation completed"`] },
  plugins: [
    pluginOas({
      output: { path: "./schemas" },
      validate: false,
      serverIndex: 0,
      contentType: "application/json",
    }),
    pluginTs({ output: { path: "./types" }, transformers: fileNameTransformer }),
    pluginClient({
      output: { path: "./client" },
      importPath: target.clientImportPath,
      transformers: fileNameTransformer,
    }),
    pluginReactQuery({ output: { path: "./hooks" }, transformers: fileNameTransformer }),
  ],
});
