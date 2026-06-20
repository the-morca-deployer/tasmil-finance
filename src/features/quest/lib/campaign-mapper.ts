import type { Campaign } from "@/features/quest/types";

/**
 * UI state machine for an individual quest task.
 * Drives the per-task action button in CampaignDetail.
 */
export type TaskUiState = "idle" | "verifying" | "claimable" | "claimed" | "error";

/**
 * Maps backend task status + claim flag + verify-failure flag to a UI state.
 * Precedence: claimed > error > claimable > verifying > idle.
 */
export function mapTaskState(input: {
  status?: string | null;
  claimed?: boolean;
  verifyFailed?: boolean;
}): TaskUiState {
  const status = input.status?.toUpperCase() ?? "";
  if (input.claimed === true || status === "CLAIMED") return "claimed";
  if (input.verifyFailed === true) return "error";
  if (status === "COMPLETED" || status === "APPROVED") return "claimable";
  if (status === "IN_PROGRESS") return "verifying";
  return "idle";
}

/**
 * API Response structure from backend (wrapped by ResponseInterceptor)
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: null;
}

/**
 * Campaigns list response structure
 */
interface CampaignsListResponse {
  items: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    avatars?: string[]; // 5 latest participant avatars
  };
}

/**
 * Maps API campaign response to frontend Campaign interface
 */
export function mapApiCampaignToCampaign(apiCampaign: any): Campaign {
  const now = new Date();
  const startAt = apiCampaign.startAt ? new Date(apiCampaign.startAt) : null;
  const endAt = apiCampaign.endAt ? new Date(apiCampaign.endAt) : null;

  // Determine status based on dates
  let status: "ongoing" | "closed" | "upcoming" = "ongoing";
  if (endAt && endAt < now) {
    status = "closed";
  } else if (startAt && startAt > now) {
    status = "upcoming";
  }

  return {
    id: apiCampaign.id,
    title: apiCampaign.title,
    description: apiCampaign.description || "",
    fullDescription:
      apiCampaign.metadata?.descriptionDetail ||
      apiCampaign.descriptionDetail ||
      apiCampaign.description ||
      undefined,
    status,
    banner:
      apiCampaign.logoUrl ||
      apiCampaign.coverUrl ||
      apiCampaign.banner ||
      "https://res.cloudinary.com/drjdgtxvh/image/upload/v1781589395/banner-campaign_dwrtkw.png",
    participants: apiCampaign.questersCount || 0,
    points: apiCampaign.rewardPoints || apiCampaign.metadata?.rewardPoints || 0,
    chain: "U2U Chain", // Default chain, can be updated if backend adds this field
    startDate: startAt ? startAt.toISOString().split("T")[0] : undefined,
    endDate: endAt ? endAt.toISOString().split("T")[0] : undefined,
    avatars: apiCampaign.avatars || [], // Array of avatar URLs for this campaign (max 5)
    coverUrl: apiCampaign.logoUrl || apiCampaign.coverUrl || undefined,
    // steps and reward will be populated from tasks if needed
  };
}

/**
 * Maps API campaigns response (with pagination) to array of Campaign
 * Response structure from backend: { success: true, data: { items: [...], meta: {...} }, error: null }
 * After axios: response.data = { success: true, data: { items: [...], meta: {...} }, error: null }
 *
 * Returns both campaigns and meta (including avatars)
 */
export function mapApiCampaignsResponse(response: any): Campaign[] {
  // Handle wrapped response from ResponseInterceptor
  if (!response) {
    return [];
  }

  // Check if response has the wrapped structure { success, data, error }
  const wrappedResponse = response as ApiResponse<CampaignsListResponse>;
  if (wrappedResponse.success && wrappedResponse.data) {
    const data = wrappedResponse.data;
    if (data && data.items && Array.isArray(data.items)) {
      return data.items.map(mapApiCampaignToCampaign);
    }
  }

  // Fallback: if response is already the data object with items (direct structure)
  if (response.items && Array.isArray(response.items)) {
    return response.items.map(mapApiCampaignToCampaign);
  }

  return [];
}

/**
 * Extracts meta information (including avatars) from campaigns API response
 */
export function extractCampaignsMeta(response: any): CampaignsListResponse["meta"] | null {
  if (!response) {
    return null;
  }

  // Handle wrapped response from ResponseInterceptor
  const wrappedResponse = response as ApiResponse<CampaignsListResponse>;
  if (wrappedResponse.success && wrappedResponse.data && wrappedResponse.data.meta) {
    return wrappedResponse.data.meta;
  }

  // Fallback: if response is already the data object
  if (response.meta) {
    return response.meta;
  }

  return null;
}
