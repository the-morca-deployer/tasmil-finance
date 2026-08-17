/**
 * Reading meaning out of a failed query.
 *
 * The backend distinguishes "this thing does not exist" (404) from "the read
 * failed" (everything else), and the difference matters to routing: a wallet
 * with no managed account belongs in the setup wizard, while a wallet whose
 * position could not be read belongs exactly where it is, with a retry. Both
 * arrive at React Query as `isError` with no data, so callers must ask which
 * one it was rather than assuming.
 */

/** HTTP status of a failed axios request, when there is one. */
export function errorStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | null | undefined)?.response?.status;
}

/** True only for a 404 - the server answering "no such record". */
export function isNotFoundError(error: unknown): boolean {
  return errorStatus(error) === 404;
}
