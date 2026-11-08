// Kapitel „blech“ – Register „Blech“: ein Handyständer aus einem Stück Blech.
// Zeitleisten-Typen (live geprüft, SolidCraft 0.30): BaseFlangeFeature, EdgeFlangeFeature, HemFeature,
// UnfoldFeature, RefoldFeature. Die Blechdicke kommt aus der aktiven Blechregel (Standard: 2,5 mm).
(function () {
    'use strict';
    const K = window.SolidcraftKursCourse;
    const {world, mids, newSketchList, sketchHints, exportStep} = K.helpers;

    const plateDrawn = c => newSketchList(c).some(s => s.profiles >= 1);
    const baseDone = c => c.newFeatures('BaseFlangeFeature') >= 1;
    const flangeOpen = c => c.dialog() === 'sheet.flange';
    const thicknessChanged = c => !c.inSketch() && c.bodyCount() >= 1 && c.base.height > 0 &&
        Math.abs(c.height() - c.base.height) >= 0.05;
    const edges = c => c.newFeatures('EdgeFlangeFeature');
    // Laschen zeigen nach oben: Wer die untere Kante erwischt, biegt nach unten (Körper reicht unter z = 0).
    const upward = c => {
        const b = c.largest();
        return !!(b && b.bbox && b.bbox.min[2] > -1);
    };
    const hemmed = c => c.newFeatures('HemFeature') >= 1;
    const unfolded = c => c.newFeatures('UnfoldFeature') >= 1;
    const refolded = c => c.newFeatures('RefoldFeature') >= 1;

    // In das Rechteck klicken – etwas neben der Mitte, denn in der Mitte liegen die Ursprungsebenen.
    const insidePlate = c => {
        const p = c.sketchCenter();
        return p ? world([p[0] + 12, p[1] + 12, p[2]]) : 'viewport';
    };
    // Kante der Grundplatte (auf ihrer Oberseite). Die Dicke ist die Plattenhöhe bei Schrittbeginn.
    const plateEdge = side => c => {
        const b = c.largest();
        if (!b || !b.bbox) return 'viewport';
        const p = mids(b);
        p[1] = side > 0 ? b.bbox.max[1] : b.bbox.min[1];
        p[2] = b.bbox.min[2] + (c.base.height || 2);
        return world(p);
    };
    // Obere Kante der Auflage vorn (vorgeschlagen sind 15 mm Höhe; die Lehne ragt oft aus dem Bild).
    const lipTop = c => {
        const b = c.largest();
        if (!b || !b.bbox) return 'viewport';
        const p = mids(b);
        p[1] = b.bbox.min[1];
        p[2] = Math.min(b.bbox.min[2] + 15, b.bbox.max[2]);
        return world(p);
    };

    K.add({
        id: 'blech',
        title: 'Dein Handyständer aus Blech',
        level: 'profi',
        type: 'Blech',
        icon: '📱',
        autoHints: true,
        steps: [
            {
                kind: 'info',
                title: 'Was bauen wir?',
                text: '<p>Du baust einen <b>Handyständer</b> – und zwar so, wie man ihn in einer echten Werkstatt aus ' +
                    '<b>Blech</b> machen würde: eine flache Platte, an der Kanten hochgebogen werden.</p>' +
                    '<p>Warum konstruiert man Blech so? In der Fabrik schneidet ein <b>Laser</b> die Form aus einer ' +
                    'flachen Blechtafel aus. Danach biegt eine <b>Abkantpresse</b> die Laschen hoch. ' +
                    'Deshalb denkt das Register <b>Blech</b> immer mit: Jedes Teil lässt sich wieder flach ausbreiten.</p>' +
                    '<p>Du lernst:</p>' +
                    '<ul><li><b>Flansch</b>: aus einer Skizze eine Blechplatte machen und Kanten hochbiegen</li>' +
                    '<li><b>Blechregeln</b>: wie dick das Blech ist</li>' +
                    '<li><b>Umkantung</b>: eine scharfe Kante umfalten</li>' +
                    '<li><b>Entfalten</b>, <b>Wieder falten</b> und <b>Flachmuster</b>: wie dein Teil flach aussieht</li></ul>' +
                    '<p>Am Ende druckst du deinen Ständer mit dem 3D-Drucker aus.</p>'
            },
            {
                kind: 'learn',
                title: 'Die Grundplatte',
                text: '<p>Öffne oben das Register <b>Blech</b>. Klicke auf <b>Neue Skizze</b>, wähle die Bodenebene ' +
                    'und zeichne ein <b>Rechteck</b>. Ein guter Vorschlag ist <b>70 × 40 mm</b> (70 breit, 40 tief). Dann <b>Skizze beenden</b>.</p>' +
                    '<p>Jetzt kommt das erste Blech-Werkzeug: <b>Flansch</b>. Ein Flansch ist ein Stück Blech. ' +
                    'Klicke in dein Rechteck – SolidCraft macht daraus eine <b>Basislasche</b>, also eine flache Blechplatte. ' +
                    'Wie dick sie wird, musst du nicht eintippen: Das regelt die Blechregel. Klicke auf <b>OK</b>.</p>',
                tasks: [
                    {text: 'Zeichne ein Rechteck', check: c => plateDrawn(c) || baseDone(c)},
                    {text: 'Mach daraus eine Blechplatte', check: baseDone}
                ],
                hints: [
                    {target: 'tab:SHEET METAL', text: 'Klicke auf das Register „Blech“',
                        done: c => c.has('toolbar:sheet.flange') || c.inSketch() || c.dialog() === 'sketch.create' || plateDrawn(c) || baseDone(c)},
                    ...sketchHints({plane: 'plane:XY', planeText: 'Klicke auf die Bodenebene',
                        tool: 'tool:sketch.rectangle.two_point', toolText: 'Klicke auf „Rechteck“',
                        drawText: 'Klicke nacheinander zwei Ecken', done: baseDone}),
                    {target: 'tool:sheet.flange', text: 'Klicke auf „Flansch“', done: c => flangeOpen(c) || baseDone(c)},
                    {target: insidePlate, text: 'Klicke in dein Rechteck', done: c => c.dialogPicked('Profile / Edges') > 0 || baseDone(c)},
                    {target: 'dialog:OK', text: 'Klicke auf OK', done: baseDone}
                ]
            },
            {
                kind: 'learn',
                title: 'Wie dick ist das Blech?',
                text: '<p>Echtes Blech gibt es nur in bestimmten Dicken. Deshalb stellst du die Dicke nicht bei jedem Teil ' +
                    'neu ein, sondern einmal in den <b>Blechregeln</b>. Alle Flansche richten sich danach.</p>' +
                    '<p>Klicke auf <b>Blechregeln</b>. Tippe bei <b>Dicke</b> zum Beispiel <b>2 mm</b> ein und klicke auf <b>OK</b>. ' +
                    'Schau genau hin: Deine Platte wird sofort dünner. Steht dort schon 2 mm, nimm 1,5 mm.</p>' +
                    '<p>In den Blechregeln stehen noch mehr Dinge, zum Beispiel der <b>Biegeradius</b>: ' +
                    'wie rund eine Biegung innen wird. Dort steht „Thickness“ – der Radius ist also so groß wie die Dicke.</p>',
                tasks: [
                    {text: 'Öffne die Blechregeln', check: c => c.dialog() === 'sheet.manage_rules' || thicknessChanged(c)},
                    {text: 'Ändere die Dicke', check: thicknessChanged}
                ],
                hints: [
                    {target: 'tool:sheet.manage_rules', text: 'Klicke auf „Blechregeln“',
                        done: c => c.dialog() === 'sheet.manage_rules' || thicknessChanged(c)},
                    {target: 'dialog:Thickness', text: 'Dicke: 2 mm, dann OK', done: thicknessChanged}
                ]
            },
            {
                kind: 'learn',
                title: 'Lehne und Auflage',
                text: '<p>Jetzt biegst du Kanten hoch. Klicke wieder auf <b>Flansch</b>, aber diesmal auf die ' +
                    '<b>obere hintere Kante</b> der Platte (oben, sonst biegt die Lasche nach unten). Jetzt heißt der Flansch <b>Kantenlasche</b>.</p>' +
                    '<ul><li>Die <b>Lehne</b>: <b>Höhe</b> etwa <b>80 mm</b>, <b>Winkel</b> etwa <b>70°</b> – ' +
                    'dann lehnt sie etwas nach hinten. Dann <b>OK</b>.</li>' +
                    '<li>Die <b>Auflage</b>: Noch ein <b>Flansch</b>, jetzt an der <b>vorderen Kante</b>, ' +
                    '<b>Höhe</b> etwa <b>15 mm</b> und <b>90°</b>. Daran rutscht dein Handy nicht herunter.</li></ul>' +
                    '<p>Siehst du die runde Stelle an jeder Biegung? Echtes Blech knickt nie ganz spitz.</p>',
                tasks: [
                    {text: 'Biege die Lehne hoch', check: c => edges(c) >= 1 && upward(c)},
                    {text: 'Biege die Auflage hoch', check: c => edges(c) >= 2 && upward(c)}
                ],
                hints: [
                    {target: 'tool:sheet.flange', text: 'Klicke auf „Flansch“', done: c => flangeOpen(c) || edges(c) >= 1},
                    {target: plateEdge(1), text: 'Klicke auf die hintere Kante',
                        done: c => c.dialogPicked('Profile / Edges') > 0 || edges(c) >= 1},
                    {target: 'dialog:Height', text: 'Höhe 80, Winkel 70, dann OK', done: c => edges(c) >= 1},
                    {target: 'tool:sheet.flange', text: 'Noch einmal „Flansch“', done: c => flangeOpen(c) || edges(c) >= 2},
                    {target: plateEdge(-1), text: 'Klicke auf die vordere Kante',
                        done: c => c.dialogPicked('Profile / Edges') > 0 || edges(c) >= 2},
                    {target: 'dialog:Height', text: 'Höhe 15, dann OK', done: c => edges(c) >= 2}
                ]
            },
            {
                kind: 'learn',
                title: 'Eine Umkantung',
                text: '<p>Blechkanten sind scharf. Deshalb faltet man sie oft ganz um – wie einen Saum an der Hose. ' +
                    'Das heißt <b>Umkantung</b>.</p>' +
                    '<p>Klicke auf <b>Umkantung</b> und dann auf die <b>obere Kante</b> der Auflage (oder der Lehne). ' +
                    'Bei <b>Länge</b> passen <b>5 mm</b>. Dann <b>OK</b>. Klappt die Umkantung zur falschen Seite, ' +
                    'setze den Haken bei <b>Umkehren</b>.</p>',
                tasks: [
                    {text: 'Kante umgefaltet', check: hemmed}
                ],
                hints: [
                    {target: 'tool:sheet.hem', text: 'Klicke auf „Umkantung“', done: c => c.dialog() === 'sheet.hem' || hemmed(c)},
                    {target: lipTop, text: 'Klicke auf die obere Kante der Auflage', done: c => c.dialogPicked('Edges') > 0 || hemmed(c)},
                    {target: 'dialog:Length', text: 'Länge 5, dann OK', done: hemmed}
                ]
            },
            {
                kind: 'learn',
                title: 'Flach machen und wieder falten',
                text: '<p>Wie sah dein Ständer aus, bevor er gebogen wurde? Klicke auf <b>Entfalten</b> und dann auf <b>OK</b>. ' +
                    'Alle Biegungen gehen auf – du siehst das flache Blech, so wie es der Laser ausschneidet.</p>' +
                    '<p>Auf dem flachen Blech kann man gut Löcher oder Schlitze einzeichnen. Danach klickst du auf ' +
                    '<b>Wieder falten</b> und <b>OK</b> – und alles ist wieder gebogen.</p>',
                tasks: [
                    {text: 'Entfalte das Blech', check: unfolded},
                    {text: 'Falte es wieder', check: refolded}
                ],
                hints: [
                    {target: 'tool:sheet.unfold', text: 'Klicke auf „Entfalten“', done: c => c.dialog() === 'sheet.unfold' || unfolded(c)},
                    {target: 'dialog:OK', text: 'Klicke auf OK', done: unfolded},
                    {target: 'tool:sheet.refold', text: 'Klicke auf „Wieder falten“', done: c => c.dialog() === 'sheet.refold' || refolded(c)},
                    {target: 'dialog:OK', text: 'Klicke auf OK', done: refolded}
                ]
            },
            {
                kind: 'learn',
                title: 'Das Flachmuster',
                text: '<p>Bevor die Werkstatt schneidet, will sie wissen: Wie groß muss das Stück Blech sein? ' +
                    'Klicke auf <b>Flachmuster</b> (auf dem Knopf steht vielleicht nur „Flachmust…“).</p>' +
                    '<p>Du siehst dein Teil ganz flach von oben, mit den Biegelinien. Daneben stehen das ' +
                    '<b>Abwicklungsmaß</b> (so groß ist das flache Blech), die <b>Dicke</b> und die Zahl der <b>Biegungen</b>. ' +
                    'Mit <b>OK</b> oder <b>Abbrechen</b> kommst du zurück.</p>',
                tasks: [
                    {text: 'Öffne das Flachmuster', check: c => c.dialog() === 'sheet.flat_pattern'}
                ],
                hints: [
                    {target: 'tool:sheet.flat_pattern', text: 'Klicke auf „Flachmuster“',
                        done: c => c.dialog() === 'sheet.flat_pattern'},
                    {target: 'dialog:OK', text: 'Anschauen, dann OK', done: () => false}
                ]
            },
            {
                kind: 'info',
                title: 'Was die anderen Knöpfe machen',
                text: '<p>Im Register <b>Blech</b> gibt es noch mehr. Das brauchst du, wenn dein Blech in eine echte Werkstatt geht:</p>' +
                    '<ul><li><b>Pfad</b>: Ein Flansch entlang einer Kette aus Skizzenlinien – viele Biegungen auf einmal, ' +
                    'zum Beispiel für ein Z- oder U-Profil.</li>' +
                    '<li><b>Falten</b>: Du zeichnest eine Linie auf die Platte (die <b>Biegelinie</b>), und das Blech knickt genau dort.</li>' +
                    '<li><b>DXF exportieren</b>: speichert das flache Blech als Zeichnung für den Laserschneider.</li>' +
                    '<li><b>Biegetabelle</b>: eine Liste aller Biegungen mit Winkel und Lage – für die Abkantpresse.</li>' +
                    '<li><b>Parameter</b>: Zahlen mit Namen, zum Beispiel „hoehe = 80 mm“. Ändert man die Zahl, ' +
                    'ändert sich alles, was sie benutzt.</li>' +
                    '<li><b>Konfigurationen</b> (Knopf „Konfigurat…“): eine Tabelle mit Varianten deines Teils, ' +
                    'zum Beispiel ein kleiner und ein großer Ständer.</li></ul>'
            },
            {
                kind: 'challenge',
                title: 'Challenge: Dein Ständer, deine Ideen',
                autoHints: false,
                text: '<p>Such dir mindestens eine Idee aus – diesmal ohne Hand:</p>' +
                    '<ul><li>Ändere den <b>Winkel</b> der Lehne: Doppelklick unten im Verlauf auf die Kantenlasche.</li>' +
                    '<li>Probier <b>Falten</b>: Neue Skizze auf der Grundplatte, eine Linie quer darüber, dann <b>Falten</b>.</li>' +
                    '<li>Ein <b>Kabelloch</b>: Skizze auf der Auflage, Kreis zeichnen, im Register <b>Modell</b> mit ' +
                    '<b>Extrudieren</b> und <b>Ausschneiden</b> durchbohren.</li>' +
                    '<li>Exportiere mit <b>DXF exportieren</b> die Zeichnung für den Laser.</li></ul>',
                tasks: [
                    {text: 'Ich habe eine Idee umgesetzt', manual: true}
                ],
                hints: [
                    {target: 'tool:sheet.fold', text: 'Hier ist „Falten“', done: () => false}
                ]
            },
            exportStep('deinen Handyständer')
        ]
    });

    K.translate('en', 'blech', {
        title: 'Your sheet metal phone stand',
        type: 'Sheet Metal',
        steps: [
            {title: 'What are we building?',
                text: '<p>You build a <b>phone stand</b> – the way a real workshop would make it from <b>sheet metal</b>: ' +
                    'a flat plate with edges bent up.</p>' +
                    '<p>Why design sheet metal like this? In the factory a <b>laser</b> cuts the shape out of a flat sheet. ' +
                    'Then a <b>press brake</b> bends the flaps up. That is why the <b>Sheet Metal</b> tab always thinks ahead: ' +
                    'every part can be laid flat again.</p>' +
                    '<p>You learn:</p>' +
                    '<ul><li><b>Flange</b>: turn a sketch into a metal plate and bend edges up</li>' +
                    '<li><b>Sheet Rules</b>: how thick the metal is</li>' +
                    '<li><b>Hem</b>: fold a sharp edge over</li>' +
                    '<li><b>Unfold</b>, <b>Refold</b> and <b>Flat Pattern</b>: what your part looks like flat</li></ul>' +
                    '<p>At the end you print your stand on a 3D printer.</p>'},
            {title: 'The base plate',
                text: '<p>Open the <b>Sheet Metal</b> tab at the top. Click <b>New Sketch</b>, choose the ground plane ' +
                    'and draw a <b>Rectangle</b>. A good suggestion is <b>70 × 40 mm</b> (70 wide, 40 deep). Then <b>Finish Sketch</b>.</p>' +
                    '<p>Now the first sheet metal tool: <b>Flange</b>. A flange is a piece of sheet metal. ' +
                    'Click inside your rectangle – SolidCraft turns it into a <b>base</b> flange, a flat metal plate. ' +
                    'You don’t type its thickness: the sheet metal rule takes care of that. Click <b>OK</b>.</p>'},
            {title: 'How thick is the metal?',
                text: '<p>Real sheet metal only comes in certain thicknesses. So you don’t set the thickness for every part, ' +
                    'but once in the <b>Sheet Rules</b>. Every flange follows them.</p>' +
                    '<p>Click <b>Sheet Rules</b>. Type for example <b>2 mm</b> in <b>Thickness</b> and click <b>OK</b>. ' +
                    'Watch closely: your plate gets thinner right away. If it already says 2 mm, take 1.5 mm.</p>' +
                    '<p>The rules hold more, for example the <b>Bend Radius</b>: how round a bend is on the inside. ' +
                    'It says “Thickness” – so the radius is as big as the thickness.</p>'},
            {title: 'Backrest and lip',
                text: '<p>Now you bend edges up. Click <b>Flange</b> again, but this time click the <b>top back edge</b> ' +
                    'of the plate (the top one – otherwise the flange bends down). Now the flange is an <b>Edge</b> flange.</p>' +
                    '<ul><li>The <b>backrest</b>: <b>Height</b> about <b>80 mm</b>, <b>Angle</b> about <b>70°</b> – ' +
                    'so it leans back a little. Then <b>OK</b>.</li>' +
                    '<li>The <b>lip</b>: one more <b>Flange</b>, now on the <b>front edge</b>, <b>Height</b> about ' +
                    '<b>15 mm</b> and <b>90°</b>. It stops your phone from sliding off.</li></ul>' +
                    '<p>See the round part at every bend? Real metal never folds to a perfectly sharp corner.</p>'},
            {title: 'A hem',
                text: '<p>Metal edges are sharp. That’s why they are often folded right over – like the hem of your trousers. ' +
                    'This is called a <b>Hem</b>.</p>' +
                    '<p>Click <b>Hem</b> and then the <b>top edge</b> of the lip (or the backrest). ' +
                    '<b>5 mm</b> is a good <b>Length</b>. Then <b>OK</b>. If the hem folds the wrong way, tick <b>Flip</b>.</p>'},
            {title: 'Flatten it and fold it again',
                text: '<p>What did your stand look like before it was bent? Click <b>Unfold</b> and then <b>OK</b>. ' +
                    'All bends open up – you see the flat metal, just as the laser cuts it.</p>' +
                    '<p>On the flat sheet it is easy to draw holes or slots. Then click <b>Refold</b> and <b>OK</b> – ' +
                    'and everything is bent again.</p>'},
            {title: 'The flat pattern',
                text: '<p>Before the workshop cuts, it wants to know: how big must the piece of metal be? ' +
                    'Click <b>Flat Pattern</b>.</p>' +
                    '<p>You see your part completely flat from above, with the bend lines. Next to it are the ' +
                    '<b>Flat size</b> (that’s how big the flat sheet is), the <b>Thickness</b> and the number of <b>Bends</b>. ' +
                    '<b>OK</b> or <b>Cancel</b> takes you back.</p>'},
            {title: 'What the other buttons do',
                text: '<p>The <b>Sheet Metal</b> tab has more. You need it when your part goes to a real workshop:</p>' +
                    '<ul><li><b>Path</b>: a flange along a chain of sketch lines – many bends at once, ' +
                    'for example for a Z or U shape.</li>' +
                    '<li><b>Fold</b>: you draw a line on the plate (the <b>Bend Line</b>) and the metal bends exactly there.</li>' +
                    '<li><b>Export DXF</b>: saves the flat sheet as a drawing for the laser cutter.</li>' +
                    '<li><b>Bend Table</b>: a list of all bends with angle and position – for the press brake.</li>' +
                    '<li><b>Parameters</b>: numbers with names, for example “height = 80 mm”. Change the number and ' +
                    'everything that uses it changes too.</li>' +
                    '<li><b>Config Table</b>: a table of variants of your part, for example a small and a large stand.</li></ul>'},
            {title: 'Challenge: your stand, your ideas',
                text: '<p>Pick at least one idea – this time without the hand:</p>' +
                    '<ul><li>Change the <b>Angle</b> of the backrest: double-click the edge flange in the History at the bottom.</li>' +
                    '<li>Try <b>Fold</b>: New Sketch on the base plate, a line across it, then <b>Fold</b>.</li>' +
                    '<li>A <b>cable hole</b>: sketch on the lip, draw a circle, then in the <b>Model</b> tab ' +
                    '<b>Extrude</b> it with <b>Cut</b>.</li>' +
                    '<li>Use <b>Export DXF</b> to save the drawing for the laser.</li></ul>'},
            {title: 'Ready to print',
                text: '<p>Save your phone stand as an <b>STL file</b> for the 3D printer: <b>File</b> menu → <b>Export STL</b>.</p>' +
                    '<p>Also save your project so you can keep working on it later.</p>'}
        ]
    }, {
        'Zeichne ein Rechteck': 'Draw a rectangle',
        'Mach daraus eine Blechplatte': 'Turn it into a metal plate',
        'Klicke auf das Register „Blech“': 'Click the “Sheet Metal” tab',
        'Klicke auf „Neue Skizze“': 'Click “New Sketch”',
        'Klicke auf die Bodenebene': 'Click the ground plane',
        'Klicke auf „Rechteck“': 'Click “Rectangle”',
        'Klicke nacheinander zwei Ecken': 'Click two corners, one after the other',
        'Klicke auf „Skizze beenden“': 'Click “Finish Sketch”',
        'Klicke auf „Flansch“': 'Click “Flange”',
        'Klicke in dein Rechteck': 'Click inside your rectangle',
        'Klicke auf OK': 'Click OK',
        'Öffne die Blechregeln': 'Open the Sheet Rules',
        'Ändere die Dicke': 'Change the thickness',
        'Klicke auf „Blechregeln“': 'Click “Sheet Rules”',
        'Dicke: 2 mm, dann OK': 'Thickness: 2 mm, then OK',
        'Biege die Lehne hoch': 'Bend up the backrest',
        'Biege die Auflage hoch': 'Bend up the lip',
        'Klicke auf die hintere Kante': 'Click the back edge',
        'Höhe 80, Winkel 70, dann OK': 'Height 80, Angle 70, then OK',
        'Noch einmal „Flansch“': '“Flange” once more',
        'Klicke auf die vordere Kante': 'Click the front edge',
        'Höhe 15, dann OK': 'Height 15, then OK',
        'Kante umgefaltet': 'Edge folded over',
        'Klicke auf „Umkantung“': 'Click “Hem”',
        'Klicke auf die obere Kante der Auflage': 'Click the top edge of the lip',
        'Länge 5, dann OK': 'Length 5, then OK',
        'Entfalte das Blech': 'Unfold the metal',
        'Falte es wieder': 'Fold it again',
        'Klicke auf „Entfalten“': 'Click “Unfold”',
        'Klicke auf „Wieder falten“': 'Click “Refold”',
        'Öffne das Flachmuster': 'Open the flat pattern',
        'Klicke auf „Flachmuster“': 'Click “Flat Pattern”',
        'Anschauen, dann OK': 'Take a look, then OK',
        'Ich habe eine Idee umgesetzt': 'I built one of the ideas',
        'Hier ist „Falten“': 'Here is “Fold”'
    });
})();
