'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { localDb } from '@/lib/dexie/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import type { SyncQueueItem } from '@/lib/types/database';
import { RefreshCw, CheckCircle2, AlertTriangle, Clock, CloudOff, Wifi } from 'lucide-react';
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

  const { pendingCount, failedCount } = useMemo(() => {
    let pending = 0;
    let failed = 0;
    for (const i of queueItems) {
      if (i.status === 'pending') pending++;
      else if (i.status === 'failed') failed++;
    }
    return { pendingCount: pending, failedCount: failed };
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Network State</div>
              <div className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                {isOnline ? (
                  <>
                    <Wifi className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700">Online & Connected</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-700">Offline / Standalone</span>
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
              <div className="text-xs text-slate-500 font-medium">Failed / Conflicts</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{failedCount} items</div>
            </div>
            <AlertTriangle className={`h-5 w-5 ${failedCount > 0 ? 'text-red-500' : 'text-slate-400'}`} />
          </div>
        </div>

        {/* Sync Action */}
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div>
            <h4 className="text-sm font-bold text-amber-900">Cloud Supabase Synchronization</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              All transactions are queued with unique idempotency keys to prevent duplicate checkout or stock loss.
            </p>
          </div>
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
