import type { AdminControllerGetTransactionsQueryResponse } from "@/gen-backend/types/admin-controller-get-transactions";
import type { AdminControllerGetTransactionsStatsQueryResponse } from "@/gen-backend/types/admin-controller-get-transactions-stats";
import type { AdminControllerGetVolumeTvlQueryResponse } from "@/gen-backend/types/admin-controller-get-volume-tvl";
import type { AdminControllerGetWalletsQueryResponse } from "@/gen-backend/types/admin-controller-get-wallets";

export type VolumeTvlPoint = AdminControllerGetVolumeTvlQueryResponse[number];
export type WalletsAnalyticsResponse = AdminControllerGetWalletsQueryResponse;
export type WalletRow = WalletsAnalyticsResponse["rows"][number];
export type TransactionsLogResponse = AdminControllerGetTransactionsQueryResponse;
export type TransactionRow = TransactionsLogResponse["rows"][number];
export type TransactionsStats = AdminControllerGetTransactionsStatsQueryResponse;

export type WalletSortKey = "tvl" | "volume" | "txCount" | "joinedAt";
export type SortOrder = "asc" | "desc";
export type Granularity = "day" | "week" | "month";
