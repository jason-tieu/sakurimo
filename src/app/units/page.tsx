'use client';

import { Suspense, useRef, useCallback } from 'react';
import SectionWrapper from '@/components/SectionWrapper';
import { UnitsActions } from './units-actions';
import { UnitsData } from './units-data';

export default function UnitsPage() {
  const refreshUnitsRef = useRef<(() => void) | null>(null);
  const onRefreshRequest = useCallback((refreshFn: () => void) => {
    refreshUnitsRef.current = refreshFn;
  }, []);

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
          <UnitsActions onRefresh={() => refreshUnitsRef.current?.()} />

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
            <UnitsData onRefreshRequest={onRefreshRequest} />
          </Suspense>
        </div>
      </SectionWrapper>
    </main>
  );
}
