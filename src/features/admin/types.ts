import type { AdminControllerGetDashboardQueryResponse } from "@/gen-backend/types/admin-controller-get-dashboard";
import type { AdminControllerGetRegistrationStatsQueryResponse } from "@/gen-backend/types/admin-controller-get-registration-stats";
import type { AdminControllerGetWaitlistEntriesQueryResponse } from "@/gen-backend/types/admin-controller-get-waitlist-entries";
import type { AdminControllerListCampaignsQueryResponse } from "@/gen-backend/types/admin-controller-list-campaigns";

export type AdminDashboard = AdminControllerGetDashboardQueryResponse;
export type RegistrationStats = AdminControllerGetRegistrationStatsQueryResponse;
export type WaitlistEntriesResponse = AdminControllerGetWaitlistEntriesQueryResponse;
export type CampaignRunList = AdminControllerListCampaignsQueryResponse;

export type WaitlistStatus = "PENDING" | "CONFIRMED" | "ACCESS_SENT" | "UNSUBSCRIBED" | "BOUNCED";

export const WAITLIST_STATUSES: WaitlistStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ACCESS_SENT",
  "UNSUBSCRIBED",
  "BOUNCED",
];

export interface EmailDispatch {
  id: string;
  templateType: string;
  status: string;
  providerMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface BulkSendResult {
  sent: number;
  failed: number;
  errors: { id: string; reason: string }[];
}
