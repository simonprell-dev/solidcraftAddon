# Referenz: Datenformat, Hinweise, Prüfungen

Quelle der Wahrheit ist der Code: `course/context.js`, `course/targets.js`, Kopfkommentar von
`course/course-data.js`. Bei Widersprüchen gilt der Code.

## Kapitel

```js
{
    id: 'anhaenger',          // eindeutig, nie umbenennen
    title: 'Dein Schlüsselanhänger',
    level: 'neuling',         // 'neuling' | 'probiert' | 'profi'
    type: 'Grundlagen',       // Abzeichen in der Übersicht
    icon: '🔑',
    autoHints: true,
    steps: [ /* … */ ]
}
```

Einstiegskapitel je Stufe: `levels` am Ende von `course-data.js`.

## Schritt

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `kind` | ja | `info` · `learn` · `creative` · `game` · `challenge` |
| `title`, `text` | ja | Überschrift, HTML-Text (`<p>`, `<b>`, `<ul><li>`) |
| `tasks` | nein | `{text, check: c => bool}` oder `{text, manual: true}` – einmal erledigt bleibt erledigt |
| `hints` | nein | `{target, text, done: c => bool}` – der erste nicht erledigte wird gezeigt |
| `autoHints` | nein | überschreibt den Kapitelwert |

## Hinweis-Ziele (`target`, String oder `c => String`)

| Ziel | zeigt auf |
|---|---|
| `tool:<command id>` | Toolbar-Button (`toolbar:`, `button:`, `dropdown:`). Unsichtbar → zuerst Panel „Erstellen ▾“ bzw. Tab, mit eigenem Text |
| `tab:<NAME>` | Tab, z. B. `tab:MODEL`, `tab:SKETCH` (Handle-Namen sind englisch) |
| `handle:<name>` | jedes Handle aus `ui.handles`, z. B. `handle:appbar:save`, `handle:axis_view:home`, `handle:tab:new` |
| `dialog:<Label>` | Feld im offenen Dialog: `dialog:Distance`, `dialog:Operation`, `dialog:OK` |
| `plane:XY` | Ebene im Modell (über `ui.at`) |
| `axis:Z` | Achse im Modell (über `ui.at`), z. B. für Drehen und Muster |
| `world:[x,y,z]` | Punkt im Modell in mm, z. B. `c => 'world:' + JSON.stringify(c.top())` |
| `viewport` | Mitte der 3D-Ansicht („Klicke zwei Ecken“) |

Hinweisfeld `search: 'Kombinieren'`: Liegt das Werkzeug in keinem sichtbaren Button, zeigt die Hand auf
die Befehlssuche oben rechts („Klicke hier und suche „Kombinieren““). Für alles in Aufklappern verwenden.

Live verifizierte Handles (SolidCraft 0.30): `toolbar:sketch.create`, `toolbar:solid.extrude`,
`toolbar:solid.revolve`, `toolbar:solid.hole`, `toolbar:solid.fillet`, `toolbar:solid.chamfer`,
`toolbar:solid.shell`, `toolbar:solid.mirror`, `toolbar:solid.pattern.rectangular`; im
Skizzenmodus `toolbar:sketch.line`, `toolbar:sketch.rectangle.two_point`,
`toolbar:sketch.circle.center`, `toolbar:sketch.finish`, `panel:SKETCH:CREATE`.
`sketch.text` und `sketch.rectangle.rounded` liegen in Aufklappern.

## Prüf-Kontext `c`

| Hilfe | liefert |
|---|---|
| `c.tool()` | Command-ID des aktiven Werkzeugs (`'sketch.text'`) oder `null` |
| `c.dialog()` | Command-ID des offenen Dialogs (`'solid.extrude'`) oder `null` |
| `c.dialogPicked(label)` | Anzahl gewählter Elemente im Dialogfeld (`'Profiles'`) |
| `c.inSketch()` / `c.activeSketch()` | offene Skizze? / `{id, name, curves, profiles}` |
| `c.sketches()` / `c.newSketches()` | alle Skizzen / neue seit Schrittbeginn |
| `c.bodies()` / `c.size(body)` | Körper mit `bbox` / `[Länge, Breite, Höhe]` |
| `c.height()` | Dicke aller Körper entlang der dünnsten Richtung |
| `c.top()` | Mitte der Oberseite `[x, y, z]` |
| `c.features(type)` | Anzahl Zeitleisten-Elemente (`'Sketch'`, `'ExtrudeFeature'` …) |
| `c.cameraMoved()` | Ansicht seit Schrittbeginn verändert? |
| `c.has(handle)` | Handle gerade sichtbar? |
| `c.approx(a, b, tol)` | Vergleich mit Toleranz |
| `c.newFeatures(type)` | neue Zeitleisten-Elemente seit Schrittbeginn: `FilletFeature`, `ChamferFeature`, `HoleFeature`, `ShellFeature`, `RevolveFeature`, `CircularPatternFeature`, `MirrorFeature`, `ExtrudeFeature` |
| `c.volume()` / `c.faceCount(type)` | Volumen in mm³ / Anzahl Flächen einer Art (`cylinder`, `sphere`, `cone`) |
| `c.bodyCount()` / `c.largest()` | Anzahl Körper / größter Körper |
| `c.top('long')` / `c.top(2)` | Oberseite entlang der längsten bzw. einer festen Achse |
| `c.sketchCenter()` | Mitte der neuesten Skizze in Weltkoordinaten |
| `c.base` | `{camera, sketchIds, height, volume, bodyCount, features, types, ignore}` bei Schrittbeginn; Körper aus `ignore` (lagen schon vor dem Kapitel im Design) zählen nirgends mit |

Fertige Helfer in `course-data.js`: `sketchHints({…})`, `extrudeHints({…})`, `exportStep(was)`,
Prüfungen wie `profileDrawn`, `filleted`, `shelled`, `newBody`, `combined`, Ziele wie `cornerEdge`,
`holeSpot`, `rimEdge`, `lidTop`, `zTop`, `sketchTarget`.

API-Fallen (live gefunden): Ausschneiden auf einer Fläche braucht `direction: 'negative'`; eine Skizze
auf XZ zeigt mit y nach −Z; der Nullpunkt einer Flächenskizze liegt nicht in der Flächenmitte
(`sketch.inspect().plane` umrechnen).
