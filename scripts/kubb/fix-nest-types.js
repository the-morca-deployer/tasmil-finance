#!/usr/bin/env node
/**
 * Patches empty PathParams and QueryParams interfaces in a generated NestJS
 * client's types/ dir by reading the real parameter definitions from the spec.
 * NestJS puts proper params in the spec but Kubb emits empty interfaces when
 * schema refs are absent.
 *
 * Usage: node scripts/kubb/fix-nest-types.js --target=backend|quest
 */

const fs = require("node:fs");
const path = require("node:path");

const TARGETS = {
  backend: { temp: "temp-openapi-backend.json", types: "src/gen-backend/types" },
  quest: { temp: "temp-openapi-quest.json", types: "src/gen-quest/types" },
};
const key = (process.argv.find((a) => a.startsWith("--target=")) || "--target=backend").split(
  "="
)[1];
const target = TARGETS[key];
if (!target) {
  console.error(`Unknown --target=${key} (expected: ${Object.keys(TARGETS).join(", ")})`);
  process.exit(1);
}

const SPEC_PATH = path.join(__dirname, "../..", target.temp);
const TYPES_DIR = path.join(__dirname, "../..", target.types);

if (!fs.existsSync(SPEC_PATH)) {
  console.log("⚠ No spec file found, skipping type fix");
  process.exit(0);
}

const spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));

/** AccountController_getPosition → AccountControllerGetPosition */
function operationIdToPascal(operationId) {
  return operationId.replace(/_([a-zA-Z])/g, (_, c) => c.toUpperCase());
}

/** AccountControllerGetPosition → account-controller-get-position */
function toKebabCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/** OpenAPI schema type → TypeScript type string */
function schemaToTs(schema) {
  if (!schema) return "unknown";
  if (schema.$ref) return "string"; // treat refs as string for simplicity
  switch (schema.type) {
    case "string":
      return schema.enum ? schema.enum.map((v) => `"${v}"`).join(" | ") : "string";
    case "number":
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "array":
      return "string[]";
    default:
      return "unknown";
  }
}

/** Patch an interface in the file content, replacing the empty version */
function patchInterface(content, interfaceName, properties) {
  if (properties.length === 0) return content;
  const propsStr = properties
    .map((p) => `  ${p.name}${p.required ? "" : "?"}: ${p.tsType}`)
    .join("\n");
  const emptyPattern = new RegExp(`(export interface ${interfaceName})\\s*\\{\\s*\\}`, "g");
  return content.replace(emptyPattern, `$1 {\n${propsStr}\n}`);
}

let patchCount = 0;

for (const [, methods] of Object.entries(spec.paths ?? {})) {
  for (const [, operation] of Object.entries(methods)) {
    if (!operation?.operationId || !Array.isArray(operation.parameters)) continue;

    const pascal = operationIdToPascal(operation.operationId);
    const fileName = toKebabCase(pascal) + ".ts";
    const filePath = path.join(TYPES_DIR, fileName);

    if (!fs.existsSync(filePath)) continue;

    const pathParams = operation.parameters
      .filter((p) => p.in === "path")
      .map((p) => ({ name: p.name, required: !!p.required, tsType: schemaToTs(p.schema) }));

    const queryParams = operation.parameters
      .filter((p) => p.in === "query")
      .map((p) => ({ name: p.name, required: !!p.required, tsType: schemaToTs(p.schema) }));

    if (pathParams.length === 0 && queryParams.length === 0) continue;

    let content = fs.readFileSync(filePath, "utf8");
    const original = content;

    content = patchInterface(content, `${pascal}PathParams`, pathParams);
    content = patchInterface(content, `${pascal}QueryParams`, queryParams);

    if (content !== original) {
      fs.writeFileSync(filePath, content, "utf8");
      patchCount++;
      const rel = path.relative(TYPES_DIR, filePath);
      console.log(`✅ Patched: types/${rel}`);
    }
  }
}

console.log(`\n🎉 Done! ${patchCount} type files patched`);
