const FLOW_KEYS = new Set(["kind", "question", "questions", "plan", "step"]);

function textFromBlocks(blocks: unknown[]): string | undefined {
  const b = (blocks as { type?: string; text?: string }[]).find(
    (b) => b?.type === "text" && typeof b?.text === "string"
  );
  return b?.text;
}

export function parseFlowResult(result: unknown): Record<string, unknown> | null {
  if (!result) return null;

  if (typeof result === "object" && !Array.isArray(result)) {
    const obj = result as Record<string, unknown>;
    if (Object.keys(obj).some((k) => FLOW_KEYS.has(k))) return obj;
    if ("content" in obj && Array.isArray(obj.content)) {
      const text = textFromBlocks(obj.content as unknown[]);
      if (text) {
        try {
          return JSON.parse(text);
        } catch {
          /* fall */
        }
      }
    }
    if ("content" in obj && typeof obj.content === "string") {
      try {
        return JSON.parse(obj.content);
      } catch {
        /* fall */
      }
    }
    return null;
  }

  let raw: unknown = result;
  if (Array.isArray(result)) {
    const text = textFromBlocks(result);
    if (text) raw = text;
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "string") {
        try {
          return JSON.parse(parsed);
        } catch {
          return null;
        }
      }
      if (typeof parsed === "object" && parsed !== null) return parsed;
      return null;
    } catch {
      return null;
    }
  }

  return null;
}
