// Kapitel „verwalten“ – Register „Verwalten“: ein Baukasten mit Parametern.
// Live geprüft (SolidCraft 0.30.1):
//  - Parameter öffnet ein Fenster (ui.windows enthält 'parameters.change', kein ui.dialog). Handles:
//    dialog:table:user:add („Parameter hinzufügen“), neue Zeile param:new:name / param:new:expression.
//  - document.inspect().params = Benutzerparameter {name, expression, value, model:false}; units = 'mm' | 'cm' …
//  - Konfigurieren und Konfigurationstabelle öffnen denselben Dialog (ui.dialog.command 'config.table'):
//    „+“ = dialog:menu:Add Column, Einträge dialog:button::<name> (parameter), „Konfiguration hinzufügen“ =
//    dialog:table:configuration_table:add, neue Zeile config:new:name, „Aktivieren“ = config:activate:<zeile>.
//  - Material / Erscheinungsbild: Dialoge material.assign (Feld Bodies) und appearance.assign (Feld Objects).
//  - Einheiten öffnet ein Menü (5 × menu:document.units), Alles berechnen rechnet ohne sichtbares Fenster.
//  - Param.-Graph zeigt im Web nichts Sichtbares – er wird nur erklärt.
//  Nur lesend (document.revision und Rückgängig-Liste bleiben gleich, live geprüft): parameters.graph,
//  config.table, inspect.measure (Material je Körper), appearance.list.
(function () {
    'use strict';
    const K = window.SolidcraftKursCourse;
    const {sketchHints, extrudeHints, exportStep, profileDrawn, world} = K.helpers;

    const A = window.SolidcraftKursAccess;
    if (A) {
        A.addRead({key: 'verwalten.graph', command: 'parameters.graph', chapter: 'verwalten'});
        A.addRead({key: 'verwalten.config', command: 'config.table', chapter: 'verwalten'});
        A.addRead({key: 'verwalten.measure', command: 'inspect.measure', chapter: 'verwalten'});
        A.addRead({key: 'verwalten.looks', command: 'appearance.list', chapter: 'verwalten'});
    }

    const memo = new WeakMap();
    function sticky (c, key, cond) {
        let m = memo.get(c.base);
        if (!m) memo.set(c.base, m = {});
        if (cond) m[key] = true;
        return !!m[key];
    }

    const onTab = (c, tab) => !!(c.ui().ui && c.ui().ui.tab === tab);
    const tabHint = (tab, text, done) => ({target: 'tab:' + tab, text, done: c => onTab(c, tab) || done(c)});

    // Parameter
    const userParams = c => (c.doc().params || []).filter(p => !p.model);
    const paramsOpen = c => (c.ui().windows || []).includes('parameters.change');
    const newRow = c => c.has('param:new:name');
    // Benutzerparameter, die das Modell benutzt (über ein Feature oder einen Modellparameter).
    const usedParams = c => {
        const names = userParams(c).map(p => p.name);
        const edges = (c.extra('verwalten.graph') || {}).edges || [];
        return names.filter(n => edges.some(([user, used]) => used === n && !names.includes(user)));
    };
    const box = c => !c.inSketch() && c.bodyCount() >= 1;
    const boxWithParam = c => box(c) && usedParams(c).length >= 1;
    const volumeChanged = c => box(c) && Math.abs(c.volume() - c.base.volume) > 1;
    const paramField = c => {
        const p = usedParams(c)[0] || (userParams(c)[0] || {}).name;
        return p && c.has('param:' + p) ? 'handle:param:' + p : 'handle:dialog:table:user:add';
    };

    // Konfigurationen
    const table = c => c.extra('verwalten.config') || {};
    const columns = c => (table(c).columns || []).length;
    const rows = c => table(c).rows || [];
    const configOpen = c => c.dialog() === 'config.table';
    const activated = c => rows(c).length >= 2 && !!table(c).active && table(c).active !== rows(c)[0].name;
    const columnEntry = c => {
        const hit = userParams(c).map(p => `dialog:button::${p.name} (parameter)`).find(n => c.has(n));
        return hit ? 'handle:' + hit : 'handle:dialog:menu:Add Column';
    };
    const activateButton = c => {
        const r = rows(c).find(x => x.name !== table(c).active);
        return r ? 'handle:config:activate:' + r.name : 'dialog:OK';
    };

    // Material und Farbe
    const materialSet = c => ((c.extra('verwalten.measure') || {}).bodies || []).some(b => b.material && b.material !== 'Default');
    const colored = c => Object.keys((c.extra('verwalten.looks') || {}).bodies || {}).length > 0;
    const materialOpen = c => c.dialog() === 'material.assign';
    const appearanceOpen = c => c.dialog() === 'appearance.assign';
    const boxTop = c => {
        const b = c.largest();
        return b && b.bbox ? world([0, 1, 2].map(i => (i === 2 ? b.bbox.max[2] : (b.bbox.min[i] + b.bbox.max[i]) / 2))) : 'viewport';
    };

    // Einheiten
    const units = c => c.doc().units || 'mm';
    const otherUnit = c => sticky(c, 'other', units(c) !== 'mm');
    const backToMm = c => {
        const o = otherUnit(c);
        return sticky(c, 'back', o && units(c) === 'mm');
    };
    const unitsMenu = c => c.has('menu:document.units');

    K.add({
        id: 'verwalten',
        title: 'Der Baukasten mit Parametern',
        level: 'profi',
        type: 'Verwalten',
        icon: '🧱',
        autoHints: true,
        steps: [
            {
                kind: 'info',
                title: 'Was bauen wir?',
                text: '<p>Du baust eine <b>Box</b>, deren Maße du jederzeit an einer einzigen Stelle ändern kannst – ' +
                    'wie ein Baukasten mit Drehknöpfen.</p>' +
                    '<p>Dafür lernst du das Register <b>Verwalten</b> kennen:</p>' +
                    '<ul><li><b>Parameter</b>: Maße mit einem Namen, zum Beispiel <b>breite</b> oder <b>hoehe</b>. ' +
                    'Statt einer Zahl tippst du später einfach den Namen ein.</li>' +
                    '<li><b>Konfigurationen</b>: Varianten deines Teils, zum Beispiel <b>klein</b> und <b>groß</b>, in einer Tabelle.</li>' +
                    '<li><b>Material</b> und <b>Erscheinungsbild</b>: woraus dein Teil ist und welche Farbe es hat.</li>' +
                    '<li><b>Einheiten</b>, <b>Regeln</b> und <b>Alles berechnen</b>: Einstellungen für das ganze Design.</li></ul>'
            },
            {
                kind: 'learn',
                title: 'Parameter anlegen',
                text: '<p>Ein <b>Parameter</b> ist ein Maß mit einem Namen. Öffne im Register <b>Verwalten</b> den Knopf ' +
                    '<b>Parameter</b>. Unter <b>Benutzerparameter</b> klickst du auf <b>Parameter hinzufügen</b>.</p>' +
                    '<p>Tippe als <b>Name</b> <b>breite</b> und als <b>Ausdruck</b> <b>40</b> ein und drück die Eingabetaste. ' +
                    'Leg genauso einen zweiten Parameter an: <b>hoehe</b> mit <b>20</b>. Schreib die Namen ohne Umlaute und ' +
                    'ohne Leerzeichen. Dann klicke auf <b>OK</b>.</p>',
                tasks: [
                    {text: 'Öffne „Parameter“', check: c => sticky(c, 'open', paramsOpen(c)) || userParams(c).length >= 1},
                    {text: 'Lege einen Parameter an', check: c => userParams(c).length >= 1},
                    {text: 'Lege einen zweiten Parameter an', check: c => userParams(c).length >= 2}
                ],
                hints: [
                    tabHint('MANAGE', 'Klicke auf das Register „Verwalten“', c => paramsOpen(c) || userParams(c).length >= 2),
                    {target: 'tool:parameters.change', text: 'Klicke auf „Parameter“', done: c => paramsOpen(c) || userParams(c).length >= 2},
                    {target: 'handle:dialog:table:user:add', text: 'Klicke auf „Parameter hinzufügen“',
                        done: c => newRow(c) || userParams(c).length >= 2},
                    {target: 'handle:param:new:name', text: 'Name und Ausdruck eintippen',
                        done: c => !newRow(c) || userParams(c).length >= 2},
                    {target: 'dialog:OK', text: 'Klicke auf „OK“', done: c => userParams(c).length >= 2 && !paramsOpen(c)}
                ]
            },
            {
                kind: 'learn',
                title: 'Eine Box aus Parametern',
                text: '<p>Jetzt baust du die Box. Wechsle ins Register <b>Modell</b>, starte eine <b>Neue Skizze</b> auf der ' +
                    'Bodenebene und zeichne ein <b>Rechteck</b>. Tipp: In das Maßfeld kannst du statt 40 auch <b>breite</b> tippen.</p>' +
                    '<p>Beende die Skizze und klicke auf <b>Extrudieren</b>. Tippe bei <b>Abstand</b> keine Zahl, sondern ' +
                    '<b>hoehe</b> ein – den Namen deines Parameters – und klicke auf <b>OK</b>. ' +
                    'Jetzt ist die Höhe deiner Box mit dem Parameter verbunden.</p>',
                tasks: [
                    {text: 'Zeichne ein Rechteck', check: c => profileDrawn(c) || boxWithParam(c)},
                    {text: 'Extrudiere mit „hoehe“ als Abstand', check: boxWithParam}
                ],
                hints: [
                    tabHint('MODEL', 'Klicke auf das Register „Modell“', c => c.has('toolbar:sketch.create') || c.inSketch() || boxWithParam(c)),
                    ...sketchHints({plane: 'plane:XY', planeText: 'Klicke auf die Bodenebene',
                        tool: 'tool:sketch.rectangle.two_point', toolText: 'Klicke auf „Rechteck“',
                        drawText: 'Klicke nacheinander zwei Ecken', done: boxWithParam}),
                    ...extrudeHints({text: 'Tippe hoehe ein, dann OK', done: boxWithParam})
                ]
            },
            {
                kind: 'learn',
                title: 'Am Drehknopf drehen',
                text: '<p>Jetzt kommt der Trick: Öffne wieder <b>Parameter</b> und ändere den <b>Ausdruck</b> von ' +
                    '<b>hoehe</b>, zum Beispiel auf <b>35</b>. Drück die Eingabetaste – und schau auf deine Box: ' +
                    'Sie wächst von selbst! Alles, was den Parameter benutzt, passt sich an.</p>' +
                    '<p>Ein Ausdruck kann auch rechnen: <b>breite / 2</b> ergibt die halbe Breite.</p>' +
                    '<p>Der Knopf <b>Param.-Graph</b> (Parametergraph) zeigt, welcher Parameter welches Element steuert. ' +
                    'Das hilft bei großen Modellen mit vielen Parametern.</p>',
                tasks: [
                    {text: 'Öffne „Parameter“', check: c => sticky(c, 'open', paramsOpen(c)) || volumeChanged(c)},
                    {text: 'Ändere einen Parameter – die Box passt sich an', check: volumeChanged}
                ],
                hints: [
                    tabHint('MANAGE', 'Klicke auf das Register „Verwalten“', c => paramsOpen(c) || volumeChanged(c)),
                    {target: 'tool:parameters.change', text: 'Klicke auf „Parameter“', done: c => paramsOpen(c) || volumeChanged(c)},
                    {target: paramField, text: 'Neuen Wert eintippen, z. B. 35', done: volumeChanged},
                    {target: 'dialog:OK', text: 'Klicke auf „OK“', done: c => volumeChanged(c) && !paramsOpen(c)}
                ]
            },
            {
                kind: 'learn',
                title: 'Klein und groß: Konfigurationen',
                text: '<p>Manchmal brauchst du dasselbe Teil in mehreren Größen. Dafür gibt es <b>Konfigurationen</b>: ' +
                    'eine Tabelle, in der jede Zeile eine Variante ist.</p>' +
                    '<p>Klicke auf <b>Konfigurieren</b>. Mit dem <b>+</b> oben rechts in der Tabelle fügst du eine Spalte hinzu – ' +
                    'wähle <b>hoehe (parameter)</b>. Dann klicke auf <b>Konfiguration hinzufügen</b>, nenne die neue Zeile ' +
                    '<b>gross</b> und gib ihr eine andere Höhe, zum Beispiel <b>50</b>.</p>' +
                    '<p>Klicke bei <b>gross</b> auf <b>Aktivieren</b> – schon hat deine Box die neue Größe. Dann <b>OK</b>. ' +
                    'Der Knopf <b>Konfigurat…</b> (Konfigurationstabelle anzeigen) öffnet dieselbe Tabelle wieder.</p>',
                tasks: [
                    {text: 'Füge „hoehe“ als Spalte hinzu', check: c => columns(c) >= 1},
                    {text: 'Lege eine zweite Konfiguration an', check: c => rows(c).length >= 2},
                    {text: 'Aktiviere die neue Konfiguration', check: activated}
                ],
                hints: [
                    tabHint('MANAGE', 'Klicke auf das Register „Verwalten“', c => configOpen(c) || activated(c)),
                    {target: 'tool:config.configure', text: 'Klicke auf „Konfigurieren“', done: c => configOpen(c) || activated(c)},
                    {target: 'handle:dialog:menu:Add Column', text: 'Klicke auf „+“: neue Spalte',
                        done: c => columns(c) >= 1 || c.has('dialog:menu:Add Column:filter') || !configOpen(c)},
                    {target: columnEntry, text: 'Wähle „hoehe (parameter)“', done: c => columns(c) >= 1 || !configOpen(c)},
                    {target: 'handle:dialog:table:configuration_table:add', text: 'Klicke auf „Konfiguration hinzufügen“',
                        done: c => rows(c).length >= 2 || c.has('config:new:name') || !configOpen(c)},
                    {target: 'handle:config:new:name', text: 'Name „gross“ und neue Höhe eintippen',
                        done: c => rows(c).length >= 2 || !configOpen(c)},
                    {target: activateButton, text: 'Klicke auf „Aktivieren“', done: activated},
                    {target: 'dialog:OK', text: 'Klicke auf „OK“', done: c => activated(c) && !configOpen(c)}
                ]
            },
            {
                kind: 'learn',
                title: 'Material und Farbe',
                text: '<p>Aus welchem <b>Material</b> ist deine Box? Klicke auf <b>Material</b>, dann auf deine Box, und wähle ' +
                    'bei <b>Material</b> den Kunststoff <b>PLA</b> – daraus sind die meisten 3D-Druck-Teile. ' +
                    'Jetzt rechnet SolidCraft mit dem echten Gewicht von PLA. Klicke auf <b>OK</b>.</p>' +
                    '<p>Die <b>Farbe</b> stellst du mit <b>Erscheinungsbild</b> ein: Box anklicken, Farbe aussuchen, <b>OK</b>. ' +
                    'Das Erscheinungsbild ändert nur das Aussehen, nicht das Gewicht.</p>',
                tasks: [
                    {text: 'Gib der Box ein Material', check: materialSet},
                    {text: 'Gib der Box eine Farbe', check: colored}
                ],
                hints: [
                    tabHint('MANAGE', 'Klicke auf das Register „Verwalten“', c => materialOpen(c) || appearanceOpen(c) || (materialSet(c) && colored(c))),
                    {target: 'tool:material.assign', text: 'Klicke auf „Material“', done: c => materialOpen(c) || materialSet(c)},
                    {target: boxTop, text: 'Klicke auf deine Box', done: c => c.dialogPicked('Bodies') > 0 || !materialOpen(c) || materialSet(c)},
                    {target: 'dialog:Material', text: 'Wähle „PLA“, dann OK', done: c => materialSet(c) || !materialOpen(c)},
                    {target: 'tool:appearance.assign', text: 'Klicke auf „Erscheinungsbild“', done: c => appearanceOpen(c) || colored(c)},
                    {target: boxTop, text: 'Klicke auf deine Box', done: c => c.dialogPicked('Objects') > 0 || !appearanceOpen(c) || colored(c)},
                    {target: 'dialog:OK', text: 'Farbe wählen, dann OK', done: c => colored(c) || !appearanceOpen(c)}
                ]
            },
            {
                kind: 'learn',
                title: 'Einheiten, Regeln und Alles berechnen',
                text: '<p>Rechts im Register <b>Verwalten</b> liegen Einstellungen für das <b>ganze Design</b>:</p>' +
                    '<ul><li><b>Einheiten</b>: ob SolidCraft Längen in Millimetern (<b>mm</b>), Zentimetern (<b>cm</b>) oder Zoll anzeigt. ' +
                    'Deine Box bleibt dabei gleich groß – nur die Zahlen ändern sich.</li>' +
                    '<li><b>Blechregeln</b>: Dicke und Biegeradius für Teile aus Blech.</li>' +
                    '<li><b>Kunststoff…</b> (Kunststoffregeln verwalten) und <b>Regel zuweisen</b>: Wanddicke und Formschräge ' +
                    'für Teile, die in einer Form gegossen werden.</li>' +
                    '<li><b>Alles berechnen</b>: baut das ganze Modell von vorn neu auf. Das hilft, wenn etwas komisch aussieht.</li></ul>' +
                    '<p>Probiere es aus: Stell die <b>Einheiten</b> auf <b>cm</b>, schau dir die Zahlen an, und stell sie wieder auf <b>mm</b>. ' +
                    'Dann klicke auf <b>Alles berechnen</b>.</p>',
                tasks: [
                    {text: 'Stell die Einheiten auf „cm“', check: otherUnit},
                    {text: 'Stell sie zurück auf „mm“', check: backToMm},
                    {text: 'Ich habe auf „Alles berechnen“ geklickt', manual: true}
                ],
                hints: [
                    tabHint('MANAGE', 'Klicke auf das Register „Verwalten“', c => unitsMenu(c) || backToMm(c)),
                    {target: 'tool:document.units', text: 'Klicke auf „Einheiten“ und wähle „cm“', done: otherUnit},
                    {target: 'tool:document.units', text: 'Wieder „Einheiten“ und „mm“', done: backToMm},
                    {target: 'tool:timeline.compute_all', text: 'Klicke auf „Alles berechnen“', done: () => false}
                ]
            },
            {
                kind: 'challenge',
                title: 'Challenge: Dein Baukasten',
                autoHints: false,
                text: '<p>Bau deinen Baukasten weiter aus – diesmal ohne Hand. Such dir mindestens eine Idee aus:</p>' +
                    '<ul><li>Leg einen dritten Parameter <b>wand</b> mit <b>2</b> an und höhle die Box mit <b>Hülle</b> aus – ' +
                    'tippe bei <b>Dicke</b> einfach <b>wand</b> ein.</li>' +
                    '<li>Füge eine Konfiguration <b>klein</b> hinzu und schalte zwischen den Größen hin und her.</li>' +
                    '<li>Verbinde auch die Breite: Doppelklick auf die Skizze in der Zeitleiste, dann das Maß auf <b>breite</b> setzen.</li></ul>',
                tasks: [
                    {text: 'Lege einen dritten Parameter an', check: c => userParams(c).length >= 3},
                    {text: 'Ich habe eine Idee umgesetzt', manual: true}
                ],
                hints: [
                    tabHint('MANAGE', 'Klicke auf das Register „Verwalten“', c => paramsOpen(c) || userParams(c).length >= 3),
                    {target: 'tool:parameters.change', text: 'Klicke auf „Parameter“', done: c => paramsOpen(c) || userParams(c).length >= 3}
                ]
            },
            exportStep('deine Box')
        ]
    });

    K.translate('en', 'verwalten', {
        title: 'The building kit with parameters',
        type: 'Manage',
        steps: [
            {title: 'What are we building?',
                text: '<p>You build a <b>box</b> whose sizes you can change at any time in one single place – ' +
                    'like a building kit with control knobs.</p>' +
                    '<p>For that you get to know the <b>Manage</b> tab:</p>' +
                    '<ul><li><b>Parameters</b>: sizes with a name, for example <b>width</b> or <b>height</b>. ' +
                    'Instead of a number you simply type the name later.</li>' +
                    '<li><b>Configurations</b>: variants of your part, for example <b>small</b> and <b>large</b>, in a table.</li>' +
                    '<li><b>Material</b> and <b>Appearance</b>: what your part is made of and what colour it has.</li>' +
                    '<li><b>Units</b>, <b>Rules</b> and <b>Compute All</b>: settings for the whole design.</li></ul>'},
            {title: 'Create parameters',
                text: '<p>A <b>parameter</b> is a size with a name. On the <b>Manage</b> tab, open the ' +
                    '<b>Parameters</b> button. Under <b>User Parameters</b>, click <b>Add parameter</b>.</p>' +
                    '<p>Type <b>width</b> as the <b>Name</b> and <b>40</b> as the <b>Expression</b> and press Enter. ' +
                    'Create a second parameter the same way: <b>height</b> with <b>20</b>. Write the names without spaces. ' +
                    'Then click <b>OK</b>.</p>'},
            {title: 'A box made of parameters',
                text: '<p>Now you build the box. Switch to the <b>Model</b> tab, start a <b>New Sketch</b> on the ' +
                    'ground plane and draw a <b>Rectangle</b>. Tip: in the size field you can type <b>width</b> instead of 40.</p>' +
                    '<p>Finish the sketch and click <b>Extrude</b>. For <b>Distance</b>, don’t type a number but ' +
                    '<b>height</b> – the name of your parameter – and click <b>OK</b>. ' +
                    'Now the height of your box is linked to the parameter.</p>'},
            {title: 'Turn the knob',
                text: '<p>Here comes the trick: open <b>Parameters</b> again and change the <b>Expression</b> of ' +
                    '<b>height</b>, for example to <b>35</b>. Press Enter – and look at your box: ' +
                    'it grows by itself! Everything that uses the parameter adapts.</p>' +
                    '<p>An expression can also calculate: <b>width / 2</b> gives half the width.</p>' +
                    '<p>The <b>Param. Graph</b> button (Parameter Graph) shows which parameter drives which feature. ' +
                    'That helps with big models with lots of parameters.</p>'},
            {title: 'Small and large: configurations',
                text: '<p>Sometimes you need the same part in several sizes. That is what <b>configurations</b> are for: ' +
                    'a table in which each row is one variant.</p>' +
                    '<p>Click <b>Configure</b>. With the <b>+</b> at the top right of the table you add a column – ' +
                    'choose <b>height (parameter)</b>. Then click <b>Add configuration</b>, name the new row ' +
                    '<b>large</b> and give it a different height, for example <b>50</b>.</p>' +
                    '<p>Click <b>Activate</b> next to <b>large</b> – and your box has the new size. Then <b>OK</b>. ' +
                    'The <b>Config Table</b> button opens the same table again.</p>'},
            {title: 'Material and colour',
                text: '<p>What <b>material</b> is your box made of? Click <b>Material</b>, then your box, and choose ' +
                    'the plastic <b>PLA</b> under <b>Material</b> – most 3D printed parts are made of it. ' +
                    'Now SolidCraft calculates with the real weight of PLA. Click <b>OK</b>.</p>' +
                    '<p>You set the <b>colour</b> with <b>Appearance</b>: click the box, pick a colour, <b>OK</b>. ' +
                    'The appearance only changes the look, not the weight.</p>'},
            {title: 'Units, rules and Compute All',
                text: '<p>On the right of the <b>Manage</b> tab are settings for the <b>whole design</b>:</p>' +
                    '<ul><li><b>Units</b>: whether SolidCraft shows lengths in millimetres (<b>mm</b>), centimetres (<b>cm</b>) or inches. ' +
                    'Your box stays the same size – only the numbers change.</li>' +
                    '<li><b>Sheet Rules</b>: thickness and bend radius for parts made of sheet metal.</li>' +
                    '<li><b>Plastic Rules</b> and <b>Assign Rule</b>: wall thickness and draft ' +
                    'for parts that are cast in a mould.</li>' +
                    '<li><b>Compute All</b>: rebuilds the whole model from the start. That helps when something looks odd.</li></ul>' +
                    '<p>Try it: set the <b>Units</b> to <b>cm</b>, look at the numbers, and set them back to <b>mm</b>. ' +
                    'Then click <b>Compute All</b>.</p>'},
            {title: 'Challenge: your building kit',
                text: '<p>Extend your building kit – this time without the hand. Pick at least one idea:</p>' +
                    '<ul><li>Create a third parameter <b>wall</b> with <b>2</b> and hollow out the box with <b>Shell</b> – ' +
                    'simply type <b>wall</b> for the <b>Thickness</b>.</li>' +
                    '<li>Add a configuration <b>small</b> and switch back and forth between the sizes.</li>' +
                    '<li>Link the width too: double-click the sketch in the timeline, then set the dimension to <b>width</b>.</li></ul>'},
            {title: 'Ready to print',
                text: '<p>Save your box as an <b>STL file</b> for the 3D printer: <b>File</b> menu → <b>Export STL</b>.</p>' +
                    '<p>Also save your project so you can keep working on it later.</p>'}
        ]
    }, {
        'Öffne „Parameter“': 'Open “Parameters”',
        'Lege einen Parameter an': 'Create a parameter',
        'Lege einen zweiten Parameter an': 'Create a second parameter',
        'Klicke auf das Register „Verwalten“': 'Click the “Manage” tab',
        'Klicke auf „Parameter“': 'Click “Parameters”',
        'Klicke auf „Parameter hinzufügen“': 'Click “Add parameter”',
        'Name und Ausdruck eintippen': 'Type the name and expression',
        'Klicke auf „OK“': 'Click “OK”',
        'Zeichne ein Rechteck': 'Draw a rectangle',
        'Extrudiere mit „hoehe“ als Abstand': 'Extrude with your height parameter as distance',
        'Klicke auf das Register „Modell“': 'Click the “Model” tab',
        'Klicke auf die Bodenebene': 'Click the ground plane',
        'Klicke auf „Rechteck“': 'Click “Rectangle”',
        'Klicke nacheinander zwei Ecken': 'Click two corners, one after the other',
        'Tippe hoehe ein, dann OK': 'Type height, then OK',
        'Ändere einen Parameter – die Box passt sich an': 'Change a parameter – the box adapts',
        'Neuen Wert eintippen, z. B. 35': 'Type a new value, e.g. 35',
        'Füge „hoehe“ als Spalte hinzu': 'Add your height parameter as a column',
        'Lege eine zweite Konfiguration an': 'Create a second configuration',
        'Aktiviere die neue Konfiguration': 'Activate the new configuration',
        'Klicke auf „Konfigurieren“': 'Click “Configure”',
        'Klicke auf „+“: neue Spalte': 'Click “+”: new column',
        'Wähle „hoehe (parameter)“': 'Choose “height (parameter)”',
        'Klicke auf „Konfiguration hinzufügen“': 'Click “Add configuration”',
        'Name „gross“ und neue Höhe eintippen': 'Type the name “large” and a new height',
        'Klicke auf „Aktivieren“': 'Click “Activate”',
        'Gib der Box ein Material': 'Give the box a material',
        'Gib der Box eine Farbe': 'Give the box a colour',
        'Klicke auf „Material“': 'Click “Material”',
        'Klicke auf deine Box': 'Click your box',
        'Wähle „PLA“, dann OK': 'Choose “PLA”, then OK',
        'Klicke auf „Erscheinungsbild“': 'Click “Appearance”',
        'Farbe wählen, dann OK': 'Pick a colour, then OK',
        'Stell die Einheiten auf „cm“': 'Set the units to “cm”',
        'Stell sie zurück auf „mm“': 'Set them back to “mm”',
        'Ich habe auf „Alles berechnen“ geklickt': 'I clicked “Compute All”',
        'Klicke auf „Einheiten“ und wähle „cm“': 'Click “Units” and choose “cm”',
        'Wieder „Einheiten“ und „mm“': '“Units” again and “mm”',
        'Klicke auf „Alles berechnen“': 'Click “Compute All”',
        'Lege einen dritten Parameter an': 'Create a third parameter',
        'Ich habe eine Idee umgesetzt': 'I built one of the ideas'
    });
})();
