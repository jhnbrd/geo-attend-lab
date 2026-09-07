// ─────────────────────────────────────────────────────────────────────────────
// geo-attend-lab — Screen Wake Lock Service
// Manages navigator.wakeLock.request('screen') with visibility-based restoration.
// ─────────────────────────────────────────────────────────────────────────────
import type { WakeLockState } from '../types';
import { writeTelemetry } from '../db';
import { TelemetryEventType } from '../types';

export type WakeLockStateCallback = (state: WakeLockState) => void;

export class WakeLockService {
  private sentinel: WakeLockSentinel | null = null;
  private _state: WakeLockState = 'released';
  private sessionActive = false;
  private readonly listeners: Set<WakeLockStateCallback> = new Set();
  private visibilityHandler: (() => void) | null = null;

  constructor() {
    // Bind once so we can remove it cleanly
    this.visibilityHandler = this.onVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Subscribe to state changes */
  onStateChange(cb: WakeLockStateCallback): () => void {
    this.listeners.add(cb);
    cb(this._state); // Emit current state immediately
    return () => this.listeners.delete(cb);
  }

  get state(): WakeLockState {
    return this._state;
  }

  get isSupported(): boolean {
    return 'wakeLock' in navigator;
  }

  /** Acquire a screen wake lock. Sets sessionActive = true. */
  async acquire(): Promise<void> {
    if (!this.isSupported) {
      this.setState('unsupported');
      return;
    }

    this.sessionActive = true;

    try {
      this.sentinel = await navigator.wakeLock.request('screen');

      this.sentinel.addEventListener('release', () => {
        // This fires when the OS revokes the lock (e.g., tab hidden, battery saver)
        this.setState('released');

        void writeTelemetry({
          timestamp: Date.now(),
          eventType: TelemetryEventType.WAKE_LOCK_LOST,
          details: JSON.stringify({ reason: 'sentinel_released' }),
        });
      });

      this.setState('active');
    } catch (err: unknown) {
      console.error('[WakeLockService] Acquire failed:', err);
      this.setState('error');
    }
  }

  /** Release the wake lock and mark session as inactive (stops auto-restore) */
  async release(): Promise<void> {
    this.sessionActive = false;
    await this.releaseSentinel();
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  /** Release sentinel without affecting sessionActive flag */
  private async releaseSentinel(): Promise<void> {
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch {
        // Ignore — may already be released
      }
      this.sentinel = null;
    }
    this.setState('released');
  }

  private setState(state: WakeLockState): void {
    this._state = state;
    this.listeners.forEach(cb => cb(state));
  }

  /**
   * iOS Safari & Android Chrome revoke the lock when the page goes to background.
   * On visibility restore, re-request if the tracking session is still active.
   */
  private onVisibilityChange(): void {
    if (document.visibilityState === 'visible' && this.sessionActive) {
      // Re-acquire asynchronously — OS returns control to page
      void this.acquire();
    }
  }

  /** Clean up event listeners */
  destroy(): void {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    void this.releaseSentinel();
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
export const wakeLockService = new WakeLockService();
