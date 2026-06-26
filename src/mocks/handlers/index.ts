/**
 * Combined MSW handlers for all API backends.
 */
import { backendHandlers } from "./backend";
import { questHandlers } from "./quest";

export const handlers = [...backendHandlers, ...questHandlers];
