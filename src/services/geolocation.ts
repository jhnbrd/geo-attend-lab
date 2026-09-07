// ─────────────────────────────────────────────────────────────────────────────
// geo-attend-lab — Geolocation Service
// Wraps navigator.geolocation.watchPosition with accuracy filtering and
// haversine distance computation from the geofence centroid.
// ─────────────────────────────────────────────────────────────────────────────
import type { GpsPing, LatLng, GeofencePolygon } from '../types';
import { haversineDistanceM, isPointInPolygon } from './geofence';

// ── Accuracy threshold: above this, mark a drift warning ─────────────────────
const ACCURACY_WARN_THRESHOLD_M = 30;

// ── watchPosition options ─────────────────────────────────────────────────────
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 2_000,   // Accept cached positions up to 2 s old
  timeout: 10_000,     // Error if no fix within 10 s
};

export type GeoSuccessCallback = (ping: GpsPing) => void;
export type GeoErrorCallback = (error: GeolocationPositionError) => void;

export class GeolocationService {
  private watchId: number | null = null;
  private currentGeofence: GeofencePolygon | null = null;
  private onSuccess: GeoSuccessCallback | null = null;
  private onError: GeoErrorCallback | null = null;

  /** Inject active geofence so each ping is tagged with inside/outside status */
  setGeofence(polygon: GeofencePolygon | null): void {
    this.currentGeofence = polygon;
  }

  /** Start watching GPS position */
  start(onSuccess: GeoSuccessCallback, onError: GeoErrorCallback): void {
    if (!('geolocation' in navigator)) {
      const err = new GeolocationPositionError();
      onError(err);
      return;
    }

    if (this.watchId !== null) {
      this.stop(); // Ensure clean restart
    }

    this.onSuccess = onSuccess;
    this.onError = onError;

    this.watchId = navigator.geolocation.watchPosition(
      this.handlePosition.bind(this),
      this.handleError.bind(this),
      GEO_OPTIONS,
    );
  }

  /** Stop watching GPS position */
  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /** Check if service is currently active */
  get isActive(): boolean {
    return this.watchId !== null;
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private handlePosition(position: GeolocationPosition): void {
    const { latitude: lat, longitude: lng, accuracy } = position.coords;
    const timestamp = position.timestamp;

    const point: LatLng = { lat, lng };

    // Accuracy filter: > 30 m = indoor GPS drift warning
    const accuracyWarning = accuracy > ACCURACY_WARN_THRESHOLD_M;

    // Distance from centroid
    let distanceFromCentroid = 0;
    let insideGeofence: boolean | null = null;

    if (this.currentGeofence) {
      distanceFromCentroid = haversineDistanceM(point, this.currentGeofence.center);
      insideGeofence = isPointInPolygon(point, this.currentGeofence.vertices);
    }

    const ping: GpsPing = {
      lat,
      lng,
      accuracy,
      timestamp,
      accuracyWarning,
      distanceFromCentroid,
      insideGeofence,
    };

    this.onSuccess?.(ping);
  }

  private handleError(error: GeolocationPositionError): void {
    console.error('[GeolocationService] Error:', error.message, 'Code:', error.code);
    this.onError?.(error);
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
export const geoService = new GeolocationService();
