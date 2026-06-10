/* PRX V3.8.8 · Tagesplan mit Highlights
   Kennsts Kernwunsch: Tagesziele mit kleinen Highlights LEICHT ergänzen.
   - Reise-Tab zeigt Tagesliste (Zeitraum aus prx.trip.v370, kompatibel zu v376)
   - Pro Tag: eine PR zuweisen (Picker aus echten PRX-Daten) + beliebige kleine
     Highlights (Freitext ODER Übernahme aus den Heute/Später-POIs) + Notiz
   - Ein Tipp auf "Tagesroute" öffnet Google Maps mit PR-Start + Highlight-Koordinaten
   Speicher: prx.dayplan.v388 = { "2026-06-22": {pr:"PR9", hl:[{t:"...",lat,lng}], note:""} }
   INTEGRATION: lädt als LETZTES Modul -> übernimmt den Reise-Tab-Klick nach dem
   etablierten Override-Muster (app.js -> v375 -> v376 -> v388 gewinnt).
   Nutzt ausschließlich vorhandene CSS-Klassen (settings-sheet, menu-row, day-card,
   settings-row, seg) -> fügt sich ohne neue Designsprache ein. */
(()=>{ 'use strict';
  const $=id=>document.getElementById(id);
  const STORE='prx.dayplan.v388', TRIP_KEY='prx.trip.v370', POI_STATE='prx.poiState.v360';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  function toast(s){const t=$('toast');if(!t)return;t.textContent=s;t.classList.remove('hidden');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.add('hidden'),1600)}
  function load(k,d){try{return Object.assign({},d,JSON.parse(localStorage.getItem(k)||'{}'))}catch(e){return Object.assign({},d)}}
  function save(k,o){try{localStorage.setItem(k,JSON.stringify(o))}catch(e){}}
  const plan=()=>load(STORE,{});
  const trip=()=>load(TRIP_KEY,{start:'2026-06-22',end:'2026-07-05'});
  function days(){const t=trip(),a=new Date(t.start+'T00:00:00'),b=new Date(t.end+'T00:00:00');if(!Number.isFinite(+a)||!Number.isFinite(+b)||b<a)return[];const o=[];for(let d=new Date(a);d<=b;d.setDate(d.getDate()+1))o.push(new Date(d));return o}
  const iso=d=>d.toISOString().slice(0,10);
  const trails=()=> (window.PRX_DATA&&window.PRX_DATA.trails)||[];
  const pois=()=> window.PRX_POIS||(window.PRX_DATA&&window.PRX_DATA.pois)||[];
  function trailById(id){return trails().find(t=>t.id===id)||null}
  function savedPois(){ /* Heute/Später-POIs als Highlight-Vorschläge */
    const st=load(POI_STATE,{});
    return pois().filter(p=>st[p.id]==='heute'||st[p.id]==='spaeter');
  }

  /* ---------- Sheet-Gerüst (im Stil von v376) ---------- */
  function sheet(){
    let el=$('tripSheet');
    if(!el){el=document.createElement('section');el.id='tripSheet';document.body.appendChild(el)}
    el.className='settings-sheet prx388-sheet';
    return el;
  }
  function openModal(el){
    document.querySelectorAll('#optionSheet,#settingsSheet,#filterSheet').forEach(x=>x.classList.add('hidden'));
    el.classList.remove('hidden');el.classList.add('prx-active-modal');
    document.body.classList.add('prx-modal-isolated','prx-modal-lock');
    document.documentElement.classList.add('prx-modal-lock');
  }
  function closeModal(el){
    el.classList.add('hidden');el.classList.remove('prx-active-modal');
    document.body.classList.remove('prx-modal-isolated','prx-modal-lock');
    document.documentElement.classList.remove('prx-modal-lock');
  }

  /* ---------- Hauptliste ---------- */
  function openTrip388(){
    const el=sheet(), p=plan(), t=trip(), ds=days();
    const rows=ds.map((d,i)=>{
      const e=p[iso(d)]||{};
      const pr=e.pr?trailById(e.pr):null;
      const sub=[pr?(pr.id+' · '+pr.name):'keine PR', (e.hl&&e.hl.length?e.hl.length+' Highlights':'')].filter(Boolean).join(' · ');
      return `<button class="menu-row" data-day="${iso(d)}"><strong>Tag ${i+1} · ${d.toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'})}</strong><small>${esc(sub)}</small><span>›</span></button>`;
    }).join('');
    el.innerHTML=`<div class="settings-head"><strong>Reise · Tagesplan</strong><button id="prx388Close">×</button></div>
      <div class="settings-row"><strong>Reisezeitraum</strong><div class="date-row">
        <label>Start <input type="date" id="prx388Start" value="${esc(t.start)}" style="font-size:16px"></label>
        <label>Ende <input type="date" id="prx388End" value="${esc(t.end)}" style="font-size:16px"></label>
      </div><small>${ds.length} Reisetage</small></div>
      <div class="menu-list" style="max-height:46dvh;overflow:auto;-webkit-overflow-scrolling:touch">${rows}</div>`;
    openModal(el);
    $('prx388Close').onclick=()=>closeModal(el);
    $('prx388Start').onchange=e=>{const v=trip();v.start=e.target.value;save(TRIP_KEY,v);openTrip388()};
    $('prx388End').onchange=e=>{const v=trip();v.end=e.target.value;save(TRIP_KEY,v);openTrip388()};
    el.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>openDay(b.dataset.day));
  }

  /* ---------- Tagesdetail ---------- */
  function openDay(dateIso){
    const el=sheet(), p=plan(); const e=p[dateIso]||{hl:[]}; e.hl=e.hl||[];
    const d=new Date(dateIso+'T00:00:00');
    const prOpts=['<option value="">– keine PR –</option>']
      .concat(trails().map(t=>`<option value="${esc(t.id)}" ${e.pr===t.id?'selected':''}>${esc(t.id)} · ${esc(t.name)}</option>`)).join('');
    const hlRows=e.hl.map((h,i)=>`<div class="settings-row" style="display:flex;align-items:center;gap:10px;justify-content:space-between"><span>✦ ${esc(h.t)}</span><button data-hl-del="${i}" style="min-width:44px;min-height:44px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08)">–</button></div>`).join('')
      ||'<div class="settings-note">Noch keine Highlights für diesen Tag.</div>';
    const sp=savedPois();
    const poiOpts=['<option value="">aus Heute/Später übernehmen …</option>']
      .concat(sp.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`)).join('');
    el.innerHTML=`<div class="settings-head"><strong>${d.toLocaleDateString('de-DE',{weekday:'long',day:'2-digit',month:'2-digit'})}</strong><button id="prx388Close">×</button></div>
      <button class="back-row" id="prx388Back">‹ Tagesplan</button>
      <div class="settings-stack" style="max-height:52dvh;overflow:auto;-webkit-overflow-scrolling:touch">
        <div class="settings-row"><strong>Tagesziel (PR)</strong>
          <select id="prx388Pr" style="width:100%;margin-top:8px;font-size:16px;padding:11px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:inherit">${prOpts}</select></div>
        <div class="settings-row"><strong>Kleine Highlights</strong>${hlRows}
          <div style="display:flex;gap:8px;margin-top:10px">
            <input id="prx388HlInput" placeholder="z. B. Kaffee in Santana" style="flex:1;font-size:16px;padding:11px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:inherit">
            <button id="prx388HlAdd" style="min-width:54px;min-height:44px;border-radius:14px;border:0;background:var(--accent);color:#041713;font-weight:900">+</button>
          </div>
          <select id="prx388HlPoi" style="width:100%;margin-top:8px;font-size:16px;padding:11px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:inherit">${poiOpts}</select></div>
        <div class="settings-row"><strong>Notiz</strong>
          <input id="prx388Note" value="${esc(e.note||'')}" placeholder="z. B. früh starten, Bus 56" style="width:100%;margin-top:8px;font-size:16px;padding:11px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:inherit"></div>
        <div class="settings-row"><button id="prx388Route" style="width:100%;min-height:48px;border:0;border-radius:16px;background:var(--accent);color:#041713;font-weight:900">Tagesroute in Google Maps öffnen</button>
        <small>Reihenfolge: Hotel → PR-Start → Highlights mit Koordinaten.</small></div>
      </div>`;
    function persist(){const all=plan();all[dateIso]=e;save(STORE,all)}
    $('prx388Close').onclick=()=>closeModal(el);
    $('prx388Back').onclick=()=>openTrip388();
    $('prx388Pr').onchange=ev=>{e.pr=ev.target.value||undefined;persist();toast(e.pr?'Tagesziel '+e.pr+' gesetzt':'Tagesziel entfernt')};
    $('prx388Note').onchange=ev=>{e.note=ev.target.value;persist()};
    $('prx388HlAdd').onclick=()=>{
      const v=($('prx388HlInput').value||'').trim();
      if(!v){toast('Bitte Highlight-Text eingeben');return}
      e.hl.push({t:v});persist();openDay(dateIso);
    };
    $('prx388HlPoi').onchange=ev=>{
      const poi=pois().find(x=>x.id===ev.target.value); if(!poi)return;
      e.hl.push({t:poi.name,lat:+poi.lat,lng:+poi.lng});persist();openDay(dateIso);
    };
    el.querySelectorAll('[data-hl-del]').forEach(b=>b.onclick=()=>{e.hl.splice(+b.dataset.hlDel,1);persist();openDay(dateIso)});
    $('prx388Route').onclick=()=>{
      const D=window.PRX_DATA||{};const home=D.home;
      const pr=e.pr?trailById(e.pr):null;
      const stops=[];
      if(pr&&Number.isFinite(+pr.lat))stops.push(pr.lat+','+pr.lon);
      e.hl.forEach(h=>{if(Number.isFinite(+h.lat))stops.push(h.lat+','+h.lng)});
      if(!stops.length){toast('Keine Ziele mit Koordinaten an diesem Tag');return}
      const origin=home&&home.lat?(home.lat+','+home.lon):'';
      let url='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(stops[stops.length-1]);
      if(origin)url+='&origin='+encodeURIComponent(origin);
      if(stops.length>1)url+='&waypoints='+encodeURIComponent(stops.slice(0,-1).join('|'));
      open(url,'_blank');
    };
  }

  /* ---------- Reise-Tab übernehmen (etabliertes Override-Muster) ---------- */
  function attach(){
    document.querySelectorAll('.nav').forEach(n=>{
      if(n.dataset.nav==='trip')n.onclick=ev=>{ev.preventDefault();openTrip388()};
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach); else attach();
  /* nach den Re-Attach-Timern von v375 (500ms) und v376 (650/1300ms) erneut greifen */
  setTimeout(attach,800); setTimeout(attach,1500); setTimeout(attach,2200);

  window.PRX_DAYPLAN={openTrip388,version:'3.8.8'};
})();
