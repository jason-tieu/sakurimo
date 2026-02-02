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
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export function UnitsList({ units, onUnitAdded }: UnitsListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [onlyWithPeriod, setOnlyWithPeriod] = useState(true);
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const onlyWithPeriodParam = urlParams.get('onlyWithPeriod');
    if (onlyWithPeriodParam !== null) {
      setOnlyWithPeriod(onlyWithPeriodParam === '1');
    }
  }, []);

  const handleFilterChange = useCallback((value: boolean) => {
    setOnlyWithPeriod(value);
    const url = new URL(window.location.href);
    url.searchParams.set('onlyWithPeriod', value ? '1' : '0');
    window.history.replaceState({}, '', url.toString());
  }, []);

  const filteredUnits = useMemo(
    () => (onlyWithPeriod ? units.filter(hasPeriod) : units),
    [units, onlyWithPeriod]
  );

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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filteredUnits.length} of {units.length} units
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Only with Period</label>
          <button
            onClick={() => handleFilterChange(!onlyWithPeriod)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              onlyWithPeriod ? 'bg-brand' : 'bg-muted'
            }`}
            aria-label="Toggle period filter"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                onlyWithPeriod ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
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
