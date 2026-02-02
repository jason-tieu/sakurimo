'use client';

import { useRef, useState, useCallback } from 'react';
import SectionWrapper from '@/components/SectionWrapper';
import { useSession } from '@/lib/supabase/SupabaseProvider';
import { useSync } from '@/lib/syncContext';
import { useToast } from '@/lib/toast';
import { readAssignmentsSyncStream } from '@/lib/readSyncStream';
import { AssignmentsActions } from './assignments-actions';
import { AssignmentsData } from './assignments-data';

export default function AssignmentsPage() {
  const { session } = useSession();
  const { addToast } = useToast();
  const {
    assignmentsSyncing,
    setAssignmentsSyncing,
    setAssignmentsProgress,
    setAssignmentsSyncResult,
  } = useSync();
  const refreshAssignmentsRef = useRef<(() => void) | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableUnitCodes, setAvailableUnitCodes] = useState<string[]>([]);

  const onRefreshRequest = useCallback((refreshFn: () => void) => {
    refreshAssignmentsRef.current = refreshFn;
  }, []);

  const handleFilterOptions = useCallback(
    (options: { statuses: string[]; types: string[]; unitCodes: string[] }) => {
      setAvailableStatuses(options.statuses);
      setAvailableTypes(options.types);
      setAvailableUnitCodes(options.unitCodes);
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setStatusFilter('all');
    setTypeFilter('all');
    setUnitFilter('all');
  }, []);

  const handleSync = useCallback(async () => {
    const token = session?.access_token;
    if (!token) {
      addToast({ title: 'Not signed in', type: 'warning' });
      return;
    }
    setAssignmentsSyncing(true);
    setAssignmentsProgress(null); // Reset so we never show a stale total from units sync
    try {
      await readAssignmentsSyncStream(
        '/api/assignments/sync/stream',
        token,
        (current, total) =>
          setAssignmentsProgress(total != null ? { current, total } : { current }),
        (data) => {
          setAssignmentsProgress(null);
          if (data.ok) {
            setAssignmentsSyncResult({
              assignmentsUpserted: data.assignmentsUpserted,
              unitsProcessed: data.unitsProcessed,
            });
            refreshAssignmentsRef.current?.();
          } else {
            addToast({
              title: 'Sync failed',
              description: data.errors?.[0] ?? 'Unknown error',
              type: 'error',
            });
          }
        }
      );
    } catch (err) {
      setAssignmentsProgress(null);
      addToast({
        title: 'Sync failed',
        description: err instanceof Error ? err.message : 'Network error. Please try again.',
        type: 'error',
      });
    } finally {
      setAssignmentsSyncing(false);
    }
  }, [
    session?.access_token,
    addToast,
    setAssignmentsSyncing,
    setAssignmentsProgress,
    setAssignmentsSyncResult,
  ]);

  return (
    <main className="relative">
      <SectionWrapper className="overflow-hidden">
        <div className="relative z-20 mx-auto max-w-6xl px-6">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
              Assignments
            </h1>
            <p className="text-lg text-muted-foreground">
              Track your assignments, deadlines, and submission status.
            </p>
          </div>

          <AssignmentsActions
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            unitFilter={unitFilter}
            onUnitFilterChange={setUnitFilter}
            onClearFilters={handleClearFilters}
            onSync={handleSync}
            syncing={assignmentsSyncing}
            availableStatuses={availableStatuses}
            availableTypes={availableTypes}
            availableUnitCodes={availableUnitCodes}
          />

          <AssignmentsData
            onRefreshRequest={onRefreshRequest}
            onFilterOptions={handleFilterOptions}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            unitFilter={unitFilter}
          />
        </div>
      </SectionWrapper>
    </main>
  );
}
