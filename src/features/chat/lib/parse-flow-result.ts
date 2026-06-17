const FLOW_KEYS = new Set(["kind", "question", "questions", "plan", "step"]);

function textFromBlocks(blocks: unknown[]): string | undefined {
  const b = (blocks as { type?: string; text?: string }[]).find(
    (b) => b?.type === "text" && typeof b?.text === "string"
  );
  return b?.text;
}

export function parseFlowResult(result: unknown): Record<string, unknown> | null {
  if (result == null) return null;
  if (typeof result === "string" && result.trim() === "") return null;

  if (typeof result === "object" && !Array.isArray(result)) {
    const obj = result as Record<string, unknown>;
    // Objects that already have flow shape are returned directly; content-unwrapping only applies to wrappers without flow keys.
    if (Object.keys(obj).some((k) => FLOW_KEYS.has(k))) return obj;
    if ("content" in obj && Array.isArray(obj.content)) {
      const text = textFromBlocks(obj.content as unknown[]);
      if (text) {
        try {
          const val = JSON.parse(text);
          if (typeof val === "object" && val !== null && !Array.isArray(val)) return val as Record<string, unknown>;
        } catch {
          /* fall */
        }
      }
    }
    if ("content" in obj && typeof obj.content === "string") {
      try {
        const val = JSON.parse(obj.content);
        if (typeof val === "object" && val !== null && !Array.isArray(val)) return val as Record<string, unknown>;
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
          const val = JSON.parse(parsed);
          if (typeof val === "object" && val !== null && !Array.isArray(val)) return val as Record<string, unknown>;
          return null;
        } catch {
          return null;
        }
      }
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
      return null;
    } catch {
      return null;
    }
  }

  return null;
}
