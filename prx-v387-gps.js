/* PRX V3.8.7 · GPS Live-Position
   - Locate-Button in den Top-Controls (rechts), Toggle an/aus
   - blauer Positionspunkt + Genauigkeitskreis auf der Leaflet-Karte
   - Folgen-Modus (Karte zentriert mit)
   - HUD-Chip: Abstand zur Route / Restdistanz auf der Route der aktiven PR
   Lädt NACH prx-v386. Nutzt window.PRX_MAP (von prx-v380 gesetzt, sobald die
   Karte existiert). Kein Eingriff in app.js. */
(()=>{ 'use strict';
  const $=id=>document.getElementById(id);
  let watchId=null, posMarker=null, accCircle=null, follow=true, lastPos=null;
  function toast(s){const t=$('toast');if(!t)return;t.textContent=s;t.classList.remove('hidden');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.add('hidden'),1700)}
  function map(){return window.PRX_MAP||null}

  /* ---------- Geometrie ---------- */
  function hav(a,b){const R=6371000,l1=a[0]*Math.PI/180,l2=b[0]*Math.PI/180,dl=l2-l1,dn=(b[1]-a[1])*Math.PI/180;const x=Math.sin(dl/2)**2+Math.cos(l1)*Math.cos(l2)*Math.sin(dn/2)**2;return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
  function activeTrackPoints(){
    const D=window.PRX_DATA||{};const t=$('detailTitle');
    if(!t||!t.textContent)return null;
    const m=t.textContent.match(/^PR([\d.]+)\s/); if(!m)return null;
    const trail=(D.trails||[]).find(x=>String(x.number)===m[1]); if(!trail)return null;
    const pts=(D.tracks&&D.tracks[trail.id]&&D.tracks[trail.id].points)||null;
    return pts&&pts.length>1?pts:null;
  }
  function trackInfo(p){
    const pts=activeTrackPoints(); if(!pts)return null;
    let bi=0,bd=Infinity;
    const step=Math.max(1,Math.floor(pts.length/600));
    for(let i=0;i<pts.length;i+=step){
      const d=hav(p,[+pts[i][0],+pts[i][1]]);
      if(d<bd){bd=d;bi=i}
    }
    let rest=0;
    for(let i=bi;i<pts.length-step;i+=step){
      rest+=hav([+pts[i][0],+pts[i][1]],[+pts[i+step][0],+pts[i+step][1]]);
    }
    return {distToTrack:bd,restM:rest};
  }
  function fmtKm(m){return m>=1000?(m/1000).toFixed(1).replace('.',',')+' km':Math.round(m)+' m'}

  /* ---------- HUD ---------- */
  function hud(text){
    let el=$('prxGpsHud');
    if(!text){ if(el)el.remove(); return; }
    if(!el){
      el=document.createElement('div'); el.id='prxGpsHud';
      el.style.cssText='position:fixed;z-index:95;left:50%;transform:translateX(-50%);top:calc(64px + env(safe-area-inset-top));background:rgba(2,18,15,.82);border:1px solid rgba(66,211,156,.4);color:#dfffee;border-radius:999px;padding:8px 14px;font:700 13px -apple-system,sans-serif;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)';
      document.body.appendChild(el);
    }
    el.textContent=text;
  }

  /* ---------- Marker ---------- */
  function draw(p,acc){
    const m=map(); if(!m||!window.L)return;
    if(!posMarker){
      const icon=L.divIcon({className:'',html:'<div style="width:18px;height:18px;border-radius:50%;background:#0a84ff;border:3px solid #fff;box-shadow:0 0 0 6px rgba(10,132,255,.25),0 4px 12px rgba(0,0,0,.4)"></div>',iconSize:[18,18],iconAnchor:[9,9]});
      posMarker=L.marker(p,{icon,interactive:false,zIndexOffset:1000}).addTo(m);
      accCircle=L.circle(p,{radius:acc||30,color:'#0a84ff',weight:1,opacity:.5,fillColor:'#0a84ff',fillOpacity:.08,interactive:false}).addTo(m);
    }else{
      posMarker.setLatLng(p); accCircle.setLatLng(p); if(acc)accCircle.setRadius(acc);
    }
    if(follow)m.panTo(p,{animate:true});
  }
  function clearMarker(){
    const m=map();
    try{ if(posMarker&&m)m.removeLayer(posMarker); if(accCircle&&m)m.removeLayer(accCircle); }catch(e){}
    posMarker=null; accCircle=null;
  }

  /* ---------- Start/Stop ---------- */
  function onPos(pos){
    const p=[pos.coords.latitude,pos.coords.longitude];
    lastPos=p; draw(p,pos.coords.accuracy);
    const info=trackInfo(p);
    if(info){
      if(info.distToTrack<=60)hud('Auf der Route · noch ca. '+fmtKm(info.restM));
      else hud(fmtKm(info.distToTrack)+' zur Route');
    }else hud('GPS aktiv · '+Math.round(pos.coords.accuracy)+' m Genauigkeit');
  }
  function start(){
    if(!('geolocation' in navigator)){toast('Kein GPS verfügbar');return}
    const m=map();
    if(!m){ $('mapBtn')&&$('mapBtn').click(); setTimeout(start,500); return; }
    watchId=navigator.geolocation.watchPosition(onPos,err=>{
      toast(err.code===1?'GPS-Zugriff verweigert – in iOS-Einstellungen erlauben':'GPS-Fehler: '+err.message);
      stop();
    },{enableHighAccuracy:true,maximumAge:4000,timeout:15000});
    btnState(true); toast('GPS aktiv · Antippen des Punkts beendet Folgen');
  }
  function stop(){
    if(watchId!==null){try{navigator.geolocation.clearWatch(watchId)}catch(e){} watchId=null;}
    clearMarker(); hud(null); btnState(false);
  }
  function toggle(){ watchId===null?start():stop(); }

  /* ---------- Button in Top-Controls ---------- */
  function btnState(on){const b=$('prxGpsBtn'); if(b){b.style.background=on?'rgba(10,132,255,.78)':'';b.style.color=on?'#fff':''}}
  function mount(){
    if($('prxGpsBtn'))return;
    const right=document.querySelector('.top-right'); if(!right)return;
    const b=document.createElement('button');
    b.id='prxGpsBtn'; b.className='ctl'; b.setAttribute('aria-label','GPS-Position');
    b.innerHTML='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/></svg>';
    b.onclick=toggle;
    right.insertBefore(b,right.firstChild);
    /* Folgen-Modus per Kartenberührung pausieren, per erneutem GPS-Tipp reaktivieren */
    document.addEventListener('touchstart',e=>{ if(watchId!==null&&e.target.closest&&e.target.closest('#map'))follow=false; },{passive:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount); else mount();
  setTimeout(mount,1200);

  window.PRX_GPS={start,stop,toggle,version:'3.8.7'};
})();
