import { formatPeriod } from './formatters/period';

export function groupUnits<T extends { year?: number | null; semester?: number | null }>(
  units: T[]
): { groups: Record<string, T[]>; orderedKeys: string[] } {
  const withPeriod = units.filter(u => u.year != null && u.semester != null);
  const withoutPeriod = units.filter(u => u.year == null || u.semester == null);

  // Sort by year DESC, semester DESC
  withPeriod.sort((a, b) => {
    if (a.year !== b.year) return (b.year ?? 0) - (a.year ?? 0);
    return (b.semester ?? 0) - (a.semester ?? 0);
  });

  const groups: Record<string, T[]> = {};
  for (const u of withPeriod) {
    const key = formatPeriod(u);
    if (!groups[key]) groups[key] = [];
    groups[key].push(u);
  }

  if (withoutPeriod.length > 0) {
    groups['Other'] = withoutPeriod;
  }

  const orderedKeys: string[] = [];
  for (const u of withPeriod) {
    const key = formatPeriod(u);
    if (!orderedKeys.includes(key)) orderedKeys.push(key);
  }
  if (withoutPeriod.length > 0) orderedKeys.push('Other');

  return { groups, orderedKeys };
}
