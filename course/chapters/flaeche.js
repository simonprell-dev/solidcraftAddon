/*
 * Kapitel „Fläche“: eine Vase aus einer hauchdünnen Fläche (Register Fläche / SURFACE).
 * Profil als offene Linie → Flächen-Rotation → Verlängern → Dicke vergeben.
 * Zeitleisten-Typen (live, SolidCraft 0.30): SurfaceRevolveFeature, ExtendFeature, ThickenFeature.
 * Eine Fläche erscheint in document.inspect als Körper mit closed: false und volume_mm3: null.
 */
(function () {
    'use strict';
    const K = window.SolidcraftKursCourse;
    const {newSketchList, exportStep} = K.helpers;

    // Offene Profillinie: mindestens drei Linien in einer neuen Skizze (ohne geschlossenes Profil ok).
    const lineDrawn = c => newSketchList(c).some(s => (s.curves || 0) >= 3);
    const lineDone = c => lineDrawn(c) && !c.inSketch();
    // Ecken abgerundet? SolidCraft kann einer Fläche mit spitzen Innenecken keine Wand geben
    // („thickening into an inside corner across a sharp edge“). Gemerkt pro Schritt.
    const memo = new WeakMap();
    const seen = (c, key, cond) => {
        let m = memo.get(c.base);
        if (!m) memo.set(c.base, m = {});
        if (cond) m[key] = true;
        return !!m[key];
    };
    const filletOpen = c => c.dialog() === 'sketch.fillet' || c.tool() === 'sketch.fillet';
    const filletTool = c => seen(c, 'fillet', filletOpen(c));
    const revolveOpen = c => c.dialog() === 'surface.revolve';
    const surfaceMade = c => c.newFeatures('SurfaceRevolveFeature') >= 1 || c.newFeatures('SurfaceLoftFeature') >= 1;
    const extendOpen = c => c.dialog() === 'surface.extend';
    const extended = c => c.newFeatures('ExtendFeature') >= 1;
    const thickenOpen = c => c.dialog() === 'surface.thicken';
    const thickened = c => c.newFeatures('ThickenFeature') >= 1;

    K.add({
        id: 'flaeche',
        title: 'Deine Vase aus Flächen',
        level: 'profi',
        type: 'Fläche',
        icon: '🏺',
        autoHints: true,
        steps: [
            {
                kind: 'info',
                title: 'Was bauen wir?',
                text: '<p>Du baust eine <b>Vase</b> – und lernst dabei das Register <b>Fläche</b> kennen.</p>' +
                    '<p>Bisher hast du immer <b>Volumenkörper</b> gebaut. Ein Volumenkörper ist wie ein Stück Knete: ' +
                    'Er ist innen voll und hat ein Gewicht.</p>' +
                    '<p>Eine <b>Fläche</b> ist ganz anders. Sie ist wie eine Seifenblase: nur eine <b>hauchdünne Haut</b>, ' +
                    'ganz ohne Dicke und ohne Inhalt. Mit Flächen kann man sehr weiche, geschwungene Formen bauen.</p>' +
                    '<p>So entsteht deine Vase:</p>' +
                    '<ul><li>eine <b>offene Profillinie</b> zeichnen – die halbe Seitenansicht der Vase</li>' +
                    '<li>sie mit <b>Drehen</b> zu einer runden Fläche drehen</li>' +
                    '<li>den Rand mit <b>Verlängern</b> höher machen</li>' +
                    '<li>der Haut mit <b>Dicke vergeben</b> eine echte Wand geben – erst dann kann der 3D-Drucker sie drucken</li></ul>'
            },
            {
                kind: 'learn',
                title: 'Das Vasenprofil',
                text: '<p>Klicke oben auf das Register <b>Fläche</b>. Dort findest du alle Flächen-Werkzeuge.</p>' +
                    '<p>Starte eine <b>Neue Skizze</b> auf der senkrechten <b>Seitenebene</b> (sie heißt <b>YZ</b>). ' +
                    'Wähle <b>Linie</b> und klicke Punkt für Punkt die rechte Hälfte deiner Vase: ' +
                    'vom <b>Nullpunkt</b> 25 mm nach rechts (das wird der Boden), dann nach oben – ' +
                    'erst etwas breiter, dann schmaler wie ein Hals, ganz oben wieder etwas breiter. ' +
                    'Ein guter Vorschlag ist eine Höhe von <b>100 mm</b>.</p>' +
                    '<p>Wichtig: Die Linie bleibt <b>offen</b>. Du gehst <b>nicht</b> zurück zum Start! Drücke am Ende <b>Esc</b>.</p>' +
                    '<p>Jetzt runde die <b>Ecken</b> ab: Wähle <b>Vollrundung</b> (in der Skizze bei <b>Ändern</b>), klicke ' +
                    'nacheinander jede Ecke deiner Linie an, tippe als Radius <b>8</b> ein und klicke auf <b>OK</b>. Das ist wichtig – an spitzen ' +
                    'Ecken kann SolidCraft der Vase später keine Wand geben. Danach klicke auf <b>Skizze beenden</b>.</p>',
                tasks: [
                    {text: 'Zeichne die offene Profillinie', check: lineDrawn},
                    {text: 'Runde die Ecken mit „Vollrundung“ ab', check: c => filletTool(c)},
                    {text: 'Beende die Skizze', check: lineDone}
                ],
                hints: [
                    {target: 'tab:SURFACE', text: 'Klicke auf das Register „Fläche“',
                        done: c => c.has('toolbar:surface.revolve') || c.inSketch() || lineDrawn(c)},
                    {target: 'tool:sketch.create', text: 'Klicke auf „Neue Skizze“',
                        done: c => c.dialog() === 'sketch.create' || c.inSketch() || lineDone(c)},
                    {target: 'plane:YZ', text: 'Klicke auf die Seitenebene', done: c => c.inSketch() || lineDone(c)},
                    {target: 'tool:sketch.line', text: 'Klicke auf „Linie“',
                        done: c => (c.tool() || '').startsWith('sketch.line') || lineDrawn(c)},
                    {target: 'viewport', text: 'Punkt für Punkt, nicht schließen', done: lineDrawn},
                    {target: 'tool:sketch.fillet', text: 'Klicke auf „Vollrundung“', done: c => filletTool(c) || lineDone(c)},
                    {target: 'dialog:Corners', text: 'Jede Ecke anklicken, Radius 8, OK',
                        done: c => !c.inSketch() || (!filletOpen(c) && filletTool(c))},
                    {target: 'tool:sketch.finish', text: 'Klicke auf „Skizze beenden“', done: lineDone}
                ]
            },
            {
                kind: 'learn',
                title: 'Die Fläche drehen',
                text: '<p>Jetzt wird aus der Linie eine Fläche. Klicke im Register <b>Fläche</b> auf <b>Drehen</b>.</p>' +
                    '<p>Klicke bei <b>Profile oder Kurven</b> deine Linie an. Wähle als <b>Achse</b> die blaue ' +
                    '<b>Z-Achse</b> – die senkrechte Mittellinie. Der <b>Winkel</b> bleibt bei <b>360°</b>, ' +
                    'also einmal ganz herum. Klicke auf <b>OK</b>.</p>' +
                    '<p>Das ist wie auf einer Töpferscheibe: Die Linie dreht sich und hinterlässt eine runde Haut.</p>',
                tasks: [
                    {text: 'Wähle „Drehen“ im Register Fläche', check: c => revolveOpen(c) || surfaceMade(c)},
                    {text: 'Dreh die Linie zur Vasenfläche', check: surfaceMade}
                ],
                hints: [
                    {target: 'tool:surface.revolve', text: 'Klicke auf „Drehen“', done: c => revolveOpen(c) || surfaceMade(c)},
                    {target: 'dialog:Profiles or curves', text: 'Klicke deine Linie an',
                        done: c => c.dialogPicked('Profiles or curves') > 0 || !revolveOpen(c) || surfaceMade(c)},
                    {target: 'axis:Z', text: 'Dann die blaue Z-Achse, OK', done: c => surfaceMade(c) || !revolveOpen(c)}
                ]
            },
            {
                kind: 'game',
                title: 'Eine Haut ohne Dicke',
                text: '<p>Schau dir deine Vase genau an. Dreh die Ansicht und schau von oben hinein.</p>' +
                    '<p>Die Wand hat <b>gar keine Dicke</b> – sie ist nur eine Haut. Ein 3D-Drucker kann so etwas nicht drucken, ' +
                    'denn er braucht Material mit Volumen. Das ändern wir gleich.</p>' +
                    '<p>Tipp: Im <b>Browser</b> links steht die Fläche als eigener Eintrag. Klicke auf das <b>Auge</b> daneben, ' +
                    'dann kannst du sie aus- und wieder einblenden.</p>',
                tasks: [
                    {text: 'Dreh oder zoome die Ansicht', check: c => c.cameraMoved()},
                    {text: 'Ich habe gesehen: Die Wand ist hauchdünn', manual: true}
                ],
                hints: [
                    {target: 'handle:axis_view:z', text: 'Klicke auf „Z“: Blick von oben', done: c => c.cameraMoved()}
                ]
            },
            {
                kind: 'learn',
                title: 'Den Rand verlängern',
                text: '<p>Deine Vase soll etwas höher werden – ohne die Skizze neu zu zeichnen. Dafür gibt es <b>Verlängern</b>.</p>' +
                    '<p>Klicke auf <b>Verlängern</b> und dann bei <b>Kanten</b> auf die <b>obere Randkante</b> der Vase. ' +
                    'Tippe bei <b>Abstand</b> eine <b>10</b> ein und klicke auf <b>OK</b>.</p>' +
                    '<p>Die Fläche wächst einfach in ihrer eigenen Richtung weiter – so, als hättest du sie gleich länger gezeichnet.</p>',
                tasks: [
                    {text: 'Wähle „Verlängern“', check: c => extendOpen(c) || extended(c)},
                    {text: 'Verlängere den oberen Rand', check: extended}
                ],
                hints: [
                    {target: 'tool:surface.extend', text: 'Klicke auf „Verlängern“', done: c => extendOpen(c) || extended(c)},
                    {target: 'dialog:Edges', text: 'Klicke die obere Randkante an',
                        done: c => c.dialogPicked('Edges') > 0 || !extendOpen(c) || extended(c)},
                    {target: 'dialog:Distance', text: 'Abstand 10, dann OK', done: c => extended(c) || !extendOpen(c)}
                ]
            },
            {
                kind: 'learn',
                title: 'Dicke vergeben',
                text: '<p>Jetzt bekommt die Haut eine echte Wand. Klicke auf <b>Dicke vergeben</b>.</p>' +
                    '<p>Klicke bei <b>Flächen</b> deine Vase an. Tippe bei <b>Dicke</b> eine <b>2</b> ein (2 mm Wand). ' +
                    'Bei <b>Operation</b> steht <b>Neuer Körper</b>. Klicke auf <b>OK</b>.</p>' +
                    '<p>Jetzt ist aus der Fläche ein <b>Volumenkörper</b> geworden – mit Boden, Wand und Inhalt. ' +
                    'Die dünne Haut bleibt als eigener Eintrag im Browser liegen. Blende sie mit dem <b>Auge</b> aus.</p>' +
                    '<p>Kommt eine Fehlermeldung? Dann tippe <b>-2</b> ein (die Wand wächst dann zur anderen Seite) oder ' +
                    'runde die Ecken in der Skizze stärker ab: Doppelklick unten im Verlauf auf die Skizze.</p>',
                tasks: [
                    {text: 'Wähle „Dicke vergeben“', check: c => thickenOpen(c) || thickened(c)},
                    {text: 'Gib der Vase eine Wand', check: thickened}
                ],
                hints: [
                    {target: 'tool:surface.thicken', text: 'Klicke auf „Dicke vergeben“', done: c => thickenOpen(c) || thickened(c)},
                    {target: 'dialog:Surfaces', text: 'Klicke die Vase an',
                        done: c => c.dialogPicked('Surfaces') > 0 || !thickenOpen(c) || thickened(c)},
                    {target: 'dialog:Thickness', text: 'Dicke 2, dann OK', done: c => thickened(c) || !thickenOpen(c)}
                ]
            },
            {
                kind: 'info',
                title: 'Was die anderen Knöpfe machen',
                text: '<p>Im Register <b>Fläche</b> gibt es noch mehr Werkzeuge. Fast alle machen <b>Flächen</b>, keine Körper:</p>' +
                    '<ul><li><b>Neue Skizze</b> – wie im Register Modell: eine flache Zeichnung starten.</li>' +
                    '<li><b>Extrudieren</b> – zieht eine Linie in die Höhe. Aus einem Strich wird eine Wand, wie ein Zaun.</li>' +
                    '<li><b>Drehen</b> – dreht eine Linie um eine Achse. Das hast du gerade gemacht.</li>' +
                    '<li><b>Führen</b> – schiebt eine Form an einem Pfad entlang, wie eine Rutsche oder ein Schlauch.</li>' +
                    '<li><b>Flächen-Loft</b> – spannt eine Haut zwischen zwei oder mehr Formen, zum Beispiel zwischen ' +
                    'einem großen Kreis unten und einem kleinen Kreis oben.</li>' +
                    '<li><b>Kürzen</b> – schneidet ein Stück einer Fläche ab, zum Beispiel an einer Ebene.</li>' +
                    '<li><b>Trimmen aufheben</b> – macht das Kürzen wieder rückgängig und füllt Löcher in einer Fläche.</li>' +
                    '<li><b>Verlängern</b> – lässt eine Fläche am Rand weiterwachsen.</li>' +
                    '<li><b>Nähen</b> – näht mehrere Flächen an ihren Rändern zusammen. Ist alles dicht, wird daraus ein Volumenkörper.</li>' +
                    '<li><b>Dicke vergeben</b> – gibt einer Fläche eine Wandstärke.</li>' +
                    '<li><b>Netz konvertieren</b> – verwandelt ein <b>Netz</b> in echte Flächen. Ein Netz ist ein Modell aus vielen ' +
                    'kleinen Dreiecken, zum Beispiel eine STL-Datei aus dem Internet. Ein Netz holst du über ' +
                    'Register <b>Einfügen</b> → <b>Netz einfügen</b>. Ein eigenes Register „Netz“ gibt es in dieser Version nicht.</li></ul>' +
                    '<p>Unter <b>Erstellen ▾</b> und <b>Bearbeiten ▾</b> stecken weitere Profi-Werkzeuge: zum Beispiel ' +
                    '<b>Patch</b> (stopft ein Loch mit einer Fläche), <b>Offsetfläche</b> (eine Kopie mit Abstand), ' +
                    '<b>Verbund aufheben</b> (trennt Genähtes wieder) und <b>Normale umkehren</b> (dreht innen und außen um).</p>'
            },
            {
                kind: 'challenge',
                title: 'Challenge: Vasen-Werkstatt',
                autoHints: false,
                text: '<p>Such dir mindestens eine Idee aus – diesmal ohne Hand:</p>' +
                    '<ul><li>Ändere die Form: Doppelklick auf die Skizze in der Zeitleiste, Punkte verschieben – die Vase passt sich an.</li>' +
                    '<li>Bau eine zweite Vase mit <b>Flächen-Loft</b>: ein großer Kreis auf der Bodenebene, ein kleiner Kreis ' +
                    'auf einer Ebene 80 mm höher. Wähle beide Kreise nacheinander als <b>Querschnitte</b>.</li>' +
                    '<li>Schneide den Rand schräg ab: Mit <b>Kürzen</b> und einer schrägen Ebene. Danach wieder <b>Dicke vergeben</b>.</li></ul>',
                tasks: [{text: 'Ich habe eine Idee umgesetzt', manual: true}]
            },
            exportStep('deine Vase')
        ]
    });

    K.translate('en', 'flaeche', {
        title: 'Your vase made of surfaces',
        type: 'Surface',
        steps: [
            {title: 'What are we building?',
                text: '<p>You’ll build a <b>vase</b> – and get to know the <b>Surface</b> tab along the way.</p>' +
                    '<p>So far you have always built <b>solid bodies</b>. A solid body is like a lump of modelling clay: ' +
                    'it is full inside and has a weight.</p>' +
                    '<p>A <b>surface</b> is very different. It is like a soap bubble: just a <b>paper-thin skin</b>, ' +
                    'with no thickness and nothing inside. With surfaces you can build very soft, curvy shapes.</p>' +
                    '<p>This is how your vase is made:</p>' +
                    '<ul><li>draw an <b>open outline</b> – half of the vase seen from the side</li>' +
                    '<li>spin it into a round surface with <b>Revolve</b></li>' +
                    '<li>make the rim taller with <b>Extend</b></li>' +
                    '<li>give the skin a real wall with <b>Thicken</b> – only then can the 3D printer print it</li></ul>'},
            {title: 'The vase outline',
                text: '<p>Click the <b>Surface</b> tab at the top. That’s where all the surface tools live.</p>' +
                    '<p>Start a <b>New Sketch</b> on the upright <b>side plane</b> (it’s called <b>YZ</b>). ' +
                    'Choose <b>Line</b> and click the right half of your vase point by point: ' +
                    'from the <b>origin</b> 25 mm to the right (that becomes the bottom), then upwards – ' +
                    'a bit wider first, then narrower like a neck, and a bit wider again at the very top. ' +
                    'A good suggestion is a height of <b>100 mm</b>.</p>' +
                    '<p>Important: the line stays <b>open</b>. Do <b>not</b> go back to the start! Press <b>Esc</b> at the end.</p>' +
                    '<p>Now round off the <b>corners</b>: choose <b>Fillet</b> (in the sketch under <b>Modify</b>), click ' +
                    'each corner of your line, one after the other, type <b>8</b> as the radius and click <b>OK</b>. That matters – at sharp ' +
                    'corners SolidCraft can’t give the vase a wall later. Then click <b>Finish Sketch</b>.</p>'},
            {title: 'Revolve the surface',
                text: '<p>Now the line becomes a surface. In the <b>Surface</b> tab, click <b>Revolve</b>.</p>' +
                    '<p>For <b>Profiles or curves</b>, click your line. As the <b>Axis</b>, choose the blue ' +
                    '<b>Z axis</b> – the upright centre line. The <b>Angle</b> stays at <b>360°</b>, ' +
                    'so once all the way round. Click <b>OK</b>.</p>' +
                    '<p>It’s like a pottery wheel: the line spins and leaves a round skin behind.</p>'},
            {title: 'A skin with no thickness',
                text: '<p>Take a close look at your vase. Turn the view and look inside from the top.</p>' +
                    '<p>The wall has <b>no thickness at all</b> – it is only a skin. A 3D printer can’t print that, ' +
                    'because it needs material with volume. We’ll change that in a moment.</p>' +
                    '<p>Tip: in the <b>Browser</b> on the left, the surface has its own entry. Click the <b>eye</b> next to it ' +
                    'to hide it and show it again.</p>'},
            {title: 'Extend the rim',
                text: '<p>Your vase should get a bit taller – without drawing the sketch again. That’s what <b>Extend</b> is for.</p>' +
                    '<p>Click <b>Extend</b>, then for <b>Edges</b> click the <b>top rim edge</b> of the vase. ' +
                    'Type <b>10</b> for <b>Distance</b> and click <b>OK</b>.</p>' +
                    '<p>The surface simply keeps growing in its own direction – as if you had drawn it longer in the first place.</p>'},
            {title: 'Thicken',
                text: '<p>Now the skin gets a real wall. Click <b>Thicken</b>.</p>' +
                    '<p>For <b>Surfaces</b>, click your vase. Type <b>2</b> for <b>Thickness</b> (a 2 mm wall). ' +
                    'The <b>Operation</b> says <b>New Body</b>. Click <b>OK</b>.</p>' +
                    '<p>Now the surface has become a <b>solid body</b> – with a bottom, a wall and an inside. ' +
                    'The thin skin stays as its own entry in the Browser. Hide it with the <b>eye</b>.</p>' +
                    '<p>Do you get an error message? Then type <b>-2</b> (the wall grows to the other side) or round ' +
                    'the corners in the sketch more: double-click the sketch in the timeline at the bottom.</p>'},
            {title: 'What the other buttons do',
                text: '<p>The <b>Surface</b> tab has even more tools. Almost all of them make <b>surfaces</b>, not bodies:</p>' +
                    '<ul><li><b>New Sketch</b> – like in the Model tab: start a flat drawing.</li>' +
                    '<li><b>Extrude</b> – pulls a line upwards. A stroke turns into a wall, like a fence.</li>' +
                    '<li><b>Revolve</b> – spins a line around an axis. You just did that.</li>' +
                    '<li><b>Sweep</b> – slides a shape along a path, like a slide or a hose.</li>' +
                    '<li><b>Surface Loft</b> – stretches a skin between two or more shapes, for example between ' +
                    'a big circle at the bottom and a small circle at the top.</li>' +
                    '<li><b>Trim</b> – cuts off a piece of a surface, for example at a plane.</li>' +
                    '<li><b>Untrim</b> – undoes trimming and fills holes in a surface.</li>' +
                    '<li><b>Extend</b> – lets a surface keep growing at its edge.</li>' +
                    '<li><b>Stitch</b> – sews several surfaces together at their edges. If everything is closed, it becomes a solid body.</li>' +
                    '<li><b>Thicken</b> – gives a surface a wall thickness.</li>' +
                    '<li><b>Convert Mesh</b> – turns a <b>mesh</b> into real surfaces. A mesh is a model made of lots of ' +
                    'tiny triangles, for example an STL file from the internet. You bring in a mesh with ' +
                    'the <b>Insert</b> tab → <b>Insert Mesh</b>. There is no separate “Mesh” tab in this version.</li></ul>' +
                    '<p>Under <b>Create ▾</b> and <b>Edit ▾</b> you’ll find more pro tools, for example ' +
                    '<b>Patch</b> (plugs a hole with a surface), <b>Offset Surface</b> (a copy at a distance), ' +
                    '<b>Unstitch</b> (separates stitched surfaces again) and <b>Reverse Normal</b> (swaps inside and outside).</p>'},
            {title: 'Challenge: vase workshop',
                text: '<p>Pick at least one idea – this time without the hand:</p>' +
                    '<ul><li>Change the shape: double-click the sketch in the timeline and move points – the vase follows.</li>' +
                    '<li>Build a second vase with <b>Surface Loft</b>: a big circle on the ground plane and a small circle ' +
                    'on a plane 80 mm higher. Pick both circles one after the other as <b>Sections</b>.</li>' +
                    '<li>Cut the rim at an angle: use <b>Trim</b> with a tilted plane. Then <b>Thicken</b> again.</li></ul>'},
            {title: 'Ready to print',
                text: '<p>Save your vase as an <b>STL file</b> for the 3D printer: menu <b>File</b> → <b>Export as STL</b>.</p>' +
                    '<p>Also save your project so you can keep building later.</p>'}
        ]
    }, {
        'Zeichne die offene Profillinie': 'Draw the open outline',
        'Klicke auf das Register „Fläche“': 'Click the “Surface” tab',
        'Klicke auf die Seitenebene': 'Click the side plane',
        'Punkt für Punkt, nicht schließen': 'Point by point, don’t close it',
        'Wähle „Drehen“ im Register Fläche': 'Choose “Revolve” in the Surface tab',
        'Dreh die Linie zur Vasenfläche': 'Revolve the line into the vase surface',
        'Klicke deine Linie an': 'Click your line',
        'Dreh oder zoome die Ansicht': 'Turn or zoom the view',
        'Ich habe gesehen: Die Wand ist hauchdünn': 'I saw it: the wall is paper-thin',
        'Wähle „Verlängern“': 'Choose “Extend”',
        'Verlängere den oberen Rand': 'Extend the top rim',
        'Klicke auf „Verlängern“': 'Click “Extend”',
        'Klicke die obere Randkante an': 'Click the top rim edge',
        'Abstand 10, dann OK': 'Distance 10, then OK',
        'Wähle „Dicke vergeben“': 'Choose “Thicken”',
        'Gib der Vase eine Wand': 'Give the vase a wall',
        'Klicke auf „Dicke vergeben“': 'Click “Thicken”',
        'Runde die Ecken mit „Vollrundung“ ab': 'Round the corners with “Fillet”',
        'Klicke auf „Vollrundung“': 'Click “Fillet”',
        'Jede Ecke anklicken, Radius 8, OK': 'Click each corner, radius 8, OK',
        'Klicke die Vase an': 'Click the vase',
        'Dicke 2, dann OK': 'Thickness 2, then OK'
    });
})();
