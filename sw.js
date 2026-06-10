/* PRX V3.8.6 · Service Worker (Offline-Kern)
   Strategie:
   - index.html (Navigation): NETWORK-FIRST mit Cache-Fallback -> Updates kommen
     sofort an, offline startet die App trotzdem. Genau das verhindert künftig
     das "alte index.html klebt fest"-Problem UND macht die App offline-fähig.
   - Eigene statische Dateien (JS/CSS/PNG/SVG/Manifest): STALE-WHILE-REVALIDATE.
   - Kartenkacheln (OSM/Topo/Esri/Waymarked) + unpkg (Leaflet): CACHE-FIRST,
     Kachel-Cache wird bei ~3000 Einträgen beschnitten.
   - Overpass/visitmadeira/api: NETZ PUR, niemals cachen.
   VERSIONSWECHSEL: Bei jedem Build SW_VERSION erhöhen -> alte prx-static-Caches
   werden im activate gelöscht (Tile-Cache bleibt erhalten). */
'use strict';
const SW_VERSION='400';
const STATIC_CACHE='prx-static-v'+SW_VERSION;
const TILE_CACHE='prx-tiles-v1';            /* bewusst versionsstabil: Kacheln überleben App-Updates */
const TILE_MAX=3000;

const PRECACHE=[
  './','./index.html','./style.css','./prx-v385-apple-motion.css',
  './manifest.webmanifest','./intro-bg.svg',
  './data.js','./poi-data.js','./app.js',
  './prx-v385-boot-guard.js','./prx-v385-apple-motion.css','./prx-v386-offline.js','./prx-v387-gps.js','./prx-v388-dayplan.js','./prx-v389-weather.js',
  './prx-v372-nav-recovery.js','./prx-v373-settings-symbol-system.js',
  './prx-v374-modal-isolation.js','./prx-v375-settings-options-trip-deepening.js',
  './prx-v376-settings-engine.js','./prx-v377-interactive-controls-status-booking.js',
  './prx-v378-detail-open-recovery.js','./prx-v380-osm-live-poi.js',
  './prx-v381-version-sync.js',
  './assets/app-icons/prx-map-route-180.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

const TILE_HOSTS=['tile.openstreetmap.org','tile.opentopomap.org','server.arcgisonline.com','tile.waymarkedtrails.org'];
const NEVER_CACHE=['overpass-api.de','visitmadeira','simplifica','api.open-meteo.com'];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then(c=>Promise.allSettled(PRECACHE.map(u=>c.add(u))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k.startsWith('prx-static-')&&k!==STATIC_CACHE).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

function isTile(url){return TILE_HOSTS.some(h=>url.hostname.endsWith(h));}
function isNeverCache(url){return NEVER_CACHE.some(h=>url.href.includes(h));}

async function trimTiles(){
  try{
    const c=await caches.open(TILE_CACHE);
    const keys=await c.keys();
    if(keys.length>TILE_MAX){
      const drop=keys.slice(0,keys.length-TILE_MAX);
      await Promise.all(drop.map(k=>c.delete(k)));
    }
  }catch(e){}
}

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  let url; try{url=new URL(req.url);}catch(_){return;}
  if(isNeverCache(url))return; /* Netz pur */

  /* 1) Navigation: network-first, Fallback Cache */
  if(req.mode==='navigate'){
    e.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(STATIC_CACHE).then(c=>c.put('./index.html',copy)).catch(()=>{});
        return res;
      }).catch(()=>caches.match('./index.html',{ignoreSearch:true}))
    );
    return;
  }

  /* 2) Kacheln + unpkg: cache-first */
  if(isTile(url)||url.hostname==='unpkg.com'){
    e.respondWith(
      caches.open(isTile(url)?TILE_CACHE:STATIC_CACHE).then(c=>
        c.match(req).then(hit=>{
          if(hit)return hit;
          return fetch(req).then(res=>{
            if(res&&(res.ok||res.type==='opaque')){
              c.put(req,res.clone()).catch(()=>{});
              if(isTile(url)&&Math.random()<0.02)trimTiles();
            }
            return res;
          });
        })
      ).catch(()=>caches.match(req))
    );
    return;
  }

  /* 3) Eigene statische Dateien: stale-while-revalidate (Query ignorieren) */
  if(url.origin===self.location.origin){
    e.respondWith(
      caches.open(STATIC_CACHE).then(c=>
        c.match(req,{ignoreSearch:true}).then(hit=>{
          const net=fetch(req).then(res=>{
            if(res&&res.ok)c.put(req,res.clone()).catch(()=>{});
            return res;
          }).catch(()=>hit);
          return hit||net;
        })
      )
    );
  }
});

/* Nachricht vom Offline-Modul: Kacheln einer Tour vorladen */
self.addEventListener('message',e=>{
  const d=e.data||{};
  if(d.type==='PRX_PRECACHE_TILES'&&Array.isArray(d.urls)){
    e.waitUntil((async()=>{
      const c=await caches.open(TILE_CACHE);
      let done=0;
      for(let i=0;i<d.urls.length;i+=6){
        const batch=d.urls.slice(i,i+6);
        await Promise.allSettled(batch.map(async u=>{
          const hit=await c.match(u);
          if(hit){done++;return;}
          const res=await fetch(u,{mode:'no-cors'});
          await c.put(u,res);
          done++;
        }));
        const clients=await self.clients.matchAll();
        clients.forEach(cl=>cl.postMessage({type:'PRX_PRECACHE_PROGRESS',done,total:d.urls.length}));
      }
      await trimTiles();
    })());
  }
});
