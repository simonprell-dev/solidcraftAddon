# Änderungen

## 0.5.0 – 2026-11-08

### Neu
- Acht neue Kapitel für alle Arbeitsbereiche von SolidCraft: Blech (Handyständer), Fläche (Vase),
  Kunststoff (Dose mit Klick-Deckel), Schweissteile (Mini-Hocker), Zusammenbau und Einfügen (Windrad mit
  Drehgelenk), Prüfen und Ansicht (Detektiv-Werkstatt), Verwalten (Baukasten mit Parametern) und der
  Arbeitsbereich Rendern (Fotostudio) – zusammen 14 Kapitel mit 128 Schritten, alles auch auf Englisch
- Vorlesen: 🔊 im Kursfenster liest den Schritt vor, im Menü lässt sich „automatisch vorlesen“ einschalten.
  Mitgelieferte Sprachaufnahmen (Piper, Stimmen Thorsten und LJSpeech); fehlt eine, liest eine lokale
  Stimme des Browsers – nie eine Online-Stimme
- `npm run audio`, `npm run e2e:audio`; `npm run check` prüft, ob alle Aufnahmen zum Text passen

### Intern
- Kapitel als eigene Dateien `course/chapters/<id>.js` mit `add()`/`translate()` und gemeinsamen `helpers`
- Kapitel können nur lesende App-Befehle anmelden (`addRead`, nur während das Kapitel offen ist);
  Prüf-Kontext mit `c.doc()`, `c.ui()`, `c.extra()`

## 0.4.0 – 2026-11-07

### Neu
- Logo (`docs/logo.svg`) und daraus erzeugte Symbole
- GitHub-Projektseite auf Deutsch und Englisch mit echten Screenshots, Datenschutzerklärungen
- Flyer für Lehrkräfte als PDF (DE/EN)
- Store-Unterlagen für Chrome Web Store und Edge Add-ons: Texte, Screenshots, Werbekacheln
- `npm run screenshots`, `npm run assets`, `npm run pack`; GitHub-Workflows „Prüfen“ und „Release“
- Issue- und PR-Vorlagen, CONTRIBUTING

### SEO der Projektseite
- Titel und Beschreibungen in suchmaschinengerechter Länge, kanonische URLs, hreflang DE/EN mit x-default
- Open Graph und Twitter-Karten mit Bildmaßen und Alt-Text, Favicon als SVG, Apple-Touch-Icon
- strukturierte Daten: SoftwareApplication (kostenlos, Altersgruppe 8–14, Bildung) und FAQPage
- FAQ um „Was ist SolidCraft?“ und „Unterschied zu Tinkercad?“ erweitert
- Screenshots als WebP (rund 60 % kleiner), Hauptbild wird bevorzugt geladen, feste Bildmaße
- sitemap.xml mit Sprachverknüpfungen, robots.txt, 404-Seite; `npm run build:seo` / `npm run check:seo`

### Behoben
- Start-Knopf war in etwa jedem fünften frischen Browser unsichtbar, weil das Stylesheet nicht
  eingefügt wurde – der Kurs bringt sein Stylesheet jetzt selbst mit
- Kurs fehlte manchmal ganz: Beim Browserstart wurden die Skripte ab- und neu angemeldet; ein Tab, der
  in dieser Lücke lud (z. B. wiederhergestellt), bekam keinen Kurs. Jetzt werden nur Änderungen
  registriert, nacheinander, und offene SolidCraft-Tabs bekommen den Kurs nach Installation oder
  Einschalten sofort
- Kurzbeschreibung der Erweiterung auf die Store-Grenze von 132 Zeichen gekürzt

## 0.3.0 – 2026-11-07

### Neu
- Mehrsprachigkeit: Kurs, Kursfenster, Hand-Hinweise, Name und Menü der Erweiterung
- Englisch komplett (alle 6 Kapitel, 50 Schritte), mit den Button-Namen der englischen SolidCraft-Oberfläche
- Sprache folgt automatisch SolidCraft; im Kursmenü fest einstellbar
- `npm run check` prüft jede Sprache auf Vollständigkeit; E2E-Test `npm run e2e:english`

### Verbessert
- Start-Knopf reagiert auch, wenn der Browser einen Klick verschluckt

## 0.2.0 – 2026-11-07

### Neu
- Kapitel 2 „Schlüsselanhänger“ (Vollrundung, Bohrung), 3 „Spielwürfel“ (Kreis, Ausschneiden,
  Abschrägung, 21 Augen), 4 „Stifteköcher“ (Hülle, Neuer Körper, Kombinieren), 5 „Box mit Deckel“
  (zwei Teile mit Spiel), 6 „Rakete“ (Linie, Drehen, Radiales Muster) – zusammen 50 Schritte
- Stufen starten bei Kapitel 1, 3 und 5
- Hand zeigt auf Kanten, Bohrstellen, die gezeichnete Skizze und die Z-Achse; Werkzeuge in
  Aufklappern über die Befehlssuche
- E2E-Test für die Kapitel 2–6

### Verbessert
- Fortschritt wird zwischen mehreren SolidCraft-Tabs abgeglichen
- Pokal- und Übergangsansicht überstehen Ein-/Ausklappen und Neuladen
- Körper, die vor einem Kapitel schon im Design lagen, stören die Prüfungen nicht mehr
- Namenserkennung auch für ganz kurze Namen; Drehen mit der rechten Maustaste erklärt
- Zurücksetzen fragt immer nach oder holt es beim nächsten Laden nach

## 0.1.0 – 2026-11-07

### Neu
- Erste Version der Erweiterung für app.solidcraft.io
- Kapitel 1 „Dein Namensschild“ (10 Schritte): Skizze, Rechteck, Extrudieren, Text, STL-Export
- Kursfenster mit Stufenwahl, Fortschritt, Zeige-Hand auf Buttons, Dialogfelder und Modellflächen
- Automatische Prüfung über die Browser-Schnittstelle `window.solidcraft`
- Unit-Tests, Kursdaten-Prüfung und End-to-End-Test gegen die echte Web-App
