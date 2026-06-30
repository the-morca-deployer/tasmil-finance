import questApiClient from "@/features/quest/lib/api-client";
import { submitSignatureProof } from "@/features/quest/lib/sign-message-verify";

// Mock the api client module so no real HTTP calls are made.
jest.mock("@/features/quest/lib/api-client", () => {
  const client = { post: jest.fn() };
  return { __esModule: true, default: client, questApiClient: client };
});

const mockPost = questApiClient.post as jest.Mock;

describe("submitSignatureProof", () => {
  const TASK_ID = "task-abc";
  const PUBLIC_KEY = "GABC1234STELLAR";
  const CHALLENGE_MSG = "tasmil:nonce:xyz789";
  const SIGNED_HEX = "aabbccddeeff";

  let mockSignFn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignFn = jest.fn().mockResolvedValue(SIGNED_HEX);
  });

  it("(a) fetches a fresh challenge with publicKey, (b) signs the returned message, (c) POSTs to verify-signature, (d) returns success", async () => {
    // Challenge endpoint returns the message to sign.
    mockPost.mockResolvedValueOnce({ data: { message: CHALLENGE_MSG } });
    // Verify-signature endpoint returns success.
    mockPost.mockResolvedValueOnce({ data: { success: true, message: "Signature verified!" } });

    const result = await submitSignatureProof(TASK_ID, PUBLIC_KEY, mockSignFn);

    // (a) fetched challenge with publicKey
    expect(mockPost).toHaveBeenNthCalledWith(1, "/api/auth/challenge", {
      publicKey: PUBLIC_KEY,
    });

    // (b) signed the challenge message the server returned
    expect(mockSignFn).toHaveBeenCalledTimes(1);
    expect(mockSignFn).toHaveBeenCalledWith(CHALLENGE_MSG);

    // (c) POSTed publicKey + signedMessage to the verify-signature endpoint
    expect(mockPost).toHaveBeenNthCalledWith(2, `/api/quest/tasks/${TASK_ID}/verify-signature`, {
      publicKey: PUBLIC_KEY,
      signedMessage: SIGNED_HEX,
    });

    // (d) resolves with the backend's success payload
    expect(result).toEqual({ success: true, message: "Signature verified!" });
  });

  it("(d) returns failure when backend returns success: false", async () => {
    mockPost.mockResolvedValueOnce({ data: { message: CHALLENGE_MSG } });
    mockPost.mockResolvedValueOnce({
      data: { success: false, message: "Invalid signature" },
    });

    const result = await submitSignatureProof(TASK_ID, PUBLIC_KEY, mockSignFn);

    expect(result).toEqual({ success: false, message: "Invalid signature" });
  });

  it("throws when the challenge response contains no message", async () => {
    mockPost.mockResolvedValueOnce({ data: {} });

    await expect(submitSignatureProof(TASK_ID, PUBLIC_KEY, mockSignFn)).rejects.toThrow(
      "Empty challenge received from server"
    );
    // sign function must never be called
    expect(mockSignFn).not.toHaveBeenCalled();
  });

  it("re-throws when the sign function rejects (e.g. user rejects in wallet)", async () => {
    mockPost.mockResolvedValueOnce({ data: { message: CHALLENGE_MSG } });
    mockSignFn.mockRejectedValueOnce(new Error("User rejected the request"));

    await expect(submitSignatureProof(TASK_ID, PUBLIC_KEY, mockSignFn)).rejects.toThrow(
      "User rejected the request"
    );
    // verify-signature endpoint must NOT be called when signing fails
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it("handles the nested { data: { message } } challenge shape (before interceptor unwrap)", async () => {
    // If the interceptor didn't fire (e.g. no top-level success:true), the
    // data key is still present and the helper must fall back to it.
    mockPost.mockResolvedValueOnce({ data: { data: { message: CHALLENGE_MSG } } });
    mockPost.mockResolvedValueOnce({ data: { success: true, message: "OK" } });

    const result = await submitSignatureProof(TASK_ID, PUBLIC_KEY, mockSignFn);

    expect(mockSignFn).toHaveBeenCalledWith(CHALLENGE_MSG);
    expect(result.success).toBe(true);
  });
});
