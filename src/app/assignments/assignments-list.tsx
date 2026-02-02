'use client';

/**
 * Performance: virtualization (@tanstack/react-virtual), useMemo for filtered list,
 * useCallback for handlers, React.memo(AssignmentCard). Fixed row height for stable layout.
 */

import { useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Filter, ClipboardList, Plus } from 'lucide-react';
import type { ListAssignment } from '@/components/AssignmentCard';
import { AssignmentCard } from '@/components/AssignmentCard';
import UIButton from '@/components/UIButton';

const ROW_CARD_HEIGHT = 220;

function getStatusColor(status: string): string {
  switch (status) {
    case 'todo':
      return 'text-yellow-500 bg-yellow-500/10';
    case 'in_progress':
      return 'text-blue-500 bg-blue-500/10';
    case 'submitted':
      return 'text-green-500 bg-green-500/10';
    case 'graded':
      return 'text-purple-500 bg-purple-500/10';
    case 'late':
      return 'text-red-500 bg-red-500/10';
    default:
      return 'text-muted-foreground bg-muted/10';
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'assignment':
      return 'text-blue-500';
    case 'project':
      return 'text-purple-500';
    case 'lab':
      return 'text-green-500';
    case 'quiz':
      return 'text-orange-500';
    case 'essay':
      return 'text-pink-500';
    case 'presentation':
      return 'text-indigo-500';
    default:
      return 'text-muted-foreground';
  }
}

interface AssignmentsListProps {
  assignments: ListAssignment[];
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  unitFilter: string;
  getUnitCode: (unitId: string) => string;
}

export function AssignmentsList({
  assignments,
  searchQuery,
  statusFilter,
  typeFilter,
  unitFilter,
  getUnitCode,
}: AssignmentsListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredAssignments = useMemo(() => {
    let list = assignments;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.unitCode ?? getUnitCode(a.unitId)).toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      list = list.filter((a) => a.type === typeFilter);
    }
    if (unitFilter !== 'all') {
      list = list.filter((a) => (a.unitCode ?? getUnitCode(a.unitId)) === unitFilter);
    }
    return list;
  }, [assignments, searchQuery, statusFilter, typeFilter, unitFilter, getUnitCode]);

  const rowVirtualizer = useVirtualizer({
    count: filteredAssignments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_CARD_HEIGHT,
    getItemKey: (index) => filteredAssignments[index].id,
    overscan: 3,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No assignments yet</h3>
        <p className="text-muted-foreground mb-6">
          Sync from Canvas or add your first assignment.
        </p>
        <UIButton variant="primary" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Assignment
        </UIButton>
      </div>
    );
  }

  if (filteredAssignments.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No assignments found</h3>
        <p className="text-muted-foreground mb-6">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {filteredAssignments.length} of {assignments.length} assignments
          {searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : ''}
        </span>
      </div>
      <div className="relative" style={{ height: 'min(65vh, 720px)' }}>
        <div ref={parentRef} className="overflow-auto h-full scrollbar-none">
          <div
            style={{
              height: totalSize,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualRow) => {
              const assignment = filteredAssignments[virtualRow.index];
              const unitCodeDisplay = assignment.unitCode ?? getUnitCode(assignment.unitId);
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    boxSizing: 'border-box',
                    paddingBottom: 16,
                  }}
                >
                  <AssignmentCard
                    assignment={assignment}
                    statusClass={getStatusColor(assignment.status)}
                    typeClass={getTypeColor(assignment.type)}
                    unitCodeDisplay={unitCodeDisplay}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent"
          aria-hidden
        />
      </div>
    </>
  );
}
