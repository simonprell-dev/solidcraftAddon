# SolidCraft-Einführungskurs – Browser-Erweiterung (Design)

Stand: 2026-11-07

## Absicht

Eine Chrome-Erweiterung (auch Brave/Edge), die Kinder von 8–14 Jahren auf Deutsch Schritt für
Schritt durch das 3D-Konstruieren in **SolidCraft** (https://app.solidcraft.io/) führt – mit
derselben Erklärlogik wie die bestehende Scratch-Erweiterung
(https://github.com/simonprell-dev/scratchExtention): Kapitel → Schritte, eine animierte Hand
zeigt, wo geklickt wird, Aufgaben werden automatisch geprüft und abgehakt, Konfetti, am
Kapitelende eine Kreativ-Aufgabe. Einsatz in Schule, AG, Makerspace und Zuhause. Open Source,
kein Konto.

## Ziele

- Kursfenster im SolidCraft-Editor mit Kapiteln, Schritten, Checklisten, Stufenwahl
  (neuling / probiert / profi) und gespeichertem Fortschritt.
- Zeige-Hand auf echte Toolbar-Buttons, Tabs, Dialogfelder und Stellen im 3D-Modell.
- Automatische Prüfung über den Modellzustand; Selbst-Abhaken nur wo nichts messbar ist.
- Kursplan mit 6 Projekten steigender Schwierigkeit:
  1. Namensschild (Rechteck skizzieren, extrudieren, erhabener Text) – **erste Lieferung**
  2. Schlüsselanhänger (Ecken abrunden, Loch schneiden, Maße)
  3. Spielwürfel (Würfel, Kugeln abziehen, Fase)
  4. Stifteköcher / Handyhalter (Schale, Winkel, mehrere Körper)
  5. Box mit Deckel (zwei Teile, Toleranz, Passung)
  6. Rakete oder Kreisel (Rotation, Spiegeln/Muster, Kombinieren)

## Nicht-Ziele

- SolidCraft verändern oder Werkzeuge ausblenden. **Die Kinder sehen das volle SolidCraft**;
  die Hand navigiert sie hindurch (Entscheidung des Nutzers).
- Eigene Übersetzung der Oberfläche (SolidCraft hat eine deutsche Lokalisierung).
- Desktop-App von SolidCraft (nur Web-App).
- Kapitel 2–6 in der ersten Lieferung (folgen einzeln, über einen Kapitel-Skill).

## Anti-Ziele

- Kursfenster, das die Toolbar oder den Dialog verdeckt, den das Kind gerade braucht.
- Prüfungen, die exakte Maße oder genau einen Bauweg verlangen – Kinder bauen anders.
- Erweiterung, die selbst konstruiert (`execute`) statt das Kind machen zu lassen.

## Technische Grundlage (recherchiert)

SolidCraft (Rust, egui + wgpu, Apache-2.0, github.com/tangency-labs/solidcraft) zeichnet die ganze
Oberfläche in ein `<canvas>` – es gibt keine DOM-Buttons. Die Web-App stellt aber offiziell
`window.solidcraft` bereit (`docs/browser-api.md`, `docs/control-protocol.md`):

- `solidcraft.request(method, params)` – jede Control-Methode, Promise-basiert.
- `ui.handles {prefix?}` → `[{name, x, y}]` der zuletzt gezeichneten Handles:
  `toolbar:<command id>`, `button:<command id>`, `dropdown:<command id>`, `tab:<NAME>` …
- `ui.inspect` → aktives Werkzeug (Command-ID), offener Dialog, Kamera, Viewport-Rechteck, Status.
- `ui.selection` → Auswahl und Eingaben des offenen Dialogs.
- `document.inspect {measure: true}` → Parameter, Zeitleiste, Körper (mit Maßen), Skizzen.
- `ui.at {world|sketch|plane|axis}`, `ui.worldToScreen` → Bildschirmpunkte für 3D-Ziele.
- `document.export` / `document.import` → Projekt sichern / Startdatei laden.
- `document.revision` → billige Änderungserkennung.

Koordinaten sind egui-Punkte relativ zum Canvas (bei devicePixelRatio ≠ 1 auf CSS-Pixel
umrechnen; Canvas-Offset per `getBoundingClientRect` addieren).

## Architektur (Entscheidung Builder, an Scratch-Repo angelehnt)

```
manifest.json            MV3, host_permissions https://app.solidcraft.io/*
background.js            Icon-Klick → Kurs ein/aus, Fortschritt-Reset
lib/solidcraft-access.js MAIN world: Zugriff auf window.solidcraft, Snapshot pro Takt
course/context.js        Prüf-Kontext c (rein, testbar)
course/targets.js        Hinweis-Ziele → Bildschirmpunkt (rein, testbar)
course/course-data.js    Kapitel & Schritte (nur Daten + Prüf-Funktionen)
course/course.js         Engine: Fenster, Stufen, Polling (200 ms), Hand, Konfetti, Speichern
course/course.css        Stil (Kursfenster, Hand, Sprechblase, Konfetti)
tools/check-course.mjs   prüft course-data.js (IDs eindeutig, Pflichtfelder, bekannte Ziele)
.claude/skills/kurs-kapitel/  Skill zum Schreiben weiterer Kapitel
```

- Wie bei Scratch laufen alle Kursskripte in der MAIN world (über
  `chrome.scripting.registerContentScripts`), keine Brücke nötig; Fortschritt im
  `localStorage` der Seite (`solidcraft-kurs:v1`).
- Live verifiziert (Headless-Chrome, 2026-11-07): `ui.handles` liefert u. a. `tab:MODEL`,
  `toolbar:sketch.create`, `toolbar:solid.extrude`, im Skizzenmodus `tab:SKETCH`,
  `toolbar:sketch.rectangle.two_point`, `toolbar:sketch.finish`, im Dialog `dialog:Distance`,
  `dialog:Operation`, `dialog:OK`. `sketch.text` steht nicht direkt in der Toolbar → über
  `panel:SKETCH:CREATE`-Aufklapper bzw. `dropdown:sketch.text`. `ui.inspect.tool` ist die
  Command-ID des aktiven Werkzeugs, `ui.inspect.dialog.command` die des offenen Dialogs,
  `document.inspect.active_sketch` die ID der offenen Skizze, `bodies[].bbox {min,max}` mit
  `measure:true`, `timeline[].type` z. B. `Sketch`, `ExtrudeFeature`. `ui.at {plane:'XY'}` und
  `{world:[x,y,z]}` liefern `[x, y]`.
- Größenprüfung: Eigene Maße werden akzeptiert (Anti-Ziel „exakte Maße“); geprüft wird nur
  „Platte ist 2–5 mm dick“ und „Text steht mindestens 1 mm heraus“; empfohlen werden 80 × 30 mm.
- Engine-Takt (200 ms): `ui.inspect` + `ui.handles` immer; `document.inspect {measure:true}` nur
  wenn `document.revision` sich geändert hat (Kosten sparen).
- Prüf-Kontext `c` (analog Scratch-`makeContext`): `c.tool()`, `c.dialog()`, `c.inSketch()`,
  `c.bodies()`, `c.bodySize(i)` (sortierte Ausdehnung), `c.sketches()`, `c.features(kindPart)`,
  `c.hasText()`, `c.cameraMoved()`, `c.base` (Zustand bei Schrittbeginn), `c.approx(a,b,tol)`.
- Hinweis-Ziele: `tool:<cmd>` (Toolbar-Button; Fallback erst `tab:<TAB>` zeigen, wenn Button
  nicht im Handles-Ergebnis), `tab:<NAME>`, `handle:<exakter Name>`, `plane:XY`, `world:[x,y,z]`,
  `viewport`, `dialog` (Mitte des Dialogs, falls ermittelbar, sonst Sprechblase ohne Hand).
- Kursfenster: schwebend, verschiebbar, einklappbar, Position gespeichert; Standard rechts unten.
- Fortschritt in `chrome.storage.local`. Zwischen Kapiteln automatisch „Projekt sichern“
  (STL/Design speichern, manuell abgehakt).

## Kapitel 1: Namensschild (neuling, autoHints)

1. info – Was bauen wir?
2. Umschauen – Kamera bewegt (`c.cameraMoved()`).
3. Skizze starten auf XY – `c.inSketch()`.
4. Rechteck (abgerundet erlaubt) ca. 80 × 30 mm – Skizze enthält Profil/Rechteck.
5. Skizze beenden + Extrudieren 3 mm – Körper ≈ 80 × 30 × 3 (Toleranz großzügig).
6. Neue Skizze auf Oberseite + Text-Werkzeug (`sketch.text`), Namen tippen – Text-Feature vorhanden.
7. Text 2 mm extrudieren, verbinden – Körperhöhe ≈ 5 mm (Platte + Text, ein oder mehr Körper).
8. Anschauen & Farbe (`appearance.assign`) – manuell bzw. Erscheinung geändert.
9. Challenge ohne Hand – Schriftgröße, Rand oder Loch (manuell).
10. Finale – eigene Gestaltung, STL-Export (manuell).

Maße 80 × 30 × 3 mm / 2 mm Text sind Builder-Entscheidung (Druckzeit 20–30 min).

## Risiken / zuerst prüfen

- Handle-Namen und `document.inspect`-Format in der Web-App live verifizieren (Spike in der
  Konsole). Prüfungen deshalb defensiv schreiben (mehrere Feldnamen tolerieren).
- Extension-MAIN-World-Zugriff auf `window.solidcraft` (Erwartung: funktioniert, da gleiches
  Fenster-Objekt).
- Englische vs. deutsche Labels: Texte nennen Buttons mit deutschem Namen aus `assets/locales/de.json`.

## Dem Builder überlassen

Design des Kursfensters (an Scratch-Erweiterung angelehnt), Animationsdetails der Hand,
genaue Toleranzen, Icons.
