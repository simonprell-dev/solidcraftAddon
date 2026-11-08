// Kapitel „rahmen“ – Register „Schweissteile“: ein Mini-Hocker aus Rahmenelementen (Vierkantrohr).
// Zeitleisten-Typ (live geprüft, SolidCraft 0.30): FrameMemberFeature – ein Körper je Skizzenlinie.
// Benutzerparameter stehen in document.inspect().params ({name, expression, value, model: false}).
(function () {
    'use strict';
    const K = window.SolidcraftKursCourse;
    const {world, newSketchList, sketchHints, exportStep} = K.helpers;

    const userParams = c => (c.doc().params || []).filter(p => !p.model);
    const hasParam = c => userParams(c).length >= 1;
    const paramsOpen = c => c.has('dialog:table:user:add');
    const memberOpen = c => c.dialog() === 'frame.member';
    const members = c => c.newFeatures('FrameMemberFeature');
    const memberDone = c => !c.inSketch() && members(c) >= 1;
    const linesDrawn = n => c => newSketchList(c).some(s => (s.curves || 0) >= n);
    const resized = c => !c.inSketch() && c.base.volume > 0 && Math.abs(c.volume() - c.base.volume) > c.base.volume * 0.1;

    // Eine Linie der neuesten Skizze. Ein stehendes „П“ (Füße auf dem Boden): der obere Balken liegt doppelt
    // so hoch wie die Skizzenmitte. Ein liegender Ring: die rechte Seite des Gestells.
    const lineTarget = c => {
        const p = c.sketchCenter();
        if (!p) return 'viewport';
        if (Math.abs(p[2]) > 1) return world([p[0], p[1], 2 * p[2]]);
        const xs = c.bodies().filter(b => b.bbox).map(b => b.bbox.max[0]);
        return world([xs.length ? Math.max(...xs) : p[0], p[1], p[2]]);
    };

    const memberHints = ({pickText, field = 'dialog:Width', fieldText}) => [
        {target: 'tool:frame.member', text: 'Klicke auf „Rahmenelement“', done: c => memberOpen(c) || memberDone(c)},
        {target: 'handle:nav:slot:fit', text: 'Hier: alles ins Bild holen',
            done: c => c.cameraMoved() || c.dialogPicked('Lines') > 0 || memberDone(c)},
        {target: lineTarget, text: pickText, done: c => c.dialogPicked('Lines') > 0 || memberDone(c)},
        {target: field, text: fieldText, done: memberDone}
    ];

    K.add({
        id: 'rahmen',
        title: 'Dein Mini-Hocker aus Rohren',
        level: 'profi',
        type: 'Schweissteile',
        icon: '🪑',
        autoHints: true,
        steps: [
            {
                kind: 'info',
                title: 'Was bauen wir?',
                text: '<p>Viele Dinge sind aus <b>Metallrohren</b> gebaut: Fahrradrahmen, Klettergerüste, Tischgestelle. ' +
                    'Die Rohre werden zugeschnitten und an den Ecken <b>zusammengeschweißt</b> – das sind <b>Schweißteile</b>.</p>' +
                    '<p>Im Register <b>Schweissteile</b> konstruierst du so etwas ganz schnell: Du zeichnest nur <b>Linien</b>. ' +
                    'Jede Linie ist die Mitte eines Rohres. Das Werkzeug <b>Rahmenelement</b> legt dann ein Rohr auf jede Linie.</p>' +
                    '<p>Du baust einen <b>Mini-Hocker</b>, etwa 6 cm hoch – zum Beispiel für eine Spielfigur. Du lernst:</p>' +
                    '<ul><li><b>Parameter</b>: eine Zahl mit Namen, die du überall benutzen kannst</li>' +
                    '<li><b>Rahmenelement</b>: aus Linien werden Rohre</li>' +
                    '<li>verschiedene <b>Profile</b>: Rechteckrohr, Rundrohr und mehr</li></ul>'
            },
            {
                kind: 'learn',
                title: 'Ein Parameter für die Rohre',
                text: '<p>Alle Rohre sollen gleich dick sein. Damit du später nur <b>eine</b> Zahl ändern musst, ' +
                    'legst du einen <b>Parameter</b> an – eine Zahl mit einem Namen.</p>' +
                    '<p>Öffne das Register <b>Schweissteile</b> und klicke auf <b>Parameter</b>. ' +
                    'Klicke auf <b>Parameter hinzufügen</b>. Gib als <b>Name</b> <b>rohr</b> ein und als <b>Ausdruck</b> <b>6 mm</b>. ' +
                    'Dann <b>OK</b>.</p>',
                tasks: [
                    {text: 'Öffne die Parameter', check: c => paramsOpen(c) || hasParam(c)},
                    {text: 'Lege den Parameter „rohr“ an', check: hasParam}
                ],
                hints: [
                    {target: 'tab:WELDMENTS', text: 'Klicke auf das Register „Schweissteile“',
                        done: c => c.has('toolbar:frame.member') || paramsOpen(c) || hasParam(c)},
                    {target: 'tool:parameters.change', text: 'Klicke auf „Parameter“', done: c => paramsOpen(c) || hasParam(c)},
                    {target: 'dialog:table:user:add', text: 'Klicke auf „Parameter hinzufügen“', done: hasParam},
                    {target: 'dialog:OK', text: 'Klicke auf OK', done: c => hasParam(c) && !paramsOpen(c)}
                ]
            },
            {
                kind: 'learn',
                title: 'Die Rahmenskizze',
                text: '<p>Jetzt zeichnest du die Mittellinien der Rohre. Klicke auf <b>Neue Skizze</b> und wähle die ' +
                    '<b>Frontebene</b> (sie heißt <b>XZ</b> und steht senkrecht).</p>' +
                    '<p>Nimm das Werkzeug <b>Linie</b> und zeichne ein großes <b>„П“</b>: ein Bein hoch, oben quer, ' +
                    'das andere Bein wieder runter bis zum Boden. Ein guter Vorschlag: <b>60 mm</b> breit und <b>60 mm</b> hoch, ' +
                    'die Mitte genau über dem Nullpunkt. Mit <b>Esc</b> hörst du auf zu zeichnen. Dann <b>Skizze beenden</b>.</p>',
                tasks: [
                    {text: 'Zeichne drei Linien', check: linesDrawn(3)},
                    {text: 'Beende die Skizze', check: c => linesDrawn(3)(c) && !c.inSketch()}
                ],
                hints: sketchHints({plane: 'plane:XZ', planeText: 'Klicke auf die Frontebene',
                    tool: 'tool:sketch.line', toolText: 'Klicke auf „Linie“', drawText: 'Zeichne ein „П“ aus drei Linien',
                    drawn: linesDrawn(3), done: c => linesDrawn(3)(c) && !c.inSketch()})
            },
            {
                kind: 'learn',
                title: 'Aus Linien werden Rohre',
                text: '<p>Klicke auf <b>Rahmenelement</b>. Siehst du nicht die ganze Skizze? Unten in der Leiste holt <b>Einpassen</b> alles ins Bild. ' +
                    'Klicke dann auf eine Linie deiner Skizze und setze den Haken bei <b>Alle Linien</b> – ' +
                    'dann bekommt jede Linie der Skizze ein Rohr.</p>' +
                    '<p>Bei <b>Profil</b> steht <b>Rechteckrohr</b> – ein Vierkantrohr. Es ist aber 40 mm dick, viel zu groß! ' +
                    'Tippe bei <b>Breite</b> und bei <b>Höhe</b> deinen Parameter <b>rohr</b> ein. ' +
                    'Bei <b>Wand</b> (so dick ist das Metall) passen <b>1,5 mm</b>. Dann <b>OK</b>.</p>' +
                    '<p>Jedes Rohr ist jetzt ein eigener Körper – genau wie in der Werkstatt, bevor geschweißt wird.</p>',
                tasks: [
                    {text: 'Lege Rohre auf die Linien', check: memberDone}
                ],
                hints: memberHints({pickText: 'Klicke auf eine Linie', fieldText: 'Breite und Höhe: rohr, dann OK'})
            },
            {
                kind: 'learn',
                title: 'Der zweite Rahmen',
                text: '<p>Ein Hocker braucht vier Beine. Zeichne noch ein <b>„П“</b>, diesmal auf der <b>Seitenebene</b> ' +
                    '(sie heißt <b>YZ</b>), genauso groß wie das erste. Die beiden Rahmen kreuzen sich oben in der Mitte.</p>' +
                    '<p>Dann wieder <b>Rahmenelement</b>: Linie anklicken, <b>Breite</b> und <b>Höhe</b> <b>rohr</b>, ' +
                    '<b>Wand</b> 1,5 mm, <b>OK</b>.</p>',
                tasks: [
                    {text: 'Zeichne das zweite „П“', check: c => linesDrawn(3)(c) || memberDone(c)},
                    {text: 'Mach Rohre daraus', check: memberDone}
                ],
                hints: [
                    ...sketchHints({plane: 'plane:YZ', planeText: 'Klicke auf die Seitenebene',
                        tool: 'tool:sketch.line', toolText: 'Klicke auf „Linie“', drawText: 'Zeichne ein „П“ aus drei Linien',
                        drawn: linesDrawn(3), done: memberDone}),
                    ...memberHints({pickText: 'Klicke auf eine Linie', fieldText: 'Breite und Höhe: rohr, dann OK'})
                ]
            },
            {
                kind: 'learn',
                title: 'Ein Fußring aus Rundrohr',
                text: '<p>Damit die Beine nicht auseinanderrutschen, kommt unten ein <b>Ring</b> dazu. Starte eine ' +
                    '<b>Neue Skizze</b> auf der <b>Bodenebene</b> und zeichne ein <b>Rechteck</b> durch die vier Füße – ' +
                    'bei 60 mm Breite also <b>60 × 60 mm</b> um den Nullpunkt.</p>' +
                    '<p>Mach mit <b>Rahmenelement</b> Rohre daraus. Wähle diesmal bei <b>Profil</b> das <b>Rundrohr</b> ' +
                    'und tippe beim <b>Durchmesser</b> <b>rohr</b> ein, <b>Wand</b> 1,5 mm.</p>',
                tasks: [
                    {text: 'Zeichne den Ring', check: c => newSketchList(c).some(s => s.profiles >= 1) || memberDone(c)},
                    {text: 'Mach Rohre daraus', check: memberDone}
                ],
                hints: [
                    ...sketchHints({plane: 'plane:XY', planeText: 'Klicke auf die Bodenebene',
                        tool: 'tool:sketch.rectangle.two_point', toolText: 'Klicke auf „Rechteck“',
                        drawText: 'Klicke nacheinander zwei Ecken', done: memberDone}),
                    ...memberHints({pickText: 'Klicke auf eine Linie', field: 'dialog:Profile', fieldText: 'Profil: Rundrohr, Durchmesser: rohr'})
                ]
            },
            {
                kind: 'learn',
                title: 'Alle Rohre auf einmal ändern',
                text: '<p>Jetzt zeigt der Parameter, was er kann. Öffne wieder <b>Parameter</b> und ändere bei <b>rohr</b> ' +
                    'den <b>Ausdruck</b> auf <b>8 mm</b>. Drücke die <b>Eingabetaste</b>.</p>' +
                    '<p>Schau hin: <b>Alle</b> Rohre werden auf einmal dicker! Dünner geht natürlich auch. ' +
                    'Für den 3D-Drucker sollten die Rohre aber mindestens 5 mm dick sein.</p>',
                tasks: [
                    {text: 'Ändere den Parameter „rohr“', check: resized}
                ],
                hints: [
                    {target: 'tool:parameters.change', text: 'Klicke auf „Parameter“', done: c => paramsOpen(c) || resized(c)},
                    {target: 'dialog:title', text: 'Bei rohr 8 mm eintippen', done: resized}
                ]
            },
            {
                kind: 'info',
                title: 'Was die anderen Knöpfe machen',
                text: '<p>Im Register <b>Schweissteile</b> kennst du jetzt <b>Neue Skizze</b>, <b>Rahmenelement</b> und ' +
                    '<b>Parameter</b>. Dazu kommen:</p>' +
                    '<ul><li><b>Konfigurationen</b> (Knopf „Konfigurat…“): eine Tabelle mit Varianten. Jede Zeile ist eine ' +
                    'Variante, jede Spalte zum Beispiel ein Parameter. So hast du einen kleinen Hocker mit rohr = 6 mm ' +
                    'und einen großen mit rohr = 10 mm in einem Design.</li>' +
                    '<li>Bei <b>Profil</b> gibt es noch mehr Formen: <b>Flachstab</b> und <b>Rundstab</b> (voll, nicht hohl), ' +
                    '<b>L-Profil</b>, <b>U-Profil</b> und <b>I-Träger</b> – wie bei Brücken und Hallen.</li>' +
                    '<li>Über die <b>Befehlssuche</b> oben rechts findest du die <b>Profilbibliothek</b> (alle Profile mit ihren Maßen), ' +
                    '<b>Profileigenschaften</b> (wie schwer und wie steif ein Profil ist) und <b>Profil einfügen</b> ' +
                    '(ein Profil als Skizze, die du selbst verändern kannst).</li></ul>'
            },
            {
                kind: 'challenge',
                title: 'Challenge: Mach den Hocker fertig',
                autoHints: false,
                text: '<p>Such dir mindestens eine Idee aus – diesmal ohne Hand:</p>' +
                    '<ul><li>Eine <b>Sitzfläche</b>: Skizze auf die Oberseite der Rohre, Rechteck zeichnen und im Register ' +
                    '<b>Modell</b> 3 mm <b>extrudieren</b>.</li>' +
                    '<li>Ein <b>Regal</b>: Zeichne eine Leiter aus Linien (zwei hohe Linien, mehrere Sprossen) und mach Rohre daraus.</li>' +
                    '<li>Probier ein anderes <b>Profil</b>: Doppelklick unten im Verlauf auf ein Rahmenelement und wähle <b>L-Profil</b>.</li>' +
                    '<li>Lege mit <b>Konfigurationen</b> einen kleinen und einen großen Hocker an.</li></ul>',
                tasks: [
                    {text: 'Ich habe eine Idee umgesetzt', manual: true}
                ],
                hints: [
                    {target: 'tool:frame.member', text: 'Hier ist „Rahmenelement“', done: () => false}
                ]
            },
            exportStep('deinen Hocker')
        ]
    });

    K.translate('en', 'rahmen', {
        title: 'Your mini stool made of tubes',
        type: 'Weldments',
        steps: [
            {title: 'What are we building?',
                text: '<p>Lots of things are built from <b>metal tubes</b>: bike frames, climbing frames, table legs. ' +
                    'The tubes are cut to length and <b>welded together</b> at the corners – these are <b>weldments</b>.</p>' +
                    '<p>In the <b>Weldments</b> tab you design them really fast: you only draw <b>lines</b>. ' +
                    'Each line is the middle of a tube. The <b>Frame Member</b> tool then puts a tube on every line.</p>' +
                    '<p>You build a <b>mini stool</b>, about 6 cm tall – for a toy figure, for example. You learn:</p>' +
                    '<ul><li><b>Parameters</b>: a number with a name that you can use anywhere</li>' +
                    '<li><b>Frame Member</b>: lines turn into tubes</li>' +
                    '<li>different <b>profiles</b>: rectangular tube, round tube and more</li></ul>'},
            {title: 'A parameter for the tubes',
                text: '<p>All tubes should be the same size. So that you only ever change <b>one</b> number later, ' +
                    'you create a <b>parameter</b> – a number with a name.</p>' +
                    '<p>Open the <b>Weldments</b> tab and click <b>Parameters</b>. ' +
                    'Click <b>Add parameter</b>. Type <b>tube</b> as the <b>Name</b> and <b>6 mm</b> as the <b>Expression</b>. ' +
                    'Then <b>OK</b>.</p>'},
            {title: 'The frame sketch',
                text: '<p>Now you draw the centre lines of the tubes. Click <b>New Sketch</b> and choose the ' +
                    '<b>front plane</b> (it is called <b>XZ</b> and stands upright).</p>' +
                    '<p>Take the <b>Line</b> tool and draw a big <b>“П”</b>: one leg up, across the top, ' +
                    'the other leg back down to the ground. A good suggestion: <b>60 mm</b> wide and <b>60 mm</b> tall, ' +
                    'centred right above the origin. Press <b>Esc</b> to stop drawing. Then <b>Finish Sketch</b>.</p>'},
            {title: 'Lines become tubes',
                text: '<p>Click <b>Frame Member</b>. Can’t see the whole sketch? <b>Fit</b> in the bar at the bottom brings everything into view. ' +
                    'Then click a line of your sketch and tick <b>All Lines</b> – ' +
                    'then every line of the sketch gets a tube.</p>' +
                    '<p><b>Profile</b> says <b>Rectangular Tube</b> – a square tube. But it is 40 mm thick, far too big! ' +
                    'Type your parameter <b>tube</b> into <b>Width</b> and <b>Height</b>. ' +
                    '<b>1.5 mm</b> is good for <b>Wall</b> (that’s how thick the metal is). Then <b>OK</b>.</p>' +
                    '<p>Every tube is its own body now – just like in the workshop before welding.</p>'},
            {title: 'The second frame',
                text: '<p>A stool needs four legs. Draw another <b>“П”</b>, this time on the <b>side plane</b> ' +
                    '(it is called <b>YZ</b>), the same size as the first. The two frames cross in the middle at the top.</p>' +
                    '<p>Then <b>Frame Member</b> again: click a line, <b>Width</b> and <b>Height</b> <b>tube</b>, ' +
                    '<b>Wall</b> 1.5 mm, <b>OK</b>.</p>'},
            {title: 'A foot ring of round tube',
                text: '<p>So that the legs don’t slide apart, a <b>ring</b> goes at the bottom. Start a ' +
                    '<b>New Sketch</b> on the <b>ground plane</b> and draw a <b>Rectangle</b> through the four feet – ' +
                    'for a 60 mm wide stool that is <b>60 × 60 mm</b> around the origin.</p>' +
                    '<p>Turn it into tubes with <b>Frame Member</b>. This time choose <b>Round Tube</b> as the <b>Profile</b> ' +
                    'and type <b>tube</b> for the <b>Diameter</b>, <b>Wall</b> 1.5 mm.</p>'},
            {title: 'Change all tubes at once',
                text: '<p>Now the parameter shows what it can do. Open <b>Parameters</b> again and change the ' +
                    '<b>Expression</b> of <b>tube</b> to <b>8 mm</b>. Press <b>Enter</b>.</p>' +
                    '<p>Look: <b>all</b> tubes get thicker at once! Thinner works too, of course. ' +
                    'For the 3D printer the tubes should be at least 5 mm thick, though.</p>'},
            {title: 'What the other buttons do',
                text: '<p>In the <b>Weldments</b> tab you now know <b>New Sketch</b>, <b>Frame Member</b> and ' +
                    '<b>Parameters</b>. There is also:</p>' +
                    '<ul><li><b>Config Table</b>: a table of variants. Each row is a variant, each column for example ' +
                    'a parameter. That way you have a small stool with tube = 6 mm and a big one with tube = 10 mm in one design.</li>' +
                    '<li><b>Profile</b> has even more shapes: <b>Bar</b> and <b>Round Bar</b> (solid, not hollow), ' +
                    '<b>L-Angle</b>, <b>Channel</b> and <b>I-Beam</b> – like on bridges and halls.</li>' +
                    '<li>With <b>Search commands</b> at the top right you find the <b>Profile Library</b> (all profiles with their sizes), ' +
                    '<b>Profile Properties</b> (how heavy and how stiff a profile is) and <b>Insert Profile</b> ' +
                    '(a profile as a sketch that you can change yourself).</li></ul>'},
            {title: 'Challenge: finish your stool',
                text: '<p>Pick at least one idea – this time without the hand:</p>' +
                    '<ul><li>A <b>seat</b>: sketch on top of the tubes, draw a rectangle and in the <b>Model</b> tab ' +
                    '<b>Extrude</b> it 3 mm.</li>' +
                    '<li>A <b>shelf</b>: draw a ladder of lines (two tall lines, several rungs) and turn it into tubes.</li>' +
                    '<li>Try another <b>Profile</b>: double-click a frame member in the History at the bottom and choose <b>L-Angle</b>.</li>' +
                    '<li>Use the <b>Config Table</b> to make a small and a big stool.</li></ul>'},
            {title: 'Ready to print',
                text: '<p>Save your stool as an <b>STL file</b> for the 3D printer: <b>File</b> menu → <b>Export STL</b>.</p>' +
                    '<p>Also save your project so you can keep working on it later.</p>'}
        ]
    }, {
        'Öffne die Parameter': 'Open the Parameters',
        'Lege den Parameter „rohr“ an': 'Create the parameter “tube”',
        'Klicke auf das Register „Schweissteile“': 'Click the “Weldments” tab',
        'Klicke auf „Parameter“': 'Click “Parameters”',
        'Klicke auf „Parameter hinzufügen“': 'Click “Add parameter”',
        'Klicke auf OK': 'Click OK',
        'Zeichne drei Linien': 'Draw three lines',
        'Beende die Skizze': 'Finish the sketch',
        'Klicke auf „Neue Skizze“': 'Click “New Sketch”',
        'Klicke auf die Frontebene': 'Click the front plane',
        'Klicke auf „Linie“': 'Click “Line”',
        'Zeichne ein „П“ aus drei Linien': 'Draw a “П” from three lines',
        'Klicke auf „Skizze beenden“': 'Click “Finish Sketch”',
        'Lege Rohre auf die Linien': 'Put tubes on the lines',
        'Klicke auf „Rahmenelement“': 'Click “Frame Member”',
        'Klicke auf eine Linie': 'Click a line',
        'Hier: alles ins Bild holen': 'Here: fit everything into view',
        'Breite und Höhe: rohr, dann OK': 'Width and Height: tube, then OK',
        'Zeichne das zweite „П“': 'Draw the second “П”',
        'Mach Rohre daraus': 'Turn it into tubes',
        'Klicke auf die Seitenebene': 'Click the side plane',
        'Zeichne den Ring': 'Draw the ring',
        'Klicke auf die Bodenebene': 'Click the ground plane',
        'Klicke auf „Rechteck“': 'Click “Rectangle”',
        'Klicke nacheinander zwei Ecken': 'Click two corners, one after the other',
        'Profil: Rundrohr, Durchmesser: rohr': 'Profile: Round Tube, Diameter: tube',
        'Ändere den Parameter „rohr“': 'Change the parameter “tube”',
        'Bei rohr 8 mm eintippen': 'Type 8 mm for tube',
        'Ich habe eine Idee umgesetzt': 'I built one of the ideas',
        'Hier ist „Rahmenelement“': 'Here is “Frame Member”'
    });
})();
