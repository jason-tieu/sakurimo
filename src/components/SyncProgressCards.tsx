'use client';

import { useEffect, useRef, useState } from 'react';
import type { SyncProgress } from '@/lib/syncContext';
import { useSync } from '@/lib/syncContext';

const DONE_DISPLAY_MS = 3200;

function SyncCard({
  label,
  sublabel,
  progress,
  isDone,
  onDoneDismiss,
}: {
  label: string;
  sublabel: string;
  progress: SyncProgress | null;
  isDone: boolean;
  onDoneDismiss: () => void;
}) {
  const [barFull, setBarFull] = useState(false);

  useEffect(() => {
    if (!isDone) {
      setBarFull(false);
      return;
    }
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setBarFull(true));
    });
    return () => cancelAnimationFrame(t);
  }, [isDone]);

  useEffect(() => {
    if (!isDone) return;
    const t = setTimeout(() => {
      onDoneDismiss();
    }, DONE_DISPLAY_MS);
    return () => clearTimeout(t);
  }, [isDone, onDoneDismiss]);

  const hasTotal = progress && progress.total != null && progress.total > 0;
  const progressSublabel =
    !isDone && progress
      ? hasTotal
        ? `${progress.current} of ${progress.total}`
        : `${progress.current} synced`
      : sublabel;
  const barWidth =
    isDone && barFull
      ? '100%'
      : isDone
        ? '0%'
        : hasTotal
          ? `${Math.round((progress.current / progress.total!) * 100)}%`
          : '40%';
  const isIndeterminate = !isDone && (!progress || !hasTotal);

  return (
    <div
      className="w-72 rounded-xl border border-border bg-card/95 shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="px-4 py-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {progressSublabel && (
          <p className="text-xs text-muted-foreground mt-0.5">{progressSublabel}</p>
        )}
      </div>
      <div className="h-1.5 w-full bg-muted/50 overflow-hidden rounded-b-xl">
        <div
          className={`h-full rounded-r-full transition-[width] duration-500 ease-out ${
            isIndeterminate ? 'sync-progress-indeterminate' : ''
          }`}
          style={{
            width: barWidth,
            backgroundColor: 'var(--color-brand)',
          }}
        />
      </div>
    </div>
  );
}

export function SyncProgressCards() {
  const {
    unitsSyncing,
    assignmentsSyncing,
    unitsProgress,
    assignmentsProgress,
    unitsSyncResult,
    assignmentsSyncResult,
    setUnitsSyncResult,
    setAssignmentsSyncResult,
  } = useSync();

  const showUnits = unitsSyncing || unitsSyncResult != null;
  const showAssignments = assignmentsSyncing || assignmentsSyncResult != null;

  if (!showUnits && !showAssignments) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {showUnits && (
        <SyncCard
          label={unitsSyncing ? 'Syncing units…' : 'Unit syncing done'}
          sublabel={
            unitsSyncResult
              ? `${unitsSyncResult.total} unit${unitsSyncResult.total !== 1 ? 's' : ''} synced`
              : ''
          }
          progress={unitsProgress}
          isDone={!unitsSyncing && unitsSyncResult != null}
          onDoneDismiss={() => setUnitsSyncResult(null)}
        />
      )}
      {showAssignments && (
        <SyncCard
          label={assignmentsSyncing ? 'Syncing assignments…' : 'Assignment syncing done'}
          sublabel={
            assignmentsSyncResult
              ? `${assignmentsSyncResult.assignmentsUpserted} assignment${assignmentsSyncResult.assignmentsUpserted !== 1 ? 's' : ''} synced`
              : ''
          }
          progress={assignmentsProgress}
          isDone={!assignmentsSyncing && assignmentsSyncResult != null}
          onDoneDismiss={() => setAssignmentsSyncResult(null)}
        />
      )}
    </div>
  );
}
