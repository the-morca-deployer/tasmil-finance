import type { TractionData } from "./evidence";

export type { TractionData };
export type TractionSummary = TractionData["summary"];
export type VolumeTvlPoint = TractionData["volumeTvl"][number];
export type UserGrowthPoint = TractionData["userGrowth"][number];
