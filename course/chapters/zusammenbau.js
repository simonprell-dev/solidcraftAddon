// Kapitel „zusammenbau“: ein Windrad, dessen Rotor sich dreht – Register „Zusammenbau“ und „Einfügen“.
// Komponenten, Boden und Gelenke stehen nicht in document.inspect. Deshalb liest das Kapitel
// zusätzlich component.list und joint.list – beide nur lesend (live geprüft: document.revision,
// undo/redo, Zeitleiste und „dirty“ bleiben unverändert).
(function () {
    'use strict';
    const K = window.SolidcraftKursCourse;
    const {world, dims, mids, newSketchList, sketchHints, extrudeHints, exportStep} = K.helpers;

    if (window.SolidcraftKursAccess) {
        window.SolidcraftKursAccess.addRead({key: 'zbComponents', command: 'component.list', chapter: 'zusammenbau'});
        window.SolidcraftKursAccess.addRead({key: 'zbJoints', command: 'joint.list', chapter: 'zusammenbau'});
    }

    // ---------- Komponenten und Gelenke (aus component.list / joint.list) ----------

    const comps = c => (c.extra('zbComponents') || {}).components || [];
    // Instanzen von Komponenten, die Körper enthalten: {id, grounded, bodies}
    const occs = c => comps(c).filter(k => (k.bodies || []).length)
        .flatMap(k => (k.occurrences || []).map(o => ({id: o.id, grounded: !!o.grounded, bodies: k.bodies})));
    const jointInfo = c => c.extra('zbJoints') || {};
    const joints = c => (jointInfo(c).joints || []).filter(j => !j.suppressed);

    const madeComponents = c => occs(c).length >= 2 || c.newFeatures('BodyTransferFeature') >= 2;
    const someGrounded = c => occs(c).some(o => o.grounded);
    const someFree = c => occs(c).some(o => !o.grounded);
    const jointDone = c => joints(c).some(j => j.type === 'revolute' || j.type === 'cylindrical');
    const oneDof = c => (jointInfo(c).dof || []).some(d => d.dof === 1);
    const driven = c => joints(c).some(j => (j.values || []).some(v => Math.abs(Number(v.value) || 0) >= 1));
    // „Verbindungselement“ und „Teile“ öffnen beide den Dialog „Bauteil einfügen“ (parts.insert / parts.fastener).
    const partsOpen = c => /^parts\./.test(c.dialog() || '');
    const screwDone = c => c.newFeatures('ThreadFeature') >= 1 || (!c.inSketch() && c.bodyCount() > c.base.bodyCount);

    // ---------- Mast und Rotor ----------

    const mastDone = c => !c.inSketch() && c.bodies().some(b => dims(b)[2] >= 40);
    const rotorDone = c => mastDone(c) && c.bodyCount() >= 2;
    // Zwei neue Skizzen mit Form: erst der Mast, dann der Rotor.
    const twoDrawn = c => newSketchList(c).filter(s => s.profiles >= 1).length >= 2;
    // Mast = der höchste Körper, Rotor = ein anderer (am liebsten einer, der nicht fixiert ist).
    const mast = c => c.bodies().reduce((a, b) => (!a || dims(b)[2] > dims(a)[2] ? b : a), null);
    const rotor = c => {
        const m = mast(c);
        const free = occs(c).filter(o => !o.grounded).flatMap(o => o.bodies);
        const rest = c.bodies().filter(b => b !== m);
        return rest.find(b => free.includes(b.name)) || rest[rest.length - 1] || null;
    };
    const rotorTarget = c => {
        const r = rotor(c);
        return r ? world(r.center_of_mass || mids(r)) : 'viewport';
    };
    // Unten am Mast – dort verdeckt ihn der Rotor nicht.
    const mastTarget = c => {
        const m = mast(c);
        if (!m || !m.bbox) return 'viewport';
        const p = mids(m);
        p[2] = m.bbox.min[2] + 0.25 * dims(m)[2];
        return world(p);
    };
    // Vorderseite des Mastes, weit oben – dort entsteht die Rotor-Skizze.
    const mastFront = c => {
        const m = mast(c);
        if (!m || !m.bbox) return 'viewport';
        const p = mids(m);
        p[1] = m.bbox.min[1];
        p[2] = m.bbox.min[2] + 0.9 * dims(m)[2];
        return world(p);
    };

    // Register öffnen, falls der Knopf gerade nicht zu sehen ist (done: Dialog schon offen oder Ergebnis da).
    const tabHint = (tab, name, handle, done) => ({target: 'tab:' + tab, text: `Öffne „${name}“`,
        done: c => c.has(handle) || done(c)});

    K.add({
        id: 'zusammenbau',
        title: 'Dein Windrad',
        level: 'profi',
        type: 'Zusammenbau',
        icon: '🌬️',
        autoHints: true,
        steps: [
            {
                kind: 'info',
                title: 'Was bauen wir?',
                text: '<p>Du baust ein <b>Windrad</b>, dessen <b>Rotor sich wirklich dreht</b> – wie eine echte Maschine.</p>' +
                    '<p>Dazu brauchst du zwei neue Ideen:</p>' +
                    '<ul><li>Eine <b>Komponente</b> ist ein eigenes Bauteil, wie ein Legostein. Bisher war alles ein Klotz. ' +
                    'Jetzt wird der Mast ein Bauteil und der Rotor ein anderes.</li>' +
                    '<li>Ein <b>Gelenk</b> verbindet zwei Bauteile und bestimmt, wie sie sich bewegen dürfen. ' +
                    'Ein freies Teil kann sich auf sechs Arten bewegen: dreimal schieben (vor, zur Seite, hoch) und dreimal drehen. ' +
                    'Das nennt man <b>Freiheitsgrade</b>. Ein Gelenk nimmt Freiheitsgrade weg. ' +
                    'Ein <b>Drehgelenk</b> lässt nur noch einen übrig: das Drehen um eine Achse – genau wie bei einer Tür im Scharnier.</li></ul>' +
                    '<p>Du arbeitest in den Registern <b>Zusammenbau</b> und <b>Einfügen</b>. Dort holst du dir am Ende auch eine echte Schraube aus der Bauteil-Bibliothek.</p>'
            },
            {
                kind: 'learn',
                title: 'Mast und Rotor',
                text: '<p>Zuerst baust du die zwei Teile im Register <b>Modell</b>.</p>' +
                    '<ul><li><b>Mast</b>: ein Quadrat auf der Bodenebene, ein guter Vorschlag ist 8 × 8 mm. ' +
                    'Extrudiere es <b>100 mm</b> hoch.</li>' +
                    '<li><b>Rotor</b>: Starte eine <b>Neue Skizze</b> vorne auf dem Mast, weit oben. Zeichne einen <b>Kreis</b> als Nabe ' +
                    '(etwa 12 mm) und zwei lange, schmale <b>Rechtecke</b> als Flügel, die sich in der Nabe kreuzen – etwa 90 × 4 mm. ' +
                    'Extrudiere Nabe und Flügel <b>4 mm</b> nach vorne. Wichtig: Stell die <b>Operation</b> auf <b>Neuer Körper</b>. ' +
                    'Sonst klebt der Rotor am Mast fest.</li></ul>',
                tasks: [
                    {text: 'Der Mast steht', check: mastDone},
                    {text: 'Der Rotor ist ein eigener Körper', check: rotorDone}
                ],
                hints: [
                    ...sketchHints({plane: 'plane:XY', planeText: 'Klicke auf die Bodenebene',
                        tool: 'tool:sketch.rectangle.two_point', toolText: 'Klicke auf „Rechteck“',
                        drawText: 'Ein Quadrat, 8 × 8 mm', done: mastDone}),
                    ...extrudeHints({pickText: 'Klicke in das Quadrat', text: 'Abstand 100, dann OK', done: mastDone}),
                    ...sketchHints({plane: mastFront, planeText: 'Klicke vorne oben auf den Mast',
                        tool: 'tool:sketch.circle.center', toolText: 'Klicke auf „Kreis“', drawn: twoDrawn,
                        drawText: 'Nabe und zwei Flügel zeichnen', done: rotorDone}),
                    ...extrudeHints({pickText: 'Klicke in Nabe und Flügel', field: 'dialog:Operation',
                        text: '„Neuer Körper“, Abstand 4, OK', done: rotorDone})
                ]
            },
            {
                kind: 'learn',
                title: 'Aus Körpern werden Komponenten',
                text: '<p>Ein <b>Körper</b> ist nur eine Form. Eine <b>Komponente</b> ist ein Bauteil mit eigenem Platz – ' +
                    'erst Komponenten kann man mit Gelenken verbinden.</p>' +
                    '<p>Öffne das Register <b>Zusammenbau</b> und klicke auf <b>Aus Körpern</b>. Wähle den Mast und den Rotor ' +
                    '(oder klicke auf <b>Alles auswählen</b>) und dann auf <b>OK</b>. ' +
                    'Links im <b>Browser</b> stehen jetzt zwei Bauteile mit einem eigenen Symbol.</p>' +
                    '<p>Übrigens: <b>Neue Komp.</b> macht eine leere Komponente, in die du danach etwas hineinbaust.</p>',
                tasks: [{text: 'Mast und Rotor sind Komponenten', check: madeComponents}],
                hints: [
                    tabHint('ASSEMBLE', 'Zusammenbau', 'toolbar:component.from_bodies',
                        c => c.dialog() === 'component.from_bodies' || madeComponents(c)),
                    {target: 'tool:component.from_bodies', text: 'Klicke auf „Aus Körpern“',
                        done: c => c.dialog() === 'component.from_bodies' || madeComponents(c)},
                    {target: 'dialog:Bodies', text: 'Mast und Rotor wählen',
                        done: c => c.dialogPicked('Bodies') >= 2 || c.dialog() !== 'component.from_bodies' || madeComponents(c)},
                    {target: 'dialog:OK', text: 'Dann OK', done: c => madeComponents(c) || c.dialog() !== 'component.from_bodies'}
                ]
            },
            {
                kind: 'learn',
                title: 'Der Mast steht fest',
                text: '<p>Ein echtes Windrad steht fest im Boden. Im Zusammenbau heißt das: Der Mast wird <b>fixiert</b>. ' +
                    'Ein fixiertes Teil bewegt sich nie – alle anderen Teile bewegen sich um es herum.</p>' +
                    '<p>Schau in den <b>Browser</b>: Neben einem fixierten Teil steht eine kleine <b>Stecknadel</b>. ' +
                    'SolidCraft fixiert das erste Bauteil oft schon selbst.</p>' +
                    '<p>So änderst du es: Klicke ein Bauteil an und dann auf <b>Boden</b>. Ein zweiter Klick löst es wieder. ' +
                    'Am Ende soll der <b>Mast</b> die Stecknadel haben und der <b>Rotor frei</b> sein.</p>',
                tasks: [
                    {text: 'Ein Bauteil ist fixiert (Stecknadel)', check: someGrounded},
                    {text: 'Der Rotor ist frei', check: c => someGrounded(c) && someFree(c)}
                ],
                hints: [
                    tabHint('ASSEMBLE', 'Zusammenbau', 'toolbar:occurrence.ground', () => false),
                    {target: mastTarget, text: 'Klicke den Mast an',
                        done: c => (someGrounded(c) && someFree(c)) || ((c.doc().selection || []).length > 0)},
                    {target: 'tool:occurrence.ground', text: '„Boden“: fixieren oder lösen', done: c => joints(c).length > 0}
                ]
            },
            {
                kind: 'learn',
                title: 'Das Drehgelenk',
                text: '<p>Jetzt verbindest du Rotor und Mast mit einem <b>Drehgelenk</b>. Klicke auf <b>Wie gebaut</b>. ' +
                    'Dieses Gelenk verbindet zwei Teile genau dort, wo sie schon liegen.</p>' +
                    '<ul><li><b>Komponenten</b>: Klicke auf den Rotor und dann auf den Mast.</li>' +
                    '<li><b>Position</b>: Klicke vorne auf die Mitte der Nabe. Dort sitzt die Drehachse.</li>' +
                    '<li><b>Typ</b>: Wähle <b>Drehgelenk</b> und klicke auf <b>OK</b>.</li></ul>' +
                    '<p>Der Knopf <b>Gelenk</b> daneben macht fast dasselbe, schiebt aber das erste Teil an den Gelenkpunkt des zweiten – ' +
                    'praktisch, wenn ein Teil noch nicht an seinem Platz ist.</p>' +
                    '<p>Im Typ-Menü siehst du noch mehr Gelenke: <b>Starr</b> (gar keine Bewegung), <b>Schubgelenk</b> (nur schieben), ' +
                    '<b>Kugelgelenk</b> (in alle Richtungen drehen, wie deine Schulter) und andere.</p>',
                tasks: [
                    {text: 'Öffne „Wie gebaut“ oder „Gelenk“',
                        check: c => ['joint.as_built', 'joint.create'].includes(c.dialog()) || joints(c).length > 0},
                    {text: 'Drehgelenk zwischen Rotor und Mast', check: jointDone},
                    {text: 'Der Rotor hat genau 1 Freiheitsgrad', check: c => jointDone(c) && oneDof(c)}
                ],
                hints: [
                    tabHint('ASSEMBLE', 'Zusammenbau', 'toolbar:joint.as_built',
                        c => ['joint.as_built', 'joint.create'].includes(c.dialog()) || jointDone(c)),
                    {target: 'tool:joint.as_built', text: 'Klicke auf „Wie gebaut“',
                        done: c => ['joint.as_built', 'joint.create'].includes(c.dialog()) || jointDone(c)},
                    {target: rotorTarget, text: 'Klicke auf den Rotor',
                        done: c => c.dialogPicked('Components') >= 1 || c.dialog() !== 'joint.as_built' || jointDone(c)},
                    {target: mastTarget, text: 'Dann auf den Mast',
                        done: c => c.dialogPicked('Components') >= 2 || c.dialog() !== 'joint.as_built' || jointDone(c)},
                    {target: rotorTarget, text: 'Position: Mitte der Nabe',
                        done: c => c.dialogPicked('Position') >= 1 || c.dialog() !== 'joint.as_built' || jointDone(c)},
                    {target: 'dialog:Type', text: 'Typ „Drehgelenk“, dann OK', done: c => jointDone(c) || c.dialog() !== 'joint.as_built'}
                ]
            },
            {
                kind: 'learn',
                title: 'Dreh den Rotor',
                text: '<p>Jetzt kommt der Wind! Klicke auf <b>Gelenke antreiben</b>. Bei <b>Gelenk</b> steht dein Drehgelenk. ' +
                    'Tippe bei <b>Winkel</b> zum Beispiel <b>45</b> ein oder zieh am Schieberegler – der Rotor dreht sich mit. ' +
                    'Klicke dann auf <b>OK</b>.</p>' +
                    '<p>Du kannst den Rotor auch einfach mit der Maus anfassen und drehen. Der Mast bleibt dabei stehen, ' +
                    'denn er ist fixiert. Und der Rotor kann nur drehen, nicht wegfliegen – das Gelenk lässt nur diesen einen Freiheitsgrad zu.</p>',
                tasks: [{text: 'Der Rotor hat sich gedreht', check: driven}],
                hints: [
                    tabHint('ASSEMBLE', 'Zusammenbau', 'toolbar:joint.drive', c => c.dialog() === 'joint.drive' || driven(c)),
                    {target: 'tool:joint.drive', text: 'Klicke auf „Gelenke antreiben“',
                        done: c => c.dialog() === 'joint.drive' || driven(c)},
                    {target: 'dialog:Angle', text: 'Winkel, z. B. 45, dann OK', done: c => driven(c) || c.dialog() !== 'joint.drive'}
                ]
            },
            {
                kind: 'learn',
                title: 'Eine Schraube aus dem Regal',
                text: '<p>Schrauben und Muttern muss niemand selbst zeichnen. Sie heißen <b>Normteile</b>, weil sie überall auf der Welt ' +
                    'gleich gebaut sind. SolidCraft hat eine ganze Bibliothek davon.</p>' +
                    '<p>Öffne das Register <b>Einfügen</b> und klicke auf <b>Verbindungselement einfügen</b> ' +
                    '(der Knopf mit der Schraube). Wähle bei <b>Typ</b> zum Beispiel eine <b>Sechskantmutter</b> oder eine ' +
                    '<b>Zylinderschraube</b>, dann die <b>Größe</b> und klicke auf <b>OK</b>. ' +
                    'Klickst du vorher auf ein Loch, setzt sich die Schraube gleich hinein – sonst landet sie am Nullpunkt.</p>' +
                    '<p>Der Knopf <b>Teile</b> öffnet dieselbe Bibliothek mit allen Standardbauteilen, auch Unterlegscheiben, Stifte und Kugellager. ' +
                    'Mit <b>Bauteilgröße ändern</b> machst du eine eingefügte Schraube später länger oder dicker.</p>',
                tasks: [{text: 'Ein Normteil eingefügt', check: screwDone}],
                hints: [
                    tabHint('INSERT', 'Einfügen', 'toolbar:parts.fastener', c => partsOpen(c) || screwDone(c)),
                    {target: 'tool:parts.fastener', text: 'Klicke auf „Verbindungselement“',
                        done: c => partsOpen(c) || screwDone(c)},
                    {target: 'dialog:Type', text: 'Typ und Größe wählen, dann OK', done: c => screwDone(c) || !partsOpen(c)}
                ]
            },
            {
                kind: 'info',
                title: 'Was die anderen Knöpfe machen',
                text: '<p><b>Register Zusammenbau</b></p>' +
                    '<ul><li><b>Einfügen</b>: holt eine andere gespeicherte Konstruktion als Bauteil herein, zum Beispiel ein Rad für dein Auto.</li>' +
                    '<li><b>Gelenkursprung</b>: setzt vorher einen Punkt fest, an dem später ein Gelenk ansetzt.</li>' +
                    '<li><b>Starrgruppe</b>: klebt mehrere Bauteile so zusammen, dass sie sich nur gemeinsam bewegen.</li>' +
                    '<li><b>Verschieben</b>: schiebt oder dreht ein Bauteil von Hand – nur so weit, wie seine Gelenke es erlauben.</li>' +
                    '<li><b>Pos. erfassen</b> merkt sich die neue Lage verschobener Teile, <b>Pos. zurücksetzen</b> stellt sie wieder zurück.</li>' +
                    '<li><b>Bewegungsverknüpfung</b>: koppelt zwei Gelenke, zum Beispiel zwei Zahnräder – dreht sich eins, dreht sich das andere mit.</li>' +
                    '<li><b>Bewegungsuntersuchung</b>: spielt eine Bewegung wie einen kleinen Film ab.</li>' +
                    '<li><b>Bewegungsbahn</b>: zeichnet die Linie, die ein Punkt beim Bewegen fährt.</li>' +
                    '<li><b>Kontaktsätze</b> und <b>Kontakt</b>: lassen Teile aneinander anstoßen, statt durcheinander hindurchzufahren, ' +
                    'und prüfen, ob sich gerade etwas durchdringt.</li></ul>' +
                    '<p><b>Register Einfügen</b> – dafür brauchst du eigene Dateien:</p>' +
                    '<ul><li><b>STEP einfügen</b>: Bauteile aus anderen CAD-Programmen, zum Beispiel einen Motor vom Hersteller.</li>' +
                    '<li><b>Netz einfügen</b>: STL-, 3MF- oder OBJ-Dateien, zum Beispiel ein Modell aus dem Internet.</li>' +
                    '<li><b>Punktwolke</b>: Punkte aus einem 3D-Scanner.</li>' +
                    '<li><b>Zeichenfläche</b>: ein Foto als durchsichtige Vorlage zum Nachzeichnen, ' +
                    '<b>Zeichenfläche bearbeiten</b> ändert Größe und Lage.</li>' +
                    '<li><b>Dekal</b>: klebt ein Bild wie einen Aufkleber auf eine Fläche.</li>' +
                    '<li><b>DXF einfügen</b> und <b>SVG einfügen</b>: holen eine 2D-Zeichnung oder ein Logo in eine Skizze.</li>' +
                    '<li><b>Verknüpfungen aktualisieren</b>: lädt eingefügte Konstruktionen neu, wenn du sie geändert hast. ' +
                    '<b>Verknüpfung trennen</b>: das Teil vergisst seine Originaldatei.</li></ul>'
            },
            {
                kind: 'challenge',
                title: 'Challenge: Windrad in Bewegung',
                autoHints: false,
                text: '<ul><li>Klicke auf <b>Bewegungsuntersuchung</b>, füge mit <b>Schlüssel hinzufügen</b> eine Drehung hinzu ' +
                    'und spiel deinen Rotor wie einen Film ab.</li>' +
                    '<li>Zeichne mit <b>Bewegungsbahn</b> den Kreis, den eine Flügelspitze fährt.</li>' +
                    '<li>Bau ein Windrad mit <b>drei</b> oder <b>vier</b> Flügeln.</li>' +
                    '<li>Hast du ein eigenes Bild? Klebe es mit <b>Dekal</b> als Logo auf den Mast.</li></ul>',
                tasks: [{text: 'Ich habe eine Idee umgesetzt', manual: true}]
            },
            exportStep('dein Windrad')
        ]
    });

    K.translate('en', 'zusammenbau', {
        title: 'Your wind turbine',
        type: 'Assembly',
        steps: [
            {title: 'What are we building?',
                text: '<p>You’re building a <b>wind turbine</b> whose <b>rotor really turns</b> – like a real machine.</p>' +
                    '<p>For that you need two new ideas:</p>' +
                    '<ul><li>A <b>component</b> is a part of its own, like a Lego brick. Until now everything was one block. ' +
                    'Now the mast becomes one part and the rotor another.</li>' +
                    '<li>A <b>joint</b> connects two parts and decides how they may move. ' +
                    'A free part can move in six ways: slide three ways (forward, sideways, up) and turn three ways. ' +
                    'These are called <b>degrees of freedom</b>. A joint takes degrees of freedom away. ' +
                    'A <b>revolute joint</b> leaves just one: turning around an axis – just like a door on its hinge.</li></ul>' +
                    '<p>You’ll work in the <b>Assemble</b> and <b>Insert</b> tabs. At the end you’ll also take a real screw from the parts library.</p>'},
            {title: 'Mast and rotor',
                text: '<p>First you build the two parts in the <b>Model</b> tab.</p>' +
                    '<ul><li><b>Mast</b>: a square on the ground plane, a good suggestion is 8 × 8 mm. ' +
                    'Extrude it <b>100 mm</b> up.</li>' +
                    '<li><b>Rotor</b>: start a <b>New Sketch</b> on the front of the mast, near the top. Draw a <b>Circle</b> as the hub ' +
                    '(about 12 mm) and two long, thin <b>Rectangles</b> as blades that cross in the hub – about 90 × 4 mm. ' +
                    'Extrude hub and blades <b>4 mm</b> to the front. Important: set the <b>Operation</b> to <b>New Body</b>. ' +
                    'Otherwise the rotor gets stuck to the mast.</li></ul>'},
            {title: 'Bodies become components',
                text: '<p>A <b>body</b> is just a shape. A <b>component</b> is a part with a place of its own – ' +
                    'only components can be connected with joints.</p>' +
                    '<p>Open the <b>Assemble</b> tab and click <b>From Bodies</b>. Choose the mast and the rotor ' +
                    '(or click <b>Select All</b>) and then <b>OK</b>. ' +
                    'On the left in the <b>Browser</b> you now see two parts with their own icon.</p>' +
                    '<p>By the way: <b>New Comp.</b> makes an empty component that you build something into afterwards.</p>'},
            {title: 'The mast stands firm',
                text: '<p>A real wind turbine stands firmly in the ground. In an assembly this means: the mast is <b>grounded</b>. ' +
                    'A grounded part never moves – all other parts move around it.</p>' +
                    '<p>Look at the <b>Browser</b>: next to a grounded part there’s a small <b>pin</b>. ' +
                    'SolidCraft often grounds the first part by itself.</p>' +
                    '<p>Here’s how to change it: click a part and then <b>Ground</b>. A second click frees it again. ' +
                    'In the end the <b>mast</b> should have the pin and the <b>rotor</b> should be <b>free</b>.</p>'},
            {title: 'The revolute joint',
                text: '<p>Now you connect rotor and mast with a <b>revolute joint</b>. Click <b>As-Built</b>. ' +
                    'This joint connects two parts exactly where they already are.</p>' +
                    '<ul><li><b>Components</b>: click the rotor and then the mast.</li>' +
                    '<li><b>Position</b>: click the middle of the hub at the front. That’s where the axis sits.</li>' +
                    '<li><b>Type</b>: choose <b>Revolute</b> and click <b>OK</b>.</li></ul>' +
                    '<p>The <b>Joint</b> button next to it does almost the same, but moves the first part to the joint point of the second – ' +
                    'handy when a part isn’t in its place yet.</p>' +
                    '<p>In the type menu you’ll find more joints: <b>Rigid</b> (no movement at all), <b>Slider</b> (only sliding), ' +
                    '<b>Ball</b> (turning in every direction, like your shoulder) and others.</p>'},
            {title: 'Turn the rotor',
                text: '<p>Here comes the wind! Click <b>Drive Joints</b>. Under <b>Joint</b> you see your revolute joint. ' +
                    'Type for example <b>45</b> into <b>Angle</b> or drag the slider – the rotor turns along. ' +
                    'Then click <b>OK</b>.</p>' +
                    '<p>You can also simply grab the rotor with the mouse and turn it. The mast stays put, ' +
                    'because it’s grounded. And the rotor can only turn, not fly away – the joint only allows this one degree of freedom.</p>'},
            {title: 'A screw off the shelf',
                text: '<p>Nobody has to draw screws and nuts themselves. They’re called <b>standard parts</b>, because they’re built ' +
                    'the same everywhere in the world. SolidCraft has a whole library of them.</p>' +
                    '<p>Open the <b>Insert</b> tab and click <b>Fastener</b> (the button with the screw). ' +
                    'Under <b>Type</b> choose for example a <b>Hex nut</b> or a <b>Socket head cap screw</b>, then the <b>Size</b>, and click <b>OK</b>. ' +
                    'If you click a hole first, the screw sits right in it – otherwise it lands at the origin.</p>' +
                    '<p>The <b>Parts</b> button opens the same library with all standard parts, including washers, pins and ball bearings. ' +
                    'With <b>Resize Part</b> you can later make an inserted screw longer or thicker.</p>'},
            {title: 'What the other buttons do',
                text: '<p><b>Assemble tab</b></p>' +
                    '<ul><li><b>Insert</b>: brings in another saved design as a part, for example a wheel for your car.</li>' +
                    '<li><b>Joint Origin</b>: sets a point in advance where a joint will attach later.</li>' +
                    '<li><b>Rigid Group</b>: glues several parts together so they only move together.</li>' +
                    '<li><b>Move</b>: slides or turns a part by hand – only as far as its joints allow.</li>' +
                    '<li><b>Capture Pos.</b> keeps the new place of moved parts, <b>Revert Pos.</b> puts them back.</li>' +
                    '<li><b>Motion Link</b>: couples two joints, for example two gears – when one turns, the other turns too.</li>' +
                    '<li><b>Motion Study</b>: plays a movement like a little film.</li>' +
                    '<li><b>Motion Trace</b>: draws the line a point travels while moving.</li>' +
                    '<li><b>Contact Sets</b> and <b>Contact</b>: make parts bump into each other instead of passing through, ' +
                    'and check whether something is passing through right now.</li></ul>' +
                    '<p><b>Insert tab</b> – for these you need your own files:</p>' +
                    '<ul><li><b>Insert STEP</b>: parts from other CAD programs, for example a motor from its maker.</li>' +
                    '<li><b>Insert Mesh</b>: STL, 3MF or OBJ files, for example a model from the internet.</li>' +
                    '<li><b>Point Clouds</b>: points from a 3D scanner.</li>' +
                    '<li><b>Canvas</b>: a photo as a see-through template to trace, ' +
                    '<b>Edit Canvas</b> changes its size and position.</li>' +
                    '<li><b>Decal</b>: sticks a picture onto a face like a sticker.</li>' +
                    '<li><b>Insert DXF</b> and <b>Insert SVG</b>: bring a 2D drawing or a logo into a sketch.</li>' +
                    '<li><b>Update Links</b>: reloads inserted designs when you’ve changed them. ' +
                    '<b>Break Link</b>: the part forgets its original file.</li></ul>'},
            {title: 'Challenge: wind turbine in motion',
                text: '<ul><li>Click <b>Motion Study</b>, add a <b>key</b> for your joint ' +
                    'and play your rotor like a film.</li>' +
                    '<li>Use <b>Motion Trace</b> to draw the circle a blade tip travels.</li>' +
                    '<li>Build a wind turbine with <b>three</b> or <b>four</b> blades.</li>' +
                    '<li>Do you have a picture of your own? Stick it onto the mast as a logo with <b>Decal</b>.</li></ul>'},
            {title: 'Ready to print',
                text: '<p>Save your wind turbine as an <b>STL file</b> for the 3D printer: <b>File</b> menu → <b>Export STL</b>.</p>' +
                    '<p>Also save your project so you can keep building later.</p>'}
        ]
    }, {
        'Der Mast steht': 'The mast is standing',
        'Der Rotor ist ein eigener Körper': 'The rotor is a body of its own',
        'Ein Quadrat, 8 × 8 mm': 'A square, 8 × 8 mm',
        'Klicke in das Quadrat': 'Click inside the square',
        'Abstand 100, dann OK': 'Distance 100, then OK',
        'Klicke vorne oben auf den Mast': 'Click the front of the mast, near the top',
        'Nabe und zwei Flügel zeichnen': 'Draw the hub and two blades',
        'Klicke in Nabe und Flügel': 'Click inside hub and blades',
        '„Neuer Körper“, Abstand 4, OK': '“New Body”, distance 4, OK',
        'Mast und Rotor sind Komponenten': 'Mast and rotor are components',
        'Öffne „Zusammenbau“': 'Open “Assemble”',
        'Öffne „Einfügen“': 'Open “Insert”',
        'Klicke auf „Aus Körpern“': 'Click “From Bodies”',
        'Mast und Rotor wählen': 'Choose mast and rotor',
        'Dann OK': 'Then OK',
        'Ein Bauteil ist fixiert (Stecknadel)': 'One part is grounded (pin)',
        'Der Rotor ist frei': 'The rotor is free',
        'Klicke den Mast an': 'Click the mast',
        '„Boden“: fixieren oder lösen': '“Ground”: fix or free',
        'Öffne „Wie gebaut“ oder „Gelenk“': 'Open “As-Built” or “Joint”',
        'Drehgelenk zwischen Rotor und Mast': 'Revolute joint between rotor and mast',
        'Der Rotor hat genau 1 Freiheitsgrad': 'The rotor has exactly 1 degree of freedom',
        'Klicke auf „Wie gebaut“': 'Click “As-Built”',
        'Klicke auf den Rotor': 'Click the rotor',
        'Dann auf den Mast': 'Then the mast',
        'Position: Mitte der Nabe': 'Position: middle of the hub',
        'Typ „Drehgelenk“, dann OK': 'Type “Revolute”, then OK',
        'Der Rotor hat sich gedreht': 'The rotor has turned',
        'Klicke auf „Gelenke antreiben“': 'Click “Drive Joints”',
        'Winkel, z. B. 45, dann OK': 'Angle, e.g. 45, then OK',
        'Ein Normteil eingefügt': 'A standard part inserted',
        'Klicke auf „Verbindungselement“': 'Click “Fastener”',
        'Typ und Größe wählen, dann OK': 'Choose type and size, then OK'
    });
})();
