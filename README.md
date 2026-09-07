<p align="center">
  <img src="public/logo.svg" width="96" height="96" alt="geo-attend-lab logo" />
</p>

<h1 align="center">geo-attend-lab</h1>

<p align="center">
  <b>Experimental Mobile Geofencing & Attendance Verification Harness</b>
</p>

> [!IMPORTANT]
> **DEVELOPER TEST PROJECT / PROOF OF CONCEPT**  
> This project is solely an experimental test harness built to test my skills as a developer and to test if the concept of client-side geofenced attendance tracking on mobile browsers is viable. It is not for production or commercial use.  
>  
> Currently deployed live at **[geotest.jhnbrd.com](https://geotest.jhnbrd.com)** solely for testing out this specific feature.

---

## What Is This?

A mobile web app testing whether phone browsers (iOS Safari & Android Chrome) can reliably handle **geofenced check-ins and attendance tracking** without requiring native apps or cameras.

- **Offline-Ready Progressive Web App (PWA)**: Configured with a web app manifest and Service Worker caching. **Try adding it to your Home Screen** ("Add to Home Screen" in Safari or Chrome) to test it as a standalone, offline-capable mobile app!
- **50m Geofence Gating**: Tapping Check In reads your GPS once and checks if you are inside the perimeter.
- **Session-Only GPS**: GPS only tracks when checked in—never when idle.
- **Screen Wake Lock**: Keeps the phone screen on during active tracking shifts.
- **Offline Storage**: Saves breadcrumbs, telemetry, and check-in events locally in IndexedDB using Dexie.js so you can continue recording without network connectivity.
- **Mobile-App UI**: A bottom sticky navbar with a thumb-friendly center button to jump straight to the action, plus Map, Ledger, and Settings tabs.

---

## PWA & Offline Testing

1. Visit **[geotest.jhnbrd.com](https://geotest.jhnbrd.com)** on your mobile phone (iOS Safari or Android Chrome).
2. Tap the browser share/menu button and select **"Add to Home Screen"**.
3. Open the installed app from your home screen.
4. Toggle **Airplane Mode** or disconnect Wi-Fi/cellular:
   - The app shell, assets, and UI will load seamlessly offline via the Service Worker cache.
   - GPS readings and check-in records will write directly to local IndexedDB.
   - When connection is restored, pending records queue for cloud sync.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run dev server (accessible from phone on same Wi-Fi)
npm run dev -- --host

# 3. Type check & build
npm run build
```

Open `http://localhost:5173` on desktop or visit the LAN IP shown in your terminal on your mobile device.

---

## Tech Stack

- **Vite** + **TypeScript**
- **Tailwind CSS**
- **Leaflet.js** (Maps & Heatmap)
- **Dexie.js** (IndexedDB)
- **PWA / Service Worker** (Offline app shell & asset caching)
- **Browser Device APIs** (Geolocation, Screen Wake Lock)

---

## License

MIT - Personal test and evaluation project.
