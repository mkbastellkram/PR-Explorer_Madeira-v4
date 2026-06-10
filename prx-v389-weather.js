/* PRX V3.8.9 · Wetter pro Trailhead (Mikroklima-Entscheider)
   - Beim Öffnen einer PR-Detailkarte: Open-Meteo-Abfrage für die STARTPUNKT-
     Koordinate (nicht Funchal!) -> heutiges Tagesmaximum/-minimum, Regen-
     wahrscheinlichkeit, Wind. Madeiras Mikroklimata machen genau das relevant.
   - Cache: 3 h pro Koordinate (localStorage), offline wird der letzte Stand
     mit Zeitstempel gezeigt. NIEMALS blockierend, reine Nachdekoration.
   Lädt NACH prx-v388. Kein Eingriff in app.js; hängt eine zusätzliche .fact-
   Kachel in die bestehende Faktenleiste der Detailkarte. */
(()=>{ 'use strict';
  const $=id=>document.getElementById(id);
  const STORE='prx.wx.v389', TTL=3*60*60*1000;
  const WMO={0:'Klar',1:'Heiter',2:'Wolkig',3:'Bedeckt',45:'Nebel',48:'Nebel',51:'Niesel',61:'Regen',63:'Regen',65:'Starkregen',80:'Schauer',81:'Schauer',82:'Schauer',95:'Gewitter'};
  function load(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch(e){return{}}}
  function save(o){try{localStorage.setItem(STORE,JSON.stringify(o))}catch(e){}}
  function key(lat,lon){return (+lat).toFixed(3)+','+(+lon).toFixed(3)}

  function activeTrail(){
    const D=window.PRX_DATA||{};const t=$('detailTitle');
    if(!t||!t.textContent)return null;
    const m=t.textContent.match(/^PR([\d.]+)\s/); if(!m)return null;
    return (D.trails||[]).find(x=>String(x.number)===m[1])||null;
  }

  async function fetchWx(lat,lon){
    const k=key(lat,lon), c=load();
    if(c[k]&&Date.now()-c[k].t<TTL)return c[k];
    const url='https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon
      +'&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,wind_speed_10m_max'
      +'&timezone=auto&forecast_days=2';
    const ctrl=new AbortController(); const tm=setTimeout(()=>ctrl.abort(),9000);
    try{
      const r=await fetch(url,{signal:ctrl.signal}); clearTimeout(tm);
      if(!r.ok)throw new Error('HTTP '+r.status);
      const j=await r.json(); const d=j.daily||{};
      const e={t:Date.now(),tmax:d.temperature_2m_max&&d.temperature_2m_max[0],tmin:d.temperature_2m_min&&d.temperature_2m_min[0],rain:d.precipitation_probability_max&&d.precipitation_probability_max[0],code:d.weather_code&&d.weather_code[0],wind:d.wind_speed_10m_max&&d.wind_speed_10m_max[0]};
      c[k]=e; save(c); return e;
    }catch(err){ clearTimeout(tm); return c[k]||null; /* offline: letzter Stand */ }
  }

  function fmt(e){
    if(!e)return null;
    const parts=[];
    if(Number.isFinite(+e.tmin)&&Number.isFinite(+e.tmax))parts.push(Math.round(e.tmin)+'–'+Math.round(e.tmax)+'°');
    if(WMO[e.code])parts.push(WMO[e.code]);
    if(Number.isFinite(+e.rain))parts.push(e.rain+'% Regen');
    const age=Date.now()-e.t;
    const stale=age>TTL?' · Stand '+new Date(e.t).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}):'';
    return parts.join(' · ')+stale;
  }

  let lastKey='';
  async function decorate(){
    const tr=activeTrail();
    const facts=$('detailFacts');
    if(!tr||!facts||!Number.isFinite(+tr.lat))return;
    const k=tr.id;
    if(k===lastKey&&facts.querySelector('.prx389-wx'))return;
    lastKey=k;
    let cell=facts.querySelector('.prx389-wx');
    if(!cell){
      cell=document.createElement('div');
      cell.className='fact prx389-wx';
      cell.innerHTML='<span>Wetter am Start</span><strong>…</strong>';
      facts.appendChild(cell);
    }else cell.querySelector('strong').textContent='…';
    const e=await fetchWx(+tr.lat,+tr.lon);
    const txt=fmt(e);
    const s=cell.querySelector('strong');
    if(s)s.textContent=txt||'offline · keine Daten';
  }

  /* Auslöser ohne Observer-Schleifen: Klicks + sanfter Heartbeat */
  document.addEventListener('click',()=>setTimeout(decorate,400),true);
  setInterval(()=>{ const c=$('detailCard'); if(c&&!c.classList.contains('hidden'))decorate(); },5000);

  window.PRX_WEATHER={decorate,version:'3.8.9'};
})();
