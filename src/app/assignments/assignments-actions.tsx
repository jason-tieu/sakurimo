'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Filter, RefreshCw, Plus } from 'lucide-react';
import UIButton from '@/components/UIButton';

interface AssignmentsActionsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  unitFilter: string;
  onUnitFilterChange: (value: string) => void;
  onClearFilters: () => void;
  onSync: () => void;
  syncing: boolean;
  availableStatuses: string[];
  availableTypes: string[];
  availableUnitCodes: string[];
}

const STATUS_OPTIONS = ['all', 'todo', 'in_progress', 'submitted', 'graded', 'late', 'published', 'unpublished'];

export function AssignmentsActions({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  unitFilter,
  onUnitFilterChange,
  onClearFilters,
  onSync,
  syncing,
  availableStatuses,
  availableTypes,
  availableUnitCodes,
}: AssignmentsActionsProps) {
  const hasActiveFilters =
    statusFilter !== 'all' || typeFilter !== 'all' || unitFilter !== 'all';
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

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <div className="flex-1 flex items-center gap-3 rounded-lg border border-border bg-card/50 px-3 py-2 focus-within:ring-2 focus-within:ring-brand/50">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          type="text"
          placeholder="Search assignments..."
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
            <div>
              <span className="text-xs font-medium text-muted-foreground block mb-2">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="w-full text-sm rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <option value="all">All status</option>
                {STATUS_OPTIONS.filter((s) => s !== 'all').map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground block mb-2">Type</span>
              <select
                value={typeFilter}
                onChange={(e) => onTypeFilterChange(e.target.value)}
                className="w-full text-sm rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <option value="all">All types</option>
                {['assignment', 'quiz', 'project', 'lab', 'essay', 'presentation'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground block mb-2">Unit</span>
              <select
                value={unitFilter}
                onChange={(e) => onUnitFilterChange(e.target.value)}
                className="w-full text-sm rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <option value="all">All units</option>
                {availableUnitCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <div className="pt-3 mt-2 border-t border-border">
                <UIButton
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={onClearFilters}
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
        onClick={onSync}
        disabled={syncing}
      >
        <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing…' : 'Sync'}
      </UIButton>
      <UIButton variant="primary" className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Add Assignment
      </UIButton>
    </div>
  );
}
