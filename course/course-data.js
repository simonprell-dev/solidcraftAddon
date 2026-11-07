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


    // ---------- Gemeinsame Helfer für die Kapitel 2–6 ----------

    const round1 = v => Math.round(v * 10) / 10 + 0;
    const world = p => p ? 'world:' + JSON.stringify(p.map(round1)) : 'viewport';
    const dims = b => b && b.bbox ? [0, 1, 2].map(i => b.bbox.max[i] - b.bbox.min[i]) : [0, 0, 0];
    const argmin = a => a.indexOf(Math.min(...a));
    const argmax = a => a.indexOf(Math.max(...a));
    const mids = b => [0, 1, 2].map(i => (b.bbox.min[i] + b.bbox.max[i]) / 2);
    const newSketchList = c => c.sketches().filter(s => !c.base.sketchIds.includes(s.id));
    const newest = c => c.bodies()[c.bodies().length - 1] || null;

    // Fortschritt beim Skizzieren – seit Schrittbeginn.
    const started = c => c.inSketch() || c.newSketches() >= 1;
    const profileDrawn = c => newSketchList(c).some(s => s.profiles >= 1);
    const circleOnFace = c => newSketchList(c).some(s => s.profiles >= 2);   // Flächenumriss + Kreis

    // Ergebnisse – großzügig: eigene Maße und Bauwege sind erlaubt.
    const plate = (min, max) => c => !c.inSketch() && c.bodyCount() >= 1 && c.height() >= min && c.height() <= max;
    const filleted = c => c.newFeatures('FilletFeature') >= 1;
    const drilled = c => c.newFeatures('HoleFeature') >= 1 ||
        (c.volume() < c.base.volume - 5 && c.newFeatures('ExtrudeFeature') >= 1);
    const edgesBroken = c => c.newFeatures('ChamferFeature') >= 1 || c.newFeatures('FilletFeature') >= 1;
    const cubeDone = c => !c.inSketch() && c.bodies().some(b => {
        const d = dims(b);
        return Math.min(...d) >= 8 && Math.max(...d) <= Math.min(...d) * 1.3;
    });
    const pips = c => c.faceCount('cylinder') + c.faceCount('sphere');
    const cylinderDone = c => !c.inSketch() && c.faceCount('cylinder') >= 1 && Math.max(...dims(c.largest())) >= 40;
    const shelled = c => c.newFeatures('ShellFeature') >= 1;
    const newBody = c => !c.inSketch() && c.bodyCount() > c.base.bodyCount;
    const combined = c => c.newFeatures('CombineFeature') >= 1 || (c.base.bodyCount >= 2 && c.bodyCount() < c.base.bodyCount);
    const revolved = c => c.newFeatures('RevolveFeature') >= 1;
    const patterned = c => c.newFeatures('CircularPatternFeature') >= 1 || c.bodyCount() >= c.base.bodyCount + 2;

    // Ziele im Modell – berechnet aus den Maßen der Körper.
    const zTop = c => world(c.top(2));
    const longTop = c => world(c.top('long'));
    // Eine Kante an einer Ecke (senkrecht zur dünnsten Richtung, bei der Platte die kurze Eckkante).
    const cornerEdge = c => {
        const b = c.largest();
        if (!b) return 'viewport';
        const thin = argmin(dims(b));
        const p = mids(b).map((v, i) => i === thin ? v : b.bbox.max[i]);
        return world(p);
    };
    // Bohrung: auf der Oberseite, 18 % vom Ende entfernt.
    const holeSpot = c => {
        const b = c.largest();
        const t = c.top();
        if (!b || !t) return 'viewport';
        const long = argmax(dims(b));
        t[long] = b.bbox.min[long] + 0.18 * dims(b)[long];
        return world(t);
    };
    // Obere Außenkante eines stehenden Körpers (Köcher).
    const rimEdge = c => {
        const b = c.largest();
        const t = c.top('long');
        if (!b || !t) return 'viewport';
        const long = argmax(dims(b));
        const side = [0, 1, 2].find(i => i !== long);
        t[side] = b.bbox.max[side];
        return world(t);
    };
    // Oberseite des zuletzt gebauten Körpers (Deckel).
    const lidTop = c => {
        const b = newest(c);
        if (!b) return 'viewport';
        const thin = argmin(dims(b));
        const p = mids(b);
        p[thin] = Math.abs(b.bbox.max[thin]) >= Math.abs(b.bbox.min[thin]) ? b.bbox.max[thin] : b.bbox.min[thin];
        return world(p);
    };

    // Hinweis-Kette: Neue Skizze → Ebene/Fläche → Werkzeug → zeichnen → Skizze beenden.
    // done: das Ergebnis des ganzen Schritts – dann ist die Kette vorbei, egal wie das Kind hinkam.
    function sketchHints ({plane, planeText, tool, toolText, drawTarget = 'viewport', drawText, drawn = profileDrawn, done}) {
        const family = tool.slice(5).split('.').slice(0, 2).join('.');   // sketch.rectangle, sketch.circle …
        return [
            {target: 'tool:sketch.create', text: 'Klicke auf „Neue Skizze“',
                done: c => c.dialog() === 'sketch.create' || started(c) || done(c)},
            {target: plane, text: planeText, done: c => started(c) || done(c)},
            {target: tool, text: toolText, done: c => (c.tool() || '').startsWith(family) || drawn(c) || done(c)},
            {target: drawTarget, text: drawText, done: c => drawn(c) || done(c)},
            {target: 'tool:sketch.finish', text: 'Klicke auf „Skizze beenden“', done: c => (drawn(c) && !c.inSketch()) || done(c)}
        ];
    }

    // Hinweis-Kette: Extrudieren → Profil anklicken → Dialogfeld.
    function extrudeHints ({pickText = 'Klicke in dein Rechteck', field = 'dialog:Distance', text, done}) {
        const open = c => c.dialog() === 'solid.extrude';
        return [
            {target: 'tool:solid.extrude', text: 'Klicke auf „Extrudieren“', done: c => open(c) || done(c)},
            {target: sketchTarget, text: pickText, done: c => c.dialogPicked('Profiles') > 0 || !open(c) || done(c)},
            {target: field, text, done: c => done(c) || !open(c)}
        ];
    }

    // Letzter Schritt jedes Kapitels: STL exportieren und Projekt speichern.
    const exportStep = what => ({
        kind: 'creative',
        title: 'Fertig zum Drucken',
        autoHints: false,
        text: `<p>Speichere ${what} als <b>STL-Datei</b> für den 3D-Drucker: Menü <b>Datei</b> → <b>Als STL exportieren</b>.</p>` +
            '<p>Speichere außerdem dein Projekt, damit du später weiterbauen kannst.</p>',
        tasks: [
            {text: 'Ich habe die STL-Datei gespeichert', manual: true},
            {text: 'Ich habe mein Projekt gespeichert', manual: true}
        ],
        hints: [{target: 'handle:appbar:file', text: 'Hier ist das Datei-Menü', done: () => false}]
    });

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
        },
        {
            id: 'anhaenger',
            title: 'Dein Schlüsselanhänger',
            level: 'neuling',
            type: 'Grundlagen',
            icon: '🔑',
            autoHints: true,
            steps: [
                {
                    kind: 'info',
                    title: 'Was bauen wir?',
                    text: '<p>Jetzt baust du einen <b>Schlüsselanhänger</b>: eine Platte mit runden Ecken und einem ' +
                        '<b>Loch</b> für den Schlüsselring.</p>' +
                        '<p>Die Platte kennst du schon vom Namensschild. Neu sind zwei Werkzeuge:</p>' +
                        '<ul><li><b>Vollrundung</b> – macht scharfe Kanten rund</li>' +
                        '<li><b>Bohrung</b> – bohrt ein rundes Loch</li></ul>'
                },
                {
                    kind: 'learn',
                    title: 'Die Grundplatte',
                    text: '<p>Bau die Platte wie beim Namensschild: <b>Neue Skizze</b> auf der Bodenebene, ' +
                        'ein <b>Rechteck</b> zeichnen, <b>Skizze beenden</b> und <b>Extrudieren</b>.</p>' +
                        '<p>Ein guter Vorschlag ist <b>50 × 25 mm</b> und <b>4 mm</b> dick – dann ist der Anhänger stabil.</p>',
                    tasks: [
                        {text: 'Zeichne ein Rechteck', check: profileDrawn},
                        {text: 'Extrudiere die Platte (3–6 mm dick)', check: plate(2.5, 6.5)}
                    ],
                    hints: [
                        ...sketchHints({plane: 'plane:XY', planeText: 'Klicke auf die Bodenebene',
                            tool: 'tool:sketch.rectangle.two_point', toolText: 'Klicke auf „Rechteck“',
                            drawText: 'Klicke nacheinander zwei Ecken', done: plate(2.5, 6.5)}),
                        ...extrudeHints({text: 'Tippe 4 ein, dann OK', done: plate(2.5, 6.5)})
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Ecken abrunden',
                    text: '<p>Scharfe Ecken pieksen in der Hosentasche. Klicke auf <b>Vollrundung</b> ' +
                        '(oder drücke die Taste <b>F</b>).</p>' +
                        '<p>Klicke dann nacheinander die <b>vier kurzen Kanten an den Ecken</b> an – das sind die ' +
                        'Kanten, die senkrecht nach oben gehen. Tippe bei <b>Radius</b> eine <b>4</b> ein und klicke auf <b>OK</b>.</p>',
                    tasks: [
                        {text: 'Wähle „Vollrundung“', check: c => c.dialog() === 'solid.fillet' || filleted(c)},
                        {text: 'Runde die Ecken ab', check: filleted}
                    ],
                    hints: [
                        {target: 'tool:solid.fillet', text: 'Klicke auf „Vollrundung“',
                            done: c => c.dialog() === 'solid.fillet' || filleted(c)},
                        {target: cornerEdge, text: 'Klicke die Kanten an den Ecken',
                            done: c => c.dialogPicked('Edges') > 0 || c.dialog() !== 'solid.fillet' || filleted(c)},
                        {target: 'dialog:Radius', text: 'Tippe 4 ein, dann OK',
                            done: c => filleted(c) || c.dialog() !== 'solid.fillet'}
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Ein Loch für den Ring',
                    text: '<p>Jetzt fehlt noch das Loch für den Schlüsselring. Klicke auf <b>Bohrung</b> ' +
                        '(Taste <b>H</b>) und dann auf die Oberseite – <b>nah an einem Ende</b>, aber nicht ganz am Rand.</p>' +
                        '<p>Tippe bei <b>Durchmesser</b> eine <b>5</b> ein (5 mm) und klicke auf <b>OK</b>.</p>',
                    tasks: [
                        {text: 'Wähle „Bohrung“', check: c => c.dialog() === 'solid.hole' || drilled(c)},
                        {text: 'Bohre das Loch', check: drilled}
                    ],
                    hints: [
                        {target: 'tool:solid.hole', text: 'Klicke auf „Bohrung“', done: c => c.dialog() === 'solid.hole' || drilled(c)},
                        {target: holeSpot, text: 'Klicke hierhin – nah am Ende',
                            done: c => c.dialogPicked('Face') > 0 || c.dialog() !== 'solid.hole' || drilled(c)},
                        {target: 'dialog:Diameter', text: 'Tippe 5 ein, dann OK', done: c => drilled(c) || c.dialog() !== 'solid.hole'}
                    ]
                },
                {
                    kind: 'game',
                    title: 'Bewundere deinen Anhänger',
                    text: '<p>Fertig! 🎉 Dreh den Anhänger und schau durch das Loch.</p>' +
                        '<p>Gib ihm eine Farbe: Klicke auf den Anhänger und drücke die Taste <b>A</b>.</p>',
                    tasks: [
                        {text: 'Ich habe durch das Loch geschaut', manual: true},
                        {text: 'Mein Anhänger hat eine Farbe', manual: true}
                    ]
                },
                {
                    kind: 'challenge',
                    title: 'Challenge: Dein eigener Anhänger',
                    autoHints: false,
                    text: '<p>Such dir mindestens eine Idee aus – ohne Hand:</p>' +
                        '<ul><li>Schreib deine <b>Initialen</b> erhaben auf den Anhänger (wie beim Namensschild)</li>' +
                        '<li>Brich die obere Kante mit <b>Abschrägung</b> statt sie zu runden</li>' +
                        '<li>Bau einen Anhänger in einer anderen Form – z. B. aus einem <b>Kreis</b></li></ul>',
                    tasks: [{text: 'Ich habe eine Idee umgesetzt', manual: true}],
                    hints: [{target: 'tool:sketch.create', text: 'Neue Skizze', done: c => c.newSketches() >= 1}]
                },
                exportStep('deinen Anhänger')
            ]
        },
        {
            id: 'wuerfel',
            title: 'Dein Spielwürfel',
            level: 'probiert',
            type: 'Spiel',
            icon: '🎲',
            autoHints: true,
            steps: [
                {
                    kind: 'info',
                    title: 'Was bauen wir?',
                    text: '<p>Einen echten <b>Spielwürfel</b> zum Ausdrucken! Er ist 20 mm groß und hat auf jeder Seite ' +
                        'die richtigen <b>Augen</b>.</p>' +
                        '<p>Neu lernst du:</p>' +
                        '<ul><li><b>Kreis</b> zeichnen</li>' +
                        '<li>mit <b>Ausschneiden</b> Material wegnehmen statt dazuzufügen</li>' +
                        '<li>Kanten mit <b>Abschrägung</b> brechen, damit der Würfel schön rollt</li></ul>' +
                        '<p>Wusstest du? Gegenüberliegende Seiten ergeben beim Würfel zusammen immer <b>7</b>.</p>'
                },
                {
                    kind: 'learn',
                    title: 'Ein Würfel',
                    text: '<p>Zeichne auf der Bodenebene ein <b>Quadrat</b> mit dem <b>Rechteck</b>-Werkzeug: ' +
                        '<b>20 × 20 mm</b>. Beende die Skizze und extrudiere es <b>20 mm</b> hoch.</p>' +
                        '<p>Alle drei Seiten gleich lang – fertig ist der Würfel!</p>',
                    tasks: [
                        {text: 'Zeichne ein Quadrat', check: profileDrawn},
                        {text: 'Extrudiere es zum Würfel', check: cubeDone}
                    ],
                    hints: [
                        ...sketchHints({plane: 'plane:XY', planeText: 'Klicke auf die Bodenebene',
                            tool: 'tool:sketch.rectangle.two_point', toolText: 'Klicke auf „Rechteck“',
                            drawText: 'Klicke zwei Ecken (20 × 20)', done: cubeDone}),
                        ...extrudeHints({text: 'Tippe 20 ein, dann OK', done: cubeDone})
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Das erste Auge',
                    text: '<p>Ein Auge ist eine kleine Mulde. Starte eine <b>Neue Skizze</b> auf der <b>Oberseite</b> und ' +
                        'zeichne mit <b>Kreis</b> einen Kreis in die Mitte: erst die Mitte klicken, dann ziehen – ' +
                        'etwa <b>4 mm</b> Durchmesser.</p>' +
                        '<p>Beende die Skizze und klicke auf <b>Extrudieren</b>. Klicke in den Kreis und wähle bei ' +
                        '<b>Operation</b> den Eintrag <b>Ausschneiden</b>. Tippe bei <b>Abstand</b> eine <b>1</b> ein. ' +
                        'Zeigt die Vorschau nach außen, nimm <b>Richtung umkehren</b>.</p>',
                    tasks: [
                        {text: 'Zeichne einen Kreis auf der Oberseite', check: circleOnFace},
                        {text: 'Schneide das Auge aus', check: c => c.volume() < c.base.volume - 2}
                    ],
                    hints: [
                        ...sketchHints({plane: zTop, planeText: 'Klicke auf die Oberseite',
                            tool: 'tool:sketch.circle.center', toolText: 'Klicke auf „Kreis“',
                            drawTarget: zTop, drawText: 'Mitte klicken, dann ziehen',
                            drawn: circleOnFace, done: c => c.volume() < c.base.volume - 2}),
                        ...extrudeHints({pickText: 'Klicke in den Kreis', field: 'dialog:Operation',
                            text: '„Ausschneiden“, Abstand 1, OK', done: c => c.volume() < c.base.volume - 2})
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Alle Seiten',
                    autoHints: false,
                    text: '<p>Jetzt bekommt jede Seite ihre Augen: <b>1 bis 6</b>. Gegenüber liegen 1 und 6, 2 und 5, 3 und 4.</p>' +
                        '<p>Tipp: Du kannst <b>mehrere Kreise in eine Skizze</b> zeichnen und sie alle auf einmal ' +
                        'ausschneiden. Dreh den Würfel mit der rechten Maustaste, um an die anderen Seiten zu kommen.</p>' +
                        '<p>Brauchst du Hilfe, drücke auf <b>👆 Zeig mir wie</b>.</p>',
                    tasks: [
                        {text: 'Mindestens 6 Augen', check: c => pips(c) >= 6},
                        {text: 'Alle 21 Augen (1 + 2 + 3 + 4 + 5 + 6)', check: c => pips(c) >= 21}
                    ],
                    hints: [
                        {target: 'tool:sketch.create', text: 'Neue Skizze auf der nächsten Seite',
                            done: c => c.inSketch() || c.dialog() === 'sketch.create'},
                        {target: 'tool:sketch.circle.center', text: 'Kreise zeichnen',
                            done: c => !c.inSketch() || c.tool() === 'sketch.circle.center'}
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Kanten brechen',
                    text: '<p>Ein echter Würfel hat keine scharfen Kanten. Klicke auf <b>Abschrägung</b> und dann auf ' +
                        'die Kanten – am schnellsten alle zwölf. Tippe bei <b>Abstand</b> eine <b>1</b> ein und klicke auf <b>OK</b>.</p>' +
                        '<p>Runde Kanten mit <b>Vollrundung</b> gehen auch!</p>',
                    tasks: [
                        {text: 'Wähle „Abschrägung“ oder „Vollrundung“',
                            check: c => ['solid.chamfer', 'solid.fillet'].includes(c.dialog()) || edgesBroken(c)},
                        {text: 'Brich die Kanten', check: edgesBroken}
                    ],
                    hints: [
                        {target: 'tool:solid.chamfer', text: 'Klicke auf „Abschrägung“',
                            done: c => ['solid.chamfer', 'solid.fillet'].includes(c.dialog()) || edgesBroken(c)},
                        {target: cornerEdge, text: 'Klicke die Kanten an',
                            done: c => c.dialogPicked('Edges') > 0 || !['solid.chamfer', 'solid.fillet'].includes(c.dialog()) || edgesBroken(c)},
                        {target: 'dialog:Distance', text: 'Tippe 1 ein, dann OK',
                            done: c => edgesBroken(c) || c.dialog() !== 'solid.chamfer'}
                    ]
                },
                {
                    kind: 'game',
                    title: 'Würfel-Check',
                    text: '<p>Dreh deinen Würfel einmal ganz herum. Stimmt alles?</p>',
                    tasks: [
                        {text: 'Jede Zahl von 1 bis 6 kommt genau einmal vor', manual: true},
                        {text: 'Gegenüber ergibt es immer 7', manual: true}
                    ]
                },
                {
                    kind: 'challenge',
                    title: 'Challenge: Würfel-Werkstatt',
                    autoHints: false,
                    text: '<p>Such dir eine Idee aus:</p>' +
                        '<ul><li>Runde Augen wie Kugeln: Suche oben nach <b>Kugel</b> und wähle Operation <b>Ausschneiden</b></li>' +
                        '<li>Ein <b>Riesenwürfel</b> mit 30 mm</li>' +
                        '<li>Ein Würfel mit <b>Symbolen</b> statt Augen – z. B. Text oder Sterne</li></ul>',
                    tasks: [{text: 'Ich habe eine Idee umgesetzt', manual: true}],
                    hints: [{target: 'handle:ribbon:search', text: 'Hier suchen', done: () => false}]
                },
                exportStep('deinen Würfel')
            ]
        },
        {
            id: 'koecher',
            title: 'Dein Stifteköcher',
            level: 'probiert',
            type: 'Alltag',
            icon: '✏️',
            autoHints: true,
            steps: [
                {
                    kind: 'info',
                    title: 'Was bauen wir?',
                    text: '<p>Einen <b>Stifteköcher</b> für deinen Schreibtisch – mit einem kleinen Extrafach.</p>' +
                        '<p>Neu lernst du:</p>' +
                        '<ul><li><b>Hülle</b> – höhlt einen Körper aus, übrig bleibt eine Wand</li>' +
                        '<li><b>Neuer Körper</b> – ein zweites Teil bauen, ohne das erste zu verändern</li>' +
                        '<li><b>Kombinieren</b> – zwei Körper zu einem verbinden</li></ul>'
                },
                {
                    kind: 'learn',
                    title: 'Ein Zylinder',
                    text: '<p>Starte eine <b>Neue Skizze</b> auf der Bodenebene und zeichne mit <b>Kreis</b> einen Kreis um den ' +
                        'Mittelpunkt – etwa <b>60 mm</b> Durchmesser.</p>' +
                        '<p>Beende die Skizze und extrudiere den Kreis <b>90 mm</b> hoch. Schon steht eine dicke Säule da!</p>',
                    tasks: [
                        {text: 'Zeichne einen Kreis', check: profileDrawn},
                        {text: 'Extrudiere ihn mindestens 40 mm hoch', check: cylinderDone}
                    ],
                    hints: [
                        ...sketchHints({plane: 'plane:XY', planeText: 'Klicke auf die Bodenebene',
                            tool: 'tool:sketch.circle.center', toolText: 'Klicke auf „Kreis“',
                            drawText: 'Mitte klicken, dann ziehen', done: cylinderDone}),
                        ...extrudeHints({pickText: 'Klicke in den Kreis', text: 'Tippe 90 ein, dann OK', done: cylinderDone})
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Aushöhlen',
                    text: '<p>Eine Säule ist kein Köcher. Klicke auf <b>Hülle</b> und dann auf die <b>Oberseite</b> – ' +
                        'diese Fläche wird zur Öffnung.</p>' +
                        '<p>Tippe bei <b>Dicke</b> eine <b>2</b> ein (2 mm Wand) und klicke auf <b>OK</b>.</p>',
                    tasks: [
                        {text: 'Wähle „Hülle“', check: c => c.dialog() === 'solid.shell' || shelled(c)},
                        {text: 'Höhle den Zylinder aus', check: shelled}
                    ],
                    hints: [
                        {target: 'tool:solid.shell', text: 'Klicke auf „Hülle“', done: c => c.dialog() === 'solid.shell' || shelled(c)},
                        {target: longTop, text: 'Klicke auf die Oberseite',
                            done: c => c.dialogPicked('Faces/Body') > 0 || c.dialog() !== 'solid.shell' || shelled(c)},
                        {target: 'dialog:Thickness', text: 'Tippe 2 ein, dann OK', done: c => shelled(c) || c.dialog() !== 'solid.shell'}
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Den Rand abrunden',
                    text: '<p>Der obere Rand ist scharf. Klicke auf <b>Vollrundung</b> und dann auf die <b>äußere obere Kante</b>. ' +
                        'Tippe bei <b>Radius</b> eine <b>1</b> ein – mehr geht nicht, die Wand ist ja nur 2 mm dick.</p>',
                    tasks: [{text: 'Runde den Rand ab', check: filleted}],
                    hints: [
                        {target: 'tool:solid.fillet', text: 'Klicke auf „Vollrundung“', done: c => c.dialog() === 'solid.fillet' || filleted(c)},
                        {target: rimEdge, text: 'Klicke die obere Kante',
                            done: c => c.dialogPicked('Edges') > 0 || c.dialog() !== 'solid.fillet' || filleted(c)},
                        {target: 'dialog:Radius', text: 'Tippe 1 ein, dann OK', done: c => filleted(c) || c.dialog() !== 'solid.fillet'}
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Ein zweites Fach',
                    text: '<p>Für Radiergummi und Spitzer bauen wir ein kleines Fach <b>daneben</b>. Zeichne auf der Bodenebene ' +
                        'einen zweiten Kreis (etwa <b>40 mm</b>), der den großen Kreis <b>ein kleines Stück überlappt</b>.</p>' +
                        '<p>Extrudiere ihn <b>60 mm</b> hoch und wähle bei <b>Operation</b> den Eintrag <b>Neuer Körper</b> – ' +
                        'so bleibt dein Köcher, wie er ist.</p>',
                    tasks: [
                        {text: 'Zeichne den zweiten Kreis', check: profileDrawn},
                        {text: 'Extrudiere ihn als neuen Körper', check: newBody}
                    ],
                    hints: [
                        ...sketchHints({plane: 'plane:XY', planeText: 'Klicke auf die Bodenebene',
                            tool: 'tool:sketch.circle.center', toolText: 'Klicke auf „Kreis“',
                            drawText: 'Neben dem Köcher zeichnen', done: newBody}),
                        ...extrudeHints({pickText: 'Klicke in den neuen Kreis', field: 'dialog:Operation',
                            text: '„Neuer Körper“, Abstand 60, OK', done: newBody})
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Aushöhlen und verbinden',
                    text: '<p>Höhle auch das Fach mit <b>Hülle</b> aus (Oberseite anklicken, Dicke 2).</p>' +
                        '<p>Dann werden beide Körper eins: Suche oben nach <b>Kombinieren</b>. Klicke als <b>Zielkörper</b> den ' +
                        'großen Köcher an, als <b>Werkzeugkörper</b> das Fach, und klicke auf <b>OK</b>.</p>',
                    tasks: [
                        {text: 'Höhle das Fach aus', check: shelled},
                        {text: 'Verbinde beide Körper', check: combined}
                    ],
                    hints: [
                        {target: 'tool:solid.shell', text: 'Klicke auf „Hülle“', done: c => c.dialog() === 'solid.shell' || shelled(c)},
                        {target: 'dialog:Thickness', text: 'Oberseite klicken, Dicke 2, OK', done: c => shelled(c) || c.dialog() !== 'solid.shell'},
                        {target: 'tool:solid.combine', search: 'Kombinieren', text: 'Suche „Kombinieren“',
                            done: c => c.dialog() === 'solid.combine' || combined(c)},
                        {target: 'dialog:Target Body', text: 'Zuerst den großen Köcher',
                            done: c => c.dialogPicked('Target Body') > 0 || c.dialog() !== 'solid.combine' || combined(c)},
                        {target: 'dialog:Tool Bodies', text: 'Dann das Fach, OK', done: c => combined(c) || c.dialog() !== 'solid.combine'}
                    ]
                },
                {
                    kind: 'game',
                    title: 'Bewundere deinen Köcher',
                    text: '<p>Dreh den Köcher und schau hinein. Gib ihm eine Farbe (Taste <b>A</b>).</p>',
                    tasks: [
                        {text: 'Ich habe von oben hineingeschaut', manual: true},
                        {text: 'Mein Köcher hat eine Farbe', manual: true}
                    ]
                },
                {
                    kind: 'challenge',
                    title: 'Challenge: Dein Design',
                    autoHints: false,
                    text: '<ul><li>Ein <b>sechseckiger</b> Köcher: Suche nach <b>Eingeschriebenes Polygon</b> statt Kreis</li>' +
                        '<li>Dein <b>Name</b> erhaben auf der Wand</li>' +
                        '<li>Ein drittes Fach – oder Füße unten dran</li></ul>',
                    tasks: [{text: 'Ich habe eine Idee umgesetzt', manual: true}],
                    hints: [{target: 'handle:ribbon:search', text: 'Hier suchen', done: () => false}]
                },
                exportStep('deinen Köcher')
            ]
        },
        {
            id: 'box',
            title: 'Box mit Deckel',
            level: 'profi',
            type: 'Technik',
            icon: '📦',
            autoHints: false,
            steps: [
                {
                    kind: 'info',
                    title: 'Was bauen wir?',
                    text: '<p>Eine <b>Box mit Deckel</b>, der wirklich passt. Dafür brauchst du zwei Teile – und ein bisschen Mathe.</p>' +
                        '<p>Wichtig beim 3D-Druck: Zwei Teile, die ineinander sollen, brauchen <b>Spiel</b> ' +
                        '(auch <b>Toleranz</b> genannt). Macht man den Deckelrand genau so groß wie die Öffnung, klemmt er. ' +
                        'Mit <b>0,2 mm</b> Luft pro Seite passt er.</p>' +
                        '<p>Die Hand hilft nur, wenn du auf <b>👆 Zeig mir wie</b> drückst.</p>'
                },
                {
                    kind: 'learn',
                    title: 'Die Box',
                    text: '<p>Zeichne auf der Bodenebene ein Rechteck <b>60 × 40 mm</b> und extrudiere es <b>30 mm</b> hoch.</p>' +
                        '<p>Höhle es mit <b>Hülle</b> aus: Oberseite anklicken, <b>Dicke 2</b>. Die Öffnung ist jetzt innen ' +
                        '<b>56 × 36 mm</b> groß (60 − 2 × 2 und 40 − 2 × 2).</p>',
                    tasks: [
                        {text: 'Box mindestens 15 mm hoch', check: c => !c.inSketch() && c.bodyCount() >= 1 && Math.min(...dims(c.largest())) >= 15},
                        {text: 'Box ausgehöhlt', check: shelled}
                    ],
                    hints: [
                        ...sketchHints({plane: 'plane:XY', planeText: 'Klicke auf die Bodenebene',
                            tool: 'tool:sketch.rectangle.two_point', toolText: 'Klicke auf „Rechteck“',
                            drawText: '60 × 40 mm', done: c => c.bodyCount() >= 1}),
                        ...extrudeHints({text: 'Tippe 30 ein, dann OK', done: c => c.bodyCount() >= 1}),
                        {target: 'tool:solid.shell', text: 'Klicke auf „Hülle“', done: c => c.dialog() === 'solid.shell' || shelled(c)},
                        {target: 'dialog:Thickness', text: 'Oberseite klicken, Dicke 2, OK', done: c => shelled(c) || c.dialog() !== 'solid.shell'}
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Die Deckelplatte',
                    text: '<p>Der Deckel entsteht <b>neben</b> der Box. Zeichne auf der Bodenebene ein zweites Rechteck ' +
                        '<b>60 × 40 mm</b> mit etwas Abstand zur Box.</p>' +
                        '<p>Extrudiere es <b>2 mm</b> und wähle bei <b>Operation</b> den Eintrag <b>Neuer Körper</b>.</p>',
                    tasks: [{text: 'Deckelplatte als neuer Körper', check: c => newBody(c) && Math.min(...dims(newest(c))) <= 4}],
                    hints: [
                        ...sketchHints({plane: 'plane:XY', planeText: 'Klicke auf die Bodenebene',
                            tool: 'tool:sketch.rectangle.two_point', toolText: 'Klicke auf „Rechteck“',
                            drawText: 'Neben der Box: 60 × 40', done: newBody}),
                        ...extrudeHints({field: 'dialog:Operation', text: '„Neuer Körper“, Abstand 2, OK', done: newBody})
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Der Rand mit Spiel',
                    text: '<p>Unter den Deckel kommt ein Rand, der in die Öffnung greift. Rechne:</p>' +
                        '<p>Öffnung 56 × 36 mm, minus 2 × 0,2 mm Spiel = <b>55,6 × 35,6 mm</b>.</p>' +
                        '<p>Starte eine <b>Neue Skizze</b> auf der Deckelplatte und zeichne ein Rechteck in diesem Maß – ' +
                        'mittig, mit <b>Rechteck vom Mittelpunkt</b> geht es am leichtesten. Extrudiere es <b>3 mm</b> mit ' +
                        '<b>Verbinden</b>. Zum Drucken drehst du den Deckel später einfach um.</p>',
                    tasks: [
                        {text: 'Rand auf den Deckel gebaut', check: c => !c.inSketch() && c.newFeatures('ExtrudeFeature') >= 1 && c.volume() > c.base.volume + 100},
                        {text: 'Ich habe nachgerechnet: Rand = Öffnung − 0,4 mm', manual: true}
                    ],
                    hints: [
                        {target: 'tool:sketch.create', text: 'Klicke auf „Neue Skizze“', done: c => c.inSketch() || c.newSketches() >= 1},
                        {target: lidTop, text: 'Klicke auf die Deckelplatte', done: c => c.inSketch() || c.newSketches() >= 1},
                        {target: 'tool:sketch.rectangle.center', search: 'Rechteck vom Mittelpunkt', text: '„Rechteck vom Mittelpunkt“',
                            done: c => /^sketch\.rectangle/.test(c.tool() || '') || !c.inSketch()},
                        {target: 'tool:sketch.finish', text: '55,6 × 35,6 – dann beenden', done: c => !c.inSketch()}
                    ]
                },
                {
                    kind: 'game',
                    title: 'Passt das?',
                    text: '<p>Dreh deine Teile und vergleiche: Ist der Rand des Deckels <b>ein kleines bisschen kleiner</b> ' +
                        'als die Öffnung der Box?</p>' +
                        '<p>Profi-Tipp: Im Tab <b>Prüfen</b> findest du ein Werkzeug zum <b>Messen</b>.</p>',
                    tasks: [{text: 'Der Rand ist kleiner als die Öffnung', manual: true}]
                },
                {
                    kind: 'challenge',
                    title: 'Challenge: Deine Box',
                    autoHints: false,
                    text: '<ul><li>Ein <b>Griff</b> oben auf dem Deckel</li>' +
                        '<li>Eine <b>Trennwand</b> in der Box für zwei Fächer</li>' +
                        '<li>Dein <b>Name</b> auf dem Deckel</li>' +
                        '<li>Runde Ecken – Achtung: Dann braucht auch der Rand runde Ecken!</li></ul>',
                    tasks: [{text: 'Ich habe eine Idee umgesetzt', manual: true}]
                },
                exportStep('Box und Deckel')
            ]
        },
        {
            id: 'rakete',
            title: 'Deine Rakete',
            level: 'profi',
            type: 'Technik',
            icon: '🚀',
            autoHints: false,
            steps: [
                {
                    kind: 'info',
                    title: 'Was bauen wir?',
                    text: '<p>Eine <b>Rakete</b> mit drei Flossen! Runde Teile baut man nicht aus Kreisen und Kegeln zusammen, ' +
                        'sondern zeichnet ihr <b>halbes Profil</b> und <b>dreht</b> es einmal im Kreis – wie auf einer Töpferscheibe.</p>' +
                        '<p>Neu lernst du:</p>' +
                        '<ul><li><b>Linie</b> – Formen Punkt für Punkt zeichnen</li>' +
                        '<li><b>Drehen</b> – ein Profil um eine Achse drehen</li>' +
                        '<li><b>Kreisförmiges Muster</b> – ein Teil mehrmals im Kreis verteilen</li></ul>' +
                        '<p>Die Hand hilft, wenn du auf <b>👆 Zeig mir wie</b> drückst.</p>'
                },
                {
                    kind: 'learn',
                    title: 'Die halbe Rakete',
                    text: '<p>Starte eine <b>Neue Skizze</b> auf der <b>Frontebene</b> (die senkrechte Ebene, XZ).</p>' +
                        '<p>Zeichne mit <b>Linie</b> die rechte Hälfte der Rakete – Punkt für Punkt, vom Mittelpunkt aus: ' +
                        '10 mm nach rechts, 50 mm nach oben, schräg zur Spitze zurück auf die Mittellinie (20 mm höher) ' +
                        'und wieder hinunter zum Start. Die Form muss <b>geschlossen</b> sein. Dann <b>Skizze beenden</b>.</p>',
                    tasks: [
                        {text: 'Zeichne die geschlossene halbe Form', check: profileDrawn},
                        {text: 'Beende die Skizze', check: c => !c.inSketch() && c.newSketches() >= 1}
                    ],
                    hints: [
                        ...sketchHints({plane: 'plane:XZ', planeText: 'Klicke auf die Frontebene',
                            tool: 'tool:sketch.line', toolText: 'Klicke auf „Linie“',
                            drawText: 'Punkt für Punkt klicken', done: c => !c.inSketch() && c.newSketches() >= 1}),
                        {target: 'tool:sketch.finish', text: 'Klicke auf „Skizze beenden“', done: c => !c.inSketch()}
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Drehen',
                    text: '<p>Klicke auf <b>Drehen</b>. Wähle dein Profil (in die Form klicken) und als <b>Achse</b> die ' +
                        'blaue <b>Z-Achse</b> – die senkrechte Mittellinie. Klicke auf <b>OK</b>.</p>' +
                        '<p>Aus der halben Form wird ein runder Raketenrumpf! Hängt sie im Modell <b>kopfüber</b>? ' +
                        'Das ist kein Fehler – SolidCraft zählt auf der Frontebene von oben nach unten. ' +
                        'Im Druckprogramm stellst du sie einfach richtig herum hin.</p>',
                    tasks: [
                        {text: 'Wähle „Drehen“', check: c => c.dialog() === 'solid.revolve' || revolved(c)},
                        {text: 'Dreh das Profil zum Rumpf', check: revolved}
                    ],
                    hints: [
                        {target: 'tool:solid.revolve', text: 'Klicke auf „Drehen“', done: c => c.dialog() === 'solid.revolve' || revolved(c)},
                        {target: sketchTarget, text: 'Klicke in deine Form',
                            done: c => c.dialogPicked('Profile') > 0 || c.dialog() !== 'solid.revolve' || revolved(c)},
                        {target: 'axis:Z', text: 'Dann die blaue Z-Achse, OK', done: c => revolved(c) || c.dialog() !== 'solid.revolve'}
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Eine Flosse',
                    text: '<p>Starte wieder eine <b>Neue Skizze</b> auf der Frontebene und zeichne mit <b>Linie</b> ein ' +
                        '<b>Dreieck</b> unten rechts am Rumpf – es soll den Rumpf ein kleines bisschen berühren.</p>' +
                        '<p>Extrudiere es <b>2 mm</b>: Stell die <b>Richtung</b> auf <b>Symmetrisch</b> und die ' +
                        '<b>Operation</b> auf <b>Neuer Körper</b>.</p>',
                    tasks: [{text: 'Flosse als neuer Körper', check: newBody}],
                    hints: [
                        ...sketchHints({plane: 'plane:XZ', planeText: 'Klicke auf die Frontebene',
                            tool: 'tool:sketch.line', toolText: 'Klicke auf „Linie“',
                            drawText: 'Ein Dreieck zeichnen', done: newBody}),
                        ...extrudeHints({pickText: 'Klicke in das Dreieck', field: 'dialog:Operation',
                            text: 'Symmetrisch, „Neuer Körper“, 2, OK', done: newBody})
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Drei Flossen',
                    text: '<p>Eine Flosse reicht nicht. Suche oben nach <b>Kreisförmiges Muster</b>. Wähle als <b>Objekte</b> ' +
                        'deine Flosse, als <b>Achse</b> die Z-Achse und stell die <b>Anzahl</b> auf <b>3</b>. <b>OK</b> – ' +
                        'schon sind es drei Flossen, schön gleichmäßig verteilt.</p>',
                    tasks: [{text: 'Drei Flossen im Kreis', check: patterned}],
                    hints: [
                        {target: 'tool:solid.pattern.circular', search: 'Kreisförmiges Muster', text: 'Suche „Kreisförmiges Muster“',
                            done: c => c.dialog() === 'solid.pattern.circular' || patterned(c)},
                        {target: 'dialog:Objects', text: 'Klicke die Flosse an',
                            done: c => c.dialogPicked('Objects') > 0 || c.dialog() !== 'solid.pattern.circular' || patterned(c)},
                        {target: 'axis:Z', text: 'Achse: die Z-Achse',
                            done: c => c.dialogPicked('Axis') > 0 || c.dialog() !== 'solid.pattern.circular' || patterned(c)},
                        {target: 'dialog:Quantity', text: 'Anzahl 3, dann OK', done: c => patterned(c) || c.dialog() !== 'solid.pattern.circular'}
                    ]
                },
                {
                    kind: 'learn',
                    title: 'Alles verbinden',
                    text: '<p>Zum Drucken soll die Rakete <b>ein</b> Teil sein. Suche nach <b>Kombinieren</b>: ' +
                        '<b>Zielkörper</b> ist der Rumpf, <b>Werkzeugkörper</b> sind alle drei Flossen. <b>OK</b>.</p>',
                    tasks: [{text: 'Rumpf und Flossen verbunden', check: combined}],
                    hints: [
                        {target: 'tool:solid.combine', search: 'Kombinieren', text: 'Suche „Kombinieren“',
                            done: c => c.dialog() === 'solid.combine' || combined(c)},
                        {target: 'dialog:Target Body', text: 'Zuerst den Rumpf',
                            done: c => c.dialogPicked('Target Body') > 0 || c.dialog() !== 'solid.combine' || combined(c)},
                        {target: 'dialog:Tool Bodies', text: 'Dann alle Flossen, OK', done: c => combined(c) || c.dialog() !== 'solid.combine'}
                    ]
                },
                {
                    kind: 'game',
                    title: 'Startklar?',
                    text: '<p>3 … 2 … 1 … 🚀 Dreh deine Rakete von allen Seiten und gib ihr Farben.</p>',
                    tasks: [{text: 'Meine Rakete ist startklar', manual: true}]
                },
                {
                    kind: 'challenge',
                    title: 'Challenge: Raumfahrt-Werkstatt',
                    autoHints: false,
                    text: '<ul><li>Ein <b>Bullauge</b>: Kreis auf den Rumpf und mit <b>Ausschneiden</b> leicht vertiefen</li>' +
                        '<li>Eine andere Spitze – rund oder ganz spitz</li>' +
                        '<li>Bau mit <b>Drehen</b> einen <b>Kreisel</b>: Profil zeichnen, drehen, fertig!</li></ul>',
                    tasks: [{text: 'Ich habe eine Idee umgesetzt', manual: true}]
                },
                exportStep('deine Rakete')
            ]
        }
    ];

    const levels = {neuling: 'namensschild', probiert: 'wuerfel', profi: 'box'};

    window.SolidcraftKursCourse = {chapters, levels};
})();
