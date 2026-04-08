/**
 * Custom UI Components Registry
 *
 * Register your custom UI components here for LangGraph's LoadExternalComponent.
 * Backend agents emit UI messages with name "{ui_prefix}-info" or "{ui_prefix}-operation".
 * This map routes those names to the correct React dispatcher component.
 */

import {
  StellarInfoDispatcher,
  StellarOperationDispatcher,
} from "@/features/chat/actions/components/stellar";
import { SupervisorPlanCard } from "@/features/chat/actions/components/stellar/supervisor-plan-card";

const ComponentMap = {
  // Supervisor (orchestrator)
  "supervisor-plan": SupervisorPlanCard,

  // Swap Agent
  "swap-info": StellarInfoDispatcher,
  "swap-operation": StellarOperationDispatcher,

  // Bridge Agent
  "bridge-info": StellarInfoDispatcher,
  "bridge-operation": StellarOperationDispatcher,

  // Vault Agent
  "vault-info": StellarInfoDispatcher,
  "vault-operation": StellarOperationDispatcher,

  // Staking Agent
  "staking-info": StellarInfoDispatcher,
  "staking-operation": StellarOperationDispatcher,

  // Yield Agent (read-only)
  "yield-info": StellarInfoDispatcher,

  // Info Agent (read-only)
  "info-info": StellarInfoDispatcher,

  // Research Agent (read-only)
  "research-info": StellarInfoDispatcher,
} as const;

export default ComponentMap;

// Export type for TypeScript support
export type ComponentMapType = typeof ComponentMap;
