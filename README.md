# PR-Explorer Madeira V4.0.0 · FINAL

Komplette Wander-Begleit-PWA fuer die Madeira-Reise (22.06.-05.07.2026).

## Funktionsumfang
- Journal mit 38 PR-Routen, Filter (Region/Status/Bereiche), Favoriten
- Karte (OSM/Topo/Satellit/Hybrid), GPX-Tracks, KML-Anfahrten, Hoehenprofile
- Kuratierte POIs + OSM-Live-POI-Layer (getrennt)
- Status-/Buchungslogik mit Quellenlinks (visitmadeira, SIMplifica)
- NEU Offline-Kern: App-Shell + Leaflet + Kacheln offline; "Offline"-Button laedt
  Kartenkacheln (Zoom 12-15) entlang des Tracks der geoeffneten PR vor
- NEU GPS-Live-Position mit Routen-HUD ("Auf der Route - noch 3,2 km")
- NEU Tagesplan: pro Reisetag eine PR + kleine Highlights (Freitext oder aus
  Heute/Spaeter-POIs) + Google-Tagesroute (Hotel -> PR-Start -> Highlights)
- NEU Wetter am Trailhead (Open-Meteo, 3h-Cache, offline letzter Stand)
- Boot-Guard: Startdiagnose (?prxdiag=1), sichtbare Fehler, Zombie-SW-Bereinigung
- Apple-Motion-Layer: iOS-Standardkurven, Tab-Bar 49pt, Press-Feedback

## Architektur
app.js + Patchkette v372-v381 UNVERAENDERT. Alle neuen Funktionen sind additive
Module nach v381 (boot-guard ausgenommen: laedt als erstes Skript). sw.js wird
vom Offline-Modul registriert, nicht in index.html eingebunden.
Bei jedem kuenftigen Build: SW_VERSION in sw.js miterhoehen.

## Upload
Kompletter Stand (data.js 769 KB -> GitHub Desktop/PC empfohlen).
Alternativ iPhone: nur die 10 geaenderten/neuen Dateien (siehe Changelog).
Nach dem Upload EINMALIG: Homescreen-App loeschen, Safari-Websitedaten der
Seite loeschen, neu laden, neu hinzufuegen. Test: FINAL_TESTPROTOKOLL.md.
