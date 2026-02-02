'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Unit } from '@/lib/types';
import { useStorage } from '@/lib/storageContext';
import { useSession } from '@/lib/supabase/SupabaseProvider';
import { UnitsList } from './units-list';

/**
 * Extract unit prefix from "actual" unit codes: either _YYseN format (MXB202_25se2) or
 * PREFIX + digits (MXB202, EGH400-2). Excludes plain words like QUT, STEM, STIMULATE.
 */
function codePrefixFromCanonicalCode(code: string | null): string | null {
  if (!code?.trim()) return null;
  const s = code.trim();
  const withSuffix = s.match(/^([A-Za-z]+)\d+_\d{2}se\d/i);
  if (withSuffix) return withSuffix[1].toUpperCase();
  const withDigits = s.match(/^([A-Za-z]+)\d/i);
  return withDigits ? withDigits[1].toUpperCase() : null;
}

interface UnitsDataProps {
  onRefreshRequest?: (refreshFn: () => void) => void;
  onFilterOptions?: (options: { years: number[]; prefixes: string[] }) => void;
  searchQuery?: string;
  onlyWithPeriod?: boolean;
  filterYear?: number | null;
  filterSemester?: number | null;
  filterCodePrefixes?: string[];
}

const DEV = process.env.NODE_ENV === 'development';

export function UnitsData({
  onRefreshRequest,
  onFilterOptions,
  searchQuery = '',
  onlyWithPeriod = true,
  filterYear = null,
  filterSemester = null,
  filterCodePrefixes = [],
}: UnitsDataProps) {
  const storage = useStorage();
  const { session, isLoading } = useSession();
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const filterOptions = useMemo(() => {
    const years = Array.from(
      new Set(units.map((u) => u.year).filter((y): y is number => y != null))
    ).sort((a, b) => b - a);
    const prefixes = Array.from(
      new Set(
        units
          .map((u) => codePrefixFromCanonicalCode(u.code))
          .filter((p): p is string => p != null && p.length > 0)
      )
    ).sort();
    return { years, prefixes };
  }, [units]);

  useEffect(() => {
    onFilterOptions?.(filterOptions);
  }, [onFilterOptions, filterOptions]);

  // Load units when session becomes available or when refresh is triggered
  useEffect(() => {
    const loadUnits = async () => {
      try {
        // Wait for session to load
        if (isLoading) {
          return;
        }
        if (DEV) console.time('UnitsData: Supabase fetch (storage.listUnits)');
        const storageUnits = await storage.listUnits();
        if (DEV) console.timeEnd('UnitsData: Supabase fetch (storage.listUnits)');
        if (DEV) console.log('[UnitsData] units count:', storageUnits.length);
        setUnits(storageUnits);
        setHasInitiallyLoaded(true);
      } catch {
        setUnits([]);
        setHasInitiallyLoaded(true);
      } finally {
        setIsLoadingUnits(false);
      }
    };

    loadUnits();
  }, [storage, isLoading, session, refreshTrigger]);

  // Expose refresh function to parent components
  const refreshUnits = useCallback(() => {
    setIsLoadingUnits(true);
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Pass refresh function to parent on mount
  useEffect(() => {
    if (onRefreshRequest) {
      onRefreshRequest(refreshUnits);
    }
  }, [onRefreshRequest, refreshUnits]);

  // Handle unit added from modal
  const handleUnitAdded = (newUnit: Unit) => {
    setUnits(prev => [...prev, newUnit]);
  };

  // Show skeleton while loading OR if we haven't initially loaded yet
  if (isLoadingUnits || !hasInitiallyLoaded) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
        {Array.from({ length: 6 }).map((_, i) => (
          <div 
            key={i} 
            className="bg-card/80 border border-border rounded-2xl p-6 animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-muted/70 rounded-lg"></div>
              <div className="w-16 h-6 bg-muted/60 rounded-full"></div>
            </div>
            <div className="h-6 bg-muted/70 rounded w-2/3 mb-2"></div>
            <div className="h-5 bg-muted/60 rounded w-3/4 mb-3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted/60 rounded w-full"></div>
              <div className="h-4 bg-muted/60 rounded w-2/3"></div>
              <div className="h-4 bg-muted/60 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <UnitsList
        units={units}
        onUnitAdded={handleUnitAdded}
        searchQuery={searchQuery}
        onlyWithPeriod={onlyWithPeriod}
        filterYear={filterYear}
        filterSemester={filterSemester}
        filterCodePrefixes={filterCodePrefixes}
      />
    </div>
  );
}
