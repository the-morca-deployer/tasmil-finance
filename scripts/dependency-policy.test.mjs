import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const workspace = readFileSync(new URL("../pnpm-workspace.yaml", import.meta.url), "utf8");
const lock = readFileSync(new URL("../pnpm-lock.yaml", import.meta.url), "utf8");

test("pins Next above both 2026 RCE fixes", () => {
  assert.equal(packageJson.dependencies.next, "16.3.5");
  assert.equal(packageJson.devDependencies["eslint-config-next"], "16.3.5");
  assert.match(lock, /next@16\.3\.5/);
});

test("keeps security overrides in the pnpm 10 workspace configuration", () => {
  for (const entry of [
    "axios: 1.20.0",
    "protobufjs@<8\": 7.6.1",
    "sharp: 0.35.4",
    "ws: 8.21.3",
  ]) {
    assert.ok(workspace.includes(entry), `missing override: ${entry}`);
  }
  assert.equal(packageJson.pnpm, undefined);
});
