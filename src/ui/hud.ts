// ─────────────────────────────────────────────────────────────────────────────
// geo-attend-lab — Mobile Header HUD / Status Bar
// Slim native status bar showing brand identity and high-level telemetry signals.
// Adheres to mobile HCI standards and leaves screen real-estate for active tabs.
// ─────────────────────────────────────────────────────────────────────────────
import type { SessionState } from '../types';

/** Build the Mobile Top Status Bar HTML */
export function createHudHTML(): string {
  return /* html */ `
    <header id="hud" class="sticky top-0 z-40 bg-surface-900/90 backdrop-blur-xl border-b border-surface-700/70 safe-top">
      <div class="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
        <!-- Brand & App Identity -->
        <div class="flex items-center gap-2.5">
          <img src="/logo.svg" alt="geo-attend-lab" class="w-7 h-7 rounded-lg shadow-sm" />
          <div>
            <div class="flex items-center gap-1.5">
              <h1 class="text-xs font-black tracking-wider uppercase text-white font-mono">geo-attend</h1>
              <span id="badge-attendance-pill" class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-800 text-gray-400 border border-surface-600">IDLE</span>
            </div>
          </div>
        </div>

        <!-- Micro Telemetry Indicators -->
        <div class="flex items-center gap-2">
          <!-- GPS Accuracy Pill -->
          <div id="badge-accuracy" class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-800 border border-surface-600">
            <span class="w-1.5 h-1.5 rounded-full bg-gray-500" id="badge-accuracy-dot"></span>
            <span id="badge-accuracy-text" class="text-gray-400">GPS --</span>
          </div>

          <!-- WakeLock Pill -->
          <div id="badge-wakelock" class="flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-surface-800 border border-surface-600 text-gray-500" title="Wake Lock">
            <span id="badge-wakelock-icon">🔆</span>
          </div>

          <!-- Network Status Dot -->
          <div id="badge-network" class="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-surface-800 border border-surface-600" title="Network Status">
            <span id="badge-network-dot" class="w-2 h-2 rounded-full bg-gray-500"></span>
          </div>
        </div>
      </div>
    </header>
  `;
}

/** Mount HUD into the DOM */
export function mountHud(container: HTMLElement): void {
  container.insertAdjacentHTML('beforeend', createHudHTML());
}

/** Update all HUD badge states from current session state */
export function updateHud(state: SessionState): void {
  // ── Attendance Status Pill ──────────────────────────────────────────────────
  const attPill = document.getElementById('badge-attendance-pill');
  if (attPill) {
    const isCheckedIn = state.attendanceStatus === 'CHECKED_IN';
    attPill.textContent = isCheckedIn ? 'TRACKING' : 'IDLE';
    attPill.className = isCheckedIn
      ? 'text-[9px] font-mono px-1.5 py-0.2 rounded bg-brand-950 text-brand-300 border border-brand-600 animate-pulse font-bold'
      : 'text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-800 text-gray-400 border border-surface-600';
  }

  // ── Network Dot ─────────────────────────────────────────────────────────────
  const netDot = document.getElementById('badge-network-dot');
  if (netDot) {
    const online = state.networkStatus === 'online';
    netDot.className = `w-2 h-2 rounded-full ${online ? 'bg-brand-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`;
  }

  // ── Wake Lock ───────────────────────────────────────────────────────────────
  const wlEl = document.getElementById('badge-wakelock');
  if (wlEl) {
    if (state.wakeLockState === 'active') {
      wlEl.className = 'flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-brand-950/70 border border-brand-600/60 text-brand-300';
    } else {
      wlEl.className = 'flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-surface-800 border border-surface-600 text-gray-500';
    }
  }

  // ── GPS Accuracy ────────────────────────────────────────────────────────────
  const accDot  = document.getElementById('badge-accuracy-dot');
  const accText = document.getElementById('badge-accuracy-text');
  if (accText && accDot) {
    const ping = state.lastPing;
    if (ping) {
      const acc = Math.round(ping.accuracy);
      accText.textContent = `±${acc}m`;
      if (acc < 15) {
        accDot.className = 'w-1.5 h-1.5 rounded-full bg-brand-400';
        accText.className = 'text-brand-300 font-bold';
      } else if (acc < 30) {
        accDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-400';
        accText.className = 'text-amber-300';
      } else {
        accDot.className = 'w-1.5 h-1.5 rounded-full bg-red-400';
        accText.className = 'text-red-300';
      }
    } else {
      accDot.className = 'w-1.5 h-1.5 rounded-full bg-gray-500';
      accText.className = 'text-gray-400';
      accText.textContent = 'GPS --';
    }
  }
}
