# SolidCraft-Einführungskurs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chrome-Erweiterung (MV3) für app.solidcraft.io mit geführtem Kurs; erste Lieferung: Engine + Kapitel 1 „Namensschild“.

**Architecture:** Alle Kursskripte laufen in der MAIN world der Seite (wie scratchExtention). `lib/solidcraft-access.js` holt alle 200 ms einen Snapshot über `window.solidcraft.request` (`ui.inspect`, `ui.handles`, `document.inspect` nur bei neuer Revision). Reine Module `course/context.js` (Prüf-Kontext) und `course/targets.js` (Ziel → Punkt) sind mit `node:test` getestet; `course/course.js` zeichnet Kursfenster, Hand und Konfetti.

**Tech Stack:** Vanilla JS (IIFE, `window.SolidcraftKurs*`-Namensräume), Chrome MV3, Node 24 `node:test`, `puppeteer-core` 23.11.1 (nur devDependency, E2E).

**Spec:** `docs/superpowers/specs/2026-11-07-solidcraft-kurs-design.md`

## Global Constraints

- Nur `https://app.solidcraft.io/*` in `host_permissions`; Berechtigungen `scripting`, `storage`, `contextMenus`.
- Texte: Du-Form, Deutsch für 8–14 Jahre, typografische „…“; Button-Namen fett wie in der deutschen UI (`<b>Skizze erstellen</b>`, `<b>Extrudieren</b>`, `<b>2-Punkt-Rechteck</b>`, `<b>Skizze beenden</b>`, `<b>Abstand</b>`, `<b>Verbinden</b>`, Tab `<b>MODELL</b>`).
- Fortschritt: `localStorage['solidcraft-kurs:v1']`; Kapitel-`id` nie umbenennen.
- Takt 200 ms; `document.inspect {measure:true, sketch_counts:true}` nur wenn `revision` sich änderte.
- Die Erweiterung ruft **nie** modellverändernde Befehle auf (kein `execute` außer in Tests).
- Eigene Maße akzeptieren: Plattendicke 2–5 mm, Text ≥ 1 mm erhaben; Empfehlung 80 × 30 × 3 / 2 mm.

## Review Focus

- SolidCraft noch nicht geladen / `window.solidcraft` fehlt → Kursfenster zeigt „SolidCraft lädt …“, kein Fehler im Takt (test in Task 2).
- Request schlägt fehl oder hängt (Tab im Hintergrund) → Takt überspringt, keine Anfragen-Lawine (max. 1 laufender Snapshot; test in Task 2).
- Button nicht in `ui.handles` (anderer Tab aktiv, Werkzeug im Aufklapper) → Hand zeigt erst auf Tab bzw. Panel (test in Task 3).
- Kind baut anders (mehrere Körper, Text nicht verbunden, eigene Größe) → Aufgabe trotzdem erledigt (test in Task 4).
- Kursfenster liegt über dem Ziel → Hand/Blase bleibt sichtbar, Fenster einklappbar (manuell in Task 6).

---

### Task 1: Gerüst, Manifest, Hintergrund

**Files:**
- Create: `manifest.json`, `background.js`, `reset-pending.js`, `package.json`, `.gitignore`, `README.md`, `LICENSE` (MIT), `icons/icon-{16,32,48,128}.png`

**Interfaces:**
- Produces: registriertes Content-Script `solidcraft-kurs` (MAIN world, `document_idle`) mit Reihenfolge `lib/solidcraft-access.js`, `course/context.js`, `course/targets.js`, `course/course-data.js`, `course/course.js`, CSS `course/course.css`; Reset-Event `solidcraft-kurs-reset` auf `window`.

- [ ] Step 1: `background.js` nach Vorbild scratchExtention (`EDITOR_URL='https://app.solidcraft.io/'`, Ein/Aus, Reset, Hilfe, Toast) schreiben; Reset löscht `solidcraft-kurs:v1`.
- [ ] Step 2: Icons per Node-Skript `tools/make-icons.mjs` (reines PNG, Würfel-Motiv) erzeugen.
- [ ] Step 3: `node --check` auf alle JS-Dateien → keine Ausgabe.
- [ ] Step 4: `git init`, Commit „chore: Gerüst der SolidCraft-Kurs-Erweiterung“.

### Task 2: Zugriff auf SolidCraft (`lib/solidcraft-access.js`)

**Files:** Create `lib/solidcraft-access.js`, Test `tests/access.test.mjs`, Helper `tests/load.mjs` (lädt IIFE-Datei in `vm`-Kontext mit Fake-`window`).

**Interfaces:**
- Produces `window.SolidcraftKursAccess = { ready(): boolean, snapshot(): Promise<Snapshot|null>, at(spec): Promise<[x,y]|null>, commands(): Promise<Map<id,{tab,panel,label}>>, canvasOffset(): {x,y} }`
- `Snapshot = { ui, handles: Map<name,{x,y}>, doc, revision, time }`; `doc` wird zwischengespeichert und nur bei geänderter `ui`-unabhängiger `document.revision` neu geholt.

- [ ] Step 1: Tests: `ready()` false ohne `window.solidcraft`; `snapshot()` liefert `null` ohne API; zwei gleichzeitige `snapshot()`-Aufrufe → nur ein Satz Requests (zweiter erhält dasselbe Promise); `document.inspect` nur bei neuer Revision; abgelehnter Request → `null`, kein Throw.
- [ ] Step 2: `node --test tests/` → FAIL.
- [ ] Step 3: Implementieren (Timeout 2 s pro Snapshot via `Promise.race`).
- [ ] Step 4: `node --test tests/` → PASS. Commit.

### Task 3: Hinweis-Ziele (`course/targets.js`)

**Files:** Create `course/targets.js`, Test `tests/targets.test.mjs`.

**Interfaces:**
- Produces `window.SolidcraftKursTargets.resolve(target, snap, cmds) → {kind:'point', x, y, name} | {kind:'need-at', spec} | {kind:'via', target, text} | null`
- Ziele: `tool:<cmd>` (versucht `toolbar:`, `button:`, `dropdown:`; sonst `panel:<cmd.tab>:<cmd.panel>` → `via` mit Text „Klicke auf <PANEL> ▾“; sonst `tab:<cmd.tab>` → `via` „Öffne oben den Tab „<TAB>““), `tab:<NAME>`, `handle:<name>`, `dialog:<Label>` (= `dialog:<Label>`), `plane:XY` / `world:[x,y,z]` (→ `need-at`), `viewport` (Mitte von `ui.viewport [x,y,w,h]`).
- Deutsche Tab-Anzeige: `MODEL→MODELL`, `SKETCH→SKIZZE`, `SOLID→VOLUMENKÖRPER`; Panels `CREATE→ERSTELLEN`, `MODIFY→ÄNDERN`.

- [ ] Step 1: Tests: `tool:solid.extrude` mit Handle `toolbar:solid.extrude` → Punkt; `tool:sketch.text` ohne Button, mit `panel:SKETCH:CREATE` → `via` mit „ERSTELLEN“; ohne Panel, mit `tab:SKETCH` → `via` mit „SKIZZE“; `plane:XY` → `need-at`; `viewport` mit `[0,34,1400,866]` → `{x:700,y:467}`; unbekannt → `null`.
- [ ] Step 2: FAIL. Step 3: implementieren. Step 4: PASS. Commit.

### Task 4: Prüf-Kontext (`course/context.js`)

**Files:** Create `course/context.js`, Test `tests/context.test.mjs` (Fixtures aus echten Spike-Antworten in `tests/fixtures/*.json`: leer, Skizze offen, Platte, Platte+Text).

**Interfaces:**
- Produces `window.SolidcraftKursContext.make(snap, base) → c` mit:
  `c.tool()`, `c.dialog()`, `c.inSketch()`, `c.activeSketch()`, `c.sketches()`, `c.newSketches()` (seit `base`), `c.bodies()`, `c.size(body) → [lang, breit, hoch]` (z-Höhe getrennt: `[x-Länge, y-Länge, z-Höhe]` absteigend für x/y), `c.height()` (z-Ausdehnung aller Körper zusammen), `c.features(type)`, `c.cameraMoved()`, `c.has(handleName)`, `c.approx(a,b,tol)`, `c.base`.
- `base = {camera, sketchIds, height, features}` aus `makeBase(snap)`.

- [ ] Step 1: Tests: leer → `inSketch()` false, `height()` 0; Skizze offen → `inSketch()` true; Platte → `height()` ≈ 3, `size()` ≈ [80,30,3]; Platte+Text → `height()` ≈ 5; zwei Körper (Text nicht verbunden) → `height()` ≈ 5; Kamera mit anderem `target` → `cameraMoved()` true, gleiche → false.
- [ ] Step 2: FAIL. Step 3: implementieren. Step 4: PASS. Commit.

### Task 5: Kursdaten Kapitel 1 + Prüfwerkzeug

**Files:** Create `course/course-data.js`, `tools/check-course.mjs`, `tools/known-commands.json` (IDs aus Spike), Test `tests/course-data.test.mjs`.

**Interfaces:**
- Produces `window.SolidcraftKursCourse = { chapters: [Chapter], levels: {neuling: 'namensschild', probiert: 'namensschild', profi: 'namensschild'} }`
- `Chapter = {id, title, level, type, icon, autoHints, steps: [Step]}`; `Step = {kind, title, text, tasks?: [{text, check?(c), manual?}], hints?: [{target: string|((c)=>string), text, done(c)}], autoHints?}`.
- Kapitel `namensschild`, 10 Schritte laut Spec; Prüfungen:
  2 `cameraMoved`; 3 `inSketch`; 4 aktive Skizze `profiles ≥ 1`; 5 `!inSketch` und `height()` 2–5; 6 `newSketches ≥ 1` und Skizzen-`curves` ≥ 12 (Buchstaben); 7 `height() ≥ base.height + 1`; 8–10 manuell.
- Hinweis-Text-Ziel für Schritt 6: `c => 'world:' + JSON.stringify([cx, cy, topZ])` aus der größten Körper-Bbox.

- [ ] Step 1: Test: `check-course` meldet 0 Probleme; jede `learn`-Aufgabe hat `check` oder `manual`; alle `tool:`-IDs in `known-commands.json`; IDs eindeutig.
- [ ] Step 2: FAIL. Step 3: Daten + Werkzeug schreiben. Step 4: `npm test` und `npm run check` → PASS. Commit.

### Task 6: Engine & Oberfläche (`course/course.js`, `course/course.css`)

**Files:** Create `course/course.js`, `course/course.css`.

**Interfaces:**
- Consumes alle obigen Namensräume.
- Verhalten nach scratchExtention: Stufenwahl beim ersten Start, Kursfenster (verschiebbar, einklappbar, Position gespeichert, Standard rechts unten), Checkliste, Weiter/Zurück, Kapitel-Menü, Konfetti bei Schrittabschluss, „Hinweise aus“-Schalter, 👆-Knopf bei `autoHints:false`, Launcher-Symbol zum Wiederöffnen, Reset-Event.
- Hand: CSS-Pointer `👆` + Ring + Sprechblase, `pointer-events:none`, Position = Handle-Punkt + `canvasOffset()`. `need-at` → `access.at(spec)` einmal pro Takt für den aktiven Hinweis. `via` → zeigt auf das via-Ziel mit dessen Text.
- Ohne `window.solidcraft`: Fenster zeigt „SolidCraft lädt …“.
- Am Kapitelende: Übergang „Projekt sichern“ (manuell: „Datei ▸ Speichern“ – Hand auf `handle:appbar:save`), dann nächstes Kapitel bzw. „Alle Kapitel geschafft“.

- [ ] Step 1: Implementieren. Step 2: `node --check` → ok. Commit.

### Task 7: End-to-End-Test

**Files:** Create `tests/e2e.mjs` (`npm run e2e`).

- [ ] Step 1: Puppeteer startet Chrome mit `--load-extension` und `--disable-extensions-except` (headless „new“, SwiftShader), öffnet app.solidcraft.io, wählt Stufe „neuling“ im Kursfenster, und spielt Kapitel 1 per `ui.click`/`execute` durch (Kamera `ui.camera`, Skizze per Klick auf `ui.at plane XY`, Rechteck/Extrude/Text per `execute`).
- [ ] Step 2: Nach jedem Schritt: Checkliste im DOM vollständig abgehakt, Hand-Element sichtbar mit Koordinaten innerhalb des Fensters für Schritte 3–7.
- [ ] Step 3: `npm run e2e` → „Kapitel 1 ok“. Screenshot `tests/out/kapitel1.png`. Commit.

### Task 8: Doku & Kapitel-Skill

**Files:** `README.md` (Installation, Kursübersicht 6 Projekte, davon 1 fertig), `CHANGELOG.md`, `.claude/skills/kurs-kapitel/SKILL.md` + `references/api.md` (Ziele, Kontext, Bauregeln für Kapitel 2–6).

- [ ] Step 1: Schreiben. Step 2: `npm test && npm run check` → PASS. Commit.

---

## Phase 2 (2026-11-07): Kleinigkeiten aus dem Review + Kapitel 2–6

Live verifiziert (Spikes): Timeline-Typen `FilletFeature`, `ChamferFeature`, `HoleFeature`,
`ShellFeature`, `RevolveFeature`, `CircularPatternFeature`, `MirrorFeature`, `BoxFeature`;
`face_types` (cylinder/sphere/cone) und `volume_mm3` je Körper; `sketch.inspect` liefert
`plane {origin, x_dir, y_dir}` und Kurven (öffnet kein Fenster); Ausschneiden-Extrusion auf einer
Fläche braucht `direction: 'negative'` (API); Navigation „fusion“ mit `right_drag_orbits`;
Taste A = Erscheinungsbild. Deutsche Labels: Vollrundung, Abschrägung, Hülle, Bohrung, Drehen,
Spiegeln, Muster, Kombinieren, Kreis, Linie; Felder Abstand, Operation (Verbinden/Ausschneiden/
Neuer Körper), Kanten, Radius, Durchmesser, Dicke, Achse, Anzahl, Zielkörper, Werkzeugkörper.

### Task 9: Infrastruktur (TDD, Unit-Tests)
- context: `c.newFeatures(type)`, `c.volume()`, `c.faceCount(type)`, `c.bodyCount()`,
  `c.largest()`, `c.top('long')`, `c.sketchCenter()`, Körper vom Kapitelstart ignorieren
  (`base.ignore`), Textskizze über Profile (≥ 2) statt Kurvenzahl.
- access: `sketch.inspect` der neuesten Skizze bei jedem Modell-Neulesen (`snap.sketch`).
- targets: `axis:Z`; `tool:`-Fallback über die Befehlssuche (`ribbon:search`) mit `search`-Text.

### Task 10: Engine-Kleinigkeiten (E2E-robust)
Pokal-Ansicht übersteht Ein-/Ausklappen; Übergangsansicht übersteht Neuladen; keine Hand nach ✕;
Reset-Fallback ohne stillen Reset; Fortschritt zwischen Tabs (storage-Event); Kapitelstart-Körper.

### Task 11: Kapitel 2–6 in course-data.js + `tests/e2e-chapters.mjs`
2 Schlüsselanhänger (neuling), 3 Spielwürfel (probiert), 4 Stifteköcher (probiert),
5 Box mit Deckel (profi), 6 Rakete (profi). Stufen-Einstieg: neuling→1, probiert→3, profi→5.
E2E spielt jedes Kapitel per Befehl durch und prüft Haken + Hand pro Lern-Schritt.
