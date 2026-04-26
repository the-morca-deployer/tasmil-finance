import { Client } from "@langchain/langgraph-sdk";
import { buildAiIdentityHeaders } from "@/lib/ai-auth";

export function createClient(
  apiUrl: string,
  options: {
    apiKey?: string;
    accessToken?: string | null;
    walletAddress?: string | null;
  } = {}
) {
  return new Client({
    apiKey: options.apiKey ?? null,
    apiUrl,
    defaultHeaders: buildAiIdentityHeaders({
      accessToken: options.accessToken,
      walletAddress: options.walletAddress,
    }),
  });
}
