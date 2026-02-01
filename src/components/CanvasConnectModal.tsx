'use client';

import { useState } from 'react';
import { Eye, EyeOff, ExternalLink, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import UIButton from '@/components/UIButton';
import { INSTITUTIONS, getInstitutionByKey } from '@/lib/institutions';

interface CanvasConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (baseUrl: string, token: string) => Promise<void>;
  isConnecting?: boolean;
}

export default function CanvasConnectModal({
  open,
  onOpenChange,
  onConnect,
  isConnecting = false
}: CanvasConnectModalProps) {
  const [selectedUniversity, setSelectedUniversity] = useState('qut');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState('');

  const selectedInstitution = getInstitutionByKey(selectedUniversity);

  const handleConnect = async () => {
    if (!selectedInstitution || !token.trim()) {
      setError('Please select a university and enter your access token.');
      return;
    }

    setError('');
    try {
      await onConnect(selectedInstitution.baseUrl, token.trim());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'We couldn\'t verify that token with Canvas. Please check your token and try again.';
      setError(message);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isConnecting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setToken('');
        setError('');
        setSelectedUniversity('qut');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Connect to Canvas</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* University Selection */}
          <div className="space-y-2">
            <label htmlFor="university" className="text-sm font-medium text-foreground">
              University <span className="text-destructive">*</span>
            </label>
            <Select
              id="university"
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              disabled={isConnecting}
            >
              {INSTITUTIONS.map((institution) => (
                <option key={institution.key} value={institution.key}>
                  {institution.label}
                </option>
              ))}
            </Select>
            {selectedInstitution && (
              <p className="text-xs text-muted-foreground">
                Canvas URL: {selectedInstitution.baseUrl}
              </p>
            )}
          </div>

          {/* Access Token */}
          <div className="space-y-2">
            <label htmlFor="token" className="text-sm font-medium text-foreground">
              Access Token <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                id="token"
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your Canvas access token here"
                disabled={isConnecting}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                disabled={isConnecting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              <a
                href="https://canvas.instructure.com/doc/api/file.oauth.html"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors underline"
              >
                Where to find your token?
              </a>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <UIButton
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isConnecting}
              className="flex-1"
            >
              Cancel
            </UIButton>
            <UIButton
              variant="primary"
              onClick={handleConnect}
              disabled={isConnecting || !selectedInstitution || !token.trim()}
              className="flex-1"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Connect'
              )}
            </UIButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
