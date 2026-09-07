// ─────────────────────────────────────────────────────────────────────────────
// geo-attend-lab — Dexie.js IndexedDB Schema
// ─────────────────────────────────────────────────────────────────────────────
import Dexie, { type EntityTable } from 'dexie';
import type { BreadcrumbRecord, CheckInRecord, TelemetryRecord } from '../types';

// ── Database class ────────────────────────────────────────────────────────────
class GeoAttendLabDatabase extends Dexie {
  breadcrumbs!: EntityTable<BreadcrumbRecord, 'id'>;
  checkIns!: EntityTable<CheckInRecord, 'id'>;
  telemetryLogs!: EntityTable<TelemetryRecord, 'id'>;

  constructor() {
    super('GeoAttendLabDB');

    // v1: original schema (camera era)
    this.version(1).stores({
      breadcrumbs:
        '++id, timestamp, lat, lng, accuracy, insideGeofence, gapDetected, synced, accuracyWarning',
      checkIns:
        '++id, type, timestamp, lat, lng, accuracy, verified',
      telemetryLogs:
        '++id, timestamp, eventType',
    });

    // v2: remove photoBlob/verified from checkIns, add synced
    this.version(2).stores({
      breadcrumbs:
        '++id, timestamp, lat, lng, accuracy, insideGeofence, gapDetected, synced, accuracyWarning',
      checkIns:
        '++id, type, timestamp, lat, lng, accuracy, synced',
      telemetryLogs:
        '++id, timestamp, eventType',
    });
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────
export const db = new GeoAttendLabDatabase();

// ── Helper: write breadcrumb ──────────────────────────────────────────────────
export async function writeBreadcrumb(
  record: Omit<BreadcrumbRecord, 'id'>,
): Promise<number> {
  return db.breadcrumbs.add(record) as Promise<number>;
}

// ── Helper: write telemetry ───────────────────────────────────────────────────
export async function writeTelemetry(
  record: Omit<TelemetryRecord, 'id'>,
): Promise<number> {
  return db.telemetryLogs.add(record) as Promise<number>;
}

// ── Helper: write check-in / check-out event ──────────────────────────────────
export async function writeCheckIn(
  record: Omit<CheckInRecord, 'id'>,
): Promise<number> {
  return db.checkIns.add(record) as Promise<number>;
}

// ── Helper: fetch last N breadcrumbs (desc by id) ────────────────────────────
export async function getRecentBreadcrumbs(limit = 50): Promise<BreadcrumbRecord[]> {
  return db.breadcrumbs
    .orderBy('id')
    .reverse()
    .limit(limit)
    .toArray();
}

// ── Helper: fetch last N telemetry logs ───────────────────────────────────────
export async function getRecentTelemetry(limit = 50): Promise<TelemetryRecord[]> {
  return db.telemetryLogs
    .orderBy('id')
    .reverse()
    .limit(limit)
    .toArray();
}

// ── Helper: count unsynced breadcrumbs ───────────────────────────────────────
export async function countUnsynced(): Promise<number> {
  return db.breadcrumbs.where('synced').equals(0).count();
}

// ── Helper: fetch all unsynced breadcrumbs ───────────────────────────────────
export async function getUnsyncedBreadcrumbs(): Promise<BreadcrumbRecord[]> {
  return db.breadcrumbs.where('synced').equals(0).toArray();
}

// ── Helper: mark batch as synced ─────────────────────────────────────────────
export async function markSynced(ids: number[]): Promise<void> {
  await db.breadcrumbs
    .where('id')
    .anyOf(ids)
    .modify({ synced: 1 });
}

// ── Helper: fetch all breadcrumbs for heatmap ────────────────────────────────
export async function getAllBreadcrumbsForHeatmap(): Promise<
  Pick<BreadcrumbRecord, 'lat' | 'lng'>[]
> {
  return db.breadcrumbs.toArray();
}

// ── Helper: purge all data ────────────────────────────────────────────────────
export async function purgeAllData(): Promise<void> {
  await Promise.all([
    db.breadcrumbs.clear(),
    db.checkIns.clear(),
    db.telemetryLogs.clear(),
  ]);
}
