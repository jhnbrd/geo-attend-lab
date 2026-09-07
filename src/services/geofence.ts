// ─────────────────────────────────────────────────────────────────────────────
// geo-attend-lab — Geofence Engine
// Implements Ray-Casting PIP, dynamic polygon generation, and violation tracking
// ─────────────────────────────────────────────────────────────────────────────
import type { LatLng, GeofencePolygon } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────
const EARTH_RADIUS_M = 6_371_000;

// ── Utility: degrees to radians ───────────────────────────────────────────────
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Ray-Casting algorithm: determines if a point [lat, lng] lies inside a polygon.
 * Works accurately for geographic coordinates at typical attendance distances (< 5 km).
 * The algorithm counts crossings of a horizontal ray from the test point.
 */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (polygon.length < 3) return false;

  const { lat: px, lng: py } = point;
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i]!.lat;
    const yi = polygon[i]!.lng;
    const xj = polygon[j]!.lat;
    const yj = polygon[j]!.lng;

    // Check if the horizontal ray from (px, py) crosses segment (xi,yi)→(xj,yj)
    const intersects =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

/**
 * Haversine formula: compute distance in metres between two lat/lng points.
 */
export function haversineDistanceM(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const c =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(c));
}

/**
 * Generate a regular N-sided polygon centred on (centerLat, centerLng)
 * with the given radius in metres.
 * Vertices are returned in order (clockwise when viewed from above).
 */
export function createBoundingPolygon(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  pointsCount = 6,
): GeofencePolygon {
  if (pointsCount < 3) throw new RangeError('pointsCount must be >= 3');
  if (radiusMeters <= 0) throw new RangeError('radiusMeters must be positive');

  // Convert radius from metres to degrees (approximate, valid for small areas)
  const latDegPerMeter = 1 / EARTH_RADIUS_M * (180 / Math.PI);
  const lngDegPerMeter =
    (1 / (EARTH_RADIUS_M * Math.cos(toRad(centerLat)))) * (180 / Math.PI);

  const vertices: LatLng[] = [];

  for (let i = 0; i < pointsCount; i++) {
    // Rotate starting from the "top" (north), going clockwise
    const angleDeg = (360 / pointsCount) * i - 90;
    const angleRad = toRad(angleDeg);

    vertices.push({
      lat: centerLat + radiusMeters * Math.cos(angleRad) * latDegPerMeter,
      lng: centerLng + radiusMeters * Math.sin(angleRad) * lngDegPerMeter,
    });
  }

  return {
    center: { lat: centerLat, lng: centerLng },
    radiusMeters,
    vertices,
  };
}

// ── Out-of-Bounds Violation Tracker ──────────────────────────────────────────

export type ViolationCallback = (consecutiveCount: number) => void;

export class GeofenceViolationTracker {
  private consecutiveOutCount = 0;
  private readonly threshold: number;
  private readonly onThresholdExceeded: ViolationCallback;

  constructor(threshold = 3, onThresholdExceeded: ViolationCallback) {
    this.threshold = threshold;
    this.onThresholdExceeded = onThresholdExceeded;
  }

  /**
   * Record a new position check result.
   * Returns the current consecutive-out count.
   */
  record(isInside: boolean): number {
    if (isInside) {
      this.consecutiveOutCount = 0;
    } else {
      this.consecutiveOutCount += 1;
      if (this.consecutiveOutCount >= this.threshold) {
        this.onThresholdExceeded(this.consecutiveOutCount);
      }
    }
    return this.consecutiveOutCount;
  }

  /** Reset tracker (e.g., after geofence change) */
  reset(): void {
    this.consecutiveOutCount = 0;
  }

  get count(): number {
    return this.consecutiveOutCount;
  }
}
