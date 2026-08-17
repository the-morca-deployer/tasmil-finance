/**
 * `farming-3` — the Heron-styled farming console.
 *
 * Consumers import from `@/features/farming-3`, never from a deep sub-path.
 */

export { ActivityList } from "./components/activity-list";
export { AllocationPanel } from "./components/allocation-panel";
export { ConsoleShell } from "./components/console-shell";
export {
  Chip,
  EmptyNote,
  Eyebrow,
  Hairline,
  Num,
  Panel,
  PanelHead,
  Pill,
  Rail,
  RowSkeletons,
  SectionRule,
  Stat,
  StatStrip,
  StepIndicator,
  Value,
} from "./components/console-ui";
export { DashboardScreen } from "./components/dashboard-screen";
export { DepositScreen } from "./components/deposit-screen";
export { FarmingConsole } from "./components/farming-console";
export { JourneyPanel, JourneyStepRow } from "./components/journey-panel";
export { MarketTable, maxApyFraction } from "./components/market-table";
export {
  HISTORY_WINDOWS,
  type HistoryWindow,
  PerformanceChart,
} from "./components/performance-chart";
export { StrategyScreen } from "./components/strategy-screen";
export {
  type PresetCandidates,
  riskPresetFromServer,
  useConsoleActivity,
  useConsoleHistory,
  useConsolePools,
  useConsolePosition,
  useConsolePresetCandidates,
  useConsoleRebalanceStatus,
} from "./hooks/use-console-api";
export { useSigningJourney } from "./hooks/use-signing-journey";
export type {
  AccountStatus,
  ConsoleActivityItem,
  ConsolePool,
  ConsolePosition,
  ConsolePositionLeg,
  ConsoleRebalanceStatus,
  ConsoleSnapshot,
  ConsoleStage,
  DepositToken,
  JourneyEvent,
  JourneyPhase,
  JourneyProgress,
  JourneyStepConfig,
  JourneyStepId,
  JourneyStepState,
  JourneyStepView,
  RiskPreset,
} from "./types";
export {
  formatAmount,
  formatApy,
  formatDayLabel,
  formatInstant,
  formatPercentPoints,
  formatSignedUsd,
  formatTimestamp,
  formatTvl,
  formatUsd,
  NO_DATA,
  shortAddress,
  shortHash,
  titleCase,
} from "./utils/format";
export {
  buildJourneyView,
  completionFromAccountStatus,
  currentJourneyStepId,
  initialJourneyProgress,
  isJourneyComplete,
  JOURNEY_STEPS,
  journeyConfirmedCount,
  journeyReducer,
  txHashesFromActivity,
} from "./utils/journey";
export {
  buildSeriesGeometry,
  nearestIndex,
  type SeriesChange,
  type SeriesGeometry,
  type SeriesPoint,
  type SeriesStatus,
  seriesChange,
  seriesStatus,
  toSeriesPoints,
} from "./utils/series";
