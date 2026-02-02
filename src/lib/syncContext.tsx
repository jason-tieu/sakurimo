'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

const SYNC_PERSIST_MS = 120_000; // 2 min max "syncing" after load if we had a recent sync
const STORAGE_KEY_UNITS = 'sakurimo_units_syncing';
const STORAGE_KEY_ASSIGNMENTS = 'sakurimo_assignments_syncing';

function readSyncingFromStorage(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return false;
    const t = parseInt(raw, 10);
    if (Number.isNaN(t)) return false;
    return Date.now() - t < SYNC_PERSIST_MS;
  } catch {
    return false;
  }
}

function clearSyncingStorage(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function setSyncingStorage(key: string): void {
  try {
    sessionStorage.setItem(key, Date.now().toString());
  } catch {
    // ignore
  }
}

export interface UnitsSyncResult {
  added: number;
  updated: number;
  total: number;
}

export interface AssignmentsSyncResult {
  assignmentsUpserted: number;
  unitsProcessed: number;
}

export interface SyncProgress {
  current: number;
  total?: number; // optional for assignments (total unknown until done)
}

type SyncChannel = 'units' | 'assignments' | null;

interface SyncContextType {
  syncingChannel: SyncChannel;
  unitsSyncing: boolean;
  assignmentsSyncing: boolean;
  unitsProgress: SyncProgress | null;
  assignmentsProgress: SyncProgress | null;
  unitsSyncResult: UnitsSyncResult | null;
  assignmentsSyncResult: AssignmentsSyncResult | null;
  setUnitsSyncing: (value: boolean) => void;
  setAssignmentsSyncing: (value: boolean) => void;
  setUnitsProgress: (value: SyncProgress | null) => void;
  setAssignmentsProgress: (value: SyncProgress | null) => void;
  setUnitsSyncResult: (value: UnitsSyncResult | null) => void;
  setAssignmentsSyncResult: (value: AssignmentsSyncResult | null) => void;
}

const SyncContext = createContext<SyncContextType | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [unitsSyncing, setUnitsSyncingState] = useState(false);
  const [assignmentsSyncing, setAssignmentsSyncingState] = useState(false);
  const [unitsProgress, setUnitsProgressState] = useState<SyncProgress | null>(null);
  const [assignmentsProgress, setAssignmentsProgressState] = useState<SyncProgress | null>(null);
  const [unitsSyncResult, setUnitsSyncResultState] = useState<UnitsSyncResult | null>(null);
  const [assignmentsSyncResult, setAssignmentsSyncResultState] =
    useState<AssignmentsSyncResult | null>(null);

  // Restore syncing state from sessionStorage on mount (e.g. after refresh or new tab)
  useEffect(() => {
    let unitsTs: number | null = null;
    let assignmentsTs: number | null = null;
    try {
      const u = sessionStorage.getItem(STORAGE_KEY_UNITS);
      if (u) unitsTs = parseInt(u, 10);
      const a = sessionStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
      if (a) assignmentsTs = parseInt(a, 10);
    } catch {
      // ignore
    }
    const now = Date.now();
    const unitsActive = unitsTs != null && !Number.isNaN(unitsTs) && now - unitsTs < SYNC_PERSIST_MS;
    const assignmentsActive =
      assignmentsTs != null && !Number.isNaN(assignmentsTs) && now - assignmentsTs < SYNC_PERSIST_MS;
    if (unitsActive) setUnitsSyncingState(true);
    if (assignmentsActive) setAssignmentsSyncingState(true);
    if (unitsActive || assignmentsActive) {
      const remainingUnits =
        unitsActive && unitsTs != null ? SYNC_PERSIST_MS - (now - unitsTs) : SYNC_PERSIST_MS;
      const remainingAssignments =
        assignmentsActive && assignmentsTs != null
          ? SYNC_PERSIST_MS - (now - assignmentsTs)
          : SYNC_PERSIST_MS;
      const clearAfter = Math.max(1000, Math.min(remainingUnits, remainingAssignments));
      const t = setTimeout(() => {
        clearSyncingStorage(STORAGE_KEY_UNITS);
        clearSyncingStorage(STORAGE_KEY_ASSIGNMENTS);
        setUnitsSyncingState(false);
        setAssignmentsSyncingState(false);
      }, clearAfter);
      return () => clearTimeout(t);
    }
  }, []);

  const setUnitsSyncing = useCallback((value: boolean) => {
    setUnitsSyncingState(value);
    if (value) setSyncingStorage(STORAGE_KEY_UNITS);
    else clearSyncingStorage(STORAGE_KEY_UNITS);
  }, []);

  const setAssignmentsSyncing = useCallback((value: boolean) => {
    setAssignmentsSyncingState(value);
    if (value) setSyncingStorage(STORAGE_KEY_ASSIGNMENTS);
    else clearSyncingStorage(STORAGE_KEY_ASSIGNMENTS);
  }, []);

  const setUnitsProgress = useCallback((value: SyncProgress | null) => {
    setUnitsProgressState(value);
  }, []);

  const setAssignmentsProgress = useCallback((value: SyncProgress | null) => {
    setAssignmentsProgressState(value);
  }, []);

  const setUnitsSyncResult = useCallback((value: UnitsSyncResult | null) => {
    setUnitsSyncResultState(value);
  }, []);

  const setAssignmentsSyncResult = useCallback((value: AssignmentsSyncResult | null) => {
    setAssignmentsSyncResultState(value);
  }, []);

  const syncingChannel: SyncChannel =
    unitsSyncing ? 'units' : assignmentsSyncing ? 'assignments' : null;

  return (
    <SyncContext.Provider
      value={{
        syncingChannel,
        unitsSyncing,
        assignmentsSyncing,
        unitsProgress,
        assignmentsProgress,
        unitsSyncResult,
        assignmentsSyncResult,
        setUnitsSyncing,
        setAssignmentsSyncing,
        setUnitsProgress,
        setAssignmentsProgress,
        setUnitsSyncResult,
        setAssignmentsSyncResult,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
