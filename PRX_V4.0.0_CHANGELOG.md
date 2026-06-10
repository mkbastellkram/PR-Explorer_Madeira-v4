# PRX V4.0.0 FINAL (Claude Komplettbau)

## Geaendert (3 Dateien)
- index.html: manifest-Link, boot-guard als erstes Skript, apple-motion.css,
  4 neue Module nach v381, alle ?v=4.0.0
- prx-v381-version-sync.js: VERSION 4.0.0
- manifest.webmanifest: description

## Neu (7 Dateien, alle Root)
- prx-v385-boot-guard.js (Startdiagnose, Fehler-Overlay, SW-bewusste Altlasten-Bereinigung)
- prx-v385-apple-motion.css (iOS-Bewegungsstandard)
- sw.js (Offline-Kern; SW_VERSION=400; wird vom Offline-Modul registriert)
- prx-v386-offline.js (SW-Registrierung, Offline-Indikator, Tour-Vorladung)
- prx-v387-gps.js (Live-Position, Routen-HUD, Folgen-Modus)
- prx-v388-dayplan.js (Tagesplan + Highlights, uebernimmt Reise-Tab)
- prx-v389-weather.js (Wetter am Trailhead)

## Unveraendert (byte-identisch zu V3.8.3)
app.js, data.js, poi-data.js, style.css, prx-v372 bis prx-v380,
alle Ordner (data/, assets/, docs/), nichts geloescht.

## iPhone-Einzeldatei-Upload (falls kein PC):
index.html, prx-v381-version-sync.js, manifest.webmanifest + die 7 neuen Dateien.
