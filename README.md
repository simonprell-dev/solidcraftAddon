# Einführungskurs für SolidCraft – 3D-Konstruieren auf Deutsch

Eine kostenlose Browser-Erweiterung für Chrome, Edge und Brave, die Kinder von 8 bis 14 Jahren
Schritt für Schritt durch das 3D-Konstruieren in [SolidCraft](https://app.solidcraft.io/) führt –
direkt im Editor, auf Deutsch, ohne Konto.

Sie funktioniert wie der [Einführungskurs für Scratch](https://simonprell-dev.github.io/scratchExtention/):

- **Kapitel mit Schritten**, jedes Kapitel endet mit einem eigenen, druckbaren Projekt
- **Eine Hand 👆 zeigt**, wo geklickt wird – auf Buttons, Felder im Dialog und Flächen im 3D-Modell
- **Automatische Prüfung**: Die Erweiterung erkennt, ob die Skizze offen ist, ob die Platte
  extrudiert wurde oder ob der Name heraussteht, hakt ab und wirft Konfetti 🎉
- **Drei Stufen** zum Einstieg, Fortschritt bleibt gespeichert

## Kursübersicht

| # | Projekt | Neue Werkzeuge | Stand |
|---|---|---|---|
| 1 | 🏷️ Namensschild | Skizze, Rechteck, Extrudieren, Text | ✅ fertig (10 Schritte) |
| 2 | 🔑 Schlüsselanhänger | Ecken abrunden, Loch schneiden, Maße | geplant |
| 3 | 🎲 Spielwürfel | Würfel, Kugeln abziehen, Fase | geplant |
| 4 | ✏️ Stifteköcher / Handyhalter | Schale, Winkel, mehrere Körper | geplant |
| 5 | 📦 Box mit Deckel | zwei Teile, Toleranz, Passung | geplant |
| 6 | 🚀 Rakete oder Kreisel | Rotation, Spiegeln/Muster, Kombinieren | geplant |

## Benutzung

1. Erweiterung installieren (siehe unten) und auf das Symbol klicken – SolidCraft öffnet sich.
2. Unten auf **🎓 3D-Kurs starten** klicken und eine Stufe wählen.
3. Dem Kursfenster folgen. Es lässt sich verschieben (Kopfzeile ziehen) und einklappen.

Rechtsklick auf das Symbol: Erweiterung aus-/einschalten, Lernfortschritt zurücksetzen.

### Entpackt installieren (Entwicklung)

1. Repository herunterladen.
2. `chrome://extensions` (bzw. `edge://extensions`) öffnen, **Entwicklermodus** einschalten.
3. **Entpackte Erweiterung laden** → diesen Ordner wählen.
4. SolidCraft-Tab neu laden (F5).

## Wie es funktioniert

SolidCraft zeichnet seine ganze Oberfläche in ein `<canvas>` – es gibt keine HTML-Buttons.
Die Web-App bietet aber eine offizielle Browser-Schnittstelle `window.solidcraft`. Die
Erweiterung liest darüber alle 200 ms (nur lesend, sie verändert das Modell nie):

- `ui.handles` – Bildschirmposition jedes Buttons, Tabs und Dialogfelds → dorthin zeigt die Hand
- `ui.inspect` – aktives Werkzeug, offener Dialog, Kamera
- `document.inspect` – Skizzen, Körper mit Maßen, Zeitleiste → damit werden Aufgaben geprüft
- `ui.at` – Bildschirmpunkt einer Ebene oder eines 3D-Punkts (z. B. die Oberseite der Platte)

| Datei | Aufgabe |
|---|---|
| `lib/solidcraft-access.js` | Zugriff auf `window.solidcraft`, ein Snapshot pro Takt |
| `course/context.js` | Prüf-Hilfen `c.inSketch()`, `c.height()`, `c.top()` … |
| `course/targets.js` | Hinweis-Ziele (`tool:solid.extrude`, `plane:XY` …) → Bildschirmpunkt |
| `course/course-data.js` | **Kursinhalte** – für neue Kapitel nur diese Datei ändern |
| `course/course.js` | Kursfenster, Hand, Stufenwahl, Konfetti |

## Entwicklung

```sh
npm install
npm test        # Unit-Tests (node:test)
npm run check   # prüft die Kursdaten
npm run e2e     # spielt Kapitel 1 in der echten Web-App durch (Edge/Chromium, Erweiterung geladen)
npm run e2e:robust  # Zurück/Neuladen/verdecktes Ziel/Ansichtswürfel
```

`npm run e2e` braucht Edge oder Chromium: Google Chrome ab Version 137 lädt entpackte
Erweiterungen nicht mehr per Startparameter. Mit `HEADFUL=1` kann man zuschauen.

Neue Kapitel schreibt man mit dem Skill [`.claude/skills/kurs-kapitel`](.claude/skills/kurs-kapitel/SKILL.md).

## Lizenz

MIT. SolidCraft selbst ist ein eigenständiges Open-Source-Projekt (Apache-2.0) von Tangency Labs
und gehört nicht zu dieser Erweiterung.
