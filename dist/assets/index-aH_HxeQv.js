import{D as te,g as ne}from"./dexie-DwMMGtsQ.js";import{r as ae}from"./leaflet-DCIffZry.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function n(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(s){if(s.ep)return;s.ep=!0;const i=n(s);fetch(s.href,i)}})();class se extends te{breadcrumbs;checkIns;telemetryLogs;constructor(){super("GeoAttendLabDB"),this.version(1).stores({breadcrumbs:"++id, timestamp, lat, lng, accuracy, insideGeofence, gapDetected, synced, accuracyWarning",checkIns:"++id, type, timestamp, lat, lng, accuracy, verified",telemetryLogs:"++id, timestamp, eventType"}),this.version(2).stores({breadcrumbs:"++id, timestamp, lat, lng, accuracy, insideGeofence, gapDetected, synced, accuracyWarning",checkIns:"++id, type, timestamp, lat, lng, accuracy, synced",telemetryLogs:"++id, timestamp, eventType"})}}const m=new se;async function ie(t){return m.breadcrumbs.add(t)}async function y(t){return m.telemetryLogs.add(t)}async function W(t){return m.checkIns.add(t)}async function F(t=50){return m.breadcrumbs.orderBy("id").reverse().limit(t).toArray()}async function re(t=50){return m.telemetryLogs.orderBy("id").reverse().limit(t).toArray()}async function _(){return m.breadcrumbs.where("synced").equals(0).count()}async function oe(){return m.breadcrumbs.where("synced").equals(0).toArray()}async function ce(t){await m.breadcrumbs.where("id").anyOf(t).modify({synced:1})}async function j(){return m.breadcrumbs.toArray()}async function le(){await Promise.all([m.breadcrumbs.clear(),m.checkIns.clear(),m.telemetryLogs.clear()])}const G=6371e3;function w(t){return t*Math.PI/180}function z(t,e){if(e.length<3)return!1;const{lat:n,lng:a}=t;let s=!1;const i=e.length;for(let r=0,l=i-1;r<i;l=r++){const o=e[r].lat,d=e[r].lng,u=e[l].lat,v=e[l].lng;d>a!=v>a&&n<(u-o)*(a-d)/(v-d)+o&&(s=!s)}return s}function V(t,e){const n=w(e.lat-t.lat),a=w(e.lng-t.lng),s=Math.sin(n/2),i=Math.sin(a/2),r=s*s+Math.cos(w(t.lat))*Math.cos(w(e.lat))*i*i;return 2*G*Math.asin(Math.sqrt(r))}function de(t,e,n,a=6){if(a<3)throw new RangeError("pointsCount must be >= 3");const s=1/G*(180/Math.PI),i=1/(G*Math.cos(w(t)))*(180/Math.PI),r=[];for(let l=0;l<a;l++){const o=360/a*l-90,d=w(o);r.push({lat:t+n*Math.cos(d)*s,lng:e+n*Math.sin(d)*i})}return{center:{lat:t,lng:e},radiusMeters:n,vertices:r}}class ue{consecutiveOutCount=0;threshold;onThresholdExceeded;constructor(e=3,n){this.threshold=e,this.onThresholdExceeded=n}record(e){return e?this.consecutiveOutCount=0:(this.consecutiveOutCount+=1,this.consecutiveOutCount>=this.threshold&&this.onThresholdExceeded(this.consecutiveOutCount)),this.consecutiveOutCount}reset(){this.consecutiveOutCount=0}get count(){return this.consecutiveOutCount}}const fe=30,me={enableHighAccuracy:!0,maximumAge:2e3,timeout:1e4};class pe{watchId=null;currentGeofence=null;onSuccess=null;onError=null;setGeofence(e){this.currentGeofence=e}start(e,n){if(!("geolocation"in navigator)){const a=new GeolocationPositionError;n(a);return}this.watchId!==null&&this.stop(),this.onSuccess=e,this.onError=n,this.watchId=navigator.geolocation.watchPosition(this.handlePosition.bind(this),this.handleError.bind(this),me)}stop(){this.watchId!==null&&(navigator.geolocation.clearWatch(this.watchId),this.watchId=null)}get isActive(){return this.watchId!==null}handlePosition(e){const{latitude:n,longitude:a,accuracy:s}=e.coords,i=e.timestamp,r={lat:n,lng:a},l=s>fe;let o=0,d=null;this.currentGeofence&&(o=V(r,this.currentGeofence.center),d=z(r,this.currentGeofence.vertices));const u={lat:n,lng:a,accuracy:s,timestamp:i,accuracyWarning:l,distanceFromCentroid:o,insideGeofence:d};this.onSuccess?.(u)}handleError(e){console.error("[GeolocationService] Error:",e.message,"Code:",e.code),this.onError?.(e)}}const O=new pe;var T=(t=>(t.CHECK_IN="CHECK_IN",t.CHECK_OUT="CHECK_OUT",t.AUTO_CHECKOUT="AUTO_CHECKOUT",t))(T||{}),b=(t=>(t.WAKE_LOCK_LOST="WAKE_LOCK_LOST",t.APP_BLUR="APP_BLUR",t.APP_FOCUS="APP_FOCUS",t.ACCURACY_WARNING="ACCURACY_WARNING",t.GEOFENCE_EXIT="GEOFENCE_EXIT",t.PROLONGED_GAP="PROLONGED_GAP",t))(b||{}),A=(t=>(t.PROLONGED_GAP="PROLONGED_GAP",t.LEGITIMATE_MULTITASKING="LEGITIMATE_MULTITASKING",t))(A||{});class ge{sentinel=null;_state="released";sessionActive=!1;listeners=new Set;visibilityHandler=null;constructor(){this.visibilityHandler=this.onVisibilityChange.bind(this),document.addEventListener("visibilitychange",this.visibilityHandler)}onStateChange(e){return this.listeners.add(e),e(this._state),()=>this.listeners.delete(e)}get state(){return this._state}get isSupported(){return"wakeLock"in navigator}async acquire(){if(!this.isSupported){this.setState("unsupported");return}this.sessionActive=!0;try{this.sentinel=await navigator.wakeLock.request("screen"),this.sentinel.addEventListener("release",()=>{this.setState("released"),y({timestamp:Date.now(),eventType:b.WAKE_LOCK_LOST,details:JSON.stringify({reason:"sentinel_released"})})}),this.setState("active")}catch(e){console.error("[WakeLockService] Acquire failed:",e),this.setState("error")}}async release(){this.sessionActive=!1,await this.releaseSentinel()}async releaseSentinel(){if(this.sentinel){try{await this.sentinel.release()}catch{}this.sentinel=null}this.setState("released")}setState(e){this._state=e,this.listeners.forEach(n=>n(e))}onVisibilityChange(){document.visibilityState==="visible"&&this.sessionActive&&this.acquire()}destroy(){this.visibilityHandler&&document.removeEventListener("visibilitychange",this.visibilityHandler),this.releaseSentinel()}}const B=new ge,$=300*1e3,he=3e4;class be{lastActiveTime=null;blurTime=null;active=!1;visibilityHandler=null;pingGapCallback=null;constructor(){this.visibilityHandler=this.onVisibilityChange.bind(this),document.addEventListener("visibilitychange",this.visibilityHandler)}start(e){this.active=!0,this.lastActiveTime=Date.now(),this.blurTime=null,this.pingGapCallback=e}stop(){this.active=!1,this.lastActiveTime=null,this.blurTime=null,this.pingGapCallback=null}processPing(e){if(!this.active)return null;const n=e.timestamp;let a=null;if(this.lastActiveTime!==null){const s=n-this.lastActiveTime;s>$?(a=A.PROLONGED_GAP,y({timestamp:Date.now(),eventType:b.PROLONGED_GAP,details:JSON.stringify({gapMs:s,gapMinutes:(s/6e4).toFixed(2),classification:a,insideBounds:e.insideGeofence})}),this.pingGapCallback?.(a,s,e.insideGeofence)):s>he&&(e.insideGeofence===!1?a=A.PROLONGED_GAP:a=A.LEGITIMATE_MULTITASKING,this.pingGapCallback?.(a,s,e.insideGeofence))}return this.lastActiveTime=n,a}onVisibilityChange(){if(this.active){if(document.visibilityState==="hidden")this.blurTime=Date.now(),y({timestamp:Date.now(),eventType:b.APP_BLUR,details:JSON.stringify({blurTime:this.blurTime})});else if(document.visibilityState==="visible"){const e=Date.now();if(y({timestamp:e,eventType:b.APP_FOCUS,details:JSON.stringify({focusTime:e,blurTime:this.blurTime,gapMs:this.blurTime?e-this.blurTime:0})}),this.blurTime){const n=e-this.blurTime;n>$&&y({timestamp:e,eventType:b.PROLONGED_GAP,details:JSON.stringify({source:"visibility_change",gapMs:n,gapMinutes:(n/6e4).toFixed(2)})}),this.blurTime=null}}}}destroy(){this.visibilityHandler&&document.removeEventListener("visibilitychange",this.visibilityHandler)}}const M=new be;class ye{_networkStatus=navigator.onLine?"online":"offline";_unsyncedCount=0;statusListeners=new Set;logListeners=new Set;isSyncing=!1;constructor(){window.addEventListener("online",()=>this.handleNetworkChange("online")),window.addEventListener("offline",()=>this.handleNetworkChange("offline"))}onStatusChange(e){return this.statusListeners.add(e),e(this._networkStatus,this._unsyncedCount),()=>this.statusListeners.delete(e)}onSyncLog(e){return this.logListeners.add(e),()=>this.logListeners.delete(e)}get networkStatus(){return this._networkStatus}get unsyncedCount(){return this._unsyncedCount}async refreshCount(){this._unsyncedCount=await _(),this.emitStatus()}async syncBatch(){if(this.isSyncing)return{synced:0,skipped:0};if(this._networkStatus==="offline")return this.log("[SYNC SKIPPED] Device is offline. Will retry when online."),{synced:0,skipped:0};this.isSyncing=!0;try{const e=await oe();if(e.length===0)return this.log("[SYNC] No unsynced records. Queue is empty."),{synced:0,skipped:0};const n={batchId:crypto.randomUUID(),sentAt:new Date().toISOString(),endpoint:"https://api.example.com/v1/attendance/breadcrumbs",recordCount:e.length,records:e.map(i=>({id:i.id,timestamp:i.timestamp,lat:i.lat,lng:i.lng,accuracy:i.accuracy,insideGeofence:i.insideGeofence===1,gapDetected:i.gapDetected===1,gapClassification:i.gapClassification,accuracyWarning:i.accuracyWarning===1,distanceFromCentroid:i.distanceFromCentroid}))},a=JSON.stringify(n,null,2);this.log(`[SYNC BATCH START] ${e.length} records
${a}`),await new Promise(i=>setTimeout(i,600));const s=e.map(i=>i.id).filter(i=>i!==void 0);return await ce(s),this.log(`[SYNC COMPLETE] Marked ${s.length} records as synced. ✓`),await this.refreshCount(),{synced:s.length,skipped:0}}catch(e){const n=e instanceof Error?e.message:String(e);return this.log(`[SYNC ERROR] ${n}`),{synced:0,skipped:0}}finally{this.isSyncing=!1}}handleNetworkChange(e){this._networkStatus=e,this.emitStatus(),e==="online"?(this.log("[NETWORK] Back online. Triggering auto-sync..."),this.syncBatch()):this.log("[NETWORK] Went offline. Sync paused.")}emitStatus(){this.statusListeners.forEach(e=>e(this._networkStatus,this._unsyncedCount))}log(e){const n=`[${new Date().toISOString()}] ${e}`;console.info(n),this.logListeners.forEach(a=>a(n))}}const S=new ye;function xe(){return`
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
  `}function ve(t){t.insertAdjacentHTML("beforeend",xe())}function we(t){const e=document.getElementById("badge-attendance-pill");if(e){const r=t.attendanceStatus==="CHECKED_IN";e.textContent=r?"TRACKING":"IDLE",e.className=r?"text-[9px] font-mono px-1.5 py-0.2 rounded bg-brand-950 text-brand-300 border border-brand-600 animate-pulse font-bold":"text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-800 text-gray-400 border border-surface-600"}const n=document.getElementById("badge-network-dot");if(n){const r=t.networkStatus==="online";n.className=`w-2 h-2 rounded-full ${r?"bg-brand-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]":"bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"}`}const a=document.getElementById("badge-wakelock");a&&(t.wakeLockState==="active"?a.className="flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-brand-950/70 border border-brand-600/60 text-brand-300":a.className="flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-surface-800 border border-surface-600 text-gray-500");const s=document.getElementById("badge-accuracy-dot"),i=document.getElementById("badge-accuracy-text");if(i&&s){const r=t.lastPing;if(r){const l=Math.round(r.accuracy);i.textContent=`±${l}m`,l<15?(s.className="w-1.5 h-1.5 rounded-full bg-brand-400",i.className="text-brand-300 font-bold"):l<30?(s.className="w-1.5 h-1.5 rounded-full bg-amber-400",i.className="text-amber-300"):(s.className="w-1.5 h-1.5 rounded-full bg-red-400",i.className="text-red-300")}else s.className="w-1.5 h-1.5 rounded-full bg-gray-500",i.className="text-gray-400",i.textContent="GPS --"}}var Ce=ae();const p=ne(Ce);(function(){function t(e){return this instanceof t?(this._canvas=e=typeof e=="string"?document.getElementById(e):e,this._ctx=e.getContext("2d"),this._width=e.width,this._height=e.height,this._max=1,void this.clear()):new t(e)}t.prototype={defaultRadius:25,defaultGradient:{.4:"blue",.6:"cyan",.7:"lime",.8:"yellow",1:"red"},data:function(e,n){return this._data=e,this},max:function(e){return this._max=e,this},add:function(e){return this._data.push(e),this},clear:function(){return this._data=[],this},radius:function(e,n){n=n||15;var a=this._circle=document.createElement("canvas"),s=a.getContext("2d"),i=this._r=e+n;return a.width=a.height=2*i,s.shadowOffsetX=s.shadowOffsetY=200,s.shadowBlur=n,s.shadowColor="black",s.beginPath(),s.arc(i-200,i-200,e,0,2*Math.PI,!0),s.closePath(),s.fill(),this},gradient:function(e){var n=document.createElement("canvas"),a=n.getContext("2d"),s=a.createLinearGradient(0,0,0,256);n.width=1,n.height=256;for(var i in e)s.addColorStop(i,e[i]);return a.fillStyle=s,a.fillRect(0,0,1,256),this._grad=a.getImageData(0,0,1,256).data,this},draw:function(e){this._circle||this.radius(this.defaultRadius),this._grad||this.gradient(this.defaultGradient);var n=this._ctx;n.clearRect(0,0,this._width,this._height);for(var a,s=0,i=this._data.length;i>s;s++)a=this._data[s],n.globalAlpha=Math.max(a[2]/this._max,e||.05),n.drawImage(this._circle,a[0]-this._r,a[1]-this._r);var r=n.getImageData(0,0,this._width,this._height);return this._colorize(r.data,this._grad),n.putImageData(r,0,0),this},_colorize:function(e,n){for(var a,s=3,i=e.length;i>s;s+=4)a=4*e[s],a&&(e[s-3]=n[a],e[s-2]=n[a+1],e[s-1]=n[a+2])}},window.simpleheat=t})(),L.HeatLayer=(L.Layer?L.Layer:L.Class).extend({initialize:function(t,e){this._latlngs=t,L.setOptions(this,e)},setLatLngs:function(t){return this._latlngs=t,this.redraw()},addLatLng:function(t){return this._latlngs.push(t),this.redraw()},setOptions:function(t){return L.setOptions(this,t),this._heat&&this._updateOptions(),this.redraw()},redraw:function(){return!this._heat||this._frame||this._map._animating||(this._frame=L.Util.requestAnimFrame(this._redraw,this)),this},onAdd:function(t){this._map=t,this._canvas||this._initCanvas(),t._panes.overlayPane.appendChild(this._canvas),t.on("moveend",this._reset,this),t.options.zoomAnimation&&L.Browser.any3d&&t.on("zoomanim",this._animateZoom,this),this._reset()},onRemove:function(t){t.getPanes().overlayPane.removeChild(this._canvas),t.off("moveend",this._reset,this),t.options.zoomAnimation&&t.off("zoomanim",this._animateZoom,this)},addTo:function(t){return t.addLayer(this),this},_initCanvas:function(){var t=this._canvas=L.DomUtil.create("canvas","leaflet-heatmap-layer leaflet-layer"),e=L.DomUtil.testProp(["transformOrigin","WebkitTransformOrigin","msTransformOrigin"]);t.style[e]="50% 50%";var n=this._map.getSize();t.width=n.x,t.height=n.y;var a=this._map.options.zoomAnimation&&L.Browser.any3d;L.DomUtil.addClass(t,"leaflet-zoom-"+(a?"animated":"hide")),this._heat=simpleheat(t),this._updateOptions()},_updateOptions:function(){this._heat.radius(this.options.radius||this._heat.defaultRadius,this.options.blur),this.options.gradient&&this._heat.gradient(this.options.gradient),this.options.max&&this._heat.max(this.options.max)},_reset:function(){var t=this._map.containerPointToLayerPoint([0,0]);L.DomUtil.setPosition(this._canvas,t);var e=this._map.getSize();this._heat._width!==e.x&&(this._canvas.width=this._heat._width=e.x),this._heat._height!==e.y&&(this._canvas.height=this._heat._height=e.y),this._redraw()},_redraw:function(){var t,e,n,a,s,i,r,l,o,d=[],u=this._heat._r,v=this._map.getSize(),N=new L.Bounds(L.point([-u,-u]),v.add([u,u])),Y=this.options.max===void 0?1:this.options.max,J=this.options.maxZoom===void 0?this._map.getMaxZoom():this.options.maxZoom,Z=1/Math.pow(2,Math.max(0,Math.min(J-this._map.getZoom(),12))),I=u/2,h=[],U=this._map._getMapPanePos(),X=U.x%I,Q=U.y%I;for(t=0,e=this._latlngs.length;e>t;t++)if(n=this._map.latLngToContainerPoint(this._latlngs[t]),N.contains(n)){s=Math.floor((n.x-X)/I)+2,i=Math.floor((n.y-Q)/I)+2;var ee=this._latlngs[t].alt!==void 0?this._latlngs[t].alt:this._latlngs[t][2]!==void 0?+this._latlngs[t][2]:1;o=ee*Z,h[i]=h[i]||[],a=h[i][s],a?(a[0]=(a[0]*a[2]+n.x*o)/(a[2]+o),a[1]=(a[1]*a[2]+n.y*o)/(a[2]+o),a[2]+=o):h[i][s]=[n.x,n.y,o]}for(t=0,e=h.length;e>t;t++)if(h[t])for(r=0,l=h[t].length;l>r;r++)a=h[t][r],a&&d.push([Math.round(a[0]),Math.round(a[1]),Math.min(a[2],Y)]);this._heat.data(d).draw(this.options.minOpacity),this._frame=null},_animateZoom:function(t){var e=this._map.getZoomScale(t.zoom),n=this._map._getCenterOffset(t.center)._multiplyBy(-e).subtract(this._map._getMapPanePos());L.DomUtil.setTransform?L.DomUtil.setTransform(this._canvas,n,e):this._canvas.style[L.DomUtil.TRANSFORM]=L.DomUtil.getTranslateString(n)+" scale("+e+")"}}),L.heatLayer=function(t,e){return new L.HeatLayer(t,e)};const P="https://unpkg.com/leaflet@1.9.4/dist/images/";p.Icon.Default.mergeOptions({iconRetinaUrl:`${P}marker-icon-2x.png`,iconUrl:`${P}marker-icon.png`,shadowUrl:`${P}marker-shadow.png`});function ke(){return`
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
  `}class Ee{map=null;userMarker=null;accuracyCircle=null;geofenceLayer=null;heatLayer=null;heatVisible=!1;breadcrumbCount=0;init(){if(!document.getElementById("leaflet-map"))throw new Error("Map container #leaflet-map not found");this.map=p.map("leaflet-map",{center:[3.139,101.687],zoom:17,zoomControl:!0,attributionControl:!0}),p.tileLayer("https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",{attribution:'&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:20}).addTo(this.map),document.getElementById("btn-toggle-heatmap")?.addEventListener("click",()=>{this.toggleHeatmap()})}invalidateSize(){this.map&&setTimeout(()=>{this.map?.invalidateSize()},50)}updatePosition(e,n,a,s){if(!this.map)return;const i=p.latLng(e,n);this.accuracyCircle?(this.accuracyCircle.setLatLng(i),this.accuracyCircle.setRadius(a)):this.accuracyCircle=p.circle(i,{radius:a,color:"#06b6d4",fillColor:"#06b6d4",fillOpacity:.08,weight:1,dashArray:"4 4"}).addTo(this.map);const r=s===!0?"marker-inside":s===!1?"marker-outside":"marker-unknown",l=p.divIcon({className:"",html:`<div class="user-pin ${r}">
               <div class="user-pin-dot"></div>
               <div class="user-pin-ring"></div>
             </div>`,iconSize:[24,24],iconAnchor:[12,12]});this.userMarker?(this.userMarker.setLatLng(i),this.userMarker.setIcon(l)):this.userMarker=p.marker(i,{icon:l}).addTo(this.map),this.map.panTo(i,{animate:!0,duration:.5});const o=document.getElementById("map-lat"),d=document.getElementById("map-lng");o&&(o.textContent=e.toFixed(6)),d&&(d.textContent=n.toFixed(6))}updateDistance(e){const n=document.getElementById("map-dist");n&&(n.textContent=e<1e3?`${Math.round(e)}m`:`${(e/1e3).toFixed(2)}km`)}setGeofence(e,n){if(!this.map)return;const a=e.vertices.map(r=>p.latLng(r.lat,r.lng)),s=n===!0?"#22c55e":n===!1?"#ef4444":"#06b6d4",i=n===!0?"#16a34a":n===!1?"#dc2626":"#0891b2";this.geofenceLayer?(this.geofenceLayer.setLatLngs(a),this.geofenceLayer.setStyle({color:i,fillColor:s,fillOpacity:.15})):this.geofenceLayer=p.polygon(a,{color:i,fillColor:s,fillOpacity:.15,weight:2,dashArray:"6 4"}).addTo(this.map),this.map.fitBounds(this.geofenceLayer.getBounds(),{padding:[40,40]})}updateGeofenceColor(e){if(!this.geofenceLayer)return;const n=e===!0?"#22c55e":e===!1?"#ef4444":"#06b6d4",a=e===!0?"#16a34a":e===!1?"#dc2626":"#0891b2";this.geofenceLayer.setStyle({fillColor:n,color:a})}incrementBreadcrumbCount(){this.breadcrumbCount++;const e=document.getElementById("map-crumbs");e&&(e.textContent=String(this.breadcrumbCount))}async toggleHeatmap(){if(!this.map)return;if(this.heatVisible&&this.heatLayer){this.map.removeLayer(this.heatLayer),this.heatLayer=null,this.heatVisible=!1;const s=document.getElementById("btn-toggle-heatmap");s&&(s.textContent="Toggle Heatmap",s.classList.remove("border-accent-cyan","text-white"));return}const e=await j();if(e.length===0){console.warn("[MapController] No breadcrumbs to display on heatmap.");return}const n=e.map(s=>[s.lat,s.lng,.8]);this.heatLayer=p.heatLayer(n,{radius:25,blur:15,maxZoom:20,max:1,gradient:{.2:"#06b6d4",.5:"#22c55e",.8:"#f59e0b",1:"#ef4444"}}),this.heatLayer.addTo(this.map),this.heatVisible=!0;const a=document.getElementById("btn-toggle-heatmap");a&&(a.textContent="Hide Heatmap 🔥",a.classList.add("border-accent-cyan","text-white"))}async refreshHeatmap(){if(!this.heatVisible||!this.heatLayer||!this.map)return;const n=(await j()).map(a=>[a.lat,a.lng,.8]);this.heatLayer.setLatLngs(n)}getCenter(){if(!this.map)return null;const e=this.map.getCenter();return{lat:e.lat,lng:e.lng}}}const f=new Ee;function Se(){return`
    <section class="panel w-full flex flex-col p-4 space-y-4" aria-label="Attendance Station">
      <div class="panel-header border-b border-surface-700/60 pb-3 mb-1 flex items-center justify-between">
        <div>
          <h2 class="panel-title text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <span class="panel-icon">📋</span> Attendance Cockpit
          </h2>
          <p class="text-[11px] text-gray-400 mt-0.5">Automated Geofence & Dwell Telemetry</p>
        </div>
        <!-- Geofence boundary indicator -->
        <div id="geofence-boundary-badge" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-surface-800 border border-surface-600">
          <span id="boundary-dot" class="w-2 h-2 rounded-full bg-gray-500"></span>
          <span id="boundary-text" class="text-gray-400">No Boundary</span>
        </div>
      </div>

      <!-- Hero Attendance Card -->
      <div class="relative overflow-hidden bg-gradient-to-b from-surface-800/90 to-surface-900/90 rounded-3xl p-6 border border-surface-600/70 flex flex-col items-center justify-center text-center shadow-xl">
        <!-- Status Pill -->
        <div
          id="attendance-status-badge"
          class="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-surface-500 bg-surface-800/90 backdrop-blur mb-5 transition-all duration-500"
        >
          <span id="attendance-status-dot" class="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
          <span id="attendance-status-text" class="text-xs font-bold tracking-widest font-mono text-gray-400">
            NOT CHECKED IN
          </span>
        </div>

        <!-- Dwell Time Counter with Ring Background -->
        <div class="relative my-2">
          <div class="text-[10px] text-gray-400 font-mono uppercase tracking-widest mb-1">Session Dwell Duration</div>
          <div
            id="dwell-timer"
            class="text-4xl sm:text-5xl font-extrabold font-mono text-gray-500 tabular-nums tracking-wider"
          >
            00:00:00
          </div>
        </div>

        <!-- Action trigger guidance -->
        <div class="mt-6 w-full max-w-xs">
          <button
            id="btn-attendance-action"
            class="w-full py-3.5 px-6 rounded-2xl text-sm font-bold tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-900 disabled:opacity-40 disabled:cursor-not-allowed bg-surface-700 text-gray-400 border border-surface-500 active:scale-95 shadow-lg"
            disabled
            aria-label="Check In"
          >
            <span id="btn-attendance-label">Set Geofence First</span>
          </button>
          <p class="text-[10px] text-gray-400 text-center mt-2 font-mono">
            💡 Or tap the center <span class="text-brand-400 font-bold">FAB</span> in bottom navigation
          </p>
        </div>
      </div>

      <!-- Last event info card -->
      <div id="last-event-info" class="hidden bg-surface-800/60 rounded-2xl p-3.5 border border-surface-700/60 text-xs font-mono text-gray-400 space-y-1">
        <div class="flex justify-between border-b border-surface-700/40 pb-1 text-[11px] font-bold text-gray-300 uppercase tracking-wider">
          <span>Latest Verification</span>
          <span id="last-event-type" class="text-brand-400">--</span>
        </div>
        <div class="flex justify-between pt-1">
          <span class="text-gray-400">Recorded At</span>
          <span id="last-event-time" class="text-gray-300">--</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Coordinates</span>
          <span id="last-event-pos" class="text-gray-300">--</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Accuracy</span>
          <span id="last-event-acc" class="text-brand-400">--</span>
        </div>
      </div>
    </section>
  `}class Le{status="CHECKED_OUT";callbacks=null;dwellStart=null;dwellTimerId=null;geofenceSet=!1;actionPending=!1;mount(e){this.callbacks=e,document.getElementById("btn-attendance-action").addEventListener("click",()=>void this.handleAction()),this.renderStatus()}setGeofenceAvailable(e){this.geofenceSet=e,this.renderBoundaryIndicator(e?"ready":null),this.renderStatus()}onPing(e){this.renderBoundaryIndicator(e.insideGeofence),this.renderStatus()}setCheckedIn(e,n){this.status="CHECKED_IN",this.dwellStart=e,this.startDwellTimer(),this.renderStatus(),this.renderLastEvent("CHECK IN ✅",n)}setCheckedOut(e,n){this.status="CHECKED_OUT",this.stopDwellTimer(),this.renderStatus(),n&&this.renderLastEvent(e==="AUTO_CHECKOUT"?"AUTO CHECKOUT ⚠️":"CHECK OUT 🚪",n)}destroy(){this.stopDwellTimer()}async handleAction(){if(this.actionPending||!this.callbacks)return;this.actionPending=!0;const e=document.getElementById("btn-attendance-action"),n=document.getElementById("btn-attendance-label");n&&(n.textContent="…"),e&&(e.disabled=!0);try{this.status==="CHECKED_OUT"?await this.callbacks.onCheckInRequest():await this.callbacks.onCheckOutRequest()}finally{this.actionPending=!1,this.renderStatus()}}renderStatus(){const e=document.getElementById("attendance-status-badge"),n=document.getElementById("attendance-status-dot"),a=document.getElementById("attendance-status-text"),s=document.getElementById("btn-attendance-action"),i=document.getElementById("btn-attendance-label"),r=document.getElementById("dwell-timer"),l=this.status==="CHECKED_IN",o=this.geofenceSet&&!this.actionPending;l?(e?.setAttribute("class","flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-brand-600 bg-brand-950/40 transition-all duration-500 shadow-glow-green"),n&&(n.className="w-3 h-3 rounded-full bg-brand-500 shadow-glow-green animate-pulse"),a&&(a.className="text-sm font-bold tracking-wider font-mono text-brand-400",a.textContent="CHECKED IN & LOGGING"),r&&(r.className="text-3xl font-bold font-mono text-brand-400 tabular-nums tracking-widest"),s?.setAttribute("class","w-full max-w-xs py-4 text-base font-bold rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-900 bg-red-700 hover:bg-red-600 text-white shadow-glow-red"),i&&(i.textContent="🚪 Check Out"),s&&(s.disabled=!1)):(e?.setAttribute("class","flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-surface-500 bg-surface-800 transition-all duration-500"),n&&(n.className="w-3 h-3 rounded-full bg-gray-500"),a&&(a.className="text-sm font-bold tracking-wider font-mono text-gray-500",a.textContent="NOT CHECKED IN"),r&&(r.className="text-3xl font-bold font-mono text-gray-600 tabular-nums tracking-widest"),this.geofenceSet?(s?.setAttribute("class","w-full max-w-xs py-4 text-base font-bold rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-900 bg-brand-600 hover:bg-brand-500 text-white shadow-glow-green"),i&&(i.textContent="✅ Check In"),s&&(s.disabled=!o)):(s?.setAttribute("class","w-full max-w-xs py-4 text-base font-bold rounded-2xl transition-all duration-300 focus:outline-none bg-surface-600 text-gray-500 cursor-not-allowed"),i&&(i.textContent="Set a Geofence First"),s&&(s.disabled=!0)))}renderBoundaryIndicator(e){const n=document.getElementById("boundary-dot"),a=document.getElementById("boundary-text");e===null?(n&&(n.className="w-2 h-2 rounded-full bg-gray-500"),a&&(a.className="text-gray-500",a.textContent="No Geofence")):e==="ready"?(n&&(n.className="w-2 h-2 rounded-full bg-amber-500 shadow-glow-amber"),a&&(a.className="text-amber-400",a.textContent="Geofence Ready")):e===!0?(n&&(n.className="w-2 h-2 rounded-full bg-brand-500 shadow-glow-green"),a&&(a.className="text-brand-400",a.textContent="Inside Venue ✓")):(n&&(n.className="w-2 h-2 rounded-full bg-red-500 shadow-glow-red"),a&&(a.className="text-red-400",a.textContent="Outside Venue"))}renderLastEvent(e,n){const a=document.getElementById("last-event-info");a&&a.classList.remove("hidden");const s=document.getElementById("last-event-type"),i=document.getElementById("last-event-time"),r=document.getElementById("last-event-pos"),l=document.getElementById("last-event-acc");s&&(s.textContent=e),i&&(i.textContent=new Date(n.timestamp).toLocaleTimeString()),r&&(r.textContent=`${n.lat.toFixed(5)}, ${n.lng.toFixed(5)}`),l&&(l.textContent=`±${Math.round(n.accuracy)}m`)}startDwellTimer(){this.stopDwellTimer(),this.dwellTimerId=setInterval(()=>this.tickDwell(),1e3),this.tickDwell()}stopDwellTimer(){this.dwellTimerId!==null&&(clearInterval(this.dwellTimerId),this.dwellTimerId=null);const e=document.getElementById("dwell-timer");e&&(e.textContent="00:00:00")}tickDwell(){if(this.dwellStart===null)return;const e=Math.floor((Date.now()-this.dwellStart)/1e3),n=Math.floor(e/3600),a=Math.floor(e%3600/60),s=e%60,i=l=>String(l).padStart(2,"0"),r=document.getElementById("dwell-timer");r&&(r.textContent=`${i(n)}:${i(a)}:${i(s)}`)}}const C=new Le;function _e(){return`
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
  `}class Te{refreshTimer=null;onSyncNow=null;mount(e){this.onSyncNow=e,document.getElementById("tab-breadcrumbs").addEventListener("click",()=>this.switchTab("breadcrumbs")),document.getElementById("tab-telemetry").addEventListener("click",()=>this.switchTab("telemetry")),document.getElementById("tab-api-inspector").addEventListener("click",()=>this.switchTab("api-inspector")),document.getElementById("btn-export-csv").addEventListener("click",()=>void this.exportCSV()),document.getElementById("btn-ledger-refresh").addEventListener("click",()=>void this.refresh()),document.getElementById("btn-sync-now").addEventListener("click",()=>void this.onSyncNow?.()),this.refreshTimer=setInterval(()=>void this.refresh(),5e3)}appendSyncLog(e){const n=document.getElementById("api-inspector-log");if(!n)return;const a=document.createElement("div");a.className=e.includes("[SYNC COMPLETE]")?"text-brand-400 font-bold":e.includes("[SYNC ERROR]")?"text-red-400 font-bold":e.includes("[SYNC SKIPPED]")?"text-amber-400":e.includes("[NETWORK]")?"text-cyan-400":"text-gray-400",a.textContent=e,n.appendChild(a),n.scrollTop=n.scrollHeight}async refresh(){await this.refreshBreadcrumbs(),await this.refreshTelemetry()}destroy(){this.refreshTimer&&clearInterval(this.refreshTimer)}switchTab(e){const n={breadcrumbs:"panel-breadcrumbs",telemetry:"panel-telemetry","api-inspector":"panel-api-inspector"},a={breadcrumbs:"tab-breadcrumbs",telemetry:"tab-telemetry","api-inspector":"tab-api-inspector"};Object.entries(n).forEach(([s,i])=>{const r=document.getElementById(i);r&&r.classList.toggle("hidden",s!==e)}),Object.entries(a).forEach(([s,i])=>{const r=document.getElementById(i);r&&r.classList.toggle("audit-tab-active",s===e)}),this.refresh()}async refreshBreadcrumbs(){const e=document.getElementById("breadcrumb-list");if(!e)return;const n=await F(50);if(n.length===0){e.innerHTML=`
        <div class="py-12 text-center text-gray-500 text-xs font-mono">
          No breadcrumbs recorded yet. Start tracking from Station.
        </div>
      `;return}e.innerHTML=n.map(a=>{const s=new Date(a.timestamp).toLocaleTimeString(),i=a.lat.toFixed(5),r=a.lng.toFixed(5),l=`±${Math.round(a.accuracy)}m`,o=a.distanceFromCentroid<1e3?`${Math.round(a.distanceFromCentroid)}m`:`${(a.distanceFromCentroid/1e3).toFixed(2)}km`;let d;a.insideGeofence===1?d='<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-950/70 border border-brand-700/60 text-brand-400">● INSIDE</span>':a.insideGeofence===0?d='<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950/70 border border-red-700/60 text-red-400">● OUTSIDE</span>':d='<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-700 text-gray-400">NO FENCE</span>';let u;a.gapDetected===1?a.gapClassification==="PROLONGED_GAP"?u='<span class="text-red-400 font-bold">GAP &gt;5m</span>':u='<span class="text-amber-400 font-semibold">MULTI-APP</span>':u='<span class="text-gray-400">Normal</span>';const v=a.synced===1?'<span class="text-brand-400">✓ Synced</span>':'<span class="text-amber-400">○ Pending</span>';return`
        <div class="rounded-2xl p-3.5 border ${a.gapClassification==="PROLONGED_GAP"||a.insideGeofence===0?"border-red-900/60 bg-gradient-to-r from-red-950/20 to-surface-800/80":a.accuracyWarning===1?"border-amber-900/60 bg-gradient-to-r from-amber-950/15 to-surface-800/80":"border-surface-700/70 bg-surface-800/80"} space-y-2 shadow-sm transition-all hover:border-surface-600">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-gray-200">${s}</span>
              ${d}
            </div>
            <div class="text-[11px] font-mono">${v}</div>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs font-mono text-gray-300 bg-surface-900/60 p-2.5 rounded-xl border border-surface-700/40">
            <div class="flex flex-col">
              <span class="text-[10px] text-gray-500 uppercase tracking-wider">Position</span>
              <span class="font-medium text-gray-200 truncate">${i}, ${r}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] text-gray-500 uppercase tracking-wider">Accuracy</span>
              <span class="${a.accuracyWarning?"text-amber-400 font-bold":"text-brand-300"}">${l}</span>
            </div>
            <div class="flex flex-col mt-1">
              <span class="text-[10px] text-gray-500 uppercase tracking-wider">Distance</span>
              <span class="text-gray-300">${o}</span>
            </div>
            <div class="flex flex-col mt-1">
              <span class="text-[10px] text-gray-500 uppercase tracking-wider">Telemetry</span>
              <span>${u}</span>
            </div>
          </div>
        </div>
      `}).join("")}async refreshTelemetry(){const e=document.getElementById("telemetry-list");if(!e)return;const n=await re(50);if(n.length===0){e.innerHTML=`
        <div class="py-12 text-center text-gray-500 text-xs font-mono">
          No telemetry events recorded yet.
        </div>
      `;return}e.innerHTML=n.map(a=>{const s=new Date(a.timestamp).toLocaleTimeString(),r={WAKE_LOCK_LOST:"text-amber-400 border-amber-800/60 bg-amber-950/40",APP_BLUR:"text-blue-400 border-blue-800/60 bg-blue-950/40",APP_FOCUS:"text-brand-400 border-brand-800/60 bg-brand-950/40",ACCURACY_WARNING:"text-amber-400 border-amber-800/60 bg-amber-950/40",GEOFENCE_EXIT:"text-red-400 border-red-800/60 bg-red-950/40",PROLONGED_GAP:"text-red-400 border-red-800/60 bg-red-950/40"}[a.eventType]??"text-gray-400 border-surface-600 bg-surface-700";let l=a.details;try{const o=JSON.parse(a.details);"gapMinutes"in o?l=`gap: ${o.gapMinutes}min, inside: ${o.insideBounds}`:"gapMs"in o?l=`gap duration: ${(o.gapMs/1e3).toFixed(1)}s`:l=Object.entries(o).map(([d,u])=>`${d}: ${JSON.stringify(u)}`).join(" | ")}catch{}return`
        <div class="rounded-2xl p-3.5 border border-surface-700/70 bg-surface-800/80 space-y-2 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${r}">
              ${a.eventType}
            </span>
            <span class="text-[11px] font-mono text-gray-400">${s}</span>
          </div>
          <div class="text-xs font-mono text-gray-300 bg-surface-900/60 p-2.5 rounded-xl border border-surface-700/40 leading-relaxed">
            ${l}
          </div>
        </div>
      `}).join("")}async exportCSV(){const e=await F(1e3),n=["id","timestamp","lat","lng","accuracy","insideGeofence","gapDetected","gapClassification","accuracyWarning","distanceFromCentroid","synced"],a=e.map(o=>[o.id,new Date(o.timestamp).toISOString(),o.lat,o.lng,o.accuracy,o.insideGeofence,o.gapDetected,o.gapClassification??"",o.accuracyWarning,o.distanceFromCentroid.toFixed(2),o.synced].join(",")),s=[n.join(","),...a].join(`
`),i=new Blob([s],{type:"text/csv"}),r=URL.createObjectURL(i),l=document.createElement("a");l.href=r,l.download=`geo-attend-log-${Date.now()}.csv`,document.body.appendChild(l),l.click(),document.body.removeChild(l),URL.revokeObjectURL(r)}}const k=new Te;class Ie{currentTab="station";status="CHECKED_OUT";geofenceReady=!1;callbacks=null;createHTML(){return`
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
    `}mount(e,n){this.callbacks=n,e.insertAdjacentHTML("beforeend",this.createHTML()),e.querySelectorAll(".nav-tab").forEach(i=>{i.addEventListener("click",()=>{const r=i.dataset.tab;r&&this.setActiveTab(r)})}),document.getElementById("nav-fab-action")?.addEventListener("click",()=>{this.callbacks?.onFabClick()}),this.renderFabState()}setActiveTab(e){if(this.currentTab===e)return;this.currentTab=e,["map","station","audit","settings"].forEach(a=>{const s=document.getElementById(`nav-tab-${a}`),i=document.getElementById(`tab-content-${a}`);!s||!i||(a===e?(s.classList.remove("text-gray-400"),s.classList.add("text-brand-400","font-semibold"),i.classList.remove("hidden"),i.classList.add("flex")):(s.classList.add("text-gray-400"),s.classList.remove("text-brand-400","font-semibold"),i.classList.add("hidden"),i.classList.remove("flex")))}),this.callbacks?.onTabChange(e)}getActiveTab(){return this.currentTab}updateFabState(e,n){this.status=e,this.geofenceReady=n,this.renderFabState()}renderFabState(){const e=document.getElementById("fab-surface"),n=document.getElementById("fab-ring-outer"),a=document.getElementById("fab-ring-inner"),s=document.getElementById("fab-icon-checkin"),i=document.getElementById("fab-icon-checkout");!e||!n||!a||!s||!i||(this.status==="CHECKED_IN"?(e.className="relative z-10 w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.6)] border-2 border-red-300/50 active:scale-95 transition-all duration-300",n.className="absolute -inset-1 rounded-full bg-red-500/40 blur-md animate-pulse",a.className="absolute -inset-0.5 rounded-full border border-red-400/50",s.classList.add("hidden"),i.classList.remove("hidden")):this.geofenceReady?(e.className="relative z-10 w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr from-brand-600 to-emerald-400 text-white shadow-[0_0_25px_rgba(34,197,94,0.6)] border-2 border-emerald-200/50 active:scale-95 transition-all duration-300",n.className="absolute -inset-1.5 rounded-full bg-brand-500/40 blur-md animate-pulse",a.className="absolute -inset-0.5 rounded-full border border-brand-300/60",s.classList.remove("hidden"),i.classList.add("hidden")):(e.className="relative z-10 w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr from-surface-700 to-surface-600 text-amber-400 border border-amber-500/30 active:scale-95 transition-all duration-300",n.className="absolute -inset-1 rounded-full bg-amber-500/20 blur-sm",a.className="absolute -inset-0.5 rounded-full border border-amber-500/30",s.classList.remove("hidden"),i.classList.add("hidden")))}}const E=new Ie;class Ae{callbacks=null;createHTML(){return`
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
    `}mount(e,n){this.callbacks=n,document.getElementById("btn-settings-set-geofence")?.addEventListener("click",()=>{this.callbacks?.onSetGeofence()}),document.getElementById("btn-settings-pocket-mode")?.addEventListener("click",()=>{this.callbacks?.onTogglePocketMode()}),document.getElementById("btn-settings-sync-now")?.addEventListener("click",async()=>{this.callbacks&&await this.callbacks.onSyncNow()}),document.getElementById("btn-settings-export-csv")?.addEventListener("click",async()=>{this.callbacks&&await this.callbacks.onExportCsv()}),document.getElementById("btn-settings-purge-db")?.addEventListener("click",async()=>{confirm("Are you sure you want to purge all stored breadcrumbs, check-ins, and telemetry?")&&(await le(),window.location.reload())})}update(e){const n=document.getElementById("settings-geofence-status");n&&(e.geofence?(n.textContent="Active (50m Hexagon)",n.className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-brand-950/60 text-brand-300 border border-brand-700/60 font-semibold"):(n.textContent="Not Configured",n.className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-700 text-gray-400 border border-surface-500"));const a=document.getElementById("settings-queue-count");a&&(a.textContent=`${e.unsyncedCount} unsynced`);const s=document.getElementById("diag-network");s&&(s.textContent=e.networkStatus.toUpperCase(),s.className=e.networkStatus==="online"?"text-brand-400":"text-red-400");const i=document.getElementById("diag-wakelock");i&&(i.textContent=e.wakeLockState.toUpperCase(),i.className=e.wakeLockState==="active"?"text-brand-400":"text-gray-400")}}const H=new Ae,c={active:!1,attendanceStatus:"CHECKED_OUT",checkedInAt:null,geofence:null,lastPing:null,consecutiveOutOfBounds:0,wakeLockState:"released",networkStatus:navigator.onLine?"online":"offline",unsyncedCount:0,heatmapVisible:!1,pocketModeActive:!1};function x(){we(c),E.updateFabState(c.attendanceStatus,c.geofence!==null),H.update(c)}const R=new ue(3,async t=>{console.warn(`[App] ${t} consecutive out-of-bounds violations!`),await y({timestamp:Date.now(),eventType:b.GEOFENCE_EXIT,details:JSON.stringify({consecutiveViolations:t})})});function Oe(){const t=document.getElementById("app");if(!t)throw new Error("#app element not found");ve(t);const e=document.createElement("main");e.id="tab-viewport",e.setAttribute("role","main"),e.innerHTML=`
    <!-- Tab 1: Live Geofence Radar / Map -->
    <div id="tab-content-map" class="tab-pane hidden flex-col p-3 h-full">
      ${ke()}
    </div>

    <!-- Tab 2: Attendance Cockpit (Default view) -->
    <div id="tab-content-station" class="tab-pane flex flex-col p-3">
      ${Se()}
    </div>

    <!-- Tab 3: Ledger / Audit Log -->
    <div id="tab-content-audit" class="tab-pane hidden flex-col p-3">
      ${_e()}
    </div>

    <!-- Tab 4: Venue & Admin Tools -->
    <div id="tab-content-settings" class="tab-pane hidden flex-col p-3">
      ${H.createHTML()}
    </div>
  `,t.appendChild(e),E.mount(t,{onTabChange:n=>{n==="map"&&f.invalidateSize()},onFabClick:()=>{if(c.attendanceStatus==="CHECKED_OUT"&&!c.geofence){g("Configure a 50m geofence first in Tools.","warn"),E.setActiveTab("settings");return}E.setActiveTab("station")}})}async function Ne(){if(c.attendanceStatus==="CHECKED_IN")return;if(!c.geofence){g("Set a geofence first before checking in.","warn");return}let t;try{t=await Be()}catch(n){const a=n instanceof Error?n.message:String(n);g(`GPS error: ${a}`,"error");return}if(t.insideGeofence===!1){g(`Cannot check in: You are ${Math.round(t.distanceFromCentroid)}m outside the venue perimeter.`,"error"),f.updatePosition(t.lat,t.lng,t.accuracy,t.insideGeofence),f.updateDistance(t.distanceFromCentroid),f.updateGeofenceColor(t.insideGeofence),C.onPing(t);return}const e=Date.now();c.active=!0,c.attendanceStatus="CHECKED_IN",c.checkedInAt=e,c.lastPing=t,c.consecutiveOutOfBounds=0,R.reset(),await W({type:T.CHECK_IN,timestamp:e,lat:t.lat,lng:t.lng,accuracy:t.accuracy,synced:0}),g("Checked in ✓ — GPS tracking active.","success"),await B.acquire(),M.start((n,a,s)=>{console.warn("[GapDetector]",n,"gap=",a,"inside=",s),k.refresh()}),O.setGeofence(c.geofence),O.start(Ge,De),C.setCheckedIn(e,t),f.updatePosition(t.lat,t.lng,t.accuracy,t.insideGeofence),f.updateDistance(t.distanceFromCentroid),f.updateGeofenceColor(t.insideGeofence),c.unsyncedCount=await _(),x(),await k.refresh()}async function Pe(){await q(T.CHECK_OUT),g("Checked out. Session ended.","success")}async function q(t){if(c.attendanceStatus==="CHECKED_OUT")return;O.stop(),M.stop(),await B.release();const e=c.lastPing;await W({type:t,timestamp:Date.now(),lat:e?.lat??0,lng:e?.lng??0,accuracy:e?.accuracy??0,synced:0}),c.active=!1,c.attendanceStatus="CHECKED_OUT",c.checkedInAt=null,C.setCheckedOut(t===T.AUTO_CHECKOUT?"AUTO_CHECKOUT":"CHECK_OUT",e),c.unsyncedCount=await _(),x(),await k.refresh()}async function Ge(t){if(!c.active)return;c.lastPing=t;const e=M.processPing(t),n=e!==null;t.insideGeofence!==null&&(c.consecutiveOutOfBounds=R.record(t.insideGeofence)),t.accuracyWarning&&await y({timestamp:Date.now(),eventType:b.ACCURACY_WARNING,details:JSON.stringify({accuracy:t.accuracy})}),await ie({timestamp:t.timestamp,lat:t.lat,lng:t.lng,accuracy:t.accuracy,insideGeofence:t.insideGeofence===!0?1:t.insideGeofence===!1?0:-1,gapDetected:n?1:0,gapClassification:e,accuracyWarning:t.accuracyWarning?1:0,distanceFromCentroid:t.distanceFromCentroid,synced:0}),c.unsyncedCount=await _(),await S.refreshCount(),x(),f.updatePosition(t.lat,t.lng,t.accuracy,t.insideGeofence),f.updateDistance(t.distanceFromCentroid),f.updateGeofenceColor(t.insideGeofence),f.incrementBreadcrumbCount(),C.onPing(t),await f.refreshHeatmap()}function De(t){console.error("[GPS Error]",t.message);const n={1:"Location permission denied. Enable location access in browser settings.",2:"GPS position unavailable. Move to open area.",3:"GPS timeout. Check device GPS settings."}[t.code]??`GPS error: ${t.message}`;g(n,"error"),c.attendanceStatus==="CHECKED_IN"&&q(T.AUTO_CHECKOUT)}function Be(){return new Promise((t,e)=>{if(!("geolocation"in navigator)){e(new Error("Geolocation not supported by this browser."));return}navigator.geolocation.getCurrentPosition(n=>{const{latitude:a,longitude:s,accuracy:i}=n.coords,r={lat:a,lng:s};let l=null,o=0;c.geofence&&(l=z(r,c.geofence.vertices),o=V(r,c.geofence.center)),t({lat:a,lng:s,accuracy:i,timestamp:n.timestamp,accuracyWarning:i>30,distanceFromCentroid:o,insideGeofence:l})},n=>e(new Error(n.message)),{enableHighAccuracy:!0,timeout:1e4,maximumAge:0})})}function Me(){if(!c.lastPing){g("Fetching your position to set geofence…","success"),navigator.geolocation.getCurrentPosition(t=>{const{latitude:e,longitude:n}=t.coords;K(e,n,t.coords.accuracy)},()=>{g("Could not get GPS fix. Move to open area and try again.","error")},{enableHighAccuracy:!0,timeout:1e4,maximumAge:5e3});return}K(c.lastPing.lat,c.lastPing.lng,c.lastPing.accuracy)}function K(t,e,n){const a=de(t,e,50,6);c.geofence=a,O.setGeofence(a),f.setGeofence(a,c.lastPing?.insideGeofence??null),R.reset(),C.setGeofenceAvailable(!0),g("Geofence set — 50m hexagon at your position ✓","success"),x(),E.setActiveTab("map")}function D(){c.pocketModeActive=!c.pocketModeActive;const t=document.getElementById("pocket-mode-overlay");t&&(t.classList.toggle("hidden",!c.pocketModeActive),t.classList.toggle("flex",c.pocketModeActive))}function He(){const t=document.getElementById("pocket-mode-overlay");if(!t)return;let e=0;t.addEventListener("touchend",()=>{const n=Date.now();n-e<350&&D(),e=n}),t.addEventListener("dblclick",()=>D())}function g(t,e="success"){document.getElementById("toast-container")?.remove();const n={success:"bg-brand-900/90 border-brand-700 text-brand-300",warn:"bg-amber-950/90 border-amber-800 text-amber-300",error:"bg-red-950/90 border-red-800 text-red-300"},a=document.createElement("div");a.id="toast-container",a.className=`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl border text-sm font-medium shadow-panel backdrop-blur-sm animate-slide-up max-w-sm text-center ${n[e]}`,a.textContent=t,document.body.appendChild(a),setTimeout(()=>{a.style.transition="opacity 0.3s",a.style.opacity="0",setTimeout(()=>a.remove(),300)},4e3)}function Re(){B.onStateChange(t=>{c.wakeLockState=t,x()}),S.onStatusChange((t,e)=>{c.networkStatus=t,c.unsyncedCount=e,x()}),S.onSyncLog(t=>{k.appendSyncLog(t)})}async function Ue(){try{await m.open()}catch(e){console.error("[DB] Failed to open IndexedDB:",e)}Oe(),f.init(),k.mount(async()=>{await S.syncBatch()}),C.mount({onCheckInRequest:Ne,onCheckOutRequest:Pe});const t=document.getElementById("app");t&&H.mount(t,{onSetGeofence:Me,onTogglePocketMode:D,onSyncNow:async()=>{await S.syncBatch()},onExportCsv:async()=>{await k.exportCSV()}}),Re(),He(),c.unsyncedCount=await _(),x(),"serviceWorker"in navigator&&(window.location.protocol==="https:"||window.location.hostname==="localhost")&&navigator.serviceWorker.register("/sw.js").then(e=>console.info("[SW] Service Worker registered:",e.scope)).catch(e=>console.warn("[SW] Service Worker registration failed:",e)),console.info("[geo-attend-lab] Ready. Set a geofence, then check in.")}Ue().catch(t=>{console.error("[geo-attend-lab] Fatal init error:",t)});
//# sourceMappingURL=index-aH_HxeQv.js.map
