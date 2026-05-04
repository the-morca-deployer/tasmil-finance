"use client";

import { useMemo } from "react";

interface ResultData<T = any> {
  data: T | null;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * Hook to extract and normalize result data from MCP tool responses.
 * Handles both `{ success, data, error }` and direct data formats.
 */
export function useResultData<T = any>(result: unknown, status?: string): ResultData<T> {
  return useMemo(() => {
    const isLoading = !result || status === "pending";

    if (isLoading) {
      return { data: null, isLoading: true, hasError: false, errorMessage: null };
    }

    let parsed: any = result;
    if (typeof result === "string") {
      try {
        parsed = JSON.parse(result);
      } catch {
        parsed = { raw: result };
      }
    }

    // Handle MCP content-block arrays: [{type:"text", text:"..."}]
    // This occurs when tool content is double-serialised (e.g. history from DB).
    if (Array.isArray(parsed)) {
      const textBlock = (parsed as any[]).find(
        (b: any) => b?.type === "text" && typeof b?.text === "string"
      );
      if (textBlock) {
        try {
          parsed = JSON.parse(textBlock.text);
        } catch {
          parsed = { raw: textBlock.text };
        }
      }
    }

    // Handle MCP response wrapper: {content: [{type:"text", text:"..."}]}
    // This occurs when the full MCP response object is passed through without
    // extracting the inner content blocks (e.g. via supervisor agent relay).
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      Array.isArray((parsed as any).content)
    ) {
      const blocks = (parsed as any).content;
      const textBlock = blocks.find((b: any) => b?.type === "text" && typeof b?.text === "string");
      if (textBlock) {
        try {
          parsed = JSON.parse(textBlock.text);
        } catch {
          parsed = { raw: textBlock.text };
        }
      }
    }

    const hasError =
      parsed?.success === false || parsed?.error != null || parsed?.status === "error";

    const errorMessage = hasError ? (parsed?.error ?? parsed?.message ?? "Operation failed") : null;

    const data = (parsed?.data ?? parsed) as T;

    return { data, isLoading: false, hasError, errorMessage };
  }, [result, status]);
}
