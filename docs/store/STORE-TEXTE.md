# Texte und Bilder für Chrome Web Store und Edge Add-ons

Alle Bilder liegen in diesem Ordner und werden aus der echten Erweiterung in der echten SolidCraft-Web-App
erzeugt (`npm run screenshots`, dann `npm run assets`). Das Paket zum Hochladen baut `npm run pack`
(→ `dist/solidcraft-kurs-<version>-store.zip`) oder der Release-Workflow bei einem Tag `v<version>`.

Erfahrung aus der Scratch-Erweiterung: Der Store lehnt Aufzählungen von Projekt- oder Kapitelnamen in
Name, Zusammenfassung und Beschreibung als „Keyword-Spam“ ab. Die Texte beschreiben den Kurs deshalb in
ganzen Sätzen und nennen die Projekte nur allgemein.

---

## Store-Eintrag Deutsch

**Name** (aus `_locales/de/messages.json`, max. 75 Zeichen):
Einführungskurs für SolidCraft – 3D-Konstruieren lernen

**Zusammenfassung** (aus `_locales/de/messages.json`, max. 132 Zeichen – `npm run check` prüft das):
Geführter 3D-Konstruktionskurs für Kinder – direkt im Web-CAD SolidCraft. Mit Zeige-Hand und Projekten für den 3D-Drucker.

**Beschreibung:**

```
3D-Konstruieren lernen – Schritt für Schritt und direkt im Browser.

SolidCraft ist ein kostenloses, leistungsfähiges CAD-Programm im Browser. Für Kinder ist die Fülle an Werkzeugen am Anfang viel. Diese Erweiterung bringt einen geführten Kurs direkt in SolidCraft: Eine animierte Hand zeigt, wo geklickt wird, und die Erweiterung erkennt selbst, wenn eine Aufgabe geschafft ist.

Geführter Kurs
Der Kurs besteht aus 14 Kapiteln mit zusammen 128 Schritten. In jedem Kapitel entsteht ein eigenes Projekt – vom Namensschild bis zu Bauteilen, die passgenau ineinandergreifen. Nach den Grundlagen hat jeder Arbeitsbereich von SolidCraft sein eigenes Kapitel: Blech (Handyständer), Fläche (Vase), Kunststoff (Dose mit Klick-Deckel), Schweissteile (Mini-Hocker), Zusammenbau mit Gelenken (Windrad), Prüfen, Verwalten mit Parametern und Rendern (Fotostudio). Jeder Knopf wird erklärt. Zum Start wählt das Kind eine von drei Stufen, je nachdem, wie viel es schon kann.

Vorlesen
Jeder Schritt kann vorgelesen werden, auf Wunsch automatisch – gut für Kinder, die noch nicht so schnell lesen. Die Sprachaufnahmen sind in der Erweiterung enthalten.

Zeige-Hand und automatische Prüfung
Die Hand zeigt auf den richtigen Button, auf das Feld im Dialog oder auf die passende Fläche im 3D-Modell. Ob die Skizze gezeichnet, der Körper extrudiert oder das Loch gebohrt ist, prüft die Erweiterung selbst und hakt die Aufgabe ab. Eigene Maße und eigene Wege sind ausdrücklich erlaubt.

So geht's
1. Auf das Symbol der Erweiterung klicken – SolidCraft öffnet sich.
2. Unten auf „3D-Kurs starten“ klicken und eine Stufe wählen.

Mit einem Rechtsklick auf das Symbol lässt sich die Erweiterung ein- und ausschalten und der Lernfortschritt zurücksetzen, zum Beispiel an geteilten Schul-PCs.

Sprachen
Deutsch und Englisch. Der Kurs folgt automatisch der Sprache von SolidCraft, damit die Namen der Buttons immer zur Oberfläche passen.

Für wen?
Für Kinder von etwa 8 bis 14 Jahren, für Lehrkräfte im Technik-, Informatik- oder Kunstunterricht, in AGs, Makerspaces und Bibliotheken, und für Eltern, die mit ihren Kindern konstruieren möchten.

Datenschutz
Kein Konto, kein Server, keine Datensammlung. Der Kursfortschritt bleibt im Browser. Die Erweiterung läuft nur auf app.solidcraft.io und verändert keine Modelle.

Open Source
Kostenlos und quelloffen (MIT-Lizenz). Anleitung, Flyer und Tipps für Lehrkräfte: https://simonprell-dev.github.io/solidcraftAddon/

Dies ist ein unabhängiges Projekt und kein offizielles Produkt von SolidCraft bzw. Tangency Labs.
```

**Kategorie:** Bildung · **Sprache:** Deutsch

**Bildunterschriften der Screenshots** (`de/screenshot-1.png` … `-5.png`):
1. Die Hand zeigt, wo geklickt wird
2. Drei Einstiegsstufen – vom Neuling bis zum Profi
3. Aufgaben werden automatisch abgehakt
4. Projekte zum Ausdrucken – vom Namensschild bis zum Würfel
5. Auch knifflige Projekte: eine Rakete mit drei Flossen

---

## Store-Eintrag Englisch

Im Developer Dashboard unter „Store-Eintrag“ die Sprache **Englisch** hinzufügen.

**Name** (aus `_locales/en/messages.json`): Intro course for SolidCraft – learn 3D design

**Summary** (aus `_locales/en/messages.json`):
A guided 3D design course for kids – right inside the web CAD SolidCraft. With a pointing hand and projects for your 3D printer.

**Description:**

```
Learn 3D design – step by step, right in your browser.

SolidCraft is a free, powerful CAD program in the browser. For kids, all those tools can be a lot at first. This extension brings a guided course right into SolidCraft: an animated hand shows where to click, and the extension notices by itself when a task is done.

Guided course
The course has 14 chapters with 128 steps in total. Every chapter ends with a project of your own – from a name tag to parts that fit precisely into each other. After the basics, every SolidCraft workspace gets its own chapter: sheet metal (phone stand), surface (vase), plastic (box with a click lid), weldments (mini stool), assemble with joints (wind turbine), inspect, manage with parameters and render (photo studio). Every button is explained. At the start, kids choose one of three levels depending on how much they already know.

Read aloud
Every step can be read aloud, automatically if you like – great for kids who don’t read fast yet. The voice recordings are included in the extension.

Pointing hand and automatic checks
The hand points at the right button, the field in a dialog or the right face in the 3D model. Whether the sketch is drawn, the body is extruded or the hole is drilled – the extension checks it by itself and ticks off the task. Your own sizes and your own ways of building are explicitly allowed.

How it works
1. Click the extension icon – SolidCraft opens.
2. Click “Start 3D course” at the bottom and choose a level.

Right-click the icon to switch the extension on or off and to reset course progress, for example on shared school computers.

Languages
English and German. The course automatically follows SolidCraft’s language so the button names always match the interface.

Who is it for?
For kids aged about 8 to 14, for teachers in design & technology, computing or art lessons, in clubs, makerspaces and libraries, and for parents who want to design things with their kids.

Privacy
No account, no server, no data collection. Course progress stays in the browser. The extension only runs on app.solidcraft.io and never changes your models.

Open source
Free and open source (MIT licence). Instructions, flyer and tips for teachers: https://simonprell-dev.github.io/solidcraftAddon/en/

This is an independent project and not an official product of SolidCraft or Tangency Labs.
```

**Screenshot captions** (`en/screenshot-1.png` … `-5.png`):
1. The hand shows you where to click
2. Three starting levels – from beginner to pro
3. Tasks tick off by themselves
4. Projects to print – from a name tag to a game die
5. Tricky projects too: a rocket with three fins

---

## Grafische Elemente

| Feld | Datei |
|---|---|
| Händlersymbol 128 × 128 (96er-Motiv mit Rand) | `haendlersymbol-128.png` |
| Screenshots 1280 × 800 (Reihenfolge 1–5) | `de/screenshot-*.png` bzw. `en/screenshot-*.png` |
| Kleine Werbekachel 440 × 280 | `de/promo-440x280.png` bzw. `en/promo-440x280.png` |
| Marquee-Werbekachel 1400 × 560 | `de/promo-1400x560.png` bzw. `en/promo-1400x560.png` |
| Werbevideo | leer lassen |

## Weitere Felder

| Feld | Wert |
|---|---|
| URL der Startseite | https://simonprell-dev.github.io/solidcraftAddon/ |
| Support-URL | https://github.com/simonprell-dev/solidcraftAddon/issues |
| Offizielle URL | keine (oder die Projektseite, nachdem sie in der Google Search Console bestätigt wurde) |
| Nicht jugendfreie Inhalte | aus |
| Sichtbarkeit | Öffentlich |
| Regionen | Alle |

## Tab „Datenschutz“

**Alleiniger Zweck:**

```
Die Erweiterung hilft Kindern beim Erlernen des 3D-Konstruierens im Web-CAD SolidCraft (app.solidcraft.io): Sie blendet einen geführten Kurs ein, zeigt mit einer animierten Hand, wo geklickt wird, und hakt Aufgaben automatisch ab, indem sie den Zustand der geöffneten SolidCraft-Seite liest.
```

**Begründung der Berechtigungen:**

| Berechtigung | Begründung |
|---|---|
| `scripting` | Registriert die Kursskripte für app.solidcraft.io dynamisch, damit Nutzer die Erweiterung über das Symbol ausschalten können. Fügt den Kurs nach der Installation bzw. dem Einschalten in bereits offene SolidCraft-Tabs ein. Setzt außerdem auf Wunsch den lokal gespeicherten Lernfortschritt in offenen SolidCraft-Tabs zurück und zeigt dort kurze Hinweise an. |
| `storage` | Speichert lokal, ob die Erweiterung ein- oder ausgeschaltet ist und ob ein Zurücksetzen des Lernfortschritts aussteht. |
| `contextMenus` | Rechtsklick-Menü am Symbol: Erweiterung ein-/ausschalten, Lernfortschritt zurücksetzen, Hilfe öffnen. |
| Hostberechtigung `https://app.solidcraft.io/*` | Die Erweiterung läuft ausschließlich in SolidCraft: Sie blendet dort den Kurs ein und liest über die offizielle Browser-Schnittstelle von SolidCraft, welches Werkzeug offen ist und was das Modell enthält, um die Zeige-Hand zu platzieren und Aufgaben abzuhaken. |

**Remote-Code:** Nein. Alle Skripte und Grafiken sind im Paket enthalten.

**Datennutzung:** Keine Kategorie ankreuzen – die Erweiterung erhebt keine Nutzerdaten. Alle drei
Bestätigungen (kein Verkauf, keine zweckfremde Nutzung, keine Bonitätsprüfung) anhaken.

**Datenschutzerklärung (URL):** https://simonprell-dev.github.io/solidcraftAddon/datenschutz.html
(englisch: https://simonprell-dev.github.io/solidcraftAddon/en/privacy.html)

---

## Microsoft Edge Add-ons (Partner Center)

Dasselbe Store-ZIP hochladen. Abweichungen:

| Feld | Wert |
|---|---|
| Logo 300 × 300 | `edge-logo-300.png` |
| Kleine Werbekachel 440 × 280 | `de/promo-440x280.png` |
| Große Werbekachel 1400 × 560 | `de/promo-1400x560.png` |
| Screenshots 1280 × 800 | wie oben |
| Beschreibung | wie oben (mind. 250 Zeichen) |
| Kategorie | Bildung |
| Datenschutzrichtlinie | ja → URL wie oben |
| Hinweise für die Zertifizierung | „Die Erweiterung läuft nur auf https://app.solidcraft.io/ . Zum Testen: Symbol klicken, unten ‚3D-Kurs starten‘, Stufe ‚Neuling‘ wählen und den Hinweisen folgen. Kein Konto nötig.“ |

## Checkliste vor dem Hochladen

- [ ] Version in `manifest.json` und `package.json` erhöht, Abschnitt in `CHANGELOG.md`
- [ ] `npm test`, `npm run check`, `npm run e2e`, `npm run e2e:chapters`, `npm run e2e:english` grün
- [ ] `npm run screenshots` und `npm run assets`, Bilder angesehen
- [ ] `npm run pack` → `dist/solidcraft-kurs-<version>-store.zip`
- [ ] Datenschutzseite erreichbar (GitHub Pages aktiv)
