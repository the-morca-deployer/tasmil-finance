/**
 * CJS stand-in for the `uuid` package under Jest.
 *
 * uuid@13 ships ESM only, and next/jest hard-codes node_modules into
 * transformIgnorePatterns (a custom config can append to that list but never
 * remove from it), so any suite that transitively imports uuid dies with
 * "SyntaxError: Unexpected token 'export'". Transpiling it instead would mean
 * adding uuid to `transpilePackages` in next.config, i.e. changing application
 * config to serve the test runner.
 *
 * This is a real implementation, not a stub: v4 returns a fresh RFC-4122 v4
 * string every call, so tests that assert on uniqueness or on "an id was
 * generated" exercise the same property the app relies on. Individual suites
 * that want a deterministic id still override it with their own jest.mock.
 */

const HEX: string[] = Array.from({ length: 256 }, (_, i) => (i + 0x100).toString(16).slice(1));

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_ANY_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^00000000-0000-0000-0000-000000000000$/i;

function randomBytes16(): Uint8Array {
  const bytes = new Uint8Array(16);
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

export function v4(): string {
  const b = randomBytes16();
  // Stamp version (4) and variant (10xx) per RFC 4122.
  b[6] = ((b[6] as number) & 0x0f) | 0x40;
  b[8] = ((b[8] as number) & 0x3f) | 0x80;
  return (
    `${HEX[b[0] as number]}${HEX[b[1] as number]}${HEX[b[2] as number]}${HEX[b[3] as number]}-` +
    `${HEX[b[4] as number]}${HEX[b[5] as number]}-` +
    `${HEX[b[6] as number]}${HEX[b[7] as number]}-` +
    `${HEX[b[8] as number]}${HEX[b[9] as number]}-` +
    `${HEX[b[10] as number]}${HEX[b[11] as number]}${HEX[b[12] as number]}${HEX[b[13] as number]}${HEX[b[14] as number]}${HEX[b[15] as number]}`
  );
}

export function validate(value: unknown): boolean {
  return typeof value === "string" && UUID_ANY_RE.test(value);
}

/** Exported for tests that want to assert "this looks like a generated v4 id". */
export const UUID_V4_PATTERN = UUID_V4_RE;
