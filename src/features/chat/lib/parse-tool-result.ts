function extractMcpText(arr: unknown[]): unknown | undefined {
  const b = (arr as { type?: string; text?: string }[]).find(
    (b) => b?.type === "text" && typeof b?.text === "string"
  );
  if (!b?.text) return undefined;
  try {
    return JSON.parse(b.text);
  } catch {
    return b.text;
  }
}

function unwrapMcpWrapper(obj: unknown): unknown {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const content = (obj as Record<string, unknown>).content;
    if (Array.isArray(content)) {
      const extracted = extractMcpText(content as unknown[]);
      if (extracted !== undefined) return extracted;
    }
  }
  return obj;
}

export function parseToolResult(content: string | unknown): unknown {
  if (Array.isArray(content)) return extractMcpText(content) ?? content;
  if (typeof content !== "string") return unwrapMcpWrapper(content);
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return extractMcpText(parsed) ?? parsed;
    return unwrapMcpWrapper(parsed);
  } catch {
    return content;
  }
}
