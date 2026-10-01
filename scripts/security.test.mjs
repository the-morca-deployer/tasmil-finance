import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";

const SECRET_SHAPES = [
  /(?:^|[^A-Z2-7])S[A-Z2-7]{55}(?:$|[^A-Z2-7])/,
  /\bsk[-_][A-Za-z0-9-]{24,}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
const ASSIGNMENT = /^(?:export\s+)?[A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|PASSWORD)[A-Z0-9_]*=(.+)$/gm;
const SAFE_VALUE = /^(?:["']?\s*["']?|\$\{|\[|<)|your|example|placeholder|dummy|fake|fixture|changeme/i;

function trackedTextFiles() {
  return execFileSync("git", ["ls-files", "-z"]).toString().split("\0").filter(Boolean).filter((path) => {
    if (/^(?:pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$/.test(path)) return false;
    try {
      return statSync(path).size <= 1024 * 1024 && !readFileSync(path).includes(0);
    } catch {
      return false;
    }
  });
}

function exposedFiles() {
  return trackedTextFiles().filter((path) => {
    const source = readFileSync(path, "utf8");
    if (SECRET_SHAPES.some((pattern) => pattern.test(source))) return true;
    return [...source.matchAll(ASSIGNMENT)].some((match) => !SAFE_VALUE.test(match[1].trim()));
  });
}

test("tracked source contains no credential-shaped values", () => {
  const exposed = exposedFiles();
  assert.deepEqual(exposed, [], `credential-shaped values found in: ${exposed.join(", ")}`);
});

test("Docker build keeps private npm credentials in a temporary user config", () => {
  const dockerfile = readFileSync("Dockerfile", "utf8");
  assert.match(dockerfile, /NPM_CONFIG_USERCONFIG=\/tmp\/sow2-npmrc pnpm install/);
  assert.match(dockerfile, /trap 'rm -f \/tmp\/sow2-npmrc' EXIT/);
  assert.doesNotMatch(dockerfile, /NODE_AUTH_TOKEN=.*pnpm install/);
});
