'use client';

import { memo } from 'react';
import { Calendar, BookOpen } from 'lucide-react';
import UIButton from '@/components/UIButton';

export type ListAssignment = {
  id: string;
  unitId: string;
  unitCode?: string;
  title: string;
  type: string;
  status: string;
  description: string;
  dueAtFormatted: string;
  grade: number | null;
  maxGrade: number | null;
  weight: number | null;
};

/** Fixed min-height for stable layout during virtualized scroll. */
const CARD_MIN_HEIGHT = 200;

interface AssignmentCardProps {
  assignment: ListAssignment;
  statusClass: string;
  typeClass: string;
  unitCodeDisplay: string;
}

function AssignmentCardInner({ assignment, statusClass, typeClass, unitCodeDisplay }: AssignmentCardProps) {
  return (
    <div
      className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 hover:bg-card/70 transition-colors"
      style={{ minHeight: CARD_MIN_HEIGHT }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-medium text-muted-foreground">{unitCodeDisplay}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
              {assignment.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`text-xs font-medium ${typeClass}`}>{assignment.type.toUpperCase()}</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{assignment.title}</h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{assignment.description}</p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Due: {assignment.dueAtFormatted}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{assignment.weight != null ? `${assignment.weight}% of grade` : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {assignment.grade != null && assignment.maxGrade != null
                  ? `Grade: ${assignment.grade}/${assignment.maxGrade}`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        <div className="ml-6 flex gap-2">
          <UIButton variant="secondary" className="text-sm px-3 py-1">
            View
          </UIButton>
          <UIButton variant="ghost" className="text-sm px-3 py-1">
            Edit
          </UIButton>
        </div>
      </div>
    </div>
  );
}

export const AssignmentCard = memo(AssignmentCardInner);
