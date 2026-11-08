/*
 * Kapitel „Kunststoff“: eine Dose mit Klick-Deckel (Kunststoff-Werkzeuge).
 * Das Register „Kunststoff“ (PLASTIC) lässt sich in SolidCraft 0.30 nicht einblenden – das Menü
 * hinter „+“ (ribbon:add_tab) bietet es nicht an, und das Handle tab:PLASTIC liegt deckungsgleich auf
 * „Modell“. Die Werkzeuge stecken deshalb in Modell → Erstellen ▾ (Ansatz, Lippe, Rastverbindung,
 * Auflage) und in Verwalten → Regeln (Kunststoffregeln verwalten, Regel zuweisen).
 * Zeitleisten-Typen (live): LipFeature, BossFeature, RestFeature, SnapFitFeature.
 * „Regel zuweisen“ erzeugt keinen Zeitleisten-Eintrag – geprüft über plastic.rules (nur lesend:
 * document.revision bleibt gleich) → c.extra('plasticRules').assigned.
 */
(function () {
    'use strict';
    const K = window.SolidcraftKursCourse;
    const {world, dims, mids, newest, newBody, shelled, sketchHints, extrudeHints, exportStep} = K.helpers;
    if (window.SolidcraftKursAccess) window.SolidcraftKursAccess.addRead({key: 'plasticRules', command: 'plastic.rules', chapter: 'kunststoff'});

    const boxHigh = c => !c.inSketch() && c.bodyCount() >= 1 && Math.min(...dims(c.largest())) >= 15;
    const ruleAssigned = c => {
        const r = c.extra('plasticRules');
        return !!(r && r.assigned && Object.keys(r.assigned).some(n => !c.base.ignore.includes(n)));
    };
    const made = type => c => c.newFeatures(type) >= 1;
    const lipped = made('LipFeature');
    const bossed = made('BossFeature');
    const rested = made('RestFeature');
    const snapped = made('SnapFitFeature');
    const lidDone = c => newBody(c) && Math.min(...dims(newest(c))) <= 4;
    const open = cmd => c => c.dialog() === cmd;

    // Punkte an der Dose (größter Körper): Rand oben, Boden innen, Unterseite; am Deckel (neuester Körper).
    const at = fn => c => {
        const b = c.largest();
        return b && b.bbox ? world(fn(b, mids(b))) : 'viewport';
    };
    const rimSpot = at((b, m) => [b.bbox.max[0] - 1, m[1], b.bbox.max[2]]);
    // Boden innen: zur hinteren Ecke hin, dort ist er in der Startansicht sichtbar (Mitte liegt hinter der Wand).
    const floorSpot = at((b, m) => [m[0] - dims(b)[0] * 0.33, m[1] + dims(b)[1] * 0.37, b.bbox.min[2] + 2]);
    const bottomSpot = at((b, m) => [m[0] + dims(b)[0] * 0.3, m[1] + dims(b)[1] * 0.3, b.bbox.min[2]]);
    const lidSpot = c => {
        const b = newest(c);
        if (!b || !b.bbox) return 'viewport';
        const m = mids(b);
        return world([m[0], b.bbox.max[1] - 3, b.bbox.max[2]]);
    };

    // Kunststoff-Werkzeug finden: Register Modell → Erstellen ▾ → Werkzeug.
    function plasticTool (cmd, name, done) {
        const isOpen = open(cmd);
        return [
            {target: 'tab:MODEL', text: 'Klicke auf das Register „Modell“',
                done: c => c.has('panel:MODEL:CREATE') || isOpen(c) || done(c)},
            {target: 'handle:panel:MODEL:CREATE', text: 'Öffne „Erstellen ▾“',
                done: c => c.has('toolbar:' + cmd) || isOpen(c) || done(c)},
            {target: 'tool:' + cmd, text: `Ganz unten: „${name}“`, done: c => isOpen(c) || done(c)}
        ];
    }

    K.add({
        id: 'kunststoff',
        title: 'Deine Dose mit Klick-Deckel',
        level: 'profi',
        type: 'Kunststoff',
        icon: '🥡',
        autoHints: true,
        steps: [
            {
                kind: 'info',
                title: 'Was bauen wir?',
                text: '<p>Du baust eine <b>Dose mit Klick-Deckel</b> – so wie die Gehäuse von Fernbedienungen oder Spielzeug. ' +
                    'Solche Teile sind meistens aus <b>Kunststoff</b>, also Plastik.</p>' +
                    '<p>Für Kunststoffteile hat SolidCraft eigene Werkzeuge:</p>' +
                    '<ul><li><b>Lippe</b> – ein schmaler Rand oben auf der Wand, damit der Deckel nicht verrutscht</li>' +
                    '<li><b>Ansatz</b> – ein kleiner Turm mit Loch für eine Schraube (Profis sagen <b>Schraubdom</b>)</li>' +
                    '<li><b>Auflage</b> – kleine Füßchen oder Stützen</li>' +
                    '<li><b>Rastverbindung</b> – ein biegsamer Haken, der hörbar einrastet: <b>Klick!</b></li>' +
                    '<li><b>Kunststoffregeln</b> – Merkzettel mit guten Maßen für ein Material</li></ul>' +
                    '<p>Ein eigenes Register „Kunststoff“ kannst du in dieser Version nicht einblenden. ' +
                    'Die Werkzeuge findest du im Register <b>Modell</b> ganz unten im Aufklapper <b>Erstellen ▾</b> ' +
                    'und die Regeln im Register <b>Verwalten</b>. Oder du drückst <b>S</b> und suchst das Werkzeug mit Namen.</p>'
            },
            {
                kind: 'learn',
                title: 'Die Dose',
                text: '<p>Bau zuerst die Dose – wie bei der Box mit Deckel: <b>Neue Skizze</b> auf der Bodenebene, ' +
                    'ein <b>Rechteck</b> mit <b>60 × 40 mm</b>, <b>Skizze beenden</b> und <b>30 mm</b> hoch <b>extrudieren</b>.</p>' +
                    '<p>Dann klickst du auf <b>Hülle</b>, wählst die <b>Oberseite</b> und tippst bei <b>Dicke</b> eine <b>2</b> ein. ' +
                    'So wird die Dose innen hohl und oben offen.</p>',
                tasks: [
                    {text: 'Box mindestens 15 mm hoch', check: boxHigh},
                    {text: 'Box ausgehöhlt', check: shelled}
                ],
                hints: [
                    ...sketchHints({plane: 'plane:XY', planeText: 'Klicke auf die Bodenebene',
                        tool: 'tool:sketch.rectangle.two_point', toolText: 'Klicke auf „Rechteck“',
                        drawText: '60 × 40 mm', done: boxHigh}),
                    ...extrudeHints({text: 'Tippe 30 ein, dann OK', done: boxHigh}),
                    {target: 'tool:solid.shell', text: 'Klicke auf „Hülle“', done: c => c.dialog() === 'solid.shell' || shelled(c)},
                    {target: 'dialog:Thickness', text: 'Oberseite klicken, Dicke 2, OK', done: c => shelled(c) || c.dialog() !== 'solid.shell'}
                ]
            },
            {
                kind: 'learn',
                title: 'Eine Kunststoffregel',
                text: '<p>Jeder Kunststoff hat seine eigenen guten Maße: wie dick die Wand sein soll, wie viel <b>Spiel</b> ' +
                    '(kleiner Abstand) zwei Teile brauchen und wie schräg die Wände sein sollten. ' +
                    'Diese Maße stehen in einer <b>Kunststoffregel</b>.</p>' +
                    '<p>Klicke auf das Register <b>Verwalten</b> und dort auf <b>Regel zuweisen</b>. ' +
                    'Klicke bei <b>Körper</b> deine Dose an und wähle bei <b>Rule</b> eine Regel, zum Beispiel <b>ABS (1.5mm)</b>. ' +
                    'Klicke auf <b>OK</b>.</p>' +
                    '<p>Daneben liegt <b>Kunststoffregeln verwalten</b> (auf dem Knopf steht „Kunststoff…“). Dort kannst du ' +
                    'die Maße einer Regel ansehen und ändern, zum Beispiel <b>Dicke</b> oder <b>Freiraum</b> (das Spiel).</p>',
                tasks: [
                    {text: 'Wähle „Regel zuweisen“', check: c => open('plastic.assign_rule')(c) || ruleAssigned(c)},
                    {text: 'Gib der Dose eine Kunststoffregel', check: ruleAssigned}
                ],
                hints: [
                    {target: 'tab:MANAGE', text: 'Klicke auf das Register „Verwalten“',
                        done: c => c.has('toolbar:plastic.assign_rule') || open('plastic.assign_rule')(c) || ruleAssigned(c)},
                    {target: 'tool:plastic.assign_rule', text: 'Klicke auf „Regel zuweisen“',
                        done: c => open('plastic.assign_rule')(c) || ruleAssigned(c)},
                    {target: 'dialog:Bodies', text: 'Klicke die Dose an',
                        done: c => c.dialogPicked('Bodies') > 0 || !open('plastic.assign_rule')(c) || ruleAssigned(c)},
                    {target: 'dialog:Rule', text: 'Regel wählen, dann OK',
                        done: c => ruleAssigned(c) || !open('plastic.assign_rule')(c)}
                ]
            },
            {
                kind: 'learn',
                title: 'Die Lippe',
                text: '<p>Damit der Deckel später nicht verrutscht, bekommt die Dose oben eine <b>Lippe</b>: ' +
                    'einen schmalen Rand, der über die Wand hinausragt.</p>' +
                    '<p>Klicke im Register <b>Modell</b> auf <b>Erstellen ▾</b> und ganz unten auf <b>Lippe</b>. ' +
                    'Klicke bei <b>Randfläche</b> oben auf den Rand der Dosenwand. Bei <b>Typ</b> bleibt <b>Lippe</b>. ' +
                    'Ein guter Vorschlag ist <b>Breite 1 mm</b> und <b>Höhe 2 mm</b>. Klicke auf <b>OK</b>.</p>',
                tasks: [{text: 'Lippe auf den Rand gebaut', check: lipped}],
                hints: [
                    ...plasticTool('plastic.lip', 'Lippe', lipped),
                    {target: rimSpot, text: 'Klicke oben auf den Rand',
                        done: c => c.dialogPicked('Rim face') > 0 || !open('plastic.lip')(c) || lipped(c)},
                    {target: 'dialog:Width', text: 'Breite 1, Höhe 2, OK', done: c => lipped(c) || !open('plastic.lip')(c)}
                ]
            },
            {
                kind: 'learn',
                title: 'Ein Schraubdom',
                text: '<p>Manche Dosen werden zugeschraubt. Dafür braucht man innen einen kleinen Turm mit Loch – ' +
                    'einen <b>Ansatz</b> (Schraubdom).</p>' +
                    '<p>Öffne wieder <b>Erstellen ▾</b> und klicke auf <b>Ansatz</b>. Klicke bei <b>Position</b> innen auf den ' +
                    '<b>Boden</b> der Dose. Ein guter Vorschlag: <b>Durchmesser 6 mm</b>, <b>Höhe 10 mm</b> und unter ' +
                    '<b>Optionen</b> ein <b>Bohrungsdurchmesser</b> von <b>2,5 mm</b>. Klicke auf <b>OK</b>.</p>' +
                    '<p>Unter <b>Erweitert</b> kannst du dem Turm sogar kleine <b>Rippen</b> zum Abstützen geben.</p>',
                tasks: [{text: 'Ansatz auf den Boden gesetzt', check: bossed}],
                hints: [
                    ...plasticTool('plastic.boss', 'Ansatz', bossed),
                    {target: floorSpot, text: 'Klicke innen auf den Boden',
                        done: c => c.dialogPicked('Position') > 0 || !open('plastic.boss')(c) || bossed(c)},
                    {target: 'dialog:Diameter', text: 'Durchmesser 6, Höhe 10, OK', done: c => bossed(c) || !open('plastic.boss')(c)}
                ]
            },
            {
                kind: 'learn',
                title: 'Füßchen',
                text: '<p>Eine Dose steht stabiler auf kleinen Füßchen. Die baust du mit <b>Auflage</b>.</p>' +
                    '<p>Öffne <b>Erstellen ▾</b> und klicke auf <b>Auflage</b>. Dreh die Ansicht, bis du den <b>Boden von unten</b> ' +
                    'siehst, und klicke bei <b>Position</b> in eine Ecke der Unterseite. <b>Form Rund</b>, ' +
                    '<b>Durchmesser 6 mm</b> und <b>Höhe 1 mm</b> passen gut. Klicke auf <b>OK</b>.</p>' +
                    '<p>Mach danach noch drei weitere Füßchen in die anderen Ecken – oder spiegle sie mit <b>Spiegeln</b>.</p>',
                tasks: [{text: 'Füßchen unter die Dose gebaut', check: rested}],
                hints: [
                    ...plasticTool('plastic.rest', 'Auflage', rested),
                    {target: bottomSpot, text: 'Unterseite: in eine Ecke klicken',
                        done: c => c.dialogPicked('Position') > 0 || !open('plastic.rest')(c) || rested(c)},
                    {target: 'dialog:Diameter', text: 'Durchmesser 6, Höhe 1, OK', done: c => rested(c) || !open('plastic.rest')(c)}
                ]
            },
            {
                kind: 'learn',
                title: 'Der Deckel',
                text: '<p>Jetzt kommt der Deckel. Er entsteht <b>neben</b> der Dose: Zeichne auf der Bodenebene ein ' +
                    'Rechteck mit <b>60 × 40 mm</b>, mit etwas Abstand zur Dose.</p>' +
                    '<p>Extrudiere es <b>2 mm</b> und wähle bei <b>Operation</b> den Eintrag <b>Neuer Körper</b>. ' +
                    'Die Oberseite des Deckels ist später die Innenseite – zum Aufsetzen drehst du ihn einfach um.</p>',
                tasks: [{text: 'Deckelplatte als neuer Körper', check: lidDone}],
                hints: [
                    ...sketchHints({plane: 'plane:XY', planeText: 'Klicke auf die Bodenebene',
                        tool: 'tool:sketch.rectangle.two_point', toolText: 'Klicke auf „Rechteck“',
                        drawText: 'Neben der Dose: 60 × 40', done: lidDone}),
                    ...extrudeHints({field: 'dialog:Operation', text: '„Neuer Körper“, Abstand 2, OK', done: lidDone})
                ]
            },
            {
                kind: 'learn',
                title: 'Klick! Der Schnapphaken',
                text: '<p>Damit der Deckel hält, bekommt er einen <b>Schnapphaken</b>. In SolidCraft heißt er <b>Rastverbindung</b>. ' +
                    'Der Haken ist ein schmaler, biegsamer Steg mit einer kleinen Nase. Beim Zudrücken biegt er sich ' +
                    'zur Seite und springt dann zurück – <b>Klick!</b></p>' +
                    '<p>Öffne <b>Erstellen ▾</b> und klicke auf <b>Rastverbindung</b>. Klicke bei <b>Position</b> auf den Deckel, ' +
                    'etwa <b>3 mm vom langen Rand</b> entfernt. Ein guter Vorschlag: <b>Länge 12 mm</b>, <b>Dicke 1,5 mm</b>, ' +
                    '<b>Breite 6 mm</b>. <b>Fangtiefe</b> ist, wie weit die Nase heraussteht – <b>1 mm</b> reicht. Klicke auf <b>OK</b>.</p>' +
                    '<p>Bau am anderen langen Rand einen zweiten Haken, dann hält der Deckel von beiden Seiten.</p>',
                tasks: [{text: 'Rastverbindung auf den Deckel gebaut', check: snapped}],
                hints: [
                    ...plasticTool('plastic.snap_fit', 'Rastverbindung', snapped),
                    {target: lidSpot, text: 'Klicke nah am Rand auf den Deckel',
                        done: c => c.dialogPicked('Position') > 0 || !open('plastic.snap_fit')(c) || snapped(c)},
                    {target: 'dialog:Length', text: 'Länge 12, Dicke 1,5, OK', done: c => snapped(c) || !open('plastic.snap_fit')(c)}
                ]
            },
            {
                kind: 'challenge',
                title: 'Challenge: Profi-Dose',
                autoHints: false,
                text: '<p>Such dir mindestens eine Idee aus – diesmal ohne Hand:</p>' +
                    '<ul><li>Bau den Deckel als <b>flache Dose</b> (6 mm hoch, mit Hülle ausgehöhlt). Dann gib seinem Rand ' +
                    'mit <b>Lippe</b> und dem Typ <b>Groove</b> eine Nut – eine Rille, in die die Lippe der Dose genau hineinpasst.</li>' +
                    '<li>Öffne <b>Kunststoffregeln verwalten</b> und schau dir die Regel an: Wie groß ist der <b>Freiraum</b>? ' +
                    'Für den 3D-Druck sind <b>0,2 mm</b> ein guter Wert.</li>' +
                    '<li>Gib dem Schraubdom unter <b>Erweitert</b> drei <b>Rippen</b>.</li></ul>',
                tasks: [{text: 'Ich habe eine Idee umgesetzt', manual: true}]
            },
            exportStep('Dose und Deckel')
        ]
    });

    K.translate('en', 'kunststoff', {
        title: 'Your box with a snap-on lid',
        type: 'Plastic',
        steps: [
            {title: 'What are we building?',
                text: '<p>You’ll build a <b>box with a snap-on lid</b> – just like the cases of remote controls or toys. ' +
                    'Parts like that are usually made of <b>plastic</b>.</p>' +
                    '<p>SolidCraft has its own tools for plastic parts:</p>' +
                    '<ul><li><b>Lip</b> – a narrow rim on top of the wall, so the lid doesn’t slide around</li>' +
                    '<li><b>Boss</b> – a little tower with a hole for a screw</li>' +
                    '<li><b>Rest</b> – little feet or supports</li>' +
                    '<li><b>Snap Fit</b> – a bendy hook that clicks into place: <b>click!</b></li>' +
                    '<li><b>Plastic rules</b> – a cheat sheet with good sizes for a material</li></ul>' +
                    '<p>You can’t show a separate “Plastic” tab in this version. ' +
                    'You’ll find the tools in the <b>Model</b> tab at the very bottom of the <b>Create ▾</b> drop-down, ' +
                    'and the rules in the <b>Manage</b> tab. Or press <b>S</b> and search for the tool by name.</p>'},
            {title: 'The box',
                text: '<p>First build the box – just like the box with a lid: <b>New Sketch</b> on the ground plane, ' +
                    'a <b>Rectangle</b> of <b>60 × 40 mm</b>, <b>Finish Sketch</b> and <b>extrude</b> it <b>30 mm</b> high.</p>' +
                    '<p>Then click <b>Shell</b>, choose the <b>top face</b> and type <b>2</b> for <b>Thickness</b>. ' +
                    'That makes the box hollow inside and open at the top.</p>'},
            {title: 'A plastic rule',
                text: '<p>Every plastic has its own good sizes: how thick the wall should be, how much <b>clearance</b> ' +
                    '(a tiny gap) two parts need, and how slanted the walls should be. ' +
                    'These sizes are stored in a <b>plastic rule</b>.</p>' +
                    '<p>Click the <b>Manage</b> tab and then <b>Assign Rule</b>. ' +
                    'For <b>Bodies</b>, click your box, and for <b>Rule</b> choose a rule, for example <b>ABS (1.5mm)</b>. ' +
                    'Click <b>OK</b>.</p>' +
                    '<p>Right next to it is <b>Plastic Rules</b> (Manage Plastic Rules). There you can look at and change ' +
                    'the sizes of a rule, for example the <b>Thickness</b> or the <b>Clearance</b>.</p>'},
            {title: 'The lip',
                text: '<p>So that the lid won’t slide around later, the box gets a <b>lip</b> on top: ' +
                    'a narrow rim that sticks up above the wall.</p>' +
                    '<p>In the <b>Model</b> tab, click <b>Create ▾</b> and then <b>Lip</b> at the very bottom. ' +
                    'For <b>Rim face</b>, click the top edge of the box wall. The <b>Type</b> stays <b>Lip</b>. ' +
                    'A good suggestion is <b>Width 1 mm</b> and <b>Height 2 mm</b>. Click <b>OK</b>.</p>'},
            {title: 'A screw boss',
                text: '<p>Some boxes are screwed shut. For that you need a little tower with a hole inside – ' +
                    'a <b>Boss</b>.</p>' +
                    '<p>Open <b>Create ▾</b> again and click <b>Boss</b>. For <b>Position</b>, click the <b>floor</b> ' +
                    'inside the box. A good suggestion: <b>Diameter 6 mm</b>, <b>Height 10 mm</b> and under ' +
                    '<b>Options</b> a <b>Hole Diameter</b> of <b>2.5 mm</b>. Click <b>OK</b>.</p>' +
                    '<p>Under <b>Advanced</b> you can even give the tower little <b>ribs</b> to support it.</p>'},
            {title: 'Little feet',
                text: '<p>A box stands more firmly on little feet. You build them with <b>Rest</b>.</p>' +
                    '<p>Open <b>Create ▾</b> and click <b>Rest</b>. Turn the view until you can see the <b>bottom from below</b>, ' +
                    'and for <b>Position</b> click a corner of the underside. <b>Shape Round</b>, ' +
                    '<b>Diameter 6 mm</b> and <b>Height 1 mm</b> work well. Click <b>OK</b>.</p>' +
                    '<p>Then make three more feet in the other corners – or copy them with <b>Mirror</b>.</p>'},
            {title: 'The lid',
                text: '<p>Now for the lid. It is built <b>next to</b> the box: draw a rectangle of <b>60 × 40 mm</b> ' +
                    'on the ground plane, with a little space to the box.</p>' +
                    '<p>Extrude it <b>2 mm</b> and choose <b>New Body</b> as the <b>Operation</b>. ' +
                    'The top of the lid will later be the inside – to put it on, you simply flip it over.</p>'},
            {title: 'Click! The snap hook',
                text: '<p>To make the lid hold, it gets a <b>snap hook</b>. In SolidCraft it’s called <b>Snap Fit</b>. ' +
                    'The hook is a narrow, bendy bar with a small nose. When you press the lid on, it bends ' +
                    'to the side and then springs back – <b>click!</b></p>' +
                    '<p>Open <b>Create ▾</b> and click <b>Snap Fit</b>. For <b>Position</b>, click on the lid, ' +
                    'about <b>3 mm from the long edge</b>. A good suggestion: <b>Length 12 mm</b>, <b>Thickness 1.5 mm</b>, ' +
                    '<b>Width 6 mm</b>. <b>Catch Depth</b> is how far the nose sticks out – <b>1 mm</b> is enough. Click <b>OK</b>.</p>' +
                    '<p>Build a second hook on the other long edge, then the lid holds from both sides.</p>'},
            {title: 'Challenge: pro box',
                text: '<p>Pick at least one idea – this time without the hand:</p>' +
                    '<ul><li>Build the lid as a <b>flat box</b> (6 mm high, hollowed out with Shell). Then give its rim ' +
                    'a groove with <b>Lip</b> and the type <b>Groove</b> – a channel that the lip of the box fits into exactly.</li>' +
                    '<li>Open <b>Manage Plastic Rules</b> and look at the rule: how big is the <b>Clearance</b>? ' +
                    'For 3D printing, <b>0.2 mm</b> is a good value.</li>' +
                    '<li>Give the screw boss three <b>ribs</b> under <b>Advanced</b>.</li></ul>'},
            {title: 'Ready to print',
                text: '<p>Save your box and lid as an <b>STL file</b> for the 3D printer: <b>File</b> menu → <b>Export STL</b>.</p>' +
                    '<p>Also save your project so you can keep working on it later.</p>'}
        ]
    }, {
        'Klicke auf das Register „Modell“': 'Click the “Model” tab',
        'Öffne „Erstellen ▾“': 'Open “Create ▾”',
        'Ganz unten: „Lippe“': 'At the very bottom: “Lip”',
        'Ganz unten: „Ansatz“': 'At the very bottom: “Boss”',
        'Ganz unten: „Auflage“': 'At the very bottom: “Rest”',
        'Ganz unten: „Rastverbindung“': 'At the very bottom: “Snap Fit”',
        'Wähle „Regel zuweisen“': 'Choose “Assign Rule”',
        'Gib der Dose eine Kunststoffregel': 'Give the box a plastic rule',
        'Klicke auf das Register „Verwalten“': 'Click the “Manage” tab',
        'Klicke auf „Regel zuweisen“': 'Click “Assign Rule”',
        'Klicke die Dose an': 'Click the box',
        'Regel wählen, dann OK': 'Choose a rule, then OK',
        'Lippe auf den Rand gebaut': 'Lip built on the rim',
        'Klicke oben auf den Rand': 'Click the top of the rim',
        'Breite 1, Höhe 2, OK': 'Width 1, height 2, OK',
        'Ansatz auf den Boden gesetzt': 'Boss placed on the floor',
        'Klicke innen auf den Boden': 'Click the floor inside',
        'Durchmesser 6, Höhe 10, OK': 'Diameter 6, height 10, OK',
        'Füßchen unter die Dose gebaut': 'Feet built under the box',
        'Unterseite: in eine Ecke klicken': 'Underside: click a corner',
        'Durchmesser 6, Höhe 1, OK': 'Diameter 6, height 1, OK',
        'Neben der Dose: 60 × 40': 'Next to the box: 60 × 40',
        'Rastverbindung auf den Deckel gebaut': 'Snap fit built on the lid',
        'Klicke nah am Rand auf den Deckel': 'Click the lid near the edge',
        'Länge 12, Dicke 1,5, OK': 'Length 12, thickness 1.5, OK'
    });
})();
