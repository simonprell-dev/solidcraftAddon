# Mitmachen

Danke, dass du den 3D-Kurs für SolidCraft besser machen willst! Fehlerberichte, Kursideen, Übersetzungen
und Code sind willkommen.

## Fehler melden und Ideen einreichen

Über [Issues](https://github.com/simonprell-dev/solidcraftAddon/issues/new/choose). Bei Fehlern helfen Kapitel,
Schritt, Browser und Sprache – und ein Screenshot.

## Entwickeln

```sh
npm install
npm test               # Unit-Tests (node:test)
npm run check          # Kursdaten, Sprachen, Store-Grenzen
npm run e2e            # Kapitel 1 in der echten Web-App (braucht Edge oder Chromium)
npm run e2e:chapters   # Kapitel 2–6 (UI_LANG=en-US für Englisch)
npm run e2e:robust     # Zurück, Neuladen, zwei Tabs …
npm run e2e:english    # Sprachen
```

Die E2E-Tests starten einen Browser mit geladener Erweiterung. Google Chrome ab Version 137 lädt entpackte
Erweiterungen nicht mehr per Startparameter – deshalb Edge oder Chromium (Pfad notfalls über `CHROME=…`).

Zum Ausprobieren: `chrome://extensions` → Entwicklermodus → „Entpackte Erweiterung laden“ → dieser Ordner.
Nach Änderungen die Erweiterung neu laden und den SolidCraft-Tab mit F5 aktualisieren.

## Aufbau

| Datei | Aufgabe |
|---|---|
| `lib/solidcraft-access.js` | liest SolidCraft über `window.solidcraft` (nur lesend!) |
| `course/context.js` | Prüf-Hilfen für Aufgaben (`c.inSketch()`, `c.height()` …) |
| `course/targets.js` | Hinweis-Ziele → Bildschirmpunkt |
| `course/course-data.js` | Kursinhalte (Deutsch) |
| `course/i18n.js`, `i18n/*.js` | Sprachen |
| `course/course.js` | Kursfenster, Hand, Stufenwahl |
| `docs/` | GitHub-Seite, Flyer, Store-Bilder und -Texte |
| `tools/` | Kurs-Check, Screenshots, Grafiken, Pakete |

## Neues Kapitel

Am einfachsten mit dem Claude-Code-Skill [`kurs-kapitel`](.claude/skills/kurs-kapitel/SKILL.md) – er beschreibt
Ablauf, Hinweis-Ziele und Prüf-Hilfen. Grundregeln:

- **Großzügig prüfen.** Kinder bauen anders; eigene Maße und Wege sind erlaubt.
- **Nie das Modell verändern.** Die Erweiterung liest nur.
- **Button-Namen wie in der Oberfläche** der jeweiligen Sprache.
- **Alle Sprachen ergänzen** – `npm run check` zeigt, was fehlt.

## Neue Sprache

Siehe [README → Sprachen](README.md#sprachen). Kurz: `i18n/en.js` kopieren, übersetzen, in `background.js`
eintragen, `_locales/<code>/messages.json` anlegen, `npm run check`.

## Release

1. Version in `manifest.json` und `package.json` erhöhen, Abschnitt in `CHANGELOG.md` schreiben.
2. `npm run screenshots && npm run assets`, wenn sich die Oberfläche geändert hat.
3. Tag setzen: `git tag v0.3.0 && git push --tags` – der Workflow baut die ZIPs und das GitHub-Release.
4. Store-ZIP im Chrome Web Store bzw. bei Edge Add-ons hochladen – Texte in [`docs/store/STORE-TEXTE.md`](docs/store/STORE-TEXTE.md).

## Lizenz

Mit einem Beitrag stimmst du zu, dass er unter der [MIT-Lizenz](LICENSE) veröffentlicht wird.
