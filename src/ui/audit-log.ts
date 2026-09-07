// ─────────────────────────────────────────────────────────────────────────────
// geo-attend-lab — Mobile Field Ledger & Telemetry Log
// Spacious, card-based mobile presentation for GPS breadcrumbs, telemetry events,
// and background API sync inspector. Eliminates cramped spreadsheet tables.
// ─────────────────────────────────────────────────────────────────────────────
import { getRecentBreadcrumbs, getRecentTelemetry } from '../db';
import type { BreadcrumbRecord, TelemetryRecord } from '../types';

export function createAuditLogHTML(): string {
  return /* html */ `
    <section class="panel w-full flex flex-col p-4 space-y-3" aria-label="Field Ledger">
      <!-- Header -->
      <div class="panel-header border-b border-surface-700/60 pb-3 mb-1 flex items-center justify-between">
        <div>
          <h2 class="panel-title text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <span class="panel-icon">🗂</span> Field Ledger
          </h2>
          <p class="text-[11px] text-gray-400 mt-0.5">Live GPS breadcrumb feed & telemetry audit</p>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            id="btn-sync-now"
            type="button"
            class="p-2 rounded-xl bg-surface-700 hover:bg-surface-600 border border-surface-500 text-brand-400 hover:text-brand-300 transition-all duration-200 active:scale-95"
            title="Sync with Cloud"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </button>
          <button
            id="btn-ledger-refresh"
            type="button"
            class="p-2 rounded-xl bg-surface-700 hover:bg-surface-600 border border-surface-500 text-gray-300 hover:text-white transition-all duration-200 active:scale-95"
            title="Refresh Feed"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            id="btn-export-csv"
            type="button"
            class="px-3 py-1.5 rounded-xl bg-surface-700 hover:bg-surface-600 border border-surface-500 text-xs font-semibold text-gray-200 hover:text-white transition-all duration-200 active:scale-95 flex items-center gap-1"
          >
            <span>⬇</span> CSV
          </button>
        </div>
      </div>

      <!-- Segmented Tab Switcher -->
      <div class="flex gap-1.5 p-1 bg-surface-900/80 rounded-xl border border-surface-700/60">
        <button id="tab-breadcrumbs" class="audit-tab audit-tab-active flex-1 text-center py-1.5 rounded-lg transition-all text-xs font-medium">Breadcrumbs</button>
        <button id="tab-telemetry" class="audit-tab flex-1 text-center py-1.5 rounded-lg transition-all text-xs font-medium">Telemetry</button>
        <button id="tab-api-inspector" class="audit-tab flex-1 text-center py-1.5 rounded-lg transition-all text-xs font-medium">Inspector</button>
      </div>

      <!-- 1. Breadcrumbs Card Feed -->
      <div id="panel-breadcrumbs" class="space-y-2">
        <div id="breadcrumb-list" class="space-y-2.5 max-h-[calc(100dvh-290px)] overflow-y-auto pr-1">
          <div class="py-12 text-center text-gray-500 text-xs font-mono">
            No breadcrumbs recorded yet. Start tracking from Station.
          </div>
        </div>
      </div>

      <!-- 2. Telemetry Card Feed -->
      <div id="panel-telemetry" class="hidden space-y-2">
        <div id="telemetry-list" class="space-y-2.5 max-h-[calc(100dvh-290px)] overflow-y-auto pr-1">
          <div class="py-12 text-center text-gray-500 text-xs font-mono">
            No telemetry events recorded yet.
          </div>
        </div>
      </div>

      <!-- 3. API Sync Inspector -->
      <div id="panel-api-inspector" class="hidden">
        <div
          id="api-inspector-log"
          class="h-72 overflow-y-auto bg-surface-900/90 rounded-2xl p-3.5 text-xs font-mono text-gray-400 border border-surface-700/60 leading-relaxed space-y-1"
        >
          <div class="text-gray-600 font-mono">API Inspector ready. Sync telemetry will stream here...</div>
        </div>
      </div>
    </section>
  `;
}

// ── Audit Log Controller ──────────────────────────────────────────────────────
export class AuditLog {
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private onSyncNow: (() => Promise<void>) | null = null;

  mount(onSyncNow: () => Promise<void>): void {
    this.onSyncNow = onSyncNow;

    // Tab switching
    document.getElementById('tab-breadcrumbs')!
      .addEventListener('click', () => this.switchTab('breadcrumbs'));
    document.getElementById('tab-telemetry')!
      .addEventListener('click', () => this.switchTab('telemetry'));
    document.getElementById('tab-api-inspector')!
      .addEventListener('click', () => this.switchTab('api-inspector'));

    // Export CSV
    document.getElementById('btn-export-csv')!
      .addEventListener('click', () => void this.exportCSV());

    // Refresh button
    document.getElementById('btn-ledger-refresh')!
      .addEventListener('click', () => void this.refresh());

    // Sync button
    document.getElementById('btn-sync-now')!
      .addEventListener('click', () => void this.onSyncNow?.());

    // Auto-refresh every 5 seconds
    this.refreshTimer = setInterval(() => void this.refresh(), 5_000);
  }

  /** Append a line to the API Inspector log */
  appendSyncLog(line: string): void {
    const el = document.getElementById('api-inspector-log');
    if (!el) return;

    const div = document.createElement('div');
    div.className = line.includes('[SYNC COMPLETE]') ? 'text-brand-400 font-bold' :
                    line.includes('[SYNC ERROR]')    ? 'text-red-400 font-bold' :
                    line.includes('[SYNC SKIPPED]')  ? 'text-amber-400' :
                    line.includes('[NETWORK]')       ? 'text-cyan-400' :
                                                       'text-gray-400';
    div.textContent = line;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  /** Refresh breadcrumbs and telemetry feeds */
  async refresh(): Promise<void> {
    await this.refreshBreadcrumbs();
    await this.refreshTelemetry();
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private switchTab(tab: 'breadcrumbs' | 'telemetry' | 'api-inspector'): void {
    const panels = {
      breadcrumbs: 'panel-breadcrumbs',
      telemetry: 'panel-telemetry',
      'api-inspector': 'panel-api-inspector',
    };
    const tabIds = {
      breadcrumbs: 'tab-breadcrumbs',
      telemetry: 'tab-telemetry',
      'api-inspector': 'tab-api-inspector',
    };

    Object.entries(panels).forEach(([key, panelId]) => {
      const panel = document.getElementById(panelId);
      if (panel) panel.classList.toggle('hidden', key !== tab);
    });

    Object.entries(tabIds).forEach(([key, tabId]) => {
      const tabEl = document.getElementById(tabId);
      if (tabEl) {
        tabEl.classList.toggle('audit-tab-active', key === tab);
      }
    });

    void this.refresh();
  }

  private async refreshBreadcrumbs(): Promise<void> {
    const container = document.getElementById('breadcrumb-list');
    if (!container) return;

    const records: BreadcrumbRecord[] = await getRecentBreadcrumbs(50);

    if (records.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center text-gray-500 text-xs font-mono">
          No breadcrumbs recorded yet. Start tracking from Station.
        </div>
      `;
      return;
    }

    container.innerHTML = records.map(r => {
      const ts = new Date(r.timestamp).toLocaleTimeString();
      const lat = r.lat.toFixed(5);
      const lng = r.lng.toFixed(5);
      const acc = `±${Math.round(r.accuracy)}m`;
      const dist = r.distanceFromCentroid < 1000
        ? `${Math.round(r.distanceFromCentroid)}m`
        : `${(r.distanceFromCentroid / 1000).toFixed(2)}km`;

      // Status badge
      let statusBadge: string;
      if (r.insideGeofence === 1) {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-950/70 border border-brand-700/60 text-brand-400">● INSIDE</span>`;
      } else if (r.insideGeofence === 0) {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950/70 border border-red-700/60 text-red-400">● OUTSIDE</span>`;
      } else {
        statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-700 text-gray-400">NO FENCE</span>`;
      }

      // Gap badge
      let gapBadge: string;
      if (r.gapDetected === 1) {
        if (r.gapClassification === 'PROLONGED_GAP') {
          gapBadge = `<span class="text-red-400 font-bold">GAP &gt;5m</span>`;
        } else {
          gapBadge = `<span class="text-amber-400 font-semibold">MULTI-APP</span>`;
        }
      } else {
        gapBadge = `<span class="text-gray-400">Normal</span>`;
      }

      // Sync badge
      const syncBadge = r.synced === 1
        ? `<span class="text-brand-400">✓ Synced</span>`
        : `<span class="text-amber-400">○ Pending</span>`;

      // Border highlight for anomalies
      const borderClass = r.gapClassification === 'PROLONGED_GAP' || r.insideGeofence === 0
        ? 'border-red-900/60 bg-gradient-to-r from-red-950/20 to-surface-800/80'
        : r.accuracyWarning === 1
        ? 'border-amber-900/60 bg-gradient-to-r from-amber-950/15 to-surface-800/80'
        : 'border-surface-700/70 bg-surface-800/80';

      return `
        <div class="rounded-2xl p-3.5 border ${borderClass} space-y-2 shadow-sm transition-all hover:border-surface-600">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-gray-200">${ts}</span>
              ${statusBadge}
            </div>
            <div class="text-[11px] font-mono">${syncBadge}</div>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs font-mono text-gray-300 bg-surface-900/60 p-2.5 rounded-xl border border-surface-700/40">
            <div class="flex flex-col">
              <span class="text-[10px] text-gray-500 uppercase tracking-wider">Position</span>
              <span class="font-medium text-gray-200 truncate">${lat}, ${lng}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] text-gray-500 uppercase tracking-wider">Accuracy</span>
              <span class="${r.accuracyWarning ? 'text-amber-400 font-bold' : 'text-brand-300'}">${acc}</span>
            </div>
            <div class="flex flex-col mt-1">
              <span class="text-[10px] text-gray-500 uppercase tracking-wider">Distance</span>
              <span class="text-gray-300">${dist}</span>
            </div>
            <div class="flex flex-col mt-1">
              <span class="text-[10px] text-gray-500 uppercase tracking-wider">Telemetry</span>
              <span>${gapBadge}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  private async refreshTelemetry(): Promise<void> {
    const container = document.getElementById('telemetry-list');
    if (!container) return;

    const records: TelemetryRecord[] = await getRecentTelemetry(50);

    if (records.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center text-gray-500 text-xs font-mono">
          No telemetry events recorded yet.
        </div>
      `;
      return;
    }

    container.innerHTML = records.map(r => {
      const ts = new Date(r.timestamp).toLocaleTimeString();

      const eventColors: Record<string, string> = {
        WAKE_LOCK_LOST:   'text-amber-400 border-amber-800/60 bg-amber-950/40',
        APP_BLUR:         'text-blue-400 border-blue-800/60 bg-blue-950/40',
        APP_FOCUS:        'text-brand-400 border-brand-800/60 bg-brand-950/40',
        ACCURACY_WARNING: 'text-amber-400 border-amber-800/60 bg-amber-950/40',
        GEOFENCE_EXIT:    'text-red-400 border-red-800/60 bg-red-950/40',
        PROLONGED_GAP:    'text-red-400 border-red-800/60 bg-red-950/40',
      };
      const badgeStyle = eventColors[r.eventType] ?? 'text-gray-400 border-surface-600 bg-surface-700';

      // Parse and summarize details
      let detailSummary = r.details;
      try {
        const parsed = JSON.parse(r.details) as Record<string, unknown>;
        if ('gapMinutes' in parsed) {
          detailSummary = `gap: ${parsed['gapMinutes']}min, inside: ${parsed['insideBounds']}`;
        } else if ('gapMs' in parsed) {
          detailSummary = `gap duration: ${((parsed['gapMs'] as number) / 1000).toFixed(1)}s`;
        } else {
          detailSummary = Object.entries(parsed)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join(' | ');
        }
      } catch {
        // Use raw string
      }

      return `
        <div class="rounded-2xl p-3.5 border border-surface-700/70 bg-surface-800/80 space-y-2 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeStyle}">
              ${r.eventType}
            </span>
            <span class="text-[11px] font-mono text-gray-400">${ts}</span>
          </div>
          <div class="text-xs font-mono text-gray-300 bg-surface-900/60 p-2.5 rounded-xl border border-surface-700/40 leading-relaxed">
            ${detailSummary}
          </div>
        </div>
      `;
    }).join('');
  }

  /** Export breadcrumbs to CSV format and trigger browser download */
  public async exportCSV(): Promise<void> {
    const records = await getRecentBreadcrumbs(1_000);

    const headers = ['id', 'timestamp', 'lat', 'lng', 'accuracy', 'insideGeofence', 'gapDetected', 'gapClassification', 'accuracyWarning', 'distanceFromCentroid', 'synced'];
    const rows = records.map(r => [
      r.id,
      new Date(r.timestamp).toISOString(),
      r.lat,
      r.lng,
      r.accuracy,
      r.insideGeofence,
      r.gapDetected,
      r.gapClassification ?? '',
      r.accuracyWarning,
      r.distanceFromCentroid.toFixed(2),
      r.synced,
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geo-attend-log-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
export const auditLog = new AuditLog();
