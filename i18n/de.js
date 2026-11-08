/*
 * Deutsch – Quellsprache. Die Kursinhalte selbst stehen in course/course-data.js.
 * Neue Sprache: diese Datei als i18n/<code>.js kopieren, ui und labels übersetzen und dazu
 * course + phrases anlegen (Vorlage: i18n/en.js). `npm run check` zeigt, was noch fehlt.
 */
(function () {
    'use strict';
    window.SolidcraftKursLang = window.SolidcraftKursLang || {};
    window.SolidcraftKursLang.de = {
        name: 'Deutsch',
        // Beschriftungen der deutschen SolidCraft-Oberfläche (0.30, per Screenshot geprüft)
        labels: {
            tabs: {MODEL: 'Modell', SKETCH: 'Skizze', SURFACE: 'Fläche', ASSEMBLE: 'Zusammenbau', INSERT: 'Einfügen',
                INSPECT: 'Prüfen', MANAGE: 'Verwalten', VIEW: 'Ansicht', 'SHEET METAL': 'Blech', SOLID: 'Volumenkörper', WELDMENTS: 'Schweissteile', PLASTIC: 'Kunststoff', MESH: 'Netz', UTILITIES: 'Werkzeuge'},
            panels: {CREATE: 'Erstellen', MODIFY: 'Ändern', ARRANGE: 'Anordnen', CONSTRUCT: 'Konstruktion',
                CONFIGURE: 'Konfigurieren', CONSTRAIN: 'Abhängigkeiten', PATTERN: 'Muster', REFERENCE: 'Referenz',
                INSPECT: 'Prüfen', EDIT: 'Bearbeiten', CONVERT: 'Konvertieren'}
        },
        ui: {
            'btn.read': 'Vorlesen',
            'btn.stopRead': 'Vorlesen beenden',
            'menu.read': 'Vorlesen',
            'read.unavailable': 'Vorlesen geht gerade nicht: Auf diesem Gerät ist keine passende Stimme installiert.',
            'hint.ok': 'Fertig eingetragen? Dann klicke auf „OK“',
            'read.auto': 'Jeden Schritt automatisch vorlesen',
            'kind.info': 'Info',
            'kind.learn': 'Lernen',
            'kind.creative': 'Kreativ',
            'kind.game': 'Anschauen',
            'kind.challenge': 'Challenge',
            'level.neuling.title': 'Neuling',
            'level.neuling.text': 'Ich habe noch nie am Computer etwas in 3D gebaut.',
            'level.probiert.title': 'Schon mal ausprobiert',
            'level.probiert.text': 'Ich kenne Tinkercad oder ein anderes 3D-Programm ein bisschen.',
            'level.profi.title': 'Ich kenne mich aus',
            'level.profi.text': 'Skizzieren und Extrudieren kenne ich schon.',
            'brand': '3D-Kurs',
            'header.step': 'Kapitel {n}: {title} · {step}/{total}',
            'header.transition': 'Projekt sichern → Kapitel {n}',
            'btn.menu': 'Kapitelübersicht',
            'btn.expand': 'Ausklappen',
            'btn.collapse': 'Einklappen',
            'btn.close': 'Kurs schließen (Fortschritt bleibt gespeichert)',
            'loading': 'SolidCraft lädt noch …',
            'task.clickToCheck': 'Zum Abhaken klicken',
            'nav.back': 'Zurück',
            'nav.next': 'Weiter →',
            'nav.chapterDone': 'Kapitel fertig ✓',
            'nav.skip': 'Du kannst auch überspringen',
            'hints.on': '👆 Zeig mir wie',
            'hints.off': '👆 Hinweise aus',
            'hints.title': 'Zeigt, wo du klicken musst',
            'menu.title': 'Kapitel',
            'menu.level': 'Stufe neu wählen',
            'menu.language': 'Sprache',
            'lang.auto': 'Automatisch (wie SolidCraft)',
            'success.title': 'Super gemacht! 🎉',
            'success.next': 'Als Nächstes: {what}',
            'next.chapter': '📘 Kapitel {n}: {title}',
            'done.title': 'Kapitel „{title}“ geschafft!',
            'done.next': '<p>Stark! Bereit für das nächste Projekt: <b>{title}</b>?</p>',
            'done.all': '<p>Du hast den ganzen 3D-Kurs geschafft. Jetzt bist du ein echter Konstrukteur! 🚀</p>',
            'done.overview': 'Zur Übersicht',
            'done.nextTitle': 'Projekt sichern und nächstes Kapitel starten',
            'transition.kind': '💾 Projekt sichern',
            'transition.title': 'Bevor es weitergeht',
            'transition.text': '<p>Speichere dein fertiges Projekt, damit es nicht verloren geht. ' +
                'Dann beginnst du das nächste Kapitel in einem neuen, leeren Design.</p>',
            'transition.save': 'Speichere dein Projekt (oben: Speichern)',
            'transition.saveHint': 'Hier speichern',
            'transition.new': 'Öffne ein neues, leeres Design (oben: +)',
            'transition.newHint': 'Neues Design',
            'transition.start': 'Kapitel {n} starten →',
            'modal.close': 'Schließen',
            'modal.brand': 'Einführungskurs',
            'modal.title': '3D-Kurs starten',
            'modal.text': 'Wie gut kennst du dich mit 3D-Konstruieren schon aus? Je nach Stufe startest du an einer anderen Stelle im Kurs.',
            'modal.start': 'Start: Kapitel {n}',
            'modal.resume': 'Weitermachen: Kapitel {n}, „{title}“',
            'launcher.title': 'Einführungskurs öffnen',
            'launcher.open': 'Kurs öffnen',
            'launcher.start': '3D-Kurs starten',
            'via.panel': 'Klicke auf „{name} ▾“',
            'via.tab': 'Öffne oben den Tab „{name}“',
            'via.search': 'Klicke hier und suche „{name}“'
        }
    };
})();
