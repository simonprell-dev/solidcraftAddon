/*
 * Inhalte des SolidCraft-Einführungskurses.
 *
 * Aufbau eines Schritts:
 *   kind   'info' | 'learn' | 'creative' | 'game' | 'challenge'
 *   title, text (HTML)
 *   tasks  [{text, check(c)}] oder [{text, manual: true}] zum Selbst-Abhaken
 *   hints  Zeige-Hinweise, es wird immer der erste noch nicht erledigte gezeigt:
 *          {target, text, done(c)}  – target ist ein String oder eine Funktion c => String
 *          Ziele (siehe course/targets.js): 'tool:<command id>', 'tab:MODEL',
 *          'handle:<name>', 'dialog:<Label>', 'plane:XY', 'world:[x,y,z]', 'viewport'
 *   autoHints  überschreibt den Kapitelwert (bei false: Hinweise nur über den 👆-Knopf)
 *
 * Prüf-Hilfen in c: siehe course/context.js (c.tool, c.dialog, c.dialogPicked, c.inSketch,
 * c.activeSketch, c.sketches, c.newSketches, c.bodies, c.size, c.height, c.top, c.features,
 * c.cameraMoved, c.has, c.approx, c.base).
 */
(function () {
    'use strict';

    // Eine neue Skizze (seit Schrittbeginn) mit Buchstaben darin. Die Umrisse der Fläche, auf
    // der die Skizze liegt, bringen schon etwa 8 Linien mit – Buchstaben kommen dazu.
    // Umriss der Fläche = 1 Profil (bei runden Ecken schon 8 Linien!), jeder Buchstabe ergibt
    // mindestens ein weiteres Profil (geprüft: „I“ → 2 Profile).
    const textSketch = c => c.sketches().some(s => !c.base.sketchIds.includes(s.id) && s.profiles >= 2);
    const extrudeOpen = c => c.dialog() === 'solid.extrude';
    const plateDone = c => !c.inSketch() && c.bodies().length > 0 && c.height() >= 2 && c.height() <= 5.5;
    const textRaised = c => !c.inSketch() && c.height() >= c.base.height + 1;
    // Mitte der zuletzt gezeichneten Skizze – „Klicke in dein Rechteck“.
    const sketchTarget = c => {
        const p = c.sketchCenter();
        return p ? 'world:' + JSON.stringify(p.map(v => Math.round(v * 10) / 10)) : 'viewport';
    };
    // Mitte der Oberseite – dorthin zeigt die Hand für die zweite Skizze.
    const topTarget = c => {
        const t = c.top();
        return t ? 'world:' + JSON.stringify(t.map(v => Math.round(v * 10) / 10)) : 'viewport';
    };

    const chapters = [
        {
            id: 'namensschild',
            title: 'Dein Namensschild',
            level: 'neuling',
            type: 'Grundlagen',
            icon: '🏷️',
            autoHints: true,
            steps: [
                {
                    kind: 'info',
                    title: 'Was bauen wir?',
                    text: '<p>Du konstruierst dein eigenes <b>Namensschild</b> – eine flache Platte, ' +
                        'auf der dein Name heraussteht. Am Ende kannst du es mit einem 3D-Drucker ausdrucken.</p>' +
                        '<p>Dabei lernst du die wichtigsten Dinge beim 3D-Konstruieren:</p>' +
                        '<ul><li>eine <b>Skizze</b> zeichnen (flach, wie auf Papier)</li>' +
                        '<li>sie <b>extrudieren</b> – also in die Höhe ziehen</li>' +
                        '<li><b>Text</b> schreiben und herausheben</li></ul>' +
                        '<p>Die Hand 👆 zeigt dir immer, wohin du klicken musst.</p>'
                },
                {
                    kind: 'learn',
                    title: 'Schau dich um',
                    text: '<p>In der Mitte siehst du den <b>3D-Raum</b>. Bevor wir bauen, lernst du dich umzusehen:</p>' +
                        '<ul><li><b>Mausrad drehen</b>: heran- und wegzoomen</li>' +
                        '<li><b>Rechte Maustaste</b> gedrückt halten und ziehen: drehen</li>' +
                        '<li><b>Mittlere Maustaste</b> (aufs Mausrad drücken) gedrückt halten und ziehen: verschieben</li>' +
                        '<li>Oben rechts der <b>Ansichtswürfel</b>: klicke auf eine Seite, dann schaust du von dort</li></ul>',
                    tasks: [
                        {text: 'Zoome oder drehe die Ansicht', check: c => c.cameraMoved()}
                    ],
                    hints: [
                        {target: 'handle:axis_view:z', text: 'Klicke auf „Z“: Blick von oben', done: c => c.cameraMoved()}
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Eine Skizze starten',
                    text: '<p>Jedes 3D-Teil beginnt mit einer <b>Skizze</b>: einer flachen Zeichnung auf einer Ebene.</p>' +
                        '<p>Klicke oben auf <b>Neue Skizze</b>. Danach wählst du die Ebene, auf der du zeichnest – ' +
                        'nimm die flache <b>Bodenebene</b> (sie heißt <b>XY</b>).</p>',
                    tasks: [
                        {text: 'Klicke auf „Neue Skizze“', check: c => c.dialog() === 'sketch.create' || c.inSketch()},
                        {text: 'Wähle die Bodenebene (XY)', check: c => c.inSketch()}
                    ],
                    hints: [
                        {target: 'tool:sketch.create', text: 'Klicke auf „Neue Skizze“',
                            done: c => c.dialog() === 'sketch.create' || c.inSketch()},
                        {target: 'plane:XY', text: 'Klicke auf die Bodenebene', done: c => c.inSketch()}
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Ein Rechteck zeichnen',
                    text: '<p>Jetzt zeichnest du die Form des Schilds. Wähle <b>Rechteck</b> und klicke ' +
                        'erst eine Ecke, dann die gegenüberliegende Ecke.</p>' +
                        '<p>Ein guter Vorschlag ist <b>80 × 30 mm</b>. Während du ziehst, zeigt SolidCraft die Maße an. ' +
                        'Du kannst sie direkt eintippen – mit der <b>Tab</b>-Taste wechselst du zwischen Breite und Höhe. ' +
                        'Größer oder kleiner geht aber auch!</p>',
                    tasks: [
                        {text: 'Wähle „Rechteck“',
                            check: c => /^sketch\.rectangle/.test(c.tool() || '') || !!(c.activeSketch() && c.activeSketch().profiles >= 1)},
                        {text: 'Zeichne das Rechteck', check: c => !!(c.activeSketch() && c.activeSketch().profiles >= 1)}
                    ],
                    hints: [
                        {target: 'tool:sketch.rectangle.two_point', text: 'Klicke auf „Rechteck“',
                            done: c => /^sketch\.rectangle/.test(c.tool() || '') || !!(c.activeSketch() && c.activeSketch().profiles >= 1)},
                        {target: 'viewport', text: 'Klicke nacheinander zwei Ecken',
                            done: c => !!(c.activeSketch() && c.activeSketch().profiles >= 1)}
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Die Platte extrudieren',
                    text: '<p>Dein Rechteck ist noch ganz flach. Beende zuerst die Skizze mit <b>Skizze beenden</b>.</p>' +
                        '<p>Dann klicke auf <b>Extrudieren</b>: Das zieht die Form in die Höhe. ' +
                        'Klicke in dein Rechteck, tippe bei <b>Abstand</b> eine <b>3</b> ein (das sind 3 mm) und klicke auf <b>OK</b>.</p>' +
                        '<p>Zu dick geraten? Mach einen Doppelklick unten in der Zeitleiste auf die Extrusion und ändere den Abstand.</p>',
                    tasks: [
                        {text: 'Beende die Skizze', check: c => !c.inSketch() && c.sketches().length > 0},
                        {text: 'Extrudiere die Platte 2–5 mm dick', check: plateDone}
                    ],
                    hints: [
                        {target: 'tool:sketch.finish', text: 'Klicke auf „Skizze beenden“', done: c => !c.inSketch()},
                        {target: 'tool:solid.extrude', text: 'Klicke auf „Extrudieren“',
                            done: c => extrudeOpen(c) || plateDone(c)},
                        {target: sketchTarget, text: 'Klicke in dein Rechteck',
                            done: c => c.dialogPicked('Profiles') > 0 || !extrudeOpen(c) || plateDone(c)},
                        {target: 'dialog:Distance', text: 'Tippe 3 ein, dann OK', done: c => plateDone(c) || !extrudeOpen(c)}
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Deinen Namen schreiben',
                    text: '<p>Jetzt kommt dein Name aufs Schild. Dafür brauchst du eine neue Skizze – diesmal ' +
                        'direkt <b>auf der Oberseite</b> der Platte.</p>' +
                        '<p>Klicke auf <b>Neue Skizze</b> und dann auf die Oberseite. Wähle das Werkzeug <b>Text</b>, ' +
                        'klicke auf die Platte, wo dein Name anfangen soll, und tippe deinen Namen.</p>' +
                        '<p>Tipp: Eine Schrifthöhe von etwa <b>12 mm</b> passt gut auf ein 80 mm langes Schild.</p>',
                    tasks: [
                        {text: 'Starte eine Skizze auf der Oberseite', check: c => c.newSketches() >= 1},
                        {text: 'Wähle das Werkzeug „Text“', check: c => c.tool() === 'sketch.text' || textSketch(c)},
                        {text: 'Schreibe deinen Namen', check: textSketch}
                    ],
                    hints: [
                        {target: 'tool:sketch.create', text: 'Klicke auf „Neue Skizze“',
                            done: c => c.dialog() === 'sketch.create' || c.newSketches() >= 1},
                        {target: topTarget, text: 'Klicke auf die Oberseite der Platte', done: c => c.newSketches() >= 1},
                        {target: 'tool:sketch.text', text: 'Wähle „Text“', done: c => c.tool() === 'sketch.text' || textSketch(c)},
                        {target: topTarget, text: 'Klicke hierhin und tippe deinen Namen', done: textSketch}
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Den Namen herausheben',
                    text: '<p>Dein Name steht jetzt flach auf der Platte. Lass ihn herausstehen!</p>' +
                        '<p>Beende die Skizze, klicke auf <b>Extrudieren</b> und wähle die <b>Buchstaben</b> aus. ' +
                        'Tippe bei <b>Abstand</b> eine <b>2</b> ein. Bei <b>Operation</b> sollte <b>Verbinden</b> stehen – ' +
                        'dann werden Platte und Buchstaben ein einziges Teil.</p>',
                    tasks: [
                        {text: 'Beende die Skizze', check: c => !c.inSketch()},
                        {text: 'Extrudiere den Text nach oben', check: textRaised}
                    ],
                    hints: [
                        {target: 'tool:sketch.finish', text: 'Klicke auf „Skizze beenden“', done: c => !c.inSketch()},
                        {target: 'tool:solid.extrude', text: 'Klicke auf „Extrudieren“', done: c => extrudeOpen(c) || textRaised(c)},
                        {target: topTarget, text: 'Klicke die Buchstaben an',
                            done: c => c.dialogPicked('Profiles') > 0 || !extrudeOpen(c) || textRaised(c)},
                        {target: 'dialog:Distance', text: 'Tippe 2 ein, dann OK', done: c => textRaised(c) || !extrudeOpen(c)}
                    ]
                },
                {
                    kind: 'game',
                    title: 'Bewundere dein Schild',
                    text: '<p>Geschafft – dein Namensschild ist fertig! 🎉</p>' +
                        '<p>Dreh es mit dem Ansichtswürfel von allen Seiten. Wenn du magst, gib ihm eine Farbe: ' +
                        'Klicke auf das Schild und drücke die Taste <b>A</b> (für <b>Erscheinungsbild</b>).</p>',
                    tasks: [
                        {text: 'Schau dir dein Schild von unten an', manual: true},
                        {text: 'Gib deinem Schild eine Farbe', manual: true}
                    ],
                    hints: [
                        {target: 'handle:axis_view:-z', text: 'Von unten anschauen', done: c => c.cameraMoved()}
                    ]
                },
                {
                    kind: 'challenge',
                    title: 'Challenge: Mach es besonders',
                    autoHints: false,
                    text: '<p>Jetzt du! Such dir mindestens eine Idee aus – diesmal ohne Hand:</p>' +
                        '<ul><li>Mach die Schrift größer oder kleiner (Doppelklick auf die Skizze in der Zeitleiste)</li>' +
                        '<li>Schreib ein zweites Wort darunter, z. B. deine Klasse</li>' +
                        '<li>Schneide ein <b>Loch</b> für ein Band: Kreis zeichnen und mit Operation <b>Ausschneiden</b> extrudieren</li></ul>',
                    tasks: [
                        {text: 'Ich habe eine Idee umgesetzt', manual: true}
                    ],
                    hints: [
                        {target: 'tool:sketch.create', text: 'Neue Skizze', done: c => c.newSketches() >= 1}
                    ]
                },
                {
                    kind: 'creative',
                    title: 'Fertig zum Drucken',
                    autoHints: false,
                    text: '<p>Zum Ausdrucken braucht der 3D-Drucker eine <b>STL-Datei</b>.</p>' +
                        '<p>Öffne oben links das Menü <b>Datei</b> und wähle <b>Als STL exportieren</b>. ' +
                        'Die Datei kannst du dann in das Programm deines Druckers laden.</p>' +
                        '<p>Speichere außerdem dein Projekt, damit du später weiterbauen kannst.</p>',
                    tasks: [
                        {text: 'Ich habe die STL-Datei gespeichert', manual: true},
                        {text: 'Ich habe mein Projekt gespeichert', manual: true}
                    ],
                    hints: [
                        {target: 'handle:appbar:file', text: 'Hier ist das Datei-Menü', done: () => false}
                    ]
                }
            ]
        }
    ];

    const levels = {neuling: 'namensschild', probiert: 'namensschild', profi: 'namensschild'};

    window.SolidcraftKursCourse = {chapters, levels};
})();
