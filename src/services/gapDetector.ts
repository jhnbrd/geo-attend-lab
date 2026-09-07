// ─────────────────────────────────────────────────────────────────────────────
// geo-attend-lab — Gap Detector Service
// Detects prolonged absences from GPS pings caused by:
//   - Tab switching (document.visibilitychange)
//   - App freezes (long delay between consecutive pings)
//   - Background throttling on mobile browsers
// ─────────────────────────────────────────────────────────────────────────────
import { writeTelemetry } from '../db';
import { TelemetryEventType, GapClassification } from '../types';
import type { GpsPing } from '../types';

// ── Thresholds ────────────────────────────────────────────────────────────────
const PROLONGED_GAP_MS = 5 * 60 * 1_000;   // 5 minutes
const MAX_PING_INTERVAL_MS = 30_000;         // Expected: ping every ~5 s; warn at 30 s

export type GapCallback = (
  classification: GapClassification,
  gapMs: number,
  isInsideBounds: boolean | null,
) => void;

export class GapDetectorService {
  private lastActiveTime: number | null = null;
  private blurTime: number | null = null;
  private active = false;
  private visibilityHandler: (() => void) | null = null;
  private pingGapCallback: GapCallback | null = null;

  constructor() {
    this.visibilityHandler = this.onVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Start gap detection. Must be called when session begins. */
  start(onGapDetected: GapCallback): void {
    this.active = true;
    this.lastActiveTime = Date.now();
    this.blurTime = null;
    this.pingGapCallback = onGapDetected;
  }

  /** Stop gap detection (session ended). */
  stop(): void {
    this.active = false;
    this.lastActiveTime = null;
    this.blurTime = null;
    this.pingGapCallback = null;
  }

  /**
   * Called on each incoming GPS ping.
   * Checks time delta from last known ping to detect freezes / background throttling.
   * Returns gap classification if a gap was detected, else null.
   */
  processPing(ping: GpsPing): GapClassification | null {
    if (!this.active) return null;

    const now = ping.timestamp;
    let classification: GapClassification | null = null;

    if (this.lastActiveTime !== null) {
      const delta = now - this.lastActiveTime;

      if (delta > PROLONGED_GAP_MS) {
        // GPS was frozen/backgrounded for > 5 minutes — severe violation
        classification = GapClassification.PROLONGED_GAP;

        void writeTelemetry({
          timestamp: Date.now(),
          eventType: TelemetryEventType.PROLONGED_GAP,
          details: JSON.stringify({
            gapMs: delta,
            gapMinutes: (delta / 60_000).toFixed(2),
            classification,
            insideBounds: ping.insideGeofence,
          }),
        });

        this.pingGapCallback?.(classification, delta, ping.insideGeofence);

      } else if (delta > MAX_PING_INTERVAL_MS) {
        // Brief gap — only classify as violation if outside bounds
        if (ping.insideGeofence === false) {
          classification = GapClassification.PROLONGED_GAP;
        } else {
          classification = GapClassification.LEGITIMATE_MULTITASKING;
        }

        this.pingGapCallback?.(classification, delta, ping.insideGeofence);
      }
    }

    this.lastActiveTime = now;
    return classification;
  }

  // ── Internal visibility handling ─────────────────────────────────────────────

  private onVisibilityChange(): void {
    if (!this.active) return;

    if (document.visibilityState === 'hidden') {
      this.blurTime = Date.now();

      void writeTelemetry({
        timestamp: Date.now(),
        eventType: TelemetryEventType.APP_BLUR,
        details: JSON.stringify({ blurTime: this.blurTime }),
      });

    } else if (document.visibilityState === 'visible') {
      const focusTime = Date.now();

      void writeTelemetry({
        timestamp: focusTime,
        eventType: TelemetryEventType.APP_FOCUS,
        details: JSON.stringify({
          focusTime,
          blurTime: this.blurTime,
          gapMs: this.blurTime ? focusTime - this.blurTime : 0,
        }),
      });

      if (this.blurTime) {
        const gapMs = focusTime - this.blurTime;

        // If gap > 5 min and we're still in session, log PROLONGED_GAP
        if (gapMs > PROLONGED_GAP_MS) {
          void writeTelemetry({
            timestamp: focusTime,
            eventType: TelemetryEventType.PROLONGED_GAP,
            details: JSON.stringify({
              source: 'visibility_change',
              gapMs,
              gapMinutes: (gapMs / 60_000).toFixed(2),
            }),
          });
        }

        this.blurTime = null;
      }
    }
  }

  /** Clean up */
  destroy(): void {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
export const gapDetector = new GapDetectorService();
