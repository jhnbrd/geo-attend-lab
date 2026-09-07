// ─────────────────────────────────────────────────────────────────────────────
// geo-attend-lab — Attendance Station UI
// One-click Check In / Check Out panel with live dwell timer and
// geofence boundary indicator. Zero camera. Zero modals. Zero delays.
// ─────────────────────────────────────────────────────────────────────────────
import type { AttendanceStatus, GpsPing } from '../types';

export type AttendanceCallbacks = {
  /** User clicked "Check In" — caller must validate geofence and write DB */
  onCheckInRequest: () => Promise<void>;
  /** User clicked "Check Out" — caller stops GPS, releases locks, writes DB */
  onCheckOutRequest: () => Promise<void>;
};

// ── HTML template ─────────────────────────────────────────────────────────────
export function createAttendanceStationHTML(): string {
  return /* html */ `
    <section class="panel w-full flex flex-col p-4 space-y-4" aria-label="Attendance Station">
      <div class="panel-header border-b border-surface-700/60 pb-3 mb-1 flex items-center justify-between">
        <div>
          <h2 class="panel-title text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <span class="panel-icon">📋</span> Attendance Cockpit
          </h2>
          <p class="text-[11px] text-gray-400 mt-0.5">Automated Geofence & Dwell Telemetry</p>
        </div>
        <!-- Geofence boundary indicator -->
        <div id="geofence-boundary-badge" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-surface-800 border border-surface-600">
          <span id="boundary-dot" class="w-2 h-2 rounded-full bg-gray-500"></span>
          <span id="boundary-text" class="text-gray-400">No Boundary</span>
        </div>
      </div>

      <!-- Hero Attendance Card -->
      <div class="relative overflow-hidden bg-gradient-to-b from-surface-800/90 to-surface-900/90 rounded-3xl p-6 border border-surface-600/70 flex flex-col items-center justify-center text-center shadow-xl">
        <!-- Status Pill -->
        <div
          id="attendance-status-badge"
          class="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-surface-500 bg-surface-800/90 backdrop-blur mb-5 transition-all duration-500"
        >
          <span id="attendance-status-dot" class="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
          <span id="attendance-status-text" class="text-xs font-bold tracking-widest font-mono text-gray-400">
            NOT CHECKED IN
          </span>
        </div>

        <!-- Dwell Time Counter with Ring Background -->
        <div class="relative my-2">
          <div class="text-[10px] text-gray-400 font-mono uppercase tracking-widest mb-1">Session Dwell Duration</div>
          <div
            id="dwell-timer"
            class="text-4xl sm:text-5xl font-extrabold font-mono text-gray-500 tabular-nums tracking-wider"
          >
            00:00:00
          </div>
        </div>

        <!-- Action trigger guidance -->
        <div class="mt-6 w-full max-w-xs">
          <button
            id="btn-attendance-action"
            class="w-full py-3.5 px-6 rounded-2xl text-sm font-bold tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-900 disabled:opacity-40 disabled:cursor-not-allowed bg-surface-700 text-gray-400 border border-surface-500 active:scale-95 shadow-lg"
            disabled
            aria-label="Check In"
          >
            <span id="btn-attendance-label">Set Geofence First</span>
          </button>
          <p class="text-[10px] text-gray-400 text-center mt-2 font-mono">
            💡 Or tap the center <span class="text-brand-400 font-bold">FAB</span> in bottom navigation
          </p>
        </div>
      </div>

      <!-- Last event info card -->
      <div id="last-event-info" class="hidden bg-surface-800/60 rounded-2xl p-3.5 border border-surface-700/60 text-xs font-mono text-gray-400 space-y-1">
        <div class="flex justify-between border-b border-surface-700/40 pb-1 text-[11px] font-bold text-gray-300 uppercase tracking-wider">
          <span>Latest Verification</span>
          <span id="last-event-type" class="text-brand-400">--</span>
        </div>
        <div class="flex justify-between pt-1">
          <span class="text-gray-400">Recorded At</span>
          <span id="last-event-time" class="text-gray-300">--</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Coordinates</span>
          <span id="last-event-pos" class="text-gray-300">--</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Accuracy</span>
          <span id="last-event-acc" class="text-brand-400">--</span>
        </div>
      </div>
    </section>
  `;
}

// ── Attendance Station Controller ─────────────────────────────────────────────
export class AttendanceStation {
  private status: AttendanceStatus = 'CHECKED_OUT';
  private callbacks: AttendanceCallbacks | null = null;
  private dwellStart: number | null = null;
  private dwellTimerId: ReturnType<typeof setInterval> | null = null;
  private geofenceSet = false;
  private actionPending = false;

  // ── Mount ──────────────────────────────────────────────────────────────────

  mount(callbacks: AttendanceCallbacks): void {
    this.callbacks = callbacks;

    document.getElementById('btn-attendance-action')!
      .addEventListener('click', () => void this.handleAction());

    this.renderStatus();
  }

  // ── Public state setters ───────────────────────────────────────────────────

  /** Called when geofence is set or cleared */
  setGeofenceAvailable(available: boolean): void {
    this.geofenceSet = available;
    // Update the boundary badge immediately — no ping needed
    // null = geofence not set, 'ready' = set but no GPS fix yet
    this.renderBoundaryIndicator(available ? 'ready' : null);
    this.renderStatus();
  }

  /** Called on every GPS ping — updates boundary indicator */
  onPing(ping: GpsPing): void {
    this.renderBoundaryIndicator(ping.insideGeofence);
    this.renderStatus();
  }

  /** Transition to CHECKED_IN — starts dwell timer */
  setCheckedIn(at: number, ping: GpsPing): void {
    this.status = 'CHECKED_IN';
    this.dwellStart = at;

    this.startDwellTimer();
    this.renderStatus();
    this.renderLastEvent('CHECK IN ✅', ping);
  }

  /** Transition to CHECKED_OUT — stops dwell timer */
  setCheckedOut(type: 'CHECK_OUT' | 'AUTO_CHECKOUT', ping: GpsPing | null): void {
    this.status = 'CHECKED_OUT';
    this.stopDwellTimer();
    this.renderStatus();

    if (ping) {
      this.renderLastEvent(type === 'AUTO_CHECKOUT' ? 'AUTO CHECKOUT ⚠️' : 'CHECK OUT 🚪', ping);
    }
  }

  destroy(): void {
    this.stopDwellTimer();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private async handleAction(): Promise<void> {
    if (this.actionPending || !this.callbacks) return;

    this.actionPending = true;
    const btn = document.getElementById('btn-attendance-action') as HTMLButtonElement;
    const label = document.getElementById('btn-attendance-label');
    if (label) label.textContent = '…';
    if (btn) btn.disabled = true;

    try {
      if (this.status === 'CHECKED_OUT') {
        await this.callbacks.onCheckInRequest();
      } else {
        await this.callbacks.onCheckOutRequest();
      }
    } finally {
      this.actionPending = false;
      this.renderStatus();
    }
  }

  private renderStatus(): void {
    const badge     = document.getElementById('attendance-status-badge');
    const dot       = document.getElementById('attendance-status-dot');
    const text      = document.getElementById('attendance-status-text');
    const btn       = document.getElementById('btn-attendance-action') as HTMLButtonElement | null;
    const label     = document.getElementById('btn-attendance-label');
    const dwell     = document.getElementById('dwell-timer');

    const isCheckedIn = this.status === 'CHECKED_IN';
    // lastPing is NOT required — check-in fires getCurrentPosition on demand.
    // The button only needs a geofence to be set.
    const canCheckIn  = this.geofenceSet && !this.actionPending;

    if (isCheckedIn) {
      // ── CHECKED IN state ────────────────────────────────────────────────────
      badge?.setAttribute('class',
        'flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-brand-600 bg-brand-950/40 transition-all duration-500 shadow-glow-green',
      );
      if (dot)  dot.className  = 'w-3 h-3 rounded-full bg-brand-500 shadow-glow-green animate-pulse';
      if (text) {
        text.className  = 'text-sm font-bold tracking-wider font-mono text-brand-400';
        text.textContent = 'CHECKED IN & LOGGING';
      }
      if (dwell) dwell.className = 'text-3xl font-bold font-mono text-brand-400 tabular-nums tracking-widest';

      btn?.setAttribute('class',
        'w-full max-w-xs py-4 text-base font-bold rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-900 bg-red-700 hover:bg-red-600 text-white shadow-glow-red',
      );
      if (label) label.textContent = '🚪 Check Out';
      if (btn) btn.disabled = false;

    } else {
      // ── CHECKED OUT state ───────────────────────────────────────────────────
      badge?.setAttribute('class',
        'flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-surface-500 bg-surface-800 transition-all duration-500',
      );
      if (dot)  dot.className  = 'w-3 h-3 rounded-full bg-gray-500';
      if (text) {
        text.className  = 'text-sm font-bold tracking-wider font-mono text-gray-500';
        text.textContent = 'NOT CHECKED IN';
      }
      if (dwell) dwell.className = 'text-3xl font-bold font-mono text-gray-600 tabular-nums tracking-widest';

      if (!this.geofenceSet) {
        btn?.setAttribute('class',
          'w-full max-w-xs py-4 text-base font-bold rounded-2xl transition-all duration-300 focus:outline-none bg-surface-600 text-gray-500 cursor-not-allowed',
        );
        if (label) label.textContent = 'Set a Geofence First';
        if (btn) btn.disabled = true;
      } else {
        btn?.setAttribute('class',
          'w-full max-w-xs py-4 text-base font-bold rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-900 bg-brand-600 hover:bg-brand-500 text-white shadow-glow-green',
        );
        if (label) label.textContent = '✅ Check In';
        if (btn) btn.disabled = !canCheckIn;
      }
    }
  }

  private renderBoundaryIndicator(isInside: boolean | null | 'ready'): void {
    const dot  = document.getElementById('boundary-dot');
    const text = document.getElementById('boundary-text');

    if (isInside === null) {
      // No geofence configured yet
      if (dot)  dot.className  = 'w-2 h-2 rounded-full bg-gray-500';
      if (text) { text.className = 'text-gray-500'; text.textContent = 'No Geofence'; }
    } else if (isInside === 'ready') {
      // Geofence is set, but no GPS ping received yet (pre-check-in)
      if (dot)  dot.className  = 'w-2 h-2 rounded-full bg-amber-500 shadow-glow-amber';
      if (text) { text.className = 'text-amber-400'; text.textContent = 'Geofence Ready'; }
    } else if (isInside === true) {
      if (dot)  dot.className  = 'w-2 h-2 rounded-full bg-brand-500 shadow-glow-green';
      if (text) { text.className = 'text-brand-400'; text.textContent = 'Inside Venue ✓'; }
    } else {
      if (dot)  dot.className  = 'w-2 h-2 rounded-full bg-red-500 shadow-glow-red';
      if (text) { text.className = 'text-red-400'; text.textContent = 'Outside Venue'; }
    }
  }

  private renderLastEvent(type: string, ping: GpsPing): void {
    const info = document.getElementById('last-event-info');
    if (info) info.classList.remove('hidden');

    const typeEl = document.getElementById('last-event-type');
    const timeEl = document.getElementById('last-event-time');
    const posEl  = document.getElementById('last-event-pos');
    const accEl  = document.getElementById('last-event-acc');

    if (typeEl) typeEl.textContent = type;
    if (timeEl) timeEl.textContent = new Date(ping.timestamp).toLocaleTimeString();
    if (posEl)  posEl.textContent  = `${ping.lat.toFixed(5)}, ${ping.lng.toFixed(5)}`;
    if (accEl)  accEl.textContent  = `±${Math.round(ping.accuracy)}m`;
  }

  // ── Dwell Timer ────────────────────────────────────────────────────────────

  private startDwellTimer(): void {
    this.stopDwellTimer();
    this.dwellTimerId = setInterval(() => this.tickDwell(), 1_000);
    this.tickDwell(); // immediate first tick
  }

  private stopDwellTimer(): void {
    if (this.dwellTimerId !== null) {
      clearInterval(this.dwellTimerId);
      this.dwellTimerId = null;
    }
    const el = document.getElementById('dwell-timer');
    if (el) el.textContent = '00:00:00';
  }

  private tickDwell(): void {
    if (this.dwellStart === null) return;
    const elapsed = Math.floor((Date.now() - this.dwellStart) / 1_000);

    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;

    const fmt = (n: number) => String(n).padStart(2, '0');
    const el = document.getElementById('dwell-timer');
    if (el) el.textContent = `${fmt(h)}:${fmt(m)}:${fmt(s)}`;
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
export const attendanceStation = new AttendanceStation();
