'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { mockAssignments, mockUnits } from '@/lib/mock';
import { useSession } from '@/lib/supabase/SupabaseProvider';
import { formatDueDate } from '@/lib/formatters/assignment';
import type { ListAssignment } from '@/components/AssignmentCard';
import { AssignmentsList } from './assignments-list';

function normalizeMock(): ListAssignment[] {
  const units = mockUnits;
  return mockAssignments.map((a) => ({
    id: a.id,
    unitId: a.unitId,
    unitCode: units.find((u) => u.id === a.unitId)?.code ?? 'N/A',
    title: a.title,
    type: a.type,
    status: a.status,
    description: a.description ?? 'N/A',
    dueAtFormatted: formatDueDate(
      a.dueAt instanceof Date ? a.dueAt.toISOString() : String(a.dueAt)
    ),
    grade: a.grade ?? null,
    maxGrade: a.maxGrade ?? null,
    weight: a.weight ?? null,
  }));
}

interface AssignmentsDataProps {
  onRefreshRequest?: (refreshFn: () => void) => void;
  onFilterOptions?: (options: { statuses: string[]; types: string[]; unitCodes: string[] }) => void;
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  unitFilter: string;
}

export function AssignmentsData({
  onRefreshRequest,
  onFilterOptions,
  searchQuery,
  statusFilter,
  typeFilter,
  unitFilter,
}: AssignmentsDataProps) {
  const { session } = useSession();
  const [assignments, setAssignments] = useState<ListAssignment[]>(normalizeMock());
  const [loading, setLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const filterOptions = useMemo(() => {
    const statuses = Array.from(
      new Set(assignments.map((a) => a.status).filter(Boolean))
    ).sort();
    const types = Array.from(
      new Set(assignments.map((a) => a.type).filter(Boolean))
    ).sort();
    const unitCodes = Array.from(
      new Set(
        assignments
          .map((a) => a.unitCode ?? '')
          .filter((c) => c && c !== 'N/A')
      )
    ).sort();
    return { statuses, types, unitCodes };
  }, [assignments]);

  useEffect(() => {
    onFilterOptions?.(filterOptions);
  }, [onFilterOptions, filterOptions]);

  const fetchAssignments = useCallback(async () => {
    const token = session?.access_token;
    if (!token) {
      setAssignments(normalizeMock());
      setLoading(false);
      setHasInitiallyLoaded(true);
      return;
    }
    try {
      const res = await fetch('/api/assignments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.ok && Array.isArray(data.assignments) && data.assignments.length > 0) {
        setAssignments(
          data.assignments.map(
            (a: {
              id: string;
              unitId: string;
              unitCode: string;
              title: string;
              type: string;
              status: string;
              description: string;
              dueAtFormatted: string;
              grade: number | null;
              maxGrade: number | null;
              weight: number | null;
            }) => ({
              id: a.id,
              unitId: a.unitId,
              unitCode: a.unitCode ?? 'N/A',
              title: a.title ?? 'N/A',
              type: a.type ?? 'assignment',
              status: a.status ?? 'published',
              description: a.description ?? 'N/A',
              dueAtFormatted: a.dueAtFormatted ?? 'N/A',
              grade: a.grade ?? null,
              maxGrade: a.maxGrade ?? null,
              weight: a.weight ?? null,
            })
          )
        );
      } else {
        setAssignments(normalizeMock());
      }
    } catch {
      setAssignments(normalizeMock());
    } finally {
      setLoading(false);
      setHasInitiallyLoaded(true);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (session === undefined) return;
    setLoading(true);
    fetchAssignments();
  }, [session, fetchAssignments, refreshTrigger]);

  const refreshAssignments = useCallback(() => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (onRefreshRequest) {
      onRefreshRequest(refreshAssignments);
    }
  }, [onRefreshRequest, refreshAssignments]);

  const getUnitCode = useCallback(
    (unitId: string): string => {
      const a = assignments.find((x) => x.unitId === unitId);
      return a?.unitCode ?? 'N/A';
    },
    [assignments]
  );

  if (loading || !hasInitiallyLoaded) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 animate-pulse"
          >
            <div className="h-5 w-48 bg-muted/50 rounded mb-3" />
            <div className="h-6 w-3/4 bg-muted/50 rounded mb-4" />
            <div className="h-4 w-full bg-muted/50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <AssignmentsList
      assignments={assignments}
      searchQuery={searchQuery}
      statusFilter={statusFilter}
      typeFilter={typeFilter}
      unitFilter={unitFilter}
      getUnitCode={getUnitCode}
    />
  );
}
