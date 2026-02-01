'use client';

import { useState, useEffect } from 'react';
import { Link, Plus, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import SectionWrapper from '@/components/SectionWrapper';
import UIButton from '@/components/UIButton';
import CanvasConnectModal from '@/components/CanvasConnectModal';
import { verifyCanvasToken, storeCanvasConnection } from '@/lib/canvas-api';
import { fetchLMSConnections, disconnectLMSConnection, type LMSConnection } from '@/lib/integrations-api';
import { useSession } from '@/lib/supabase/SupabaseProvider';
import { syncCanvas } from '@/lib/integrations/actions';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  connectionId?: string; // Add connection ID for sync/disconnect operations
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [canvasModalOpen, setCanvasModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncingConnections, setSyncingConnections] = useState<Set<string>>(new Set());
  const [disconnectingConnections, setDisconnectingConnections] = useState<Set<string>>(new Set());
  const { session, user, isLoading: authLoading } = useSession();

  // Convert LMS connections to integration format (new schema: platform, last_synced_at)
  const convertConnectionsToIntegrations = (connections: LMSConnection[]): Integration[] => {
    const integrationMap = new Map<string, Integration>();
    const defaultIntegrations: Integration[] = [
      { id: 'canvas', name: 'Canvas LMS', type: 'canvas', status: 'disconnected' },
    ];
    defaultIntegrations.forEach((integration) => integrationMap.set(integration.id, integration));
    connections.forEach((connection) => {
      if (connection.platform === 'canvas') {
        const lastSync = connection.last_synced_at
          ? new Date(connection.last_synced_at)
          : undefined;
        integrationMap.set('canvas', {
          id: 'canvas',
          name: 'Canvas LMS',
          type: 'canvas',
          status: 'connected',
          ...(lastSync !== undefined && { lastSync }),
          connectionId: connection.id,
        });
      }
    });
    return Array.from(integrationMap.values());
  };

  // Fetch connections from database (uses cookies)
  const loadConnections = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const response = await fetchLMSConnections();
      if (response.success && response.connections) {
        const integrations = convertConnectionsToIntegrations(response.connections);
        setIntegrations(integrations);
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
      setIntegrations([
        { id: 'canvas', name: 'Canvas LMS', type: 'canvas', status: 'disconnected' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) loadConnections();
  }, [user, authLoading]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'disconnected': return <XCircle className="h-5 w-5 text-muted-foreground" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <XCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-500 bg-green-500/10';
      case 'disconnected': return 'text-muted-foreground bg-muted/10';
      case 'error': return 'text-red-500 bg-red-500/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  const formatLastSync = (date: Date) => {
    return new Intl.DateTimeFormat('en-AU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleCanvasConnect = async (baseUrl: string, token: string) => {
    if (!user) {
      throw new Error('You must be signed in to connect Canvas');
    }
    setIsConnecting(true);
    try {
      const verifyResult = await verifyCanvasToken(baseUrl, token);
      if (!verifyResult.success) {
        throw new Error(verifyResult.error || 'Token verification failed');
      }
      const storeResult = await storeCanvasConnection(baseUrl, token, verifyResult.profile);
      if (!storeResult.success) {
        throw new Error(storeResult.error || 'Failed to store connection');
      }

      // Close modal and refresh connections
      setCanvasModalOpen(false);
      
      // Show success message based on action
      const action = storeResult.action || 'created';
      console.log(`Canvas connection ${action} successfully:`, {
        connectionId: storeResult.connectionId,
        action
      });
      
      // Reload connections to show updated status
      await loadConnections();
      
    } catch (error) {
      console.error('Canvas connection error:', error);
      throw error; // Re-throw to let the modal handle the error display
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async (integration: Integration) => {
    if (!session?.access_token) {
      console.error('Missing access token for sync');
      return;
    }
    setSyncingConnections((prev) => new Set(prev).add(integration.id));
    try {
      const result = await syncCanvas(session.access_token);
      if (result.ok) {
        const added = result.added ?? 0;
        const updated = result.updated ?? 0;
        const skipped = result.skipped ?? 0;
        console.log('Canvas sync successful:', { added, updated, skipped });
        await loadConnections();
      } else {
        console.error('Canvas sync failed:', result.error);
      }
    } catch (error) {
      console.error('Canvas sync error:', error);
    } finally {
      setSyncingConnections((prev) => {
        const next = new Set(prev);
        next.delete(integration.id);
        return next;
      });
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    if (!integration.connectionId) {
      console.error('Missing connection ID for disconnect');
      return;
    }
    if (!confirm(`Are you sure you want to disconnect ${integration.name}? This will remove all synced data.`)) {
      return;
    }
    setDisconnectingConnections((prev) => new Set(prev).add(integration.id));
    try {
      const result = await disconnectLMSConnection(integration.connectionId);
      
      if (result.success) {
        console.log('Canvas disconnect successful');
        // Reload connections to update status
        await loadConnections();
      } else {
        console.error('Canvas disconnect failed:', result.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Canvas disconnect error:', error);
      // TODO: Show error toast
    } finally {
      setDisconnectingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(integration.id);
        return newSet;
      });
    }
  };

  const handleCanvasConnectClick = () => {
    if (!user) {
      // Redirect to sign in or show error
      console.error('User must be signed in to connect Canvas');
      return;
    }
    setCanvasModalOpen(true);
  };

  // Show loading state while checking authentication or loading connections
  if (authLoading || isLoading) {
    return (
      <main className="relative">
        <SectionWrapper className="overflow-hidden">
          <div className="relative z-20 mx-auto max-w-6xl px-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading integrations...</div>
            </div>
          </div>
        </SectionWrapper>
      </main>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <main className="relative">
        <SectionWrapper className="overflow-hidden">
          <div className="relative z-20 mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
                Integrations
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Please sign in to manage your integrations.
              </p>
              <UIButton variant="primary" asChild>
                <a href="/auth/sign-in">Sign In</a>
              </UIButton>
            </div>
          </div>
        </SectionWrapper>
      </main>
    );
  }

  return (
    <main className="relative">
      <SectionWrapper className="overflow-hidden">
        <div className="relative z-20 mx-auto max-w-6xl px-6">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
              Integrations
            </h1>
            <p className="text-lg text-muted-foreground">
              Connect with your university&apos;s learning management systems and external tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <div key={integration.id} className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center">
                    <Link className="h-6 w-6 text-brand" />
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(integration.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                      {integration.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-2">{integration.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {integration.type.replace('_', ' ').toUpperCase()} Integration
                </p>
                
                {integration.lastSync && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Last synced: {formatLastSync(integration.lastSync)}
                  </p>
                )}
                
                <div className="flex gap-2">
                  {integration.status === 'connected' ? (
                    <>
                      <UIButton 
                        variant="secondary" 
                        className="flex-1 text-sm px-3 py-1"
                        onClick={() => handleSync(integration)}
                        disabled={syncingConnections.has(integration.id)}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${syncingConnections.has(integration.id) ? 'animate-spin' : ''}`} />
                        {syncingConnections.has(integration.id) ? 'Syncing...' : 'Sync All'}
                      </UIButton>
                      <UIButton 
                        variant="ghost" 
                        className="text-sm px-3 py-1"
                        onClick={() => handleDisconnect(integration)}
                        disabled={disconnectingConnections.has(integration.id)}
                      >
                        {disconnectingConnections.has(integration.id) ? 'Disconnecting...' : 'Disconnect'}
                      </UIButton>
                    </>
                  ) : (
                    <UIButton 
                      variant="primary" 
                      className="flex-1 text-sm px-3 py-1"
                      onClick={integration.type === 'canvas' ? handleCanvasConnectClick : () => {}}
                    >
                      Connect
                    </UIButton>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-muted/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
            <p className="text-muted-foreground mb-4">
              More integrations are being added regularly. Request a specific integration or suggest new features.
            </p>
            <UIButton variant="secondary" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Request Integration
            </UIButton>
          </div>
        </div>
      </SectionWrapper>

      {/* Canvas Connect Modal */}
      <CanvasConnectModal
        open={canvasModalOpen}
        onOpenChange={setCanvasModalOpen}
        onConnect={handleCanvasConnect}
        isConnecting={isConnecting}
      />
    </main>
  );
}