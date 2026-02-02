'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Filter, RefreshCw, Plus } from 'lucide-react';
import { Unit } from '@/lib/types';
import UIButton from '@/components/UIButton';
import { AddUnitModal } from '@/components/AddUnitModal';

const SEMESTER_OPTIONS = [1, 2] as const;

interface UnitsActionsProps {
  onRefresh?: (() => void) | null;
  onSync?: () => void;
  syncing?: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onlyWithPeriod: boolean;
  onOnlyWithPeriodChange: (value: boolean) => void;
  filterYear: number | null;
  onFilterYearChange: (value: number | null) => void;
  filterSemester: number | null;
  onFilterSemesterChange: (value: number | null) => void;
  filterCodePrefixes: string[];
  onFilterCodePrefixesChange: (value: string[]) => void;
  availableYears: number[];
  availablePrefixes: string[];
  onClearFilters: () => void;
}

export function UnitsActions({
  onRefresh,
  onSync,
  syncing = false,
  searchQuery,
  onSearchChange,
  onlyWithPeriod,
  onOnlyWithPeriodChange,
  filterYear,
  onFilterYearChange,
  filterSemester,
  onFilterSemesterChange,
  filterCodePrefixes,
  onFilterCodePrefixesChange,
  availableYears,
  availablePrefixes,
  onClearFilters,
}: UnitsActionsProps) {
  const hasActiveFilters =
    filterYear !== null || filterSemester !== null || filterCodePrefixes.length > 0;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [filterOpen]);

  // Handle unit added from modal
  const handleUnitAdded = (_newUnit: Unit) => {
    // Trigger refresh to show new unit
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 flex items-center gap-3 rounded-lg border border-border bg-card/50 px-3 py-2 focus-within:ring-2 focus-within:ring-brand/50">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            type="text"
            placeholder="Search units..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent focus:outline-none"
          />
        </div>
        <div className="relative" ref={filterRef}>
          <UIButton
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => setFilterOpen((o) => !o)}
          >
            <Filter className="h-4 w-4" />
            Filter
          </UIButton>
          {filterOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-lg border border-border bg-card shadow-lg p-4 space-y-4">
              <label className="flex items-center justify-between gap-3 text-sm text-foreground cursor-pointer">
                <span className="text-muted-foreground">Only with Period</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={onlyWithPeriod}
                  onClick={() => onOnlyWithPeriodChange(!onlyWithPeriod)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 ${
                    onlyWithPeriod ? 'bg-brand' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      onlyWithPeriod ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              <div>
                <span className="text-xs font-medium text-muted-foreground block mb-2">Year</span>
                <select
                  value={filterYear ?? ''}
                  onChange={(e) => onFilterYearChange(e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full text-sm rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/50"
                >
                  <option value="">All years</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-xs font-medium text-muted-foreground block mb-2">Semester</span>
                <select
                  value={filterSemester ?? ''}
                  onChange={(e) => onFilterSemesterChange(e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full text-sm rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/50"
                >
                  <option value="">All semesters</option>
                  {SEMESTER_OPTIONS.map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-xs font-medium text-muted-foreground block mb-2">Unit code prefix</span>
                <div className="flex flex-wrap gap-2">
                  {availablePrefixes.map((prefix) => {
                    const checked = filterCodePrefixes.includes(prefix);
                    return (
                      <label
                        key={prefix}
                        className="flex items-center gap-1.5 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              onFilterCodePrefixesChange(filterCodePrefixes.filter((p) => p !== prefix));
                            } else {
                              onFilterCodePrefixesChange([...filterCodePrefixes, prefix]);
                            }
                          }}
                          className="rounded border-border text-brand focus:ring-brand/50"
                        />
                        <span>{prefix}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {hasActiveFilters && (
                <div className="pt-3 mt-2 border-t border-border">
                  <UIButton
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => onClearFilters()}
                  >
                    Clear filters
                  </UIButton>
                </div>
              )}
            </div>
          )}
        </div>
        <UIButton
          variant="secondary"
          className="flex items-center gap-2"
          onClick={() => onSync?.()}
          disabled={syncing}
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync'}
        </UIButton>
        <UIButton 
          variant="primary" 
          className="flex items-center gap-2"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Unit
        </UIButton>
      </div>

      {/* Add Unit Modal */}
      <AddUnitModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onUnitAdded={handleUnitAdded}
      />
    </>
  );
}
