import type { TractionResponseDto } from "@/gen-backend/types/traction-response-dto";

export type TractionData = TractionResponseDto;
export type TractionSummary = TractionResponseDto["summary"];
export type VolumeTvlPoint = TractionResponseDto["volumeTvl"][number];
export type UserGrowthPoint = TractionResponseDto["userGrowth"][number];
export type TxTypeCount = TractionResponseDto["txByType"][number];
