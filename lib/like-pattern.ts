/** Escape `\`, `%`, and `_` so user input is matched literally in SQL ILIKE/LIKE patterns. */
export function escapeLikeWildcards(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/** Build `%…%` pattern for ILIKE after escaping user wildcards. */
export function ilikeContainsPattern(trimmedUserInput: string): string {
  return `%${escapeLikeWildcards(trimmedUserInput)}%`;
}

/**
 * PostgREST `or()` filter value: wrap in double quotes; double any `"` inside.
 * Use for ilike patterns that may contain spaces or commas.
 */
export function postgrestQuotedValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '""')}"`;
}
