/**
 * LangSmith API helper for verifying AI traces after chat interactions.
 * Queries the LangSmith API to confirm correct tool calls, intent parsing, and latency.
 */

const LANGSMITH_API_URL = process.env.LANGSMITH_ENDPOINT || "https://api.smith.langchain.com";
const LANGSMITH_API_KEY = process.env.LANGSMITH_API_KEY || "";
const LANGSMITH_PROJECT = process.env.LANGSMITH_PROJECT || "tasmil-ai";

interface LangSmithRun {
  id: string;
  name: string;
  run_type: string;
  status: string;
  start_time: string;
  end_time?: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  child_runs?: LangSmithRun[];
  extra?: Record<string, unknown>;
  error?: string;
  latency?: number;
}

interface TraceResult {
  runs: LangSmithRun[];
  toolCalls: Array<{ name: string; args: Record<string, unknown> }>;
  totalLatencyMs: number;
  errors: string[];
}

/**
 * Get the latest trace for a given thread ID.
 * Waits a few seconds after the chat response to ensure the trace is written.
 */
export async function getLatestTrace(threadId: string, waitMs = 5000): Promise<TraceResult | null> {
  if (!LANGSMITH_API_KEY) {
    console.warn("[LangSmith] No API key set, skipping trace verification");
    return null;
  }

  // Wait for trace to be written to LangSmith
  await new Promise((r) => setTimeout(r, waitMs));

  try {
    const response = await fetch(
      `${LANGSMITH_API_URL}/api/v1/runs?` +
        new URLSearchParams({
          project_name: LANGSMITH_PROJECT,
          filter: `and(eq(metadata_key, "thread_id"), eq(metadata_value, "${threadId}"))`,
          order: "desc",
          limit: "5",
        }),
      {
        headers: {
          "x-api-key": LANGSMITH_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.warn(`[LangSmith] API returned ${response.status}: ${await response.text()}`);
      return null;
    }

    const runs: LangSmithRun[] = await response.json();
    return parseTraceResult(runs);
  } catch (error) {
    console.warn("[LangSmith] Failed to fetch trace:", error);
    return null;
  }
}

/**
 * Get runs filtered by session (alternative to thread_id filter).
 */
export async function getRunsBySession(sessionId: string, limit = 10): Promise<TraceResult | null> {
  if (!LANGSMITH_API_KEY) return null;

  try {
    const response = await fetch(
      `${LANGSMITH_API_URL}/api/v1/runs?` +
        new URLSearchParams({
          session_id: sessionId,
          order: "desc",
          limit: limit.toString(),
        }),
      {
        headers: {
          "x-api-key": LANGSMITH_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) return null;
    const runs: LangSmithRun[] = await response.json();
    return parseTraceResult(runs);
  } catch {
    return null;
  }
}

function parseTraceResult(runs: LangSmithRun[]): TraceResult {
  const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const errors: string[] = [];
  let totalLatencyMs = 0;

  for (const run of runs) {
    if (run.error) errors.push(run.error);

    if (run.latency) totalLatencyMs += run.latency;
    else if (run.start_time && run.end_time) {
      totalLatencyMs += new Date(run.end_time).getTime() - new Date(run.start_time).getTime();
    }

    // Extract tool calls from the run
    if (run.run_type === "tool") {
      toolCalls.push({
        name: run.name,
        args: (run.inputs as Record<string, unknown>) ?? {},
      });
    }

    // Check child runs for tool calls
    if (run.child_runs) {
      for (const child of run.child_runs) {
        if (child.run_type === "tool") {
          toolCalls.push({
            name: child.name,
            args: (child.inputs as Record<string, unknown>) ?? {},
          });
        }
      }
    }
  }

  return { runs, toolCalls, totalLatencyMs, errors };
}

/**
 * Assert that a specific tool was called in the trace.
 */
export function assertToolCalled(trace: TraceResult, toolName: string): boolean {
  return trace.toolCalls.some((tc) => tc.name === toolName || tc.name.includes(toolName));
}

/**
 * Assert that intent was parsed correctly.
 */
export function assertIntentParsed(trace: TraceResult, expectedAction: string): boolean {
  return trace.runs.some((run) => {
    const outputs = run.outputs as Record<string, unknown> | undefined;
    if (!outputs) return false;
    const action = (outputs as any)?.action || (outputs as any)?.intent?.action;
    return action === expectedAction;
  });
}
