/**
 * Performs the challenge → wallet-sign → backend-verify flow for the
 * sign_message quest task.  Separated from the component so it can be
 * unit-tested without rendering a full React tree.
 */
import questApiClient from "@/features/quest/lib/api-client";

/** Function signature expected from the wallet context's signMessage helper. */
export type SignFn = (message: string) => Promise<string>;

/** Return value passed back to the caller (QuestItem). */
export interface SignatureProofResult {
  success: boolean;
  message: string;
}

/**
 * Fetches a fresh auth challenge, signs it with the user's wallet, then
 * POSTs the proof to the backend's sign_message verification endpoint.
 *
 * @param taskId     Quest task ID (used in the endpoint path).
 * @param publicKey  User's Stellar public key (sent to both endpoints).
 * @param signFn     The wallet sign primitive – must return the signed string.
 */
export async function submitSignatureProof(
  taskId: string,
  publicKey: string,
  signFn: SignFn
): Promise<SignatureProofResult> {
  // 1. Fetch a fresh challenge from the auth endpoint (same as wallet login).
  //    The backend expects { publicKey } in the request body.
  const challengeRes = await questApiClient.post("/api/auth/challenge", { publicKey });
  const cbody = challengeRes.data as { message?: string; data?: { message?: string } };
  // The questApiClient interceptor unwraps { success, data } → data when
  // success===true and a "data" key exists. Be defensive for both shapes.
  const challengeMessage = cbody?.message ?? cbody?.data?.message ?? "";
  if (!challengeMessage) {
    throw new Error("Empty challenge received from server");
  }

  // 2. Ask the wallet to sign the challenge message.
  const signedMessage = await signFn(challengeMessage);

  // 3. Submit the proof to the dedicated backend endpoint.
  const verifyRes = await questApiClient.post(`/api/quest/tasks/${taskId}/verify-signature`, {
    publicKey,
    signedMessage,
  });
  const body = verifyRes.data as { success?: boolean; message?: string };
  return {
    success: body?.success ?? false,
    message: body?.message ?? (body?.success ? "Signature verified!" : "Verification failed"),
  };
}
