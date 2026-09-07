// ─────────────────────────────────────────────────────────────────────────────
// geo-attend-lab — Main Application Bootstrap & Orchestrator
//
// Attendance lifecycle (strict):
//   CHECKED_OUT → user clicks Check In → getCurrentPosition() validates
//                 geofence → if inside: record, start watchPosition + WakeLock
//   CHECKED_IN  → user clicks Check Out → clearWatch, release WakeLock, record
//
// GPS polling NEVER runs in the background while CHECKED_OUT.
// ─────────────────────────────────────────────────────────────────────────────
import './style.css';

import { db, writeBreadcrumb, writeCheckIn, countUnsynced } from './db';
import { geoService } from './services/geolocation';
import { wakeLockService } from './services/wakelock';
import { gapDetector } from './services/gapDetector';
import { syncService } from './services/sync';
import { createBoundingPolygon, GeofenceViolationTracker, isPointInPolygon, haversineDistanceM } from './services/geofence';
import { writeTelemetry } from './db';
import { TelemetryEventType, CheckInType } from './types';
import type { SessionState, GpsPing } from './types';

import { mountHud, updateHud } from './ui/hud';
import { createMapHTML, mapController } from './ui/map';
import { createAttendanceStationHTML, attendanceStation } from './ui/attendance-station';
import { createAuditLogHTML, auditLog } from './ui/audit-log';
import { bottomNavbar } from './ui/navbar';
import { settingsPanel } from './ui/settings-panel';

// ── Session State ─────────────────────────────────────────────────────────────
const state: SessionState = {
  active: false,                       // true only while CHECKED_IN (GPS running)
  attendanceStatus: 'CHECKED_OUT',
  checkedInAt: null,
  geofence: null,
  lastPing: null,
  consecutiveOutOfBounds: 0,
  wakeLockState: 'released',
  networkStatus: navigator.onLine ? 'online' : 'offline',
  unsyncedCount: 0,
  heatmapVisible: false,
  pocketModeActive: false,
};

// ── Reactive UI Synchronizer ──────────────────────────────────────────────────
function refreshUI(): void {
  updateHud(state);
  bottomNavbar.updateFabState(state.attendanceStatus, state.geofence !== null);
  settingsPanel.update(state);
}

// ── Violation Tracker ─────────────────────────────────────────────────────────
const violationTracker = new GeofenceViolationTracker(3, async (count) => {
  console.warn(`[App] ${count} consecutive out-of-bounds violations!`);
  await writeTelemetry({
    timestamp: Date.now(),
    eventType: TelemetryEventType.GEOFENCE_EXIT,
    details: JSON.stringify({ consecutiveViolations: count }),
  });
});

// ── Build Mobile App Shell Layout ─────────────────────────────────────────────
function buildLayout(): void {
  const app = document.getElementById('app');
  if (!app) throw new Error('#app element not found');

  // Top Mobile Header HUD
  mountHud(app);

  // Scrollable Tab Viewport (zero window scroll)
  const viewport = document.createElement('main');
  viewport.id = 'tab-viewport';
  viewport.setAttribute('role', 'main');
  viewport.innerHTML = `
    <!-- Tab 1: Live Geofence Radar / Map -->
    <div id="tab-content-map" class="tab-pane hidden flex-col p-3 h-full">
      ${createMapHTML()}
    </div>

    <!-- Tab 2: Attendance Cockpit (Default view) -->
    <div id="tab-content-station" class="tab-pane flex flex-col p-3">
      ${createAttendanceStationHTML()}
    </div>

    <!-- Tab 3: Ledger / Audit Log -->
    <div id="tab-content-audit" class="tab-pane hidden flex-col p-3">
      ${createAuditLogHTML()}
    </div>

    <!-- Tab 4: Venue & Admin Tools -->
    <div id="tab-content-settings" class="tab-pane hidden flex-col p-3">
      ${settingsPanel.createHTML()}
    </div>
  `;
  app.appendChild(viewport);

  // Bottom Sticky Navbar with Central Hero FAB (Fitts's Law)
  bottomNavbar.mount(app, {
    onTabChange: (tabId) => {
      if (tabId === 'map') {
        mapController.invalidateSize();
      }
    },
    onFabClick: () => {
      // User preference: Central button routes to Station cockpit rather than instant check-in/out
      if (state.attendanceStatus === 'CHECKED_OUT' && !state.geofence) {
        showToast('Configure a 50m geofence first in Tools.', 'warn');
        bottomNavbar.setActiveTab('settings');
        return;
      }
      bottomNavbar.setActiveTab('station');
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK IN FLOW
// 1. Call getCurrentPosition() — one-shot, no streaming yet.
// 2. Validate against geofence.
// 3. If outside → reject with toast. Done. No state change.
// 4. If inside  → record event, start watchPosition + WakeLock + GapDetector.
// ─────────────────────────────────────────────────────────────────────────────
async function handleCheckInRequest(): Promise<void> {
  if (state.attendanceStatus === 'CHECKED_IN') return;

  if (!state.geofence) {
    showToast('Set a geofence first before checking in.', 'warn');
    return;
  }

  // One-shot GPS read — no streaming started yet
  let ping: GpsPing;
  try {
    ping = await getOneShot();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    showToast(`GPS error: ${msg}`, 'error');
    return;
  }

  // ── Geofence gate ───────────────────────────────────────────────────────────
  if (ping.insideGeofence === false) {
    showToast(
      `Cannot check in: You are ${Math.round(ping.distanceFromCentroid)}m outside the venue perimeter.`,
      'error',
    );
    // Update map and HUD so user can see their current position
    mapController.updatePosition(ping.lat, ping.lng, ping.accuracy, ping.insideGeofence);
    mapController.updateDistance(ping.distanceFromCentroid);
    mapController.updateGeofenceColor(ping.insideGeofence);
    attendanceStation.onPing(ping);
    return;
  }

  // ── Transition to CHECKED_IN ────────────────────────────────────────────────
  const now = Date.now();
  state.active = true;
  state.attendanceStatus = 'CHECKED_IN';
  state.checkedInAt = now;
  state.lastPing = ping;
  state.consecutiveOutOfBounds = 0;
  violationTracker.reset();

  // Record the check-in event
  await writeCheckIn({
    type: CheckInType.CHECK_IN,
    timestamp: now,
    lat: ping.lat,
    lng: ping.lng,
    accuracy: ping.accuracy,
    synced: 0,
  });

  showToast('Checked in ✓ — GPS tracking active.', 'success');

  // 1. Acquire Screen Wake Lock
  await wakeLockService.acquire();

  // 2. Start gap detector
  gapDetector.start((classification, gapMs, isInside) => {
    console.warn('[GapDetector]', classification, 'gap=', gapMs, 'inside=', isInside);
    void auditLog.refresh();
  });

  // 3. Start GPS streaming (breadcrumb polling)
  geoService.setGeofence(state.geofence);
  geoService.start(onGpsPing, onGpsError);

  // UI updates
  attendanceStation.setCheckedIn(now, ping);
  mapController.updatePosition(ping.lat, ping.lng, ping.accuracy, ping.insideGeofence);
  mapController.updateDistance(ping.distanceFromCentroid);
  mapController.updateGeofenceColor(ping.insideGeofence);

  state.unsyncedCount = await countUnsynced();
  refreshUI();
  await auditLog.refresh();
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK OUT FLOW
// Immediately stops GPS, releases WakeLock, records event, resets state.
// ─────────────────────────────────────────────────────────────────────────────
async function handleCheckOutRequest(): Promise<void> {
  await transitionToCheckedOut(CheckInType.CHECK_OUT);
  showToast('Checked out. Session ended.', 'success');
}

async function transitionToCheckedOut(
  type: CheckInType.CHECK_OUT | CheckInType.AUTO_CHECKOUT,
): Promise<void> {
  if (state.attendanceStatus === 'CHECKED_OUT') return;

  // 1. Stop GPS streaming immediately
  geoService.stop();

  // 2. Stop gap detector
  gapDetector.stop();

  // 3. Release Wake Lock
  await wakeLockService.release();

  // 4. Record checkout event
  const ping = state.lastPing;
  await writeCheckIn({
    type,
    timestamp: Date.now(),
    lat: ping?.lat ?? 0,
    lng: ping?.lng ?? 0,
    accuracy: ping?.accuracy ?? 0,
    synced: 0,
  });

  // 5. Reset state
  state.active = false;
  state.attendanceStatus = 'CHECKED_OUT';
  state.checkedInAt = null;

  attendanceStation.setCheckedOut(
    type === CheckInType.AUTO_CHECKOUT ? 'AUTO_CHECKOUT' : 'CHECK_OUT',
    ping,
  );

  state.unsyncedCount = await countUnsynced();
  refreshUI();
  await auditLog.refresh();
}

// ─────────────────────────────────────────────────────────────────────────────
// GPS STREAMING HANDLERS (only fire while CHECKED_IN)
// ─────────────────────────────────────────────────────────────────────────────
async function onGpsPing(ping: GpsPing): Promise<void> {
  // Safety guard: if state somehow transitions to CHECKED_OUT, ignore stale pings
  if (!state.active) return;

  state.lastPing = ping;

  // Gap detection
  const gapClassification = gapDetector.processPing(ping);
  const gapDetected = gapClassification !== null;

  // Violation tracking
  if (ping.insideGeofence !== null) {
    state.consecutiveOutOfBounds = violationTracker.record(ping.insideGeofence);
  }

  // Accuracy warning telemetry
  if (ping.accuracyWarning) {
    await writeTelemetry({
      timestamp: Date.now(),
      eventType: TelemetryEventType.ACCURACY_WARNING,
      details: JSON.stringify({ accuracy: ping.accuracy }),
    });
  }

  // Write breadcrumb to IndexedDB
  await writeBreadcrumb({
    timestamp: ping.timestamp,
    lat: ping.lat,
    lng: ping.lng,
    accuracy: ping.accuracy,
    insideGeofence: ping.insideGeofence === true ? 1 : ping.insideGeofence === false ? 0 : -1,
    gapDetected: gapDetected ? 1 : 0,
    gapClassification: gapClassification,
    accuracyWarning: ping.accuracyWarning ? 1 : 0,
    distanceFromCentroid: ping.distanceFromCentroid,
    synced: 0,
  });

  state.unsyncedCount = await countUnsynced();
  await syncService.refreshCount();

  // Map & HUD
  refreshUI();
  mapController.updatePosition(ping.lat, ping.lng, ping.accuracy, ping.insideGeofence);
  mapController.updateDistance(ping.distanceFromCentroid);
  mapController.updateGeofenceColor(ping.insideGeofence);
  mapController.incrementBreadcrumbCount();
  attendanceStation.onPing(ping);

  await mapController.refreshHeatmap();
}

function onGpsError(error: GeolocationPositionError): void {
  console.error('[GPS Error]', error.message);

  const codeMessages: Record<number, string> = {
    1: 'Location permission denied. Enable location access in browser settings.',
    2: 'GPS position unavailable. Move to open area.',
    3: 'GPS timeout. Check device GPS settings.',
  };

  const msg = codeMessages[error.code] ?? `GPS error: ${error.message}`;
  showToast(msg, 'error');

  // If GPS dies mid-session, auto-checkout to prevent ghost sessions
  if (state.attendanceStatus === 'CHECKED_IN') {
    void transitionToCheckedOut(CheckInType.AUTO_CHECKOUT);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ONE-SHOT GPS READ
// Used at check-in time to validate position before starting the stream.
// ─────────────────────────────────────────────────────────────────────────────
function getOneShot(): Promise<GpsPing> {
  return new Promise<GpsPing>((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const point = { lat, lng };

        let insideGeofence: boolean | null = null;
        let distanceFromCentroid = 0;

        if (state.geofence) {
          insideGeofence = isPointInPolygon(point, state.geofence.vertices);
          distanceFromCentroid = haversineDistanceM(point, state.geofence.center);
        }

        resolve({
          lat,
          lng,
          accuracy,
          timestamp: pos.timestamp,
          accuracyWarning: accuracy > 30,
          distanceFromCentroid,
          insideGeofence,
        });
      },
      (err) => reject(new Error(err.message)),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SET GEOFENCE
// ─────────────────────────────────────────────────────────────────────────────
function setGeofenceHere(): void {
  if (!state.lastPing) {
    // If no ping yet (not checked in), do a one-shot read to seed the geofence
    showToast('Fetching your position to set geofence…', 'success');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        applyGeofence(lat, lng, pos.coords.accuracy);
      },
      () => {
        showToast('Could not get GPS fix. Move to open area and try again.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 },
    );
    return;
  }

  applyGeofence(state.lastPing.lat, state.lastPing.lng, state.lastPing.accuracy);
}

function applyGeofence(lat: number, lng: number, _accuracy: number): void {
  const polygon = createBoundingPolygon(lat, lng, 50, 6);
  state.geofence = polygon;
  geoService.setGeofence(polygon);

  mapController.setGeofence(polygon, state.lastPing?.insideGeofence ?? null);
  violationTracker.reset();
  attendanceStation.setGeofenceAvailable(true);

  showToast('Geofence set — 50m hexagon at your position ✓', 'success');
  refreshUI();

  // Automatically switch to the Live Radar tab so user immediately sees and confirms the geofence perimeter!
  bottomNavbar.setActiveTab('map');
}

// ─────────────────────────────────────────────────────────────────────────────
// POCKET MODE
// ─────────────────────────────────────────────────────────────────────────────
function togglePocketMode(): void {
  state.pocketModeActive = !state.pocketModeActive;
  const overlay = document.getElementById('pocket-mode-overlay');
  if (!overlay) return;

  overlay.classList.toggle('hidden',  !state.pocketModeActive);
  overlay.classList.toggle('flex',     state.pocketModeActive);
}

function initPocketModeGesture(): void {
  const overlay = document.getElementById('pocket-mode-overlay');
  if (!overlay) return;

  let lastTap = 0;
  overlay.addEventListener('touchend', () => {
    const now = Date.now();
    if (now - lastTap < 350) togglePocketMode();
    lastTap = now;
  });
  overlay.addEventListener('dblclick', () => togglePocketMode());
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function showToast(message: string, type: 'success' | 'warn' | 'error' = 'success'): void {
  document.getElementById('toast-container')?.remove();

  const colors = {
    success: 'bg-brand-900/90 border-brand-700 text-brand-300',
    warn:    'bg-amber-950/90 border-amber-800 text-amber-300',
    error:   'bg-red-950/90 border-red-800 text-red-300',
  };

  const toast = document.createElement('div');
  toast.id = 'toast-container';
  toast.className = `fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl border text-sm font-medium shadow-panel backdrop-blur-sm animate-slide-up max-w-sm text-center ${colors[type]}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4_000);
}

// ─────────────────────────────────────────────────────────────────────────────
// WIRE SERVICES
// ─────────────────────────────────────────────────────────────────────────────
function wireServices(): void {
  wakeLockService.onStateChange(wl => {
    state.wakeLockState = wl;
    refreshUI();
  });

  syncService.onStatusChange((net, count) => {
    state.networkStatus = net;
    state.unsyncedCount = count;
    refreshUI();
  });

  syncService.onSyncLog(line => {
    auditLog.appendSyncLog(line);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
async function init(): Promise<void> {
  try {
    await db.open();
  } catch (err) {
    console.error('[DB] Failed to open IndexedDB:', err);
  }

  buildLayout();
  mapController.init();

  auditLog.mount(async () => { await syncService.syncBatch(); });

  attendanceStation.mount({
    onCheckInRequest:  handleCheckInRequest,
    onCheckOutRequest: handleCheckOutRequest,
  });

  const app = document.getElementById('app');
  if (app) {
    settingsPanel.mount(app, {
      onSetGeofence: setGeofenceHere,
      onTogglePocketMode: togglePocketMode,
      onSyncNow: async () => { await syncService.syncBatch(); },
      onExportCsv: async () => { await auditLog.exportCSV(); },
    });
  }

  wireServices();
  initPocketModeGesture();

  state.unsyncedCount = await countUnsynced();
  refreshUI();

  // Register PWA Service Worker for offline capability
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.info('[SW] Service Worker registered:', reg.scope))
      .catch((err) => console.warn('[SW] Service Worker registration failed:', err));
  }

  console.info('[geo-attend-lab] Ready. Set a geofence, then check in.');
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────────────────────────────────
init().catch(err => {
  console.error('[geo-attend-lab] Fatal init error:', err);
});
