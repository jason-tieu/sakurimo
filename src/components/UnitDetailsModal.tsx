'use client';

import { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { Unit } from '@/lib/types';
import { formatPeriod } from '@/lib/formatters/period';
import UIButton from '@/components/UIButton';

interface UnitDetailsModalProps {
  unitId: string;
  open: boolean;
  onClose: () => void;
}

export function UnitDetailsModal({ unitId, open, onClose }: UnitDetailsModalProps) {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState(false);

  // Fetch unit details when modal opens
  useEffect(() => {
    if (!open || !unitId) return;

    const fetchUnit = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/units/${unitId}`, {
          method: 'GET',
          credentials: 'include',        // ensure auth cookies are sent
          cache: 'no-store',             // don't serve a stale 401
        });
        
        if (res.status === 401) {
          setError('Please sign in to view unit details');
          return;
        }
        
        if (!res.ok) {
          throw new Error('Failed to fetch unit details');
        }
        
        const { unit } = await res.json();
        setUnit(unit);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchUnit();
  }, [open, unitId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setUnit(null);
      setError(null);
      setShowRawData(false);
    }
  }, [open]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ isolation: 'isolate' }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Unit Details</h2>
          <UIButton
            variant="ghost"
            onClick={onClose}
            className="p-2"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </UIButton>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              {error.includes('sign in') ? (
                <div className="space-y-3">
                  <UIButton 
                    onClick={() => window.location.href = '/auth/sign-in'}
                    variant="primary"
                  >
                    Sign In
                  </UIButton>
                  <UIButton onClick={onClose} variant="ghost">
                    Close
                  </UIButton>
                </div>
              ) : (
                <UIButton onClick={onClose}>Close</UIButton>
              )}
            </div>
          )}

          {unit && (
            <div className="space-y-6">
              {/* Main Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Code</label>
                  <p className="text-lg font-mono bg-muted/50 px-3 py-2 rounded-lg mt-1">
                    {unit.code || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Period</label>
                  <p className="text-lg bg-muted/50 px-3 py-2 rounded-lg mt-1">
                    {formatPeriod(unit)}
                  </p>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <p className="text-lg mt-1 leading-relaxed whitespace-pre-wrap">
                  {unit.title}
                </p>
              </div>

              {/* External ID (e.g. Canvas course ID) */}
              {unit.external_id && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">External ID</label>
                  <p className="text-sm font-mono mt-1 bg-muted/50 px-3 py-2 rounded-lg">
                    {unit.external_id}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Created
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(unit.created_at)}
                  </p>
                </div>

                {unit.updated_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Updated</label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(unit.updated_at)}
                    </p>
                  </div>
                )}
              </div>

              {/* Developer Section */}
              {process.env.NODE_ENV === 'development' && (
                <details className="pt-4 border-t border-border">
                  <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                    Developer Info (Raw Data)
                  </summary>
                  <pre className="mt-2 text-xs bg-muted/30 p-4 rounded-lg overflow-auto max-h-40">
                    {JSON.stringify(unit, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/20">
          <UIButton variant="ghost" onClick={onClose}>
            Close
          </UIButton>
          <UIButton variant="primary">
            Edit
          </UIButton>
        </div>
      </div>
    </div>
  );
}
