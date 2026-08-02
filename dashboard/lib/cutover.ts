/**
 * Environment variable that controls the S7 cutover write-guard for the
 * legacy standalone dashboard. When set to a truthy value ("1" or "true"),
 * every filesystem write path in the dashboard is blocked.
 */
export const WORKBOOK_CUTOVER_ENV = 'WORKBOOKS_READ_ONLY';

/**
 * Returns whether the cutover write-guard is active.
 *
 * Returns true when `process.env[WORKBOOK_CUTOVER_ENV]` is exactly "1" or
 * "true" (case-insensitive). Any other value, or an unset variable, returns
 * false. Unsetting the variable is the rollback path: it restores the
 * dashboard's write capability without a code change.
 */
export function isCutoverActive(): boolean {
  const value = process.env[WORKBOOK_CUTOVER_ENV];
  if (value === undefined) {
    return false;
  }
  const normalized = value.toLowerCase();
  return normalized === '1' || normalized === 'true';
}

/**
 * Error thrown when a filesystem write is attempted while the cutover
 * write-guard is active. Carries the name of the blocked operation.
 */
export class WorkbookCutoverError extends Error {
  readonly operation: string;

  constructor(operation: string) {
    super(
      `The standalone dashboard is read-only: workbook authoring has moved to apps/workbooks in the reading-advantage monorepo. ` +
      `The attempted operation '${operation}' was blocked. Unset the WORKBOOKS_READ_ONLY environment variable to roll back.`
    );
    this.name = 'WorkbookCutoverError';
    this.operation = operation;
  }
}

/**
 * Guards a filesystem write path against the cutover.
 *
 * Throws {@link WorkbookCutoverError} when {@link isCutoverActive} returns
 * true; returns nothing otherwise. Call this at the top of every filesystem
 * write path, passing the name of the calling function as the operation.
 */
export function assertWritable(operation: string): void {
  if (isCutoverActive()) {
    throw new WorkbookCutoverError(operation);
  }
}
