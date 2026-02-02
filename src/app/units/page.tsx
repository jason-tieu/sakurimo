'use client';

import { Suspense, useRef, useCallback, useState, useEffect } from 'react';
import SectionWrapper from '@/components/SectionWrapper';
import { useSession } from '@/lib/supabase/SupabaseProvider';
import { useSync } from '@/lib/syncContext';
import { useToast } from '@/lib/toast';
import { readUnitsSyncStream } from '@/lib/readSyncStream';
import { UnitsActions } from './units-actions';
import { UnitsData } from './units-data';

export default function UnitsPage() {
  const { session } = useSession();
  const { addToast } = useToast();
  const {
    unitsSyncing,
    setUnitsSyncing,
    setUnitsProgress,
    setUnitsSyncResult,
  } = useSync();
  const refreshUnitsRef = useRef<(() => void) | null>(null);
  const onRefreshRequest = useCallback((refreshFn: () => void) => {
    refreshUnitsRef.current = refreshFn;
  }, []);

  const handleSync = useCallback(async () => {
    const token = session?.access_token;
    if (!token) {
      addToast({ title: 'Not signed in', type: 'warning' });
      return;
    }
    setUnitsSyncing(true);
    setUnitsProgress(null);
    try {
      await readUnitsSyncStream(
        '/api/canvas/sync/stream',
        token,
        (current, total) => setUnitsProgress({ current, total }),
        (data) => {
          setUnitsProgress(null);
          if (data.ok) {
            setUnitsSyncResult({
              added: data.added,
              updated: data.updated,
              total: data.total,
            });
            refreshUnitsRef.current?.();
          } else {
            addToast({
              title: 'Sync failed',
              description: 'Unknown error',
              type: 'error',
            });
          }
        }
      );
    } catch (err) {
      setUnitsProgress(null);
      addToast({
        title: 'Sync failed',
        description: err instanceof Error ? err.message : 'Network error. Please try again.',
        type: 'error',
      });
    } finally {
      setUnitsSyncing(false);
    }
  }, [
    session?.access_token,
    addToast,
    setUnitsSyncing,
    setUnitsProgress,
    setUnitsSyncResult,
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [onlyWithPeriod, setOnlyWithPeriod] = useState(true);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterSemester, setFilterSemester] = useState<number | null>(null);
  const [filterCodePrefixes, setFilterCodePrefixes] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availablePrefixes, setAvailablePrefixes] = useState<string[]>([]);
  const didReadUrl = useRef(false);

  const handleFilterOptions = useCallback((options: { years: number[]; prefixes: string[] }) => {
    setAvailableYears(options.years);
    setAvailablePrefixes(options.prefixes);
  }, []);

  // Read "Only with Period" from URL on load
  useEffect(() => {
    if (didReadUrl.current) return;
    didReadUrl.current = true;
    const params = new URLSearchParams(window.location.search);
    const v = params.get('onlyWithPeriod');
    if (v !== null) setOnlyWithPeriod(v === '1');
  }, []);

  // Write "Only with Period" to URL when user changes it (skip initial mount)
  const prevOnlyWithPeriod = useRef(onlyWithPeriod);
  useEffect(() => {
    if (prevOnlyWithPeriod.current === onlyWithPeriod) return;
    prevOnlyWithPeriod.current = onlyWithPeriod;
    const url = new URL(window.location.href);
    url.searchParams.set('onlyWithPeriod', onlyWithPeriod ? '1' : '0');
    window.history.replaceState({}, '', url.toString());
  }, [onlyWithPeriod]);

  return (
    <main className="relative">
      <SectionWrapper className="overflow-hidden">
        <div className="relative z-20 mx-auto max-w-6xl px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
              Units
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your enrolled units and track your academic progress.
            </p>
          </div>

          {/* Actions */}
          <UnitsActions
            onRefresh={() => refreshUnitsRef.current?.()}
            onSync={handleSync}
            syncing={unitsSyncing}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onlyWithPeriod={onlyWithPeriod}
            onOnlyWithPeriodChange={setOnlyWithPeriod}
            filterYear={filterYear}
            onFilterYearChange={setFilterYear}
            filterSemester={filterSemester}
            onFilterSemesterChange={setFilterSemester}
            filterCodePrefixes={filterCodePrefixes}
            onFilterCodePrefixesChange={setFilterCodePrefixes}
            availableYears={availableYears}
            availablePrefixes={availablePrefixes}
            onClearFilters={() => {
              setFilterYear(null);
              setFilterSemester(null);
              setFilterCodePrefixes([]);
            }}
          />

          {/* Units Data with Suspense - This will show loading.tsx while loading */}
          <Suspense fallback={
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200"
            >
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
          }>
            <UnitsData
            onRefreshRequest={onRefreshRequest}
            onFilterOptions={handleFilterOptions}
            searchQuery={searchQuery}
            onlyWithPeriod={onlyWithPeriod}
            filterYear={filterYear}
            filterSemester={filterSemester}
            filterCodePrefixes={filterCodePrefixes}
          />
          </Suspense>
        </div>
      </SectionWrapper>
    </main>
  );
}
