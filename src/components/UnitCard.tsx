'use client';

import { BookOpen } from 'lucide-react';
import { Unit } from '@/lib/types';
import { formatPeriod } from '@/lib/formatters/period';
import { cleanUnitTitle } from '@/lib/formatters/unitTitle';
import UIButton from '@/components/UIButton';

interface UnitCardProps {
  unit: Unit;
  onViewDetails: (unitId: string) => void;
}

export function UnitCard({ unit, onViewDetails }: UnitCardProps) {
  return (
    <div className="bg-card/50 border border-border rounded-2xl p-6 hover:bg-card/70 transition-colors duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center">
          <BookOpen className="h-6 w-6 text-brand" />
        </div>
        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
          {formatPeriod(unit)}
        </span>
      </div>
      
      <h3 
        className="text-lg font-semibold text-foreground mb-2 truncate" 
        title={unit.code || 'No code'}
      >
        {unit.code || 'N/A'}
      </h3>
      <h4 
        className="text-base text-foreground mb-3 line-clamp-2" 
        title={unit.title}
      >
        {cleanUnitTitle(unit)}
      </h4>
      
      <div className="space-y-2 text-sm text-muted-foreground">
        <p><span className="font-medium">Period:</span> {formatPeriod(unit)}</p>
      </div>
      
      <div className="mt-6 flex gap-2">
        <UIButton 
          variant="secondary" 
          className="flex-1 text-sm px-3 py-1"
          onClick={() => onViewDetails(unit.id)}
          style={{
            '--hover-bg': 'black',
            '--hover-text': 'white'
          } as React.CSSProperties}
        >
          View Details
        </UIButton>
        <UIButton variant="ghost" className="text-sm px-3 py-1">
          Edit
        </UIButton>
      </div>
    </div>
  );
}
