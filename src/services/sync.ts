// ─────────────────────────────────────────────────────────────────────────────
// geo-attend-lab — Sync Service
// Monitors online/offline state and simulates a sync batch routine
// that exports unsynced breadcrumbs as JSON, logs them to an onscreen
// inspector, and marks them as synced in IndexedDB.
// ─────────────────────────────────────────────────────────────────────────────
import { getUnsyncedBreadcrumbs, markSynced, countUnsynced } from '../db';
import type { BreadcrumbRecord } from '../types';

export type NetworkStatus = 'online' | 'offline';
export type SyncStatusCallback = (status: NetworkStatus, unsyncedCount: number) => void;
export type SyncLogCallback = (payload: string) => void;

export class SyncService {
  private _networkStatus: NetworkStatus = navigator.onLine ? 'online' : 'offline';
  private _unsyncedCount = 0;
  private statusListeners: Set<SyncStatusCallback> = new Set();
  private logListeners: Set<SyncLogCallback> = new Set();
  private isSyncing = false;

  constructor() {
    window.addEventListener('online',  () => this.handleNetworkChange('online'));
    window.addEventListener('offline', () => this.handleNetworkChange('offline'));
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Subscribe to network/sync status changes */
  onStatusChange(cb: SyncStatusCallback): () => void {
    this.statusListeners.add(cb);
    cb(this._networkStatus, this._unsyncedCount);
    return () => this.statusListeners.delete(cb);
  }

  /** Subscribe to sync log output (for the API inspector panel) */
  onSyncLog(cb: SyncLogCallback): () => void {
    this.logListeners.add(cb);
    return () => this.logListeners.delete(cb);
  }

  get networkStatus(): NetworkStatus {
    return this._networkStatus;
  }

  get unsyncedCount(): number {
    return this._unsyncedCount;
  }

  /** Refresh unsynced count from DB */
  async refreshCount(): Promise<void> {
    this._unsyncedCount = await countUnsynced();
    this.emitStatus();
  }

  /**
   * Run a sync batch:
   * 1. Fetch all unsynced breadcrumbs
   * 2. Build a JSON payload
   * 3. Log to onscreen API inspector
   * 4. Mark as synced in IndexedDB
   *
   * In production, replace the "simulate" step with a real fetch() call.
   */
  async syncBatch(): Promise<{ synced: number; skipped: number }> {
    if (this.isSyncing) {
      return { synced: 0, skipped: 0 };
    }

    if (this._networkStatus === 'offline') {
      this.log('[SYNC SKIPPED] Device is offline. Will retry when online.');
      return { synced: 0, skipped: 0 };
    }

    this.isSyncing = true;

    try {
      const records: BreadcrumbRecord[] = await getUnsyncedBreadcrumbs();

      if (records.length === 0) {
        this.log('[SYNC] No unsynced records. Queue is empty.');
        return { synced: 0, skipped: 0 };
      }

      const payload = {
        batchId: crypto.randomUUID(),
        sentAt: new Date().toISOString(),
        endpoint: 'https://api.example.com/v1/attendance/breadcrumbs', // Simulated
        recordCount: records.length,
        records: records.map(r => ({
          id: r.id,
          timestamp: r.timestamp,
          lat: r.lat,
          lng: r.lng,
          accuracy: r.accuracy,
          insideGeofence: r.insideGeofence === 1,
          gapDetected: r.gapDetected === 1,
          gapClassification: r.gapClassification,
          accuracyWarning: r.accuracyWarning === 1,
          distanceFromCentroid: r.distanceFromCentroid,
        })),
      };

      const payloadJson = JSON.stringify(payload, null, 2);

      // ── Simulate network request ──────────────────────────────────────────
      this.log(`[SYNC BATCH START] ${records.length} records\n${payloadJson}`);

      // Simulate latency (would be a real fetch() in production)
      await new Promise<void>(resolve => setTimeout(resolve, 600));

      // ── Mark as synced in DB ──────────────────────────────────────────────
      const ids = records
        .map(r => r.id)
        .filter((id): id is number => id !== undefined);

      await markSynced(ids);

      this.log(`[SYNC COMPLETE] Marked ${ids.length} records as synced. ✓`);

      await this.refreshCount();
      return { synced: ids.length, skipped: 0 };

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log(`[SYNC ERROR] ${msg}`);
      return { synced: 0, skipped: 0 };

    } finally {
      this.isSyncing = false;
    }
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private handleNetworkChange(status: NetworkStatus): void {
    this._networkStatus = status;
    this.emitStatus();

    if (status === 'online') {
      this.log('[NETWORK] Back online. Triggering auto-sync...');
      void this.syncBatch();
    } else {
      this.log('[NETWORK] Went offline. Sync paused.');
    }
  }

  private emitStatus(): void {
    this.statusListeners.forEach(cb => cb(this._networkStatus, this._unsyncedCount));
  }

  private log(message: string): void {
    const line = `[${new Date().toISOString()}] ${message}`;
    console.info(line);
    this.logListeners.forEach(cb => cb(line));
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
export const syncService = new SyncService();
