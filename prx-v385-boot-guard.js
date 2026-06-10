/* PRX V3.8.6 · Boot Guard v2 (ersetzt die Datei aus V3.8.5 — gleicher Dateiname!)
   ÄNDERUNG GEGENÜBER V3.8.5 — WICHTIG FÜR DIE OFFLINE-STUFE:
   - Deregistriert nur noch FREMDE/ALTE Service Worker (alles, dessen Skript-URL
     nicht auf unser eigenes ./sw.js zeigt). Der neue Offline-SW bleibt unangetastet.
   - Löscht nur noch Caches, die NICHT mit 'prx-' beginnen (Tile-/Static-Caches
     des Offline-Moduls bleiben erhalten).
   Alles andere (Startdiagnose ?prxdiag=1, Fehler-Overlay, Watchdog) unverändert. */
(function(){
  'use strict';
  var VERSION='4.0.0';
  var PRX_SW_CLEANUP=true;
  var FLAG='prx.bootGuard.v386.reloaded';
  var errors=[];

  function panel(html,color){
    var show=function(){
      var el=document.getElementById('prxBootPanel');
      if(!el){
        el=document.createElement('div');
        el.id='prxBootPanel';
        el.style.cssText='position:fixed;left:12px;right:12px;bottom:calc(96px + env(safe-area-inset-bottom));z-index:99999;color:#fff;font:600 13px/1.5 -apple-system,BlinkMacSystemFont,sans-serif;border-radius:16px;padding:12px 14px;box-shadow:0 14px 40px rgba(0,0,0,.4);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);max-height:55vh;overflow:auto';
        el.onclick=function(){el.remove();};
        document.body.appendChild(el);
      }
      el.style.background=color||'rgba(122,24,24,.94)';
      el.innerHTML=html+'<div style="opacity:.7;font-weight:500;margin-top:6px">Tippen zum Schließen</div>';
    };
    if(document.body) show(); else document.addEventListener('DOMContentLoaded',show);
  }
  function esc(s){return String(s).replace(/[&<>]/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[m]})}

  window.addEventListener('error',function(e){
    var m=((e&&e.message)||'Unbekannter Skriptfehler');
    var src=(e&&e.filename)?(' · '+String(e.filename).split('/').pop()+':'+(e.lineno||'?')):'';
    errors.push(m+src);
    panel('<b>PRX Skriptfehler</b><br>'+esc(m+src));
  });

  function diagnose(){
    var D=window.PRX_DATA||{}; var trails=(D.trails||[]).length;
    var pois=(window.PRX_POIS||D.pois||[]).length;
    var list=document.getElementById('journalList');
    var rows=[
      ['Version', window.PRX_APP_VERSION||VERSION],
      ['data.js geladen', D.trails?'✓':'✗ FEHLT'],
      ['PRs', String(trails)],
      ['POIs', String(pois)],
      ['Journal-Karten', list?String(list.children.length):'Container fehlt'],
      ['Leaflet (window.L)', window.L?'✓':'✗ nicht geladen'],
      ['Karte initialisiert', window.PRX_MAP?'✓':'– (erst bei Kartenaufruf)'],
      ['Offline-SW aktiv', (navigator.serviceWorker&&navigator.serviceWorker.controller)?'✓':'– (erster Besuch oder nicht registriert)'],
      ['Fehler bisher', errors.length?errors.slice(-3).join('<br>'):'keine']
    ];
    panel('<b>PRX Startdiagnose V'+VERSION+'</b><br>'+rows.map(function(r){return r[0]+': <b>'+r[1]+'</b>'}).join('<br>'),'rgba(8,46,38,.96)');
  }
  try{ if(/[?&]prxdiag=1/.test(location.search)) window.addEventListener('load',function(){setTimeout(diagnose,600)}); }catch(e){}
  window.PRX_DIAGNOSE=diagnose;

  window.addEventListener('load',function(){
    setTimeout(function(){
      try{
        var list=document.getElementById('journalList');
        if(!list || list.children.length===0){
          diagnose();
          panelAppend('Journal wurde nicht aufgebaut. In der Homescreen-App: App entfernen, Safari-Websitedaten dieser Seite löschen, neu laden, neu hinzufügen.');
        }
      }catch(e){}
    },4000);
  });
  function panelAppend(t){var el=document.getElementById('prxBootPanel'); if(el){var d=document.createElement('div'); d.style.cssText='margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.25)'; d.textContent=t; el.appendChild(d);}}

  /* Nur FREMDE Service Worker entfernen; eigener ./sw.js bleibt. */
  if(PRX_SW_CLEANUP){
    try{
      if('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations){
        navigator.serviceWorker.getRegistrations().then(function(regs){
          var foreign=regs.filter(function(r){
            var w=r.active||r.waiting||r.installing;
            var url=(w&&w.scriptURL)||'';
            return url.indexOf('/sw.js')===-1;   /* eigener SW wird verschont */
          });
          if(!foreign.length) return;
          Promise.all(foreign.map(function(r){return r.unregister().catch(function(){})})).then(function(){
            var clear=(window.caches&&caches.keys)
              ? caches.keys().then(function(ks){
                  return Promise.all(ks.filter(function(k){return k.indexOf('prx-')!==0})
                    .map(function(k){return caches.delete(k)}));
                }).catch(function(){})
              : Promise.resolve();
            clear.then(function(){
              try{
                if(!sessionStorage.getItem(FLAG)){ sessionStorage.setItem(FLAG,'1'); location.reload(); }
              }catch(e){}
            });
          });
        }).catch(function(){});
      }
    }catch(e){}
  }

  window.PRX_BOOT_GUARD=VERSION;
})();
