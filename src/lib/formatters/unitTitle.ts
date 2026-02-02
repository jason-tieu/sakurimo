import { Unit } from '@/lib/types';

/**
 * Cleans up unit titles by removing redundant unit code prefixes.
 * 
 * Examples:
 * - "MXB202_25se2 Advanced Calculus" → "Advanced Calculus"
 * - "CAB222_25se2 Networks" → "Networks"
 * - "EGH400-2_25se2 Research Project 2" → "Research Project 2"
 * - "Laboratory and Workshop HSE Induction – Faculty of Engineering" → unchanged
 * 
 * @param unit - The unit object containing code and title
 * @returns The cleaned title (no unit code in the text)
 */
export function cleanUnitTitle(unit: Unit): string {
  if (!unit.title || !unit.code) {
    return unit.title ?? '';
  }

  // Match unit code at start, optional suffix (e.g. _25se2, _24se1), then spaces, then rest
  const codeEscaped = escapeRegExp(unit.code);
  const unitCodePattern = new RegExp(`^${codeEscaped}(_[\\w.-]+)?\\s*`, 'i');
  const cleanedTitle = unit.title.replace(unitCodePattern, '').trim();

  if (cleanedTitle && cleanedTitle !== unit.title) {
    return cleanedTitle;
  }

  return unit.title;
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
