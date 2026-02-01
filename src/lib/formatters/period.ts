/**
 * Period formatting utilities for units
 */

export interface UnitPeriod {
  term_display?: string | null;
  semester?: number | null;
  year?: number | null;
  term?: string | null;
}

/**
 * Format period display for a unit
 * Prefer term_display if non-null and non-empty
 * else if semester && year → S${semester} ${year}
 * else if term (string) → term
 * else return "N/A"
 */
export function formatPeriod(u: UnitPeriod): string {
  // Prefer term_display if available
  if (u.term_display && u.term_display.trim()) {
    return u.term_display.trim();
  }

  // Fallback to semester + year
  if (u.semester && u.year) {
    return `S${u.semester} ${u.year}`;
  }

  // Fallback to term string
  if (u.term && u.term.trim()) {
    return u.term.trim();
  }

  // No period information available
  return "N/A";
}

/**
 * Check if a unit has period information
 * Returns true if any period field has a value
 */
export function hasPeriod(u: UnitPeriod): boolean {
  return Boolean(
    u.term_display || 
    (u.semester && u.year) || 
    u.term
  );
}

