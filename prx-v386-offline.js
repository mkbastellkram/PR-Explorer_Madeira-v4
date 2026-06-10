/* PRX V3.8.6 · Offline-Modul
   - registriert ./sw.js (nur dieses Modul registriert je einen SW)
   - Online-/Offline-Indikator als Toast + Statuspunkt
   - "Tour offline laden": lädt die Kartenkacheln (Zoom 12–15) entlang des
     GPX-Tracks der GEÖFFNETEN PR in den Tile-Cache (max. 900 Kacheln/Tour)
   Lädt NACH prx-v381. Greift in keine bestehende Funktion ein; der Button wird
   defensiv in die vorhandene .route-actions der Detailkarte eingehängt. */
(()=>{ 'use strict';
  const MAXTILES=900, ZOOMS=[12,13,14,15];
  const $=id=>document.getElementById(id);
  function toast(s){const t=$('toast');if(!t)return;t.textContent=s;t.classList.remove('hidden');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.add('hidden'),1800)}

  /* ---------- SW-Registrierung ---------- */
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('./sw.js').then(reg=>{
        try{reg.update()}catch(e){}
      }).catch(e=>console.warn('[PRX Offline] SW-Registrierung fehlgeschlagen',e));
      navigator.serviceWorker.addEventListener('message',ev=>{
        const d=ev.data||{};
        if(d.type==='PRX_PRECACHE_PROGRESS'&&d.total){
          if(d.done>=d.total)toast('Tour offline gespeichert ('+d.total+' Kacheln)');
          else if(d.done%120===0)toast('Offline-Paket: '+d.done+'/'+d.total);
        }
      });
    });
  }

  /* ---------- Online-/Offline-Indikator ---------- */
  function netState(){
    document.documentElement.dataset.prxNet=navigator.onLine?'on':'off';
    if(!navigator.onLine)toast('Offline-Modus: gespeicherte Karten und Daten aktiv');
  }
  window.addEventListener('online',()=>{netState();toast('Wieder online')});
  window.addEventListener('offline',netState);
  netState();

  /* ---------- aktive PR ermitteln (defensiv, ohne app.js-Interna) ---------- */
  function activeTrail(){
    const D=window.PRX_DATA||{};const t=$('detailTitle');
    if(!t||!t.textContent)return null;
    const m=t.textContent.match(/^PR([\d.]+)\s/);
    if(!m)return null;
    return (D.trails||[]).find(x=>String(x.number)===m[1])||null;
  }

  /* ---------- Kachel-Liste aus GPX-Track ---------- */
  function lonLatToTile(lon,lat,z){
    const n=Math.pow(2,z);
    const x=Math.floor((lon+180)/360*n);
    const latR=lat*Math.PI/180;
    const y=Math.floor((1-Math.log(Math.tan(latR)+1/Math.cos(latR))/Math.PI)/2*n);
    return [x,y];
  }
  function tileUrls(points){
    const set=new Set();
    const step=Math.max(1,Math.floor(points.length/400)); /* Track ausdünnen */
    for(const z of ZOOMS){
      for(let i=0;i<points.length;i+=step){
        const p=points[i];const lat=+p[0],lon=+p[1];
        if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
        const [x,y]=lonLatToTile(lon,lat,z);
        /* 3x3-Umfeld je Punkt für Kartenrand */
        for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)
          set.add('https://tile.openstreetmap.org/'+z+'/'+(x+dx)+'/'+(y+dy)+'.png');
        if(set.size>MAXTILES*1.2)break;
      }
    }
    return [...set].slice(0,MAXTILES);
  }

  function precacheActive(){
    const t=activeTrail();
    if(!t){toast('Keine PR-Detailkarte geöffnet');return}
    const D=window.PRX_DATA||{};
    const pts=(D.tracks&&D.tracks[t.id]&&D.tracks[t.id].points)||[];
    if(!pts.length){toast('Kein GPX-Track für '+t.id+' vorhanden');return}
    if(!navigator.serviceWorker||!navigator.serviceWorker.controller){
      toast('Offline-Dienst startet noch – Seite einmal neu laden und erneut versuchen');return;
    }
    const urls=tileUrls(pts);
    toast('Lade '+urls.length+' Kacheln für '+t.id+' …');
    navigator.serviceWorker.controller.postMessage({type:'PRX_PRECACHE_TILES',urls});
  }

  /* ---------- Button in bestehende Detail-Aktionen einhängen ---------- */
  function mountButton(){
    const fit=$('fitBtn');
    if(!fit||$('prxOfflineBtn'))return;
    const b=document.createElement('button');
    b.id='prxOfflineBtn';
    b.textContent='⇣ Offline';
    b.style.minHeight='44px';
    b.onclick=precacheActive;
    fit.parentElement&&fit.parentElement.appendChild(b);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountButton);
  else mountButton();
  setTimeout(mountButton,1200);

  window.PRX_OFFLINE={precacheActive,version:'3.8.6'};
})();
