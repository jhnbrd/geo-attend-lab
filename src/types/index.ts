// ─────────────────────────────────────────────────────────────────────────────
// geo-attend-lab — Shared TypeScript Types & Enums
// ─────────────────────────────────────────────────────────────────────────────

// ── Check-In / Check-Out event types ─────────────────────────────────────────
export enum CheckInType {
  CHECK_IN     = 'CHECK_IN',
  CHECK_OUT    = 'CHECK_OUT',
  AUTO_CHECKOUT = 'AUTO_CHECKOUT',
}

// ── Telemetry event types ─────────────────────────────────────────────────────
export enum TelemetryEventType {
  WAKE_LOCK_LOST    = 'WAKE_LOCK_LOST',
  APP_BLUR          = 'APP_BLUR',
  APP_FOCUS         = 'APP_FOCUS',
  ACCURACY_WARNING  = 'ACCURACY_WARNING',
  GEOFENCE_EXIT     = 'GEOFENCE_EXIT',
  PROLONGED_GAP     = 'PROLONGED_GAP',
}

// ── Gap classification ────────────────────────────────────────────────────────
export enum GapClassification {
  PROLONGED_GAP         = 'PROLONGED_GAP',
  LEGITIMATE_MULTITASKING = 'LEGITIMATE_MULTITASKING',
}

// ── Wake Lock observable state ────────────────────────────────────────────────
export type WakeLockState = 'active' | 'released' | 'unsupported' | 'error';

// ── Sync service network state ────────────────────────────────────────────────
export type NetworkStatus = 'online' | 'offline';

// ── Geofence ──────────────────────────────────────────────────────────────────
export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeofencePolygon {
  center: LatLng;
  radiusMeters: number;
  vertices: LatLng[];
}

// ── GPS ping result ───────────────────────────────────────────────────────────
export interface GpsPing {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  /** true when accuracy > 30 m — indoor drift warning */
  accuracyWarning: boolean;
  /** distance in metres from geofence centroid */
  distanceFromCentroid: number;
  /** null if no geofence is set */
  insideGeofence: boolean | null;
}

// ── Database record shapes ────────────────────────────────────────────────────
export interface BreadcrumbRecord {
  id?: number;
  timestamp: number;
  lat: number;
  lng: number;
  accuracy: number;
  insideGeofence: number; // 0 | 1 (IndexedDB doesn't store booleans natively)
  gapDetected: number;    // 0 | 1
  gapClassification: string | null;
  accuracyWarning: number; // 0 | 1
  distanceFromCentroid: number;
  synced: number;          // 0 | 1
}

export interface CheckInRecord {
  id?: number;
  type: CheckInType;
  timestamp: number;
  lat: number;
  lng: number;
  accuracy: number;
  synced: number; // 0 | 1
}

export interface TelemetryRecord {
  id?: number;
  timestamp: number;
  eventType: TelemetryEventType;
  details: string; // JSON stringified payload
}

// ── Attendance lifecycle state ───────────────────────────────────────────────
export type AttendanceStatus = 'CHECKED_OUT' | 'CHECKED_IN';

// ── App session state ─────────────────────────────────────────────────────────
export interface SessionState {
  /** GPS watch is active and breadcrumbs are being written */
  active: boolean;
  attendanceStatus: AttendanceStatus;
  checkedInAt: number | null;
  geofence: GeofencePolygon | null;
  lastPing: GpsPing | null;
  consecutiveOutOfBounds: number;
  wakeLockState: WakeLockState;
  networkStatus: NetworkStatus;
  unsyncedCount: number;
  heatmapVisible: boolean;
  pocketModeActive: boolean;
}

// ── UI event bus ──────────────────────────────────────────────────────────────
export type AppEventType =
  | 'SESSION_START'
  | 'SESSION_END'
  | 'GPS_PING'
  | 'GEOFENCE_SET'
  | 'CHECKIN'
  | 'CHECKOUT'
  | 'WAKE_LOCK_CHANGE'
  | 'NETWORK_CHANGE'
  | 'SYNC_COMPLETE'
  | 'GAP_DETECTED'
  | 'BREADCRUMB_WRITTEN'
  | 'POCKET_MODE_TOGGLE';

export interface AppEvent<T = unknown> {
  type: AppEventType;
  payload: T;
}
