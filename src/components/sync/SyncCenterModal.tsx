'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { localDb } from '@/lib/dexie/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import type { SyncQueueItem } from '@/lib/types/database';
import { RefreshCw, CheckCircle2, AlertTriangle, Clock, CloudOff, Wifi, ArrowRight, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';

interface SyncCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncCenterModal: React.FC<SyncCenterModalProps> = ({ isOpen, onClose }) => {
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const loadQueue = async () => {
    try {
      const items = await localDb.syncQueue.orderBy('id').reverse().limit(50).toArray();
      setQueueItems(items);
    } catch (e) {
      console.error('Error loading sync queue:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQueue();
      const unsubscribe = syncEngine.subscribe((status) => {
        setIsOnline(status.isOnline);
        setIsSyncing(status.isSyncing);
        loadQueue();
      });
      return unsubscribe;
    }
  }, [isOpen]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncEngine.syncAll();
    await loadQueue();
    setIsSyncing(false);
  };

  const handleRetryFailed = async () => {
    setIsSyncing(true);
    // Reset failed items to pending for retry
    const failedItems = queueItems.filter(i => i.status === 'failed' || i.status === 'conflict');
    for (const item of failedItems) {
      await localDb.syncQueue.update(item.id!, {
        status: 'pending',
        retry_count: 0,
        last_error: null,
        conflict_data: null,
      });
    }
    await syncEngine.syncPendingQueue();
    await loadQueue();
    setIsSyncing(false);
  };

  const handleResolveConflict = async (item: SyncQueueItem, action: 'keep_local' | 'mark_synced') => {
    setIsSyncing(true);
    if (action === 'keep_local') {
      // Reset to pending for retry
      await localDb.syncQueue.update(item.id!, {
        status: 'pending',
        retry_count: 0,
        last_error: null,
        conflict_data: null,
      });
    } else if (action === 'mark_synced') {
      // Mark as synced without re-uploading (data already exists remotely)
      await localDb.syncQueue.update(item.id!, {
        status: 'synced',
        synced_at: new Date().toISOString(),
        conflict_data: null,
      });
    }
    await loadQueue();
    setIsSyncing(false);
  };

  const { pendingCount, failedCount, conflictCount } = useMemo(() => {
    let pending = 0;
    let failed = 0;
    let conflict = 0;
    for (const i of queueItems) {
      if (i.status === 'pending') pending++;
      else if (i.status === 'failed') failed++;
      else if (i.status === 'conflict') conflict++;
    }
    return { pendingCount: pending, failedCount: failed, conflictCount: conflict };
  }, [queueItems]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Synchronization & Offline Queue"
      description="Track pending transactions, retry queued operations, and inspect hardware inventory audit sync."
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Status Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Network State</div>
              <div className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                {isOnline ? (
                  <>
                    <Wifi className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700">Online</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-700">Offline</span>
                  </>
                )}
              </div>
            </div>
            <Badge variant={isOnline ? 'success' : 'warning'}>{isOnline ? 'Active' : 'Queuing'}</Badge>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Pending Sync</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{pendingCount} items</div>
            </div>
            <Clock className="h-5 w-5 text-slate-400" />
          </div>

          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Failed</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{failedCount} items</div>
            </div>
            <AlertTriangle className={`h-5 w-5 ${failedCount > 0 ? 'text-red-500' : 'text-slate-400'}`} />
          </div>

          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Conflicts</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{conflictCount} items</div>
            </div>
            <XCircle className={`h-5 w-5 ${conflictCount > 0 ? 'text-orange-500' : 'text-slate-400'}`} />
          </div>
        </div>

        {/* Last Sync Info */}
        <div className="flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Last sync: <span className="font-semibold text-slate-700">
              {syncEngine.getStatus().lastSyncTime
                ? formatDate(syncEngine.getStatus().lastSyncTime!)
                : 'Never'}
            </span>
          </div>
          {syncEngine.getStatus().lastError && (
            <div className="text-red-600 font-medium">
              Error: {syncEngine.getStatus().lastError}
            </div>
          )}
        </div>

        {/* Sync Action */}
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div>
            <h4 className="text-sm font-bold text-amber-900">Cloud Database Synchronization</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              All transactions are queued with unique idempotency keys to prevent duplicate checkout or stock loss.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(failedCount > 0 || conflictCount > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryFailed}
                isLoading={isSyncing}
                className="flex items-center gap-1.5 whitespace-nowrap"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Issues
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleManualSync}
              isLoading={isSyncing}
              className="flex items-center gap-1.5 whitespace-nowrap"
            >
              <RefreshCw className="h-4 w-4" />
              Sync Now
            </Button>
          </div>
        </div>

        {/* Queue Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recent Synchronization Ledger
          </h4>

          {queueItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm border border-dashed rounded-xl">
              No operations queued. All local hardware store operations are synchronized with the cloud!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              {queueItems.map((item) => (
                <div key={item.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      <span className="uppercase font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.operation_type}
                      </span>
                      <span>Key: {item.idempotency_key}</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">{formatDate(item.created_at)}</div>
                    {item.last_error && (
                      <div className="text-red-600 text-[11px] font-mono">Error: {item.last_error}</div>
                    )}
                  </div>

                  <div className="text-right flex items-center gap-2">
                    {item.status === 'synced' && (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Synced
                      </Badge>
                    )}
                    {item.status === 'pending' && (
                      <Badge variant="warning" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending (Try {item.retry_count})
                      </Badge>
                    )}
                    {item.status === 'failed' && (
                      <Badge variant="danger" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Failed
                      </Badge>
                    )}
                    {item.status === 'conflict' && (
                      <div className="flex flex-col gap-1">
                        <Badge variant="warning" className="flex items-center gap-1 bg-orange-100 text-orange-800 border-orange-300">
                          <XCircle className="h-3 w-3" />
                          Conflict
                        </Badge>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleResolveConflict(item, 'keep_local')}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                            title="Keep local version and retry"
                          >
                            Keep Local
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={() => handleResolveConflict(item, 'mark_synced')}
                            className="text-[10px] text-emerald-600 hover:text-emerald-800 font-medium"
                            title="Mark as synced (already on server)"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
