/**
 * Period formatting utilities for units.
 * term_display is derived from year + semester (not stored).
 */

export interface UnitPeriod {
  semester?: number | null;
  year?: number | null;
}

/**
 * Format period display for a unit (derived from year + semester).
 */
export function formatPeriod(u: UnitPeriod): string {
  if (u.semester != null && u.year != null) {
    return `S${u.semester} ${u.year}`;
  }
  return 'N/A';
}

/**
 * Check if a unit has period information (year and semester).
 */
export function hasPeriod(u: UnitPeriod): boolean {
  return u.year != null && u.semester != null;
}

