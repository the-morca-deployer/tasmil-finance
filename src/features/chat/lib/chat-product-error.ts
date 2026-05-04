export type ChatProductError =
  | "SESSION_INVALID"
  | "INVALID_CHAT_WALLET_ADDRESS"
  | "CHAT_IDENTITY_RESOLUTION_FAILED"
  | "CHAT_USAGE_LIMIT_REACHED"
  | "GENERIC_AI_ERROR";

function extractStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || !error) return undefined;
  if ("status" in error && typeof (error as { status?: unknown }).status === "number") {
    return (error as { status: number }).status;
  }
  if (
    "response" in error &&
    typeof (error as { response?: { status?: unknown } }).response?.status === "number"
  ) {
    return (error as { response: { status: number } }).response.status;
  }
  return undefined;
}

function extractDetail(error: unknown): string {
  if (typeof error !== "object" || !error) return "";

  if (
    "response" in error &&
    typeof (error as { response?: { data?: unknown } }).response?.data === "object" &&
    (error as { response?: { data?: { detail?: unknown } } }).response?.data &&
    "detail" in (error as { response: { data: { detail?: unknown } } }).response.data
  ) {
    return String(
      (error as { response: { data: { detail?: unknown } } }).response.data.detail ?? ""
    );
  }

  if ("message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }

  return "";
}

export function classifyChatProductError(error: unknown): ChatProductError {
  const status = extractStatus(error);
  const detail = extractDetail(error);

  if (status === 400 && detail.includes("INVALID_CHAT_WALLET_ADDRESS")) {
    return "INVALID_CHAT_WALLET_ADDRESS";
  }

  if (status === 503 || detail.includes("CHAT_IDENTITY_RESOLUTION_FAILED")) {
    return "CHAT_IDENTITY_RESOLUTION_FAILED";
  }

  if (status === 401 || (status === 403 && detail.includes("SESSION_INVALID"))) {
    return "SESSION_INVALID";
  }

  if (status === 429 || detail.includes("CHAT_USAGE_LIMIT_REACHED")) {
    return "CHAT_USAGE_LIMIT_REACHED";
  }

  return "GENERIC_AI_ERROR";
}
