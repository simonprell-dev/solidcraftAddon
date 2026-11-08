// Kapitel „pruefen“ – Register „Prüfen“ und „Ansicht“: die Detektiv-Werkstatt.
// Live geprüft (SolidCraft 0.30.1):
//  - Messen, Schnitt, Eingriff öffnen Dialoge (ui.dialog.command inspect.measure | inspect.section |
//    inspect.interference); Massenschwerpunkt, Krümmungskamm, Isokurve sind Werkzeuge (ui.tool).
//  - Eigenschaften öffnet ein Fenster ohne ui.dialog – erkennbar an Handles dialog:row:Masse (de) bzw. dialog:row:Mass.
//  - Schnitt, Zebra, Krümmung, Abziehen, Zugriff zeigen solange sie an sind ein Etikett im 3D-Fenster:
//    Handle viewport_status:<Section|SurfaceAnalysis>:<command>:name.
//  - Eingriff → „Berechnen“ zeigt die Überschneidungen rot; Ergebniszeilen dialog:row:Checked / dialog:row:Interferes.
//  - Verlauf: document.inspect().marker (= Anzahl Elemente, wenn der Marker am Ende steht).
//  - Benannte Ansichten: der Knopf „Ansicht speichern“ meldet im Web „`camera` is required“; zuverlässig ist
//    der Browser: Rechtsklick „Benannte Ansichten“ → menu:ui.newView, Rechtsklick Ansicht → menu:ui.restoreView.
//    view.list liest nur (document.revision und Rückgängig-Liste bleiben gleich).
//  - Kontakt, Abhängige Elemente und Prüfen (Konstruktion prüfen) zeigen im Web ohne Gelenke bzw. Auswahl nichts
//    Sichtbares – sie werden nur erklärt.
(function () {
    'use strict';
    const K = window.SolidcraftKursCourse;
    const {world, dims, sketchHints, extrudeHints, exportStep, shelled, newBody} = K.helpers;

    if (window.SolidcraftKursAccess) window.SolidcraftKursAccess.addRead({key: 'pruefen.views', command: 'view.list', chapter: 'pruefen'});

    // Einmal gesehen bleibt gesehen – pro Schritt (c.base gehört zu genau einem Schritt).
    const memo = new WeakMap();
    function sticky (c, key, cond) {
        let m = memo.get(c.base);
        if (!m) memo.set(c.base, m = {});
        if (cond) m[key] = true;
        return !!m[key];
    }

    const onTab = (c, tab) => !!(c.ui().ui && c.ui().ui.tab === tab);
    const tabHint = (tab, text, done) => ({target: 'tab:' + tab, text, done: c => onTab(c, tab) || done(c)});
    const analysisOn = (c, cmd) => c.has(`viewport_status:SurfaceAnalysis:${cmd}:name`);
    const sectionOn = c => c.has('viewport_status:Section:inspect.section:name');

    // Becher: ein Zylinder (mind. 30 mm hoch), ausgehöhlt.
    const cylinder = c => !c.inSketch() && c.faceCount('cylinder') >= 1 && c.bodies().some(b => dims(b)[2] >= 30);
    const cupDone = c => cylinder(c) && (shelled(c) || c.features('ShellFeature') >= 1);
    const shellOpen = c => c.dialog() === 'solid.shell';
    const picked = c => ((c.ui().dialog && c.ui().dialog.inputs) || []).some(i => (i.items || []).length > 0);
    // Außen am oberen Rand des größten Körpers.
    const rim = c => {
        const b = c.largest();
        if (!b || !b.bbox) return 'viewport';
        return world([b.bbox.max[0], (b.bbox.min[1] + b.bbox.max[1]) / 2, b.bbox.max[2]]);
    };
    const top = c => {
        const b = c.largest();
        if (!b || !b.bbox) return 'viewport';
        return world([(b.bbox.min[0] + b.bbox.max[0]) / 2, (b.bbox.min[1] + b.bbox.max[1]) / 2, b.bbox.max[2]]);
    };

    // Messen, wiegen, ausbalancieren
    const measured = c => sticky(c, 'measured', c.dialog() === 'inspect.measure' && c.dialogPicked('Items') >= 1);
    const measureOpened = c => sticky(c, 'measureOpen', c.dialog() === 'inspect.measure') || measured(c);
    const comSeen = c => sticky(c, 'com', c.tool() === 'inspect.center_of_mass');
    const propsOpen = c => ['Masse', 'Mass', 'Volumen', 'Volume'].some(r => c.has('dialog:row:' + r));
    const propsSeen = c => sticky(c, 'props', propsOpen(c));

    // Schnitt
    const sectionDone = c => sticky(c, 'section', sectionOn(c));
    const sectionOpened = c => sticky(c, 'sectionOpen', c.dialog() === 'inspect.section') || sectionDone(c);

    // Eingriff
    const interfOpen = c => c.dialog() === 'inspect.interference';
    const interfOpened = c => sticky(c, 'interfOpen', interfOpen(c));
    const interfComputed = c => sticky(c, 'interf', interfOpen(c) && (c.has('dialog:row:Checked') || c.has('dialog:row:Interferes')));
    const computeButton = c => ['Berechnen', 'Compute', 'Calculate'].map(n => 'dialog:button::' + n).find(n => c.has(n));
    const computeTarget = c => (computeButton(c) ? 'handle:' + computeButton(c) : 'dialog:Clearance');

    // Oberflächenqualität
    const zebraSeen = c => sticky(c, 'zebra', analysisOn(c, 'inspect.zebra'));
    const curvSeen = c => sticky(c, 'curv', analysisOn(c, 'inspect.curvature_map'));
    const draftSeen = c => sticky(c, 'draft', analysisOn(c, 'inspect.draft') || analysisOn(c, 'inspect.accessibility'));

    // Verlauf
    const timelineLen = c => (c.doc().timeline || []).length;
    const marker = c => (c.doc().marker == null ? timelineLen(c) : c.doc().marker);
    const rewound = c => sticky(c, 'rewound', timelineLen(c) > 0 && marker(c) < timelineLen(c));
    const played = c => {
        const r = rewound(c);
        return sticky(c, 'played', r && marker(c) >= timelineLen(c));
    };

    // Benannte Ansichten (view.list liest nur)
    const views = c => ((c.extra('pruefen.views') || {}).views || []);
    const viewSaved = c => views(c).length >= 1;
    const near = (a, b, tol) => Math.abs((a || 0) - (b || 0)) <= tol;
    const atView = c => {
        const cam = c.ui().camera;
        if (!cam) return false;
        return views(c).some(v => near(cam.yaw, v.yaw, 0.02) && near(cam.pitch, v.pitch, 0.02) &&
            near(cam.distance, v.distance, Math.max(1, v.distance * 0.02)) &&
            [0, 1, 2].every(i => near((cam.target || [])[i], (v.target || [])[i], 1)));
    };
    const turnedAway = c => sticky(c, 'away', viewSaved(c) && !atView(c));
    const restored = c => {
        const away = turnedAway(c);
        return sticky(c, 'restored', away && atView(c));
    };
    const viewRow = c => {
        const v = views(c);
        return v.length ? 'handle:row:' + v[v.length - 1].name : 'handle:row:Named Views';
    };

    // Challenge
    const combSeen = c => sticky(c, 'comb', c.tool() === 'inspect.curvature_comb' || c.tool() === 'inspect.isocurve');

    K.add({
        id: 'pruefen',
        title: 'Die Detektiv-Werkstatt',
        level: 'profi',
        type: 'Prüfen & Ansicht',
        icon: '🔍',
        autoHints: true,
        steps: [
            {
                kind: 'info',
                title: 'Was untersuchen wir?',
                text: '<p>Heute bist du <b>Detektiv</b>! Du baust schnell einen <b>Becher</b> und untersuchst ihn ' +
                    'dann ganz genau – so wie Ingenieure ihre Teile prüfen, bevor sie gebaut werden.</p>' +
                    '<p>Deine Detektiv-Werkzeuge liegen im Register <b>Prüfen</b>:</p>' +
                    '<ul><li><b>Messen</b>, <b>Massenschwerpunkt</b> und <b>Eigenschaften</b>: Wie groß, wie schwer, wo ist die Mitte?</li>' +
                    '<li><b>Schnitt</b>: in das Teil hineinschauen</li>' +
                    '<li><b>Eingriff</b>: Stecken zwei Teile ineinander fest?</li>' +
                    '<li><b>Zebra</b>, <b>Krümmung</b>, <b>Abziehen</b>, <b>Zugriff</b>: Wie glatt und wie gut herstellbar ist die Oberfläche?</li>' +
                    '<li><b>Verlauf abspielen</b>: dein Bauen wie einen Film ansehen</li></ul>' +
                    '<p>Zum Schluss speicherst du deine Lieblingsansicht – das gehört zum Register <b>Ansicht</b>.</p>'
            },
            {
                kind: 'learn',
                title: 'Ein Becher in zwei Minuten',
                text: '<p>Zuerst brauchst du etwas zum Untersuchen. Starte eine <b>Neue Skizze</b> auf der Bodenebene ' +
                    'und zeichne einen <b>Kreis</b> – ein guter Vorschlag ist <b>60 mm</b> Durchmesser.</p>' +
                    '<p>Beende die Skizze und <b>extrudiere</b> den Kreis etwa <b>80 mm</b> hoch. ' +
                    'Dann klicke auf <b>Hülle</b>, wähle die <b>Oberseite</b> und tippe bei <b>Dicke</b> eine <b>3</b> ein. ' +
                    'Schon hast du einen Becher!</p>',
                tasks: [
                    {text: 'Baue einen Zylinder', check: cylinder},
                    {text: 'Höhle ihn mit „Hülle“ aus', check: cupDone}
                ],
                hints: [
                    tabHint('MODEL', 'Klicke auf das Register „Modell“', c => c.has('toolbar:sketch.create') || c.inSketch() || cylinder(c)),
                    ...sketchHints({plane: 'plane:XY', planeText: 'Klicke auf die Bodenebene',
                        tool: 'tool:sketch.circle.center', toolText: 'Klicke auf „Kreis“',
                        drawText: 'Mitte klicken, dann ziehen', done: cylinder}),
                    ...extrudeHints({pickText: 'Klicke in den Kreis', text: 'Tippe 80 ein, dann OK', done: cylinder}),
                    tabHint('MODEL', 'Klicke auf das Register „Modell“', c => c.has('toolbar:solid.shell') || shellOpen(c) || cupDone(c)),
                    {target: 'tool:solid.shell', text: 'Klicke auf „Hülle“', done: c => shellOpen(c) || cupDone(c)},
                    {target: top, text: 'Klicke auf die Oberseite', done: c => picked(c) || !shellOpen(c) || cupDone(c)},
                    {target: 'dialog:Thickness', text: 'Tippe 3 ein, dann OK', done: c => cupDone(c) || !shellOpen(c)}
                ]
            },
            {
                kind: 'learn',
                title: 'Messen, wiegen, ausbalancieren',
                text: '<p>Wechsle in das Register <b>Prüfen</b>. Klicke auf <b>Messen</b> und dann auf den <b>oberen Rand</b> ' +
                    'deines Bechers. SolidCraft zeigt dir den <b>Durchmesser</b> und den <b>Umfang</b>. ' +
                    'Klickst du nacheinander die Außenwand und die Innenwand an, misst du den <b>Abstand</b> dazwischen – ' +
                    'das ist die <b>Wanddicke</b>.</p>' +
                    '<p>Danach klicke auf <b>Massenschwerpunkt</b>: Der Punkt zeigt, wo dein Becher im Gleichgewicht ist. ' +
                    'Fachleute sagen <b>Schwerpunkt</b> dazu – liegt er tief, kippt der Becher nicht so leicht um.</p>' +
                    '<p>Zum Schluss öffne <b>Eigenschaften</b>: Dort stehen <b>Masse</b> (also das Gewicht), ' +
                    '<b>Volumen</b> (wie viel Platz das Material braucht) und noch mehr.</p>',
                tasks: [
                    {text: 'Öffne „Messen“', check: measureOpened},
                    {text: 'Miss den Becherrand', check: measured},
                    {text: 'Zeige den Massenschwerpunkt', check: comSeen},
                    {text: 'Öffne die Eigenschaften', check: propsSeen}
                ],
                hints: [
                    tabHint('INSPECT', 'Klicke auf das Register „Prüfen“', c => propsSeen(c)),
                    {target: 'tool:inspect.measure', text: 'Klicke auf „Messen“', done: c => c.dialog() === 'inspect.measure' || measured(c)},
                    {target: rim, text: 'Klicke auf den oberen Rand', done: measured},
                    {target: 'tool:inspect.center_of_mass', text: 'Klicke auf „Massenschwerpunkt“', done: comSeen},
                    {target: 'tool:component.properties', text: 'Klicke auf „Eigenschaften“', done: propsSeen}
                ]
            },
            {
                kind: 'learn',
                title: 'Hineinschauen mit Schnitt',
                text: '<p>Ein Detektiv will auch wissen, was <b>innen</b> ist. Klicke auf <b>Schnitt</b> und dann auf ' +
                    'die <b>Vorderebene</b> (sie heißt <b>XZ</b>). SolidCraft schneidet die Ansicht dort auf – ' +
                    'so, als hättest du den Becher mit einem riesigen Messer halbiert.</p>' +
                    '<p>Keine Sorge: Dein Modell bleibt ganz. Es ist nur ein Blick hinein. Mit <b>Abstand</b> kannst du ' +
                    'die Schnittebene verschieben. Klicke auf <b>OK</b>.</p>' +
                    '<p>Oben im 3D-Fenster steht jetzt ein Schild <b>Schnitt</b>. Mit dem <b>×</b> darauf schaltest du ' +
                    'den Schnitt wieder aus.</p>',
                tasks: [
                    {text: 'Öffne „Schnitt“', check: sectionOpened},
                    {text: 'Schau in den Becher hinein', check: sectionDone}
                ],
                hints: [
                    tabHint('INSPECT', 'Klicke auf das Register „Prüfen“', sectionDone),
                    {target: 'tool:inspect.section', text: 'Klicke auf „Schnitt“', done: c => c.dialog() === 'inspect.section' || sectionDone(c)},
                    {target: 'plane:XZ', text: 'Klicke auf die Vorderebene',
                        done: c => c.dialogPicked('Plane') > 0 || c.dialog() !== 'inspect.section' || sectionDone(c)},
                    {target: 'dialog:OK', text: 'Klicke auf „OK“', done: sectionDone}
                ]
            },
            {
                kind: 'learn',
                title: 'Der verdächtige Stift',
                text: '<p>Ein neuer Fall: Steckt ein Stift <b>in der Wand</b> fest? Bau dafür einen Stift: ' +
                    'Wechsle ins Register <b>Modell</b>, starte eine <b>Neue Skizze</b> auf der <b>Vorderebene</b> und zeichne ' +
                    'einen kleinen <b>Kreis</b> (etwa <b>8 mm</b>) mitten über den Becher, ungefähr auf halber Höhe.</p>' +
                    '<p>Extrudiere ihn <b>80 mm</b>: Stell die <b>Richtung</b> auf <b>Symmetrisch</b> und die ' +
                    '<b>Operation</b> auf <b>Neuer Körper</b>. Jetzt geht der Stift quer durch den Becher.</p>' +
                    '<p>Dann zurück ins Register <b>Prüfen</b>: Klicke auf <b>Eingriff</b> und auf <b>Berechnen</b>. ' +
                    'Alles, wo sich zwei Körper <b>überschneiden</b>, wird rot – mit dem Volumen der Überschneidung. ' +
                    'So findest du Teile, die beim Zusammenbauen nicht passen würden.</p>',
                tasks: [
                    {text: 'Baue einen Stift als neuen Körper', check: newBody},
                    {text: 'Öffne „Eingriff“', check: c => interfOpened(c) || interfComputed(c)},
                    {text: 'Berechne die Überschneidungen', check: interfComputed}
                ],
                hints: [
                    tabHint('MODEL', 'Klicke auf das Register „Modell“', c => c.has('toolbar:sketch.create') || c.inSketch() || newBody(c)),
                    ...sketchHints({plane: 'plane:XZ', planeText: 'Klicke auf die Vorderebene',
                        tool: 'tool:sketch.circle.center', toolText: 'Klicke auf „Kreis“',
                        drawText: 'Kleiner Kreis über dem Becher', done: newBody}),
                    ...extrudeHints({pickText: 'Klicke in den Kreis', field: 'dialog:Operation',
                        text: '„Symmetrisch“, „Neuer Körper“, 80, OK', done: newBody}),
                    tabHint('INSPECT', 'Klicke auf das Register „Prüfen“', c => interfOpen(c) || interfComputed(c)),
                    {target: 'tool:inspect.interference', text: 'Klicke auf „Eingriff“', done: c => interfOpen(c) || interfComputed(c)},
                    {target: computeTarget, text: 'Klicke auf „Berechnen“', done: interfComputed}
                ]
            },
            {
                kind: 'learn',
                title: 'Wie glatt ist die Oberfläche?',
                text: '<p>Jetzt prüfst du die <b>Oberflächenqualität</b>. Jedes dieser Werkzeuge schaltest du mit einem Klick ' +
                    'ein und mit einem zweiten Klick wieder aus:</p>' +
                    '<ul><li><b>Zebra</b> spiegelt schwarze und weiße Streifen. Laufen sie glatt weiter, ist die Fläche glatt. ' +
                    'Knicken sie ab, ist dort eine <b>Kante</b>.</li>' +
                    '<li><b>Krümmung</b> färbt die Flächen: Rot heißt stark gebogen, also ein kleiner Radius.</li>' +
                    '<li><b>Abziehen</b> prüft die <b>Formschräge</b>: Lässt sich das Teil aus einer Gussform ziehen? ' +
                    '<b>Zugriff</b> zeigt, welche Flächen ein Fräser von oben erreicht.</li></ul>',
                tasks: [
                    {text: 'Schalte „Zebra“ ein', check: zebraSeen},
                    {text: 'Probiere „Krümmung“', check: curvSeen},
                    {text: 'Probiere „Abziehen“ oder „Zugriff“', check: draftSeen}
                ],
                hints: [
                    tabHint('INSPECT', 'Klicke auf das Register „Prüfen“', c => zebraSeen(c) && curvSeen(c) && draftSeen(c)),
                    {target: 'tool:inspect.zebra', text: 'Klicke auf „Zebra“', done: zebraSeen},
                    {target: 'tool:inspect.curvature_map', text: 'Klicke auf „Krümmung“', done: curvSeen},
                    {target: 'tool:inspect.draft', text: 'Klicke auf „Abziehen“', done: draftSeen}
                ]
            },
            {
                kind: 'learn',
                title: 'Dein Bauen als Film',
                text: '<p>Unten liegt die Zeitleiste <b>Verlauf</b>: Jedes Kästchen ist ein Bauschritt. ' +
                    'Klicke links auf <b>⏮</b> – damit springst du an den Anfang, und dein Becher verschwindet.</p>' +
                    '<p>Dann klicke im Register <b>Prüfen</b> auf <b>Verlauf abspielen</b>: SolidCraft baut alles ' +
                    'Schritt für Schritt wieder auf, wie in einem Film. Ein Detektiv sieht so genau, wie etwas entstanden ist.</p>',
                tasks: [
                    {text: 'Springe an den Anfang', check: rewound},
                    {text: 'Spiele den Verlauf ab', check: played}
                ],
                hints: [
                    {target: 'handle:history:first', text: 'Klicke hier: an den Anfang', done: rewound},
                    tabHint('INSPECT', 'Klicke auf das Register „Prüfen“', played),
                    {target: 'tool:timeline.play', text: 'Klicke auf „Verlauf abspielen“', done: played}
                ]
            },
            {
                kind: 'learn',
                title: 'Deine Lieblingsansicht',
                text: '<p>Dreh deinen Becher so, dass er richtig gut aussieht. Diese Ansicht kannst du dir <b>merken</b> – ' +
                    'als <b>benannte Ansicht</b>.</p>' +
                    '<p>Im Register <b>Ansicht</b> gibt es dafür <b>Ansicht speichern</b> und <b>Ansicht wiederherstellen</b>. ' +
                    'Zeigen die Knöpfe eine Fehlermeldung, nimm den Weg über den <b>Browser</b> links – der klappt immer:</p>' +
                    '<ul><li><b>Rechtsklick</b> auf <b>Benannte Ansichten</b> → <b>Neue benannte Ansicht</b></li>' +
                    '<li>Dreh die Ansicht weg</li>' +
                    '<li><b>Rechtsklick</b> auf deine neue Ansicht → <b>Wiederherstellen</b>: Zack, du schaust wieder genau wie vorher.</li></ul>',
                tasks: [
                    {text: 'Speichere eine benannte Ansicht', check: viewSaved},
                    {text: 'Dreh die Ansicht weg', check: turnedAway},
                    {text: 'Stelle deine Ansicht wieder her', check: restored}
                ],
                hints: [
                    tabHint('VIEW', 'Schau ins Register „Ansicht“', c => viewSaved(c) || c.has('menu:ui.newView')),
                    {target: 'handle:row:Named Views', text: 'Rechtsklick auf „Benannte Ansichten“',
                        done: c => c.has('menu:ui.newView') || viewSaved(c)},
                    {target: 'handle:menu:ui.newView', text: 'Klicke auf „Neue benannte Ansicht“', done: viewSaved},
                    {target: 'handle:axis_view:z', text: 'Dreh die Ansicht, z. B. hier', done: turnedAway},
                    {target: viewRow, text: 'Rechtsklick auf deine Ansicht', done: c => c.has('menu:ui.restoreView') || restored(c)},
                    {target: 'handle:menu:ui.restoreView', text: 'Klicke auf „Wiederherstellen“', done: restored}
                ]
            },
            {
                kind: 'challenge',
                title: 'Challenge: Deine Detektiv-Akte',
                autoHints: false,
                text: '<p>Ein echter Detektiv kennt alle Werkzeuge. Probiere mindestens eins davon aus – diesmal ohne Hand:</p>' +
                    '<ul><li><b>Krümmungskamm</b>: Klicke eine Kante an. Kleine Kämme zeigen, wie stark sie sich biegt.</li>' +
                    '<li><b>Isokurve</b>: Klicke eine Fläche an. Du siehst das Netz aus Linien, aus dem die Fläche gebaut ist.</li>' +
                    '<li><b>Kontakt</b>: prüft bei Zusammenbauten mit Gelenken, ob sich Teile gerade durchdringen.</li>' +
                    '<li><b>Abhängige Elemente</b>: Markiere unten im Verlauf einen Schritt. Der Knopf zeigt, was davon abhängt – ' +
                    'was also kaputtginge, wenn du ihn löschst.</li>' +
                    '<li><b>Prüfen</b> (ganz rechts): eine Übersicht über dein ganzes Design – praktisch bei fremden Modellen.</li></ul>' +
                    '<p>Löse danach den Fall: Verschieb den Stift so, dass er nicht mehr in der Wand steckt, und prüfe mit ' +
                    '<b>Eingriff</b>, ob nichts mehr rot wird. Oder lösch den Stift einfach.</p>',
                tasks: [
                    {text: 'Probiere „Krümmungskamm“ oder „Isokurve“', check: combSeen},
                    {text: 'Ich habe den Fall mit dem Stift gelöst', manual: true}
                ],
                hints: [
                    tabHint('INSPECT', 'Klicke auf das Register „Prüfen“', combSeen),
                    {target: 'tool:inspect.curvature_comb', text: 'Klicke auf „Krümmungskamm“', done: combSeen}
                ]
            },
            exportStep('deinen Becher')
        ]
    });

    K.translate('en', 'pruefen', {
        title: 'The Detective Workshop',
        type: 'Inspect & View',
        steps: [
            {title: 'What are we investigating?',
                text: '<p>Today you are a <b>detective</b>! You quickly build a <b>cup</b> and then examine it very closely – ' +
                    'just like engineers check their parts before they are made.</p>' +
                    '<p>Your detective tools are on the <b>Inspect</b> tab:</p>' +
                    '<ul><li><b>Measure</b>, <b>Mass Center</b> and <b>Properties</b>: How big, how heavy, where is the middle?</li>' +
                    '<li><b>Section</b>: look inside the part</li>' +
                    '<li><b>Interference</b>: are two parts stuck inside each other?</li>' +
                    '<li><b>Zebra</b>, <b>Curvature</b>, <b>Draft</b>, <b>Access</b>: how smooth and how easy to make is the surface?</li>' +
                    '<li><b>Play History</b>: watch your building like a film</li></ul>' +
                    '<p>Finally you save your favourite view – that belongs to the <b>View</b> tab.</p>'},
            {title: 'A cup in two minutes',
                text: '<p>First you need something to investigate. Start a <b>New Sketch</b> on the ground plane ' +
                    'and draw a <b>Circle</b> – a good suggestion is <b>60 mm</b> across.</p>' +
                    '<p>Finish the sketch and <b>extrude</b> the circle about <b>80 mm</b> high. ' +
                    'Then click <b>Shell</b>, pick the <b>top face</b> and type <b>3</b> for the <b>Thickness</b>. ' +
                    'And you have a cup!</p>'},
            {title: 'Measure, weigh, balance',
                text: '<p>Switch to the <b>Inspect</b> tab. Click <b>Measure</b> and then the <b>top rim</b> ' +
                    'of your cup. SolidCraft shows you the <b>diameter</b> and the <b>circumference</b>. ' +
                    'If you click the outer wall and then the inner wall, you measure the <b>distance</b> between them – ' +
                    'that is the <b>wall thickness</b>.</p>' +
                    '<p>Next click <b>Mass Center</b>: the dot shows where your cup balances. ' +
                    'Experts call it the <b>centre of mass</b> – if it is low, the cup does not tip over easily.</p>' +
                    '<p>Finally open <b>Properties</b>: there you find the <b>mass</b> (the weight), ' +
                    'the <b>volume</b> (how much space the material takes up) and more.</p>'},
            {title: 'Look inside with Section',
                text: '<p>A detective also wants to know what is <b>inside</b>. Click <b>Section</b> and then ' +
                    'the <b>front plane</b> (it is called <b>XZ</b>). SolidCraft cuts the view open there – ' +
                    'as if you had cut the cup in half with a giant knife.</p>' +
                    '<p>Don’t worry: your model stays whole. It is only a look inside. With <b>Distance</b> you can ' +
                    'move the cutting plane. Click <b>OK</b>.</p>' +
                    '<p>At the top of the 3D window there is now a <b>Section</b> label. The <b>×</b> on it turns ' +
                    'the section off again.</p>'},
            {title: 'The suspicious pencil',
                text: '<p>A new case: is a pencil <b>stuck in the wall</b>? Build a pencil for it: ' +
                    'switch to the <b>Model</b> tab, start a <b>New Sketch</b> on the <b>front plane</b> and draw ' +
                    'a small <b>Circle</b> (about <b>8 mm</b>) above the middle of the cup, roughly at half height.</p>' +
                    '<p>Extrude it <b>80 mm</b>: set the <b>Direction</b> to <b>Symmetric</b> and the ' +
                    '<b>Operation</b> to <b>New Body</b>. Now the pencil goes right through the cup.</p>' +
                    '<p>Then back to the <b>Inspect</b> tab: click <b>Interference</b> and <b>Compute</b>. ' +
                    'Everywhere two bodies <b>overlap</b> turns red – with the volume of the overlap. ' +
                    'That is how you find parts that would not fit together.</p>'},
            {title: 'How smooth is the surface?',
                text: '<p>Now you check the <b>surface quality</b>. You turn each of these tools on with one click ' +
                    'and off again with a second click:</p>' +
                    '<ul><li><b>Zebra</b> reflects black and white stripes. If they run on smoothly, the surface is smooth. ' +
                    'If they kink, there is an <b>edge</b>.</li>' +
                    '<li><b>Curvature</b> colours the faces: red means strongly bent, so a small radius.</li>' +
                    '<li><b>Draft</b> checks the <b>draft angle</b>: can the part be pulled out of a mould? ' +
                    '<b>Access</b> shows which faces a milling cutter can reach from above.</li></ul>'},
            {title: 'Your building as a film',
                text: '<p>At the bottom is the <b>History</b> timeline: every box is one building step. ' +
                    'Click <b>⏮</b> on the left – that jumps to the start, and your cup disappears.</p>' +
                    '<p>Then click <b>Play History</b> on the <b>Inspect</b> tab: SolidCraft rebuilds everything ' +
                    'step by step, like in a film. That way a detective sees exactly how something was made.</p>'},
            {title: 'Your favourite view',
                text: '<p>Turn your cup so that it looks really good. You can <b>remember</b> this view – ' +
                    'as a <b>named view</b>.</p>' +
                    '<p>The <b>View</b> tab has <b>Save View</b> and <b>Restore View</b> for that. ' +
                    'If the buttons show an error message, use the <b>Browser</b> on the left instead – that always works:</p>' +
                    '<ul><li><b>Right-click</b> <b>Named Views</b> → <b>New Named View</b></li>' +
                    '<li>Turn the view away</li>' +
                    '<li><b>Right-click</b> your new view → <b>Restore</b>: zap, you are looking exactly like before.</li></ul>'},
            {title: 'Challenge: your detective file',
                text: '<p>A real detective knows every tool. Try at least one of these – this time without the hand:</p>' +
                    '<ul><li><b>Curv. Comb</b>: click an edge. Little combs show how strongly it bends.</li>' +
                    '<li><b>Isocurve</b>: click a face. You see the net of lines the face is built from.</li>' +
                    '<li><b>Contact</b>: checks assemblies with joints for parts that pass through each other right now.</li>' +
                    '<li><b>Dependents</b>: select a step in the History at the bottom. The button shows what depends on it – ' +
                    'what would break if you deleted it.</li>' +
                    '<li><b>Inspect</b> (far right): an overview of your whole design – handy for models made by others.</li></ul>' +
                    '<p>Then solve the case: move the pencil so it is no longer stuck in the wall, and check with ' +
                    '<b>Interference</b> that nothing turns red any more. Or simply delete the pencil.</p>'},
            {title: 'Ready to print',
                text: '<p>Save your cup as an <b>STL file</b> for the 3D printer: <b>File</b> menu → <b>Export STL</b>.</p>' +
                    '<p>Also save your project so you can keep working on it later.</p>'}
        ]
    }, {
        'Baue einen Zylinder': 'Build a cylinder',
        'Höhle ihn mit „Hülle“ aus': 'Hollow it out with “Shell”',
        'Klicke auf das Register „Modell“': 'Click the “Model” tab',
        'Klicke auf die Bodenebene': 'Click the ground plane',
        'Klicke auf „Kreis“': 'Click “Circle”',
        'Mitte klicken, dann ziehen': 'Click the centre, then drag',
        'Klicke in den Kreis': 'Click inside the circle',
        'Tippe 80 ein, dann OK': 'Type 80, then OK',
        'Klicke auf „Hülle“': 'Click “Shell”',
        'Klicke auf die Oberseite': 'Click the top face',
        'Tippe 3 ein, dann OK': 'Type 3, then OK',
        'Öffne „Messen“': 'Open “Measure”',
        'Miss den Becherrand': 'Measure the rim of the cup',
        'Zeige den Massenschwerpunkt': 'Show the centre of mass',
        'Öffne die Eigenschaften': 'Open the properties',
        'Klicke auf das Register „Prüfen“': 'Click the “Inspect” tab',
        'Klicke auf „Messen“': 'Click “Measure”',
        'Klicke auf den oberen Rand': 'Click the top rim',
        'Klicke auf „Massenschwerpunkt“': 'Click “Mass Center”',
        'Klicke auf „Eigenschaften“': 'Click “Properties”',
        'Öffne „Schnitt“': 'Open “Section”',
        'Schau in den Becher hinein': 'Look inside the cup',
        'Klicke auf „Schnitt“': 'Click “Section”',
        'Klicke auf die Vorderebene': 'Click the front plane',
        'Klicke auf „OK“': 'Click “OK”',
        'Baue einen Stift als neuen Körper': 'Build a pencil as a new body',
        'Öffne „Eingriff“': 'Open “Interference”',
        'Berechne die Überschneidungen': 'Compute the overlaps',
        'Kleiner Kreis über dem Becher': 'Small circle above the cup',
        '„Symmetrisch“, „Neuer Körper“, 80, OK': '“Symmetric”, “New Body”, 80, OK',
        'Klicke auf „Eingriff“': 'Click “Interference”',
        'Klicke auf „Berechnen“': 'Click “Compute”',
        'Schalte „Zebra“ ein': 'Turn on “Zebra”',
        'Probiere „Krümmung“': 'Try “Curvature”',
        'Probiere „Abziehen“ oder „Zugriff“': 'Try “Draft” or “Access”',
        'Klicke auf „Zebra“': 'Click “Zebra”',
        'Klicke auf „Krümmung“': 'Click “Curvature”',
        'Klicke auf „Abziehen“': 'Click “Draft”',
        'Springe an den Anfang': 'Jump to the start',
        'Spiele den Verlauf ab': 'Play the history',
        'Klicke hier: an den Anfang': 'Click here: back to the start',
        'Klicke auf „Verlauf abspielen“': 'Click “Play History”',
        'Speichere eine benannte Ansicht': 'Save a named view',
        'Dreh die Ansicht weg': 'Turn the view away',
        'Stelle deine Ansicht wieder her': 'Restore your view',
        'Schau ins Register „Ansicht“': 'Look at the “View” tab',
        'Rechtsklick auf „Benannte Ansichten“': 'Right-click “Named Views”',
        'Klicke auf „Neue benannte Ansicht“': 'Click “New Named View”',
        'Dreh die Ansicht, z. B. hier': 'Turn the view, e.g. here',
        'Rechtsklick auf deine Ansicht': 'Right-click your view',
        'Klicke auf „Wiederherstellen“': 'Click “Restore”',
        'Probiere „Krümmungskamm“ oder „Isokurve“': 'Try “Curv. Comb” or “Isocurve”',
        'Ich habe den Fall mit dem Stift gelöst': 'I solved the pencil case',
        'Klicke auf „Krümmungskamm“': 'Click “Curv. Comb”'
    });
})();
