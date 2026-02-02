'use client';

/**
 * Performance changes (dev notes):
 * - Virtualization: flattened header + unit rows, @tanstack/react-virtual; only visible rows rendered.
 * - Stable layout: UnitCard min-height; no per-item animations during scroll; no heavy shadows/blurs.
 * - Derived data: useMemo for filteredUnits, groupUnits, flattenedRows; stable callbacks; React.memo(UnitCard).
 * - Keys: stable (unit.id, period-based row keys). No index keys.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { BookOpen, Plus, Filter } from 'lucide-react';
import { Unit } from '@/lib/types';
import { hasPeriod } from '@/lib/formatters/period';
import { cleanUnitTitle } from '@/lib/formatters/unitTitle';
import { groupUnits } from '@/lib/groupUnits';
import UIButton from '@/components/UIButton';
import { AddUnitModal } from '@/components/AddUnitModal';
import { UnitCard } from '@/components/UnitCard';
import { UnitDetailsModal } from '@/components/UnitDetailsModal';

const DEV = process.env.NODE_ENV === 'development';

/** Fixed row heights for stable layout; must fit actual content to avoid overlap. */
const ROW_HEADER_HEIGHT = 88; /* header (text-xl) + mb-8 between sections */
const ROW_CARD_HEIGHT = 312; /* one row of cards: ~280px content (min 220 + padding/gap) + gap below */

type FlattenedRow =
  | { type: 'header'; key: string; label: string; count: number }
  | { type: 'unit-row'; key: string; units: Unit[] };

interface UnitsListProps {
  units: Unit[];
  onUnitAdded: (unit: Unit) => void;
  searchQuery?: string;
  onlyWithPeriod?: boolean;
  filterYear?: number | null;
  filterSemester?: number | null;
  filterCodePrefixes?: string[];
}

function matchesSearch(unit: Unit, q: string): boolean {
  if (!q.trim()) return true;
  const lower = q.trim().toLowerCase();
  const code = (unit.code ?? '').toLowerCase();
  const title = (unit.title ?? '').toLowerCase();
  const cleanTitle = cleanUnitTitle(unit).toLowerCase();
  return code.includes(lower) || title.includes(lower) || cleanTitle.includes(lower);
}

function matchesYear(unit: Unit, year: number | null): boolean {
  if (year === null) return true;
  return unit.year === year;
}

function matchesSemester(unit: Unit, semester: number | null): boolean {
  if (semester === null) return true;
  return unit.semester === semester;
}

function matchesCodePrefix(unit: Unit, prefixes: string[]): boolean {
  if (prefixes.length === 0) return true;
  const code = (unit.code ?? '').toUpperCase();
  return prefixes.some((p) => code.startsWith(p.toUpperCase()));
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export function UnitsList({
  units,
  onUnitAdded,
  searchQuery = '',
  onlyWithPeriod = true,
  filterYear = null,
  filterSemester = null,
  filterCodePrefixes = [],
}: UnitsListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  const handleUnitAdded = useCallback(
    (newUnit: Unit) => {
      onUnitAdded(newUnit);
    },
    [onUnitAdded]
  );

  const handleViewDetails = useCallback((unitId: string) => {
    setSelectedUnitId(unitId);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedUnitId(null);
  }, []);

  const filteredUnits = useMemo(() => {
    let list = units.filter((u) => matchesSearch(u, searchQuery));
    list = list.filter((u) => matchesYear(u, filterYear));
    list = list.filter((u) => matchesSemester(u, filterSemester));
    list = list.filter((u) => matchesCodePrefix(u, filterCodePrefixes));
    return onlyWithPeriod ? list.filter(hasPeriod) : list;
  }, [units, searchQuery, onlyWithPeriod, filterYear, filterSemester, filterCodePrefixes]);

  const { groups, orderedKeys } = useMemo(
    () => {
      if (DEV) console.time('UnitsList: groupUnits');
      const result = groupUnits(filteredUnits);
      if (DEV) console.timeEnd('UnitsList: groupUnits');
      return result;
    },
    [filteredUnits]
  );

  const flattenedRows = useMemo((): FlattenedRow[] => {
    const rows: FlattenedRow[] = [];
    for (const period of orderedKeys) {
      const list = groups[period];
      rows.push({
        type: 'header',
        key: `header-${period}`,
        label: period,
        count: list.length,
      });
      for (const unitChunk of chunk(list, 3)) {
        rows.push({
          type: 'unit-row',
          key: `row-${period}-${unitChunk.map((u) => u.id).join('-')}`,
          units: unitChunk,
        });
      }
    }
    return rows;
  }, [orderedKeys, groups]);

  const totalCards = useMemo(
    () => orderedKeys.reduce((acc, k) => acc + groups[k].length, 0),
    [orderedKeys, groups]
  );

  const rowVirtualizer = useVirtualizer({
    count: flattenedRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const row = flattenedRows[index];
      return row.type === 'header' ? ROW_HEADER_HEIGHT : ROW_CARD_HEIGHT;
    },
    getItemKey: (index) => flattenedRows[index].key,
    overscan: 2,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  if (DEV) {
    useEffect(() => {
      console.log('[UnitsList] derived state:', {
        unitCount: units.length,
        filteredCount: filteredUnits.length,
        groupCount: orderedKeys.length,
        flattenedRowCount: flattenedRows.length,
        virtualItemCount: virtualItems.length,
        renderCount: renderCountRef.current,
      });
    }, [
      units.length,
      filteredUnits.length,
      orderedKeys.length,
      flattenedRows.length,
      virtualItems.length,
    ]);
  }

  if (units.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No units found</h3>
          <p className="text-muted-foreground mb-6">
            Get started by adding your first unit.
          </p>
          <UIButton
            variant="primary"
            className="flex items-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Unit
          </UIButton>
        </div>

        <AddUnitModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onUnitAdded={handleUnitAdded}
        />

        {selectedUnitId && (
          <UnitDetailsModal
            unitId={selectedUnitId}
            open={!!selectedUnitId}
            onClose={handleCloseDetails}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {filteredUnits.length} of {units.length} units
          {searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : ''}
        </span>
      </div>

      <div className="relative" style={{ height: 'min(65vh, 720px)' }}>
        <div
          ref={parentRef}
          className="overflow-auto h-full scrollbar-none"
        >
          <div
            style={{
              height: totalSize,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualRow) => {
            const row = flattenedRows[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: row.type === 'header' ? ROW_HEADER_HEIGHT : ROW_CARD_HEIGHT,
                  transform: `translateY(${virtualRow.start}px)`,
                  boxSizing: 'border-box',
                }}
              >
                {row.type === 'header' ? (
                  <h2 className="text-xl font-semibold mb-8 text-foreground">
                    {row.label} ({row.count} unit{row.count !== 1 ? 's' : ''})
                  </h2>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {row.units.map((unit) => (
                      <UnitCard
                        key={unit.id}
                        unit={unit}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
        {/* Fade at bottom so content doesn't cut off harshly */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent"
          aria-hidden
        />
      </div>

      <AddUnitModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onUnitAdded={handleUnitAdded}
      />

      {selectedUnitId && (
        <UnitDetailsModal
          unitId={selectedUnitId}
          open={!!selectedUnitId}
          onClose={handleCloseDetails}
        />
      )}
    </>
  );
}
