# V4.0.0 FINAL-TESTPROTOKOLL (einmalig, ca. 30-40 Minuten)

Vorbereitung: Upload abgeschlossen, dann Homescreen-App loeschen, Safari-
Websitedaten der Seite loeschen, Seite frisch laden, neu zum Homescreen.

## Block A - Start & Diagnose (5 min)
A1 App oeffnen -> Journal mit 38 PR-Karten sichtbar. [ ]
A2 URL mit ?prxdiag=1 oeffnen -> "PRs: 38", "Journal-Karten: 38". [ ]
A3 App schliessen, ERNEUT oeffnen, ?prxdiag=1 -> "Offline-SW aktiv: OK". [ ]
   (Erster Besuch installiert nur; ab dem zweiten ist er aktiv.)

## Block B - Offline (10 min)
B1 PR9 oeffnen -> Button "Offline" in Karte&Route -> Fortschritts-Toasts,
   am Ende "Tour offline gespeichert". [ ]
B2 Flugmodus AN -> App komplett schliessen -> oeffnen: App startet,
   Journal da, Toast "Offline-Modus". [ ]
B3 PR9 oeffnen, Karte: Kacheln im Trackkorridor sichtbar; weit wegzoomen:
   graue Kacheln sind KORREKT. [ ]
B4 Flugmodus AUS -> Toast "Wieder online". [ ]

## Block C - GPS (5-10 min, am besten draussen)
C1 GPS-Button (Fadenkreuz oben rechts) -> iOS fragt Berechtigung -> erlauben
   -> blauer Punkt + HUD-Chip oben. [ ]
C2 Karte mit Finger verschieben -> Folgen pausiert (Punkt bleibt). [ ]
C3 GPS-Button erneut -> Punkt und HUD verschwinden. [ ]
C4 Negativtest: Berechtigung in iOS entziehen, Button -> verstaendlicher
   Toast, kein Absturz. [ ]

## Block D - Tagesplan (10 min)
D1 Reise-Tab -> Tagesliste 22.06.-05.07. erscheint (neuer Tagesplan). [ ]
D2 Tag 1 antippen -> PR aus Dropdown waehlen -> zurueck -> Tagesliste
   zeigt "PR... " unter Tag 1. [ ]
D3 Highlight tippen ("Kaffee in Santana") + Plus -> erscheint in Liste;
   eines per Minus loeschen. [ ]
D4 Vorher in einer PR einen POI auf "Heute" setzen -> im Tag per zweitem
   Dropdown uebernehmen. [ ]
D5 App neu laden -> Plan vollstaendig erhalten. [ ]
D6 "Tagesroute in Google Maps" -> Route Hotel -> PR-Start -> Highlight. [ ]
D7 Optionen + Einstellungen oeffnen -> funktionieren unveraendert. [ ]

## Block E - Wetter & Bedienung (5 min)
E1 PR oeffnen -> Kachel "Wetter am Start" fuellt sich (Temp, Zustand, Regen%). [ ]
E2 Zweite PR in anderer Inselregion -> andere Werte. [ ]
E3 Flugmodus -> Wetterkachel zeigt letzten Stand mit Uhrzeit. [ ]
E4 Gefuehlstest: Detail oeffnen/schliessen, Sheets, Tab-Wechsel -> weiche
   iOS-Kurven, Buttons reagieren mit Druck-Feedback. [ ]

## Befunde
Bei JEDEM fehlgeschlagenen Punkt: Blocknummer + beobachtetes Verhalten +
ggf. Text aus dem roten Fehler-Overlay notieren und an Claude geben.
Schnell-Abschaltung eines Moduls: zugehoerige Script-Zeile in index.html
auskommentieren -> Rest laeuft weiter.
