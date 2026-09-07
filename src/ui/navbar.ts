// ─────────────────────────────────────────────────────────────────────────────
// geo-attend-lab — Mobile Bottom Navigation & Central Geofence FAB
// Thumb-zone ergonomic bottom navigation bar adhering to HCI standards (Fitts's Law)
// and UX psychology for clear feedback and affordances.
// ─────────────────────────────────────────────────────────────────────────────
import type { AttendanceStatus } from '../types';

export type TabId = 'map' | 'station' | 'audit' | 'settings';

export type NavbarCallbacks = {
  onTabChange: (tabId: TabId) => void;
  onFabClick: () => void;
};

export class BottomNavbar {
  private currentTab: TabId = 'station';
  private status: AttendanceStatus = 'CHECKED_OUT';
  private geofenceReady = false;
  private callbacks: NavbarCallbacks | null = null;

  /** Build the Bottom Navbar HTML */
  createHTML(): string {
    return /* html */ `
      <nav
        id="bottom-navbar"
        class="fixed bottom-0 left-0 right-0 z-50 bg-surface-900/90 backdrop-blur-xl border-t border-surface-600/70 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] safe-bottom"
        aria-label="Mobile Navigation"
      >
        <div class="max-w-md mx-auto px-3 py-1.5 flex items-center justify-between relative">
          <!-- Tab 1: Map / Radar -->
          <button
            type="button"
            id="nav-tab-map"
            class="nav-tab flex-1 flex flex-col items-center justify-center py-1 px-1 text-gray-400 hover:text-white transition-colors duration-200 group focus:outline-none"
            data-tab="map"
            aria-label="Radar Map"
          >
            <div class="nav-icon-container relative p-1 rounded-full group-active:scale-95 transition-transform">
              <svg class="w-5 h-5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18M3 12h18" stroke-dasharray="2 2" />
                <circle cx="12" cy="12" r="3" fill="currentColor" fill-opacity="0.3" />
              </svg>
            </div>
            <span class="text-[10px] font-medium tracking-tight mt-0.5">Radar</span>
          </button>

          <!-- Tab 2: Attendance Station -->
          <button
            type="button"
            id="nav-tab-station"
            class="nav-tab flex-1 flex flex-col items-center justify-center py-1 px-1 text-brand-400 transition-colors duration-200 group focus:outline-none font-semibold"
            data-tab="station"
            aria-label="Attendance Station"
          >
            <div class="nav-icon-container relative p-1 rounded-full group-active:scale-95 transition-transform">
              <svg class="w-5 h-5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span class="text-[10px] font-medium tracking-tight mt-0.5">Station</span>
          </button>

          <!-- Center Elevated FAB (Fitts's Law Hero Action) -->
          <div class="relative flex-1 flex flex-col items-center justify-center -mt-6 z-10">
            <button
              type="button"
              id="nav-fab-action"
              class="fab-btn group relative w-15 h-15 w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none select-none active:scale-95"
              aria-label="Attendance Station"
              title="Attendance Station"
            >
              <!-- Outer glowing pulse rings -->
              <span id="fab-ring-outer" class="absolute -inset-1 rounded-full opacity-70 blur-sm transition-all duration-500"></span>
              <span id="fab-ring-inner" class="absolute -inset-0.5 rounded-full border transition-all duration-500"></span>

              <!-- FAB Core Surface -->
              <div id="fab-surface" class="relative z-10 w-full h-full rounded-full flex items-center justify-center shadow-2xl transition-all duration-300">
                <!-- Icon container -->
                <div id="fab-icon-wrap" class="transition-transform duration-300 group-active:scale-90 flex items-center justify-center">
                  <svg id="fab-icon-checkin" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <svg id="fab-icon-checkout" class="w-7 h-7 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
              </div>
            </button>
          </div>

          <!-- Tab 3: Audit Log -->
          <button
            type="button"
            id="nav-tab-audit"
            class="nav-tab flex-1 flex flex-col items-center justify-center py-1 px-1 text-gray-400 hover:text-white transition-colors duration-200 group focus:outline-none"
            data-tab="audit"
            aria-label="Audit Log"
          >
            <div class="nav-icon-container relative p-1 rounded-full group-active:scale-95 transition-transform">
              <svg class="w-5 h-5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span class="text-[10px] font-medium tracking-tight mt-0.5">Ledger</span>
          </button>

          <!-- Tab 4: Settings & Tools -->
          <button
            type="button"
            id="nav-tab-settings"
            class="nav-tab flex-1 flex flex-col items-center justify-center py-1 px-1 text-gray-400 hover:text-white transition-colors duration-200 group focus:outline-none"
            data-tab="settings"
            aria-label="Settings and Tools"
          >
            <div class="nav-icon-container relative p-1 rounded-full group-active:scale-95 transition-transform">
              <svg class="w-5 h-5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <span class="text-[10px] font-medium tracking-tight mt-0.5">Tools</span>
          </button>
        </div>
      </nav>
    `;
  }

  /** Mount event listeners */
  mount(container: HTMLElement, callbacks: NavbarCallbacks): void {
    this.callbacks = callbacks;
    container.insertAdjacentHTML('beforeend', this.createHTML());

    // Wire tab switches
    const tabButtons = container.querySelectorAll<HTMLButtonElement>('.nav-tab');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab as TabId;
        if (tab) this.setActiveTab(tab);
      });
    });

    // Wire FAB click
    const fab = document.getElementById('nav-fab-action');
    fab?.addEventListener('click', () => {
      this.callbacks?.onFabClick();
    });

    this.renderFabState();
  }

  /** Switch active tab */
  setActiveTab(tabId: TabId): void {
    if (this.currentTab === tabId) return;
    this.currentTab = tabId;

    // Update tab bar visuals
    const tabs: TabId[] = ['map', 'station', 'audit', 'settings'];
    tabs.forEach(t => {
      const btn = document.getElementById(`nav-tab-${t}`);
      const panel = document.getElementById(`tab-content-${t}`);
      if (!btn || !panel) return;

      if (t === tabId) {
        btn.classList.remove('text-gray-400');
        btn.classList.add('text-brand-400', 'font-semibold');
        panel.classList.remove('hidden');
        panel.classList.add('flex');
      } else {
        btn.classList.add('text-gray-400');
        btn.classList.remove('text-brand-400', 'font-semibold');
        panel.classList.add('hidden');
        panel.classList.remove('flex');
      }
    });

    this.callbacks?.onTabChange(tabId);
  }

  /** Get currently active tab */
  getActiveTab(): TabId {
    return this.currentTab;
  }

  /** Update FAB visual state depending on attendance status & geofence readiness */
  updateFabState(status: AttendanceStatus, geofenceReady: boolean): void {
    this.status = status;
    this.geofenceReady = geofenceReady;
    this.renderFabState();
  }

  private renderFabState(): void {
    const surface = document.getElementById('fab-surface');
    const ringOuter = document.getElementById('fab-ring-outer');
    const ringInner = document.getElementById('fab-ring-inner');
    const iconCheckIn = document.getElementById('fab-icon-checkin');
    const iconCheckOut = document.getElementById('fab-icon-checkout');

    if (!surface || !ringOuter || !ringInner || !iconCheckIn || !iconCheckOut) return;

    if (this.status === 'CHECKED_IN') {
      // ── CHECKED IN: Red / Crimson Emergency Checkout Glow ──────────────────
      surface.className =
        'relative z-10 w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.6)] border-2 border-red-300/50 active:scale-95 transition-all duration-300';
      ringOuter.className =
        'absolute -inset-1 rounded-full bg-red-500/40 blur-md animate-pulse';
      ringInner.className =
        'absolute -inset-0.5 rounded-full border border-red-400/50';

      iconCheckIn.classList.add('hidden');
      iconCheckOut.classList.remove('hidden');
    } else if (!this.geofenceReady) {
      // ── NO GEOFENCE: Amber Guidance State ───────────────────────────────────
      surface.className =
        'relative z-10 w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr from-surface-700 to-surface-600 text-amber-400 border border-amber-500/30 active:scale-95 transition-all duration-300';
      ringOuter.className =
        'absolute -inset-1 rounded-full bg-amber-500/20 blur-sm';
      ringInner.className =
        'absolute -inset-0.5 rounded-full border border-amber-500/30';

      iconCheckIn.classList.remove('hidden');
      iconCheckOut.classList.add('hidden');
    } else {
      // ── READY TO CHECK IN: Emerald Glow Invitation ──────────────────────────
      surface.className =
        'relative z-10 w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr from-brand-600 to-emerald-400 text-white shadow-[0_0_25px_rgba(34,197,94,0.6)] border-2 border-emerald-200/50 active:scale-95 transition-all duration-300';
      ringOuter.className =
        'absolute -inset-1.5 rounded-full bg-brand-500/40 blur-md animate-pulse';
      ringInner.className =
        'absolute -inset-0.5 rounded-full border border-brand-300/60';

      iconCheckIn.classList.remove('hidden');
      iconCheckOut.classList.add('hidden');
    }
  }
}

export const bottomNavbar = new BottomNavbar();
