---
name: kurs-kapitel
description: Schreibt neue Kapitel und Schritte für den SolidCraft-Einführungskurs dieser Browser-Erweiterung (course/course-data.js) – mit kindgerechten Texten, automatischen Prüfungen über window.solidcraft und Zeige-Hinweisen auf Buttons, Dialogfelder und Modellflächen. Verwende diesen Skill, wenn ein neues Kurs-Kapitel (z. B. Schlüsselanhänger, Spielwürfel, Stifteköcher, Box mit Deckel, Rakete), ein neuer Schritt oder eine Challenge umgesetzt, ein Kapitel umgebaut oder Prüfungen bzw. Hinweise geändert werden sollen.
---

# Kapitel für den SolidCraft-Einführungskurs schreiben

Der Kurs läuft als Browser-Erweiterung in der SolidCraft-Web-App. Inhalte stehen in
`course/course-data.js`; die Engine (`course/course.js`) prüft alle 200 ms einen Snapshot der
App. **Für ein neues Kapitel wird nur `course-data.js` geändert.** Fehlt eine Prüf-Hilfe in
`course/context.js` oder eine Zielart in `course/targets.js`, wird sie dort mit Test in
`tests/` ergänzt – und das ausdrücklich gesagt.

## Ablauf

1. **Verstehen:** Projekt, Stufe (`neuling` | `probiert` | `profi`), neue Werkzeuge. Geplante
   Reihenfolge: Namensschild → Schlüsselanhänger → Spielwürfel → Stifteköcher → Box mit Deckel → Rakete.
2. **Erkunden:** Für jedes neue Werkzeug live nachsehen, statt zu raten:
   - Command-ID und Parameter: `await solidcraft.commands()` (in der Konsole von app.solidcraft.io)
   - Handle-Namen: `await solidcraft.request('ui.handles')` – im Modell- und im Skizzenmodus,
     mit offenem Dialog (z. B. `dialog:Distance`, `dialog:Operation`, `dialog:OK`)
   - Was `ui.inspect().tool` / `.dialog` beim Klick zeigt und was `document.inspect({measure:true})`
     danach liefert (`bodies[].bbox`, `timeline[].type`, `sketches[].curves/profiles`)
   - Deutsche Beschriftung: Screenshot der Oberfläche oder `assets/locales/de.json` im SolidCraft-Repo
   Ein Headless-Skript wie `tests/e2e.mjs` eignet sich dafür.
3. **Planen:** Schrittfolge skizzieren (siehe unten) und dem Nutzer zeigen, bevor viel Code entsteht.
4. **Schreiben:** Kapitel-Objekt in `chapters` einfügen, Details in [references/api.md](references/api.md).
   Neue Command-IDs in `tools/known-commands.json` eintragen.
5. **Prüfen:** `npm test`, `npm run check`. Dann den E2E-Test um das Kapitel erweitern und
   `npm run e2e` ausführen – bis alles grün ist.
6. **Übersetzen:** Neue Schritte in jeder Sprache unter `i18n/<code>.js` ergänzen: Titel und Text
   in `course.chapters.<id>.steps`, neue kurze Aufgaben-/Hinweistexte und Suchbegriffe in `phrases`
   (Schlüssel = deutscher Text). Button-Namen wie in der jeweiligen SolidCraft-Oberfläche.
   `npm run check` listet alles, was fehlt.
7. **Abschließen:** `CHANGELOG.md` und Kursübersicht im `README.md` aktualisieren.

## Aufbau eines Kapitels

6–10 Schritte, am Ende ein **druckbares** Projekt:

1. `info` – Was bauen wir? Was lernen wir? (keine Aufgaben)
2. mehrere `learn` – je **ein** neues Werkzeug, Hinweis-Kette Button → Modell → Dialogfeld
3. `game` – anschauen, drehen, Farbe
4. `challenge` – Erweiterung ohne Hand (`autoHints: false`)
5. `creative` – eigene Gestaltung + STL-Export (`manual: true`)

Zwischen Kapiteln fügt die Engine „Projekt sichern“ selbst ein.

## Regeln für Texte

- Du-Form, kurze Sätze, Deutsch für 8–14 Jahre. Fachwörter (Skizze, Extrudieren, Profil) beim
  ersten Mal erklären.
- Buttons fett und genau so, wie die **deutsche Oberfläche** sie zeigt: `<b>Neue Skizze</b>`,
  `<b>Rechteck</b>`, `<b>Extrudieren</b>`, `<b>Skizze beenden</b>`, Feld `<b>Abstand</b>`,
  Operation `<b>Verbinden</b>` / `<b>Ausschneiden</b>`, Tabs `Modell`, `Skizze`, Panel `Erstellen ▾`.
- Maße als Vorschlag („ein guter Vorschlag ist 80 × 30 mm“), eigene Größen sind erlaubt.
- Hinweistexte 2–6 Wörter, Aufgabentexte kurz, typografische Anführungszeichen „…“.

## Regeln für Prüfungen

- **Großzügig**: Kinder bauen anders. Nie exakte Maße oder einen bestimmten Bauweg verlangen.
  Die Platte darf auf jeder Ebene liegen – `c.height()` misst entlang der dünnsten Richtung.
- Relativ zum Schrittbeginn prüfen (`c.base.height`, `c.newSketches()`), nicht absolut.
- Jede `learn`-Aufgabe hat `check`; `manual: true` nur für Dinge, die die App nicht sieht.
- Hinweis-`done` so schreiben, dass die Kette auch weiterläuft, wenn das Kind einen Schritt
  anders erledigt (z. B. `done: c => extrudeOpen(c) || plateDone(c)`).
- Die Erweiterung ruft **nie** modellverändernde Befehle auf.
- Kapitel-`id` klein, ohne Umlaute, nie umbenennen (Fortschritt hängt daran).
