// ─────────────────────────────────────────────────────────────────────────────
// geo-attend-lab — Settings & Administrative Tools Panel
// Centralizes geofence setup, OLED pocket mode, cloud sync, CSV export,
// database management, and platform diagnostics.
// ─────────────────────────────────────────────────────────────────────────────
import { purgeAllData } from '../db';
import type { SessionState } from '../types';

export type SettingsCallbacks = {
  onSetGeofence: () => void;
  onTogglePocketMode: () => void;
  onSyncNow: () => Promise<void>;
  onExportCsv: () => Promise<void>;
};

export class SettingsPanel {
  private callbacks: SettingsCallbacks | null = null;

  createHTML(): string {
    return /* html */ `
      <section class="panel w-full flex flex-col p-4 space-y-5" aria-label="Settings and Tools">
        <!-- Header -->
        <div class="panel-header border-b border-surface-700/60 pb-3 mb-0">
          <div>
            <h2 class="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <span>⚙️</span> Venue & Admin Console
            </h2>
            <p class="text-[11px] text-gray-400 mt-0.5">Configure geofencing, battery savers, and data sync</p>
          </div>
        </div>

        <!-- 1. Geofencing Station Setup -->
        <div class="bg-surface-800/80 rounded-2xl p-4 border border-surface-600/70 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-gray-200 uppercase tracking-wide flex items-center gap-1.5">
              <span>⬡</span> Venue Perimeter
            </span>
            <span id="settings-geofence-status" class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-700 text-gray-400 border border-surface-500">
              Not Configured
            </span>
          </div>

          <p class="text-xs text-gray-400 leading-relaxed">
            Generate an authoritative 50-meter hexagonal geofence centered on your device's exact GPS fix.
          </p>

          <button
            type="button"
            id="btn-settings-set-geofence"
            class="w-full py-3 px-4 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/50 text-brand-300 hover:text-brand-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Set 50m Geofence Here
          </button>
        </div>

        <!-- 2. Battery & Field Operations -->
        <div class="bg-surface-800/80 rounded-2xl p-4 border border-surface-600/70 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-gray-200 uppercase tracking-wide flex items-center gap-1.5">
              <span>🔋</span> Field Saver
            </span>
            <span class="text-[10px] font-mono text-gray-400">OLED Darkening</span>
          </div>

          <p class="text-xs text-gray-400 leading-relaxed">
            Activate black screen OLED Pocket Mode to prevent screen burn-in and minimize battery draw during continuous tracking shifts.
          </p>

          <button
            type="button"
            id="btn-settings-pocket-mode"
            class="w-full py-2.5 px-4 rounded-xl bg-surface-700 hover:bg-surface-600 border border-surface-500 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
          >
            <span>🌑</span> Toggle Pocket Mode (Double-tap to wake)
          </button>
        </div>

        <!-- 3. Cloud Sync & Local Storage -->
        <div class="bg-surface-800/80 rounded-2xl p-4 border border-surface-600/70 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-gray-200 uppercase tracking-wide flex items-center gap-1.5">
              <span>☁️</span> Data Persistence & Sync
            </span>
            <span id="settings-queue-count" class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-700 text-brand-400 border border-brand-800/40">
              0 unsynced
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              id="btn-settings-sync-now"
              class="py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 shadow-lg shadow-brand-900/40"
            >
              <span>☁</span> Sync Now
            </button>
            <button
              type="button"
              id="btn-settings-export-csv"
              class="py-2.5 px-3 rounded-xl bg-surface-700 hover:bg-surface-600 border border-surface-500 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95"
            >
              <span>⬇</span> Export CSV
            </button>
          </div>

          <button
            type="button"
            id="btn-settings-purge-db"
            class="w-full py-2 px-3 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-800/40 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95"
          >
            <span>🗑</span> Purge Local Database
          </button>
        </div>

        <!-- 4. Diagnostic Telemetry Info -->
        <div class="rounded-xl p-3 bg-surface-900/60 border border-surface-700/50 text-[11px] font-mono text-gray-400 space-y-1">
          <div class="flex justify-between">
            <span>IndexedDB Engine</span>
            <span class="text-brand-400">Dexie v2 (Active)</span>
          </div>
          <div class="flex justify-between">
            <span>Screen WakeLock</span>
            <span id="diag-wakelock" class="text-gray-300">Supported</span>
          </div>
          <div class="flex justify-between">
            <span>Network Gateway</span>
            <span id="diag-network" class="text-brand-400">Online</span>
          </div>
        </div>
      </section>
    `;
  }

  mount(_container: HTMLElement, callbacks: SettingsCallbacks): void {
    this.callbacks = callbacks;

    // Set geofence
    document.getElementById('btn-settings-set-geofence')?.addEventListener('click', () => {
      this.callbacks?.onSetGeofence();
    });

    // Pocket mode
    document.getElementById('btn-settings-pocket-mode')?.addEventListener('click', () => {
      this.callbacks?.onTogglePocketMode();
    });

    // Sync now
    document.getElementById('btn-settings-sync-now')?.addEventListener('click', async () => {
      if (this.callbacks) {
        await this.callbacks.onSyncNow();
      }
    });

    // Export CSV
    document.getElementById('btn-settings-export-csv')?.addEventListener('click', async () => {
      if (this.callbacks) {
        await this.callbacks.onExportCsv();
      }
    });

    // Purge DB
    document.getElementById('btn-settings-purge-db')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to purge all stored breadcrumbs, check-ins, and telemetry?')) {
        await purgeAllData();
        window.location.reload();
      }
    });
  }

  update(state: SessionState): void {
    const geoStatus = document.getElementById('settings-geofence-status');
    if (geoStatus) {
      if (state.geofence) {
        geoStatus.textContent = 'Active (50m Hexagon)';
        geoStatus.className =
          'px-2 py-0.5 rounded-full text-[10px] font-mono bg-brand-950/60 text-brand-300 border border-brand-700/60 font-semibold';
      } else {
        geoStatus.textContent = 'Not Configured';
        geoStatus.className =
          'px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-700 text-gray-400 border border-surface-500';
      }
    }

    const queueCount = document.getElementById('settings-queue-count');
    if (queueCount) {
      queueCount.textContent = `${state.unsyncedCount} unsynced`;
    }

    const diagNet = document.getElementById('diag-network');
    if (diagNet) {
      diagNet.textContent = state.networkStatus.toUpperCase();
      diagNet.className = state.networkStatus === 'online' ? 'text-brand-400' : 'text-red-400';
    }

    const diagWl = document.getElementById('diag-wakelock');
    if (diagWl) {
      diagWl.textContent = state.wakeLockState.toUpperCase();
      diagWl.className = state.wakeLockState === 'active' ? 'text-brand-400' : 'text-gray-400';
    }
  }
}

export const settingsPanel = new SettingsPanel();
