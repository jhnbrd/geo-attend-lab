// ─────────────────────────────────────────────────────────────────────────────
// geo-attend-lab — Interactive Leaflet Map Panel
// Renders the map, geofence polygon, marker, accuracy circle, and heatmap.
// ─────────────────────────────────────────────────────────────────────────────
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import type { GeofencePolygon, LatLng } from '../types';
import { getAllBreadcrumbsForHeatmap } from '../db';

// Fix Leaflet default marker icon path issue with Vite bundler
// Using CDN URLs avoids the need for *.png module declarations
const LEAFLET_CDN = 'https://unpkg.com/leaflet@1.9.4/dist/images/';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: `${LEAFLET_CDN}marker-icon-2x.png`,
  iconUrl: `${LEAFLET_CDN}marker-icon.png`,
  shadowUrl: `${LEAFLET_CDN}marker-shadow.png`,
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface HeatLatLng extends L.LatLngTuple {
  2: number; // intensity
}

declare module 'leaflet' {
  function heatLayer(
    latlngs: HeatLatLng[],
    options?: {
      radius?: number;
      blur?: number;
      maxZoom?: number;
      max?: number;
      minOpacity?: number;
      gradient?: Record<string, string>;
    },
  ): L.Layer & { setLatLngs(latlngs: HeatLatLng[]): void };
}

// ── Map panel HTML ────────────────────────────────────────────────────────────
export function createMapHTML(): string {
  return /* html */ `
    <section class="panel h-full flex flex-col p-3 sm:p-4" aria-label="Live Map">
      <div class="panel-header mb-2 flex items-center justify-between">
        <h2 class="panel-title flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-300">
          <span class="panel-icon">🗺</span> Live Geofence Radar
        </h2>
        <button
          id="btn-toggle-heatmap"
          class="text-xs px-2.5 py-1.5 rounded-lg bg-surface-700/80 border border-surface-500 text-gray-300 hover:text-white hover:border-brand-500 transition-all duration-200 active:scale-95"
        >
          Toggle Heatmap
        </button>
      </div>
      <div id="leaflet-map" class="w-full flex-1 min-h-[280px] rounded-xl overflow-hidden border border-surface-600 shadow-inner relative z-0"></div>
      <div id="map-info" class="mt-2.5 text-[11px] font-mono text-gray-400 flex gap-3 flex-wrap justify-between items-center bg-surface-800/80 px-3 py-2 rounded-lg border border-surface-600/60">
        <span>📍 <span id="map-lat">--</span>, <span id="map-lng">--</span></span>
        <span>↔ <span id="map-dist">--</span></span>
        <span>🔺 <span id="map-crumbs">0</span> pings</span>
      </div>
    </section>
  `;
}

// ── Map Controller ────────────────────────────────────────────────────────────
export class MapController {
  private map: L.Map | null = null;
  private userMarker: L.Marker | null = null;
  private accuracyCircle: L.Circle | null = null;
  private geofenceLayer: L.Polygon | null = null;
  private heatLayer: (L.Layer & { setLatLngs(latlngs: HeatLatLng[]): void }) | null = null;
  private heatVisible = false;
  private breadcrumbCount = 0;

  /** Initialize the Leaflet map in the designated container */
  init(): void {
    const container = document.getElementById('leaflet-map');
    if (!container) throw new Error('Map container #leaflet-map not found');

    this.map = L.map('leaflet-map', {
      center: [3.139, 101.687], // Kuala Lumpur as default — will move to user
      zoom: 17,
      zoomControl: true,
      attributionControl: true,
    });

    // Dark tile layer — Stadia Alidade Smooth Dark
    L.tileLayer(
      'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 20,
      },
    ).addTo(this.map);

    // Toggle heatmap button
    document.getElementById('btn-toggle-heatmap')?.addEventListener('click', () => {
      void this.toggleHeatmap();
    });
  }

  /** Invalidate map size when tab container transitions into view */
  invalidateSize(): void {
    if (!this.map) return;
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 50);
  }

  /** Update user position marker and accuracy circle */
  updatePosition(lat: number, lng: number, accuracyM: number, isInside: boolean | null): void {
    if (!this.map) return;

    const latlng = L.latLng(lat, lng);

    // Accuracy circle
    if (!this.accuracyCircle) {
      this.accuracyCircle = L.circle(latlng, {
        radius: accuracyM,
        color: '#06b6d4',
        fillColor: '#06b6d4',
        fillOpacity: 0.08,
        weight: 1,
        dashArray: '4 4',
      }).addTo(this.map);
    } else {
      this.accuracyCircle.setLatLng(latlng);
      this.accuracyCircle.setRadius(accuracyM);
    }

    // Custom pulsing marker icon
    const insideClass = isInside === true ? 'marker-inside' : isInside === false ? 'marker-outside' : 'marker-unknown';
    const customIcon = L.divIcon({
      className: '',
      html: `<div class="user-pin ${insideClass}">
               <div class="user-pin-dot"></div>
               <div class="user-pin-ring"></div>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (!this.userMarker) {
      this.userMarker = L.marker(latlng, { icon: customIcon }).addTo(this.map);
    } else {
      this.userMarker.setLatLng(latlng);
      this.userMarker.setIcon(customIcon);
    }

    // Pan map to follow user (smooth)
    this.map.panTo(latlng, { animate: true, duration: 0.5 });

    // Update info bar
    const latEl  = document.getElementById('map-lat');
    const lngEl  = document.getElementById('map-lng');
    if (latEl) latEl.textContent = lat.toFixed(6);
    if (lngEl) lngEl.textContent = lng.toFixed(6);
  }

  /** Update distance from centroid display */
  updateDistance(distanceM: number): void {
    const el = document.getElementById('map-dist');
    if (!el) return;
    el.textContent = distanceM < 1000
      ? `${Math.round(distanceM)}m`
      : `${(distanceM / 1000).toFixed(2)}km`;
  }

  /** Draw / update geofence polygon on the map */
  setGeofence(polygon: GeofencePolygon, isInside: boolean | null): void {
    if (!this.map) return;

    const latlngs = polygon.vertices.map(v => L.latLng(v.lat, v.lng));

    const fillColor = isInside === true ? '#22c55e' : isInside === false ? '#ef4444' : '#06b6d4';
    const strokeColor = isInside === true ? '#16a34a' : isInside === false ? '#dc2626' : '#0891b2';

    if (!this.geofenceLayer) {
      this.geofenceLayer = L.polygon(latlngs, {
        color: strokeColor,
        fillColor,
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '6 4',
      }).addTo(this.map);
    } else {
      this.geofenceLayer.setLatLngs(latlngs);
      this.geofenceLayer.setStyle({
        color: strokeColor,
        fillColor,
        fillOpacity: 0.15,
      });
    }

    // Center map on geofence
    this.map.fitBounds(this.geofenceLayer.getBounds(), { padding: [40, 40] });
  }

  /** Reactively update geofence colour based on current inside/outside state */
  updateGeofenceColor(isInside: boolean | null): void {
    if (!this.geofenceLayer) return;
    const fillColor   = isInside === true ? '#22c55e' : isInside === false ? '#ef4444' : '#06b6d4';
    const strokeColor = isInside === true ? '#16a34a' : isInside === false ? '#dc2626' : '#0891b2';
    this.geofenceLayer.setStyle({ fillColor, color: strokeColor });
  }

  /** Increment breadcrumb count display */
  incrementBreadcrumbCount(): void {
    this.breadcrumbCount++;
    const el = document.getElementById('map-crumbs');
    if (el) el.textContent = String(this.breadcrumbCount);
  }

  /** Toggle heatmap on/off */
  async toggleHeatmap(): Promise<void> {
    if (!this.map) return;

    if (this.heatVisible && this.heatLayer) {
      this.map.removeLayer(this.heatLayer);
      this.heatLayer = null;
      this.heatVisible = false;

      const btn = document.getElementById('btn-toggle-heatmap');
      if (btn) {
        btn.textContent = 'Toggle Heatmap';
        btn.classList.remove('border-accent-cyan', 'text-white');
      }
      return;
    }

    // Fetch all breadcrumbs from IndexedDB for heatmap
    const crumbs = await getAllBreadcrumbsForHeatmap();

    if (crumbs.length === 0) {
      console.warn('[MapController] No breadcrumbs to display on heatmap.');
      return;
    }

    const heatData: HeatLatLng[] = crumbs.map(c => [c.lat, c.lng, 0.8] as HeatLatLng);

    this.heatLayer = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 20,
      max: 1.0,
      gradient: { 0.2: '#06b6d4', 0.5: '#22c55e', 0.8: '#f59e0b', 1.0: '#ef4444' },
    });

    this.heatLayer.addTo(this.map);
    this.heatVisible = true;

    const btn = document.getElementById('btn-toggle-heatmap');
    if (btn) {
      btn.textContent = 'Hide Heatmap 🔥';
      btn.classList.add('border-accent-cyan', 'text-white');
    }
  }

  /** Refresh heatmap data (called after each breadcrumb write) */
  async refreshHeatmap(): Promise<void> {
    if (!this.heatVisible || !this.heatLayer || !this.map) return;

    const crumbs = await getAllBreadcrumbsForHeatmap();
    const heatData: HeatLatLng[] = crumbs.map(c => [c.lat, c.lng, 0.8] as HeatLatLng);
    this.heatLayer.setLatLngs(heatData);
  }

  /** Get the current map center as LatLng */
  getCenter(): LatLng | null {
    if (!this.map) return null;
    const c = this.map.getCenter();
    return { lat: c.lat, lng: c.lng };
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
export const mapController = new MapController();
