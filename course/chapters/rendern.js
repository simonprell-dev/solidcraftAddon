/*
 * Kapitel „rendern“: Fotostudio – der Arbeitsbereich Rendern (Umschalter oben links).
 * Würfel bauen → in „Rendern“ wechseln → Phasen 1–4 (Aussehen, Licht, Bildausschnitt, Ausgabe) → Bild rendern.
 *
 * Live geprüft (SolidCraft 0.30.1): ui.inspect().render = {active, stage: look|light|frame|output,
 * method: raster|…, job, completed, results: [{frame, seconds, shot}], showing_result, …} und
 * ui.inspect().ui.tab === 'RENDER'. Perspektive: ui.inspect().camera.fov > 0 (Orthografisch: 0).
 * Erscheinungsbilder: appearance.list (nur lesend, keine neue Revision) → {bodies: {Name: look}, faces: […], in_design: […]}.
 * Rendern in Edge headless (SwiftShader): 1024 × 768 > 2 min, 160 × 120 ≈ 10 s.
 */
(function () {
    'use strict';
    const K = window.SolidcraftKursCourse;
    const {sketchHints, extrudeHints} = K.helpers;

    if (window.SolidcraftKursAccess) window.SolidcraftKursAccess.addRead({key: 'looks', command: 'appearance.list', chapter: 'rendern'});

    const R = c => (c.ui() && c.ui().render) || {};
    const inRender = c => R(c).active === true || ((c.ui() && c.ui().ui) || {}).tab === 'RENDER';
    const stage = c => R(c).stage || null;
    // Ein Modell im Design – auch eines, das schon vor dem Kapitel da war.
    const model = c => !c.inSketch() && (c.doc().bodies || []).some(b => b.visible !== false);
    const looks = c => c.extra('looks') || {};
    const bodyLook = c => Object.keys(looks(c).bodies || {}).length > 0 || (looks(c).in_design || []).length > 0;
    const faceLook = c => (looks(c).faces || []).length > 0;
    const pickBodies = c => !!((c.ui() && c.ui().ui) || {}).pickBodies;
    const methodChanged = c => !!R(c).method && R(c).method !== 'raster';
    // Einmal ausprobiert bleibt ausprobiert – auch wenn das Kind danach (wie empfohlen) zurückstellt.
    const memo = new WeakMap();
    const methodTried = c => {
        let m = memo.get(c.base);
        if (!m) memo.set(c.base, m = {});
        if (methodChanged(c)) m.tried = true;
        return !!m.tried;
    };
    const perspective = c => ((c.ui() && c.ui().camera) || {}).fov > 0;
    const started = c => !!R(c).job || (R(c).results || []).length > 0;
    const rendered = c => (R(c).results || []).length > 0;
    const viewing = c => R(c).showing_result === true;
    // Beschriftete Handles gibt es nur in der Oberflächensprache – also beide probieren.
    const perspectiveTarget = c => c.has('dialog::Perspektivische Kamera') ? 'handle:dialog::Perspektivische Kamera' :
        'handle:dialog::Perspective camera';
    // Mitte der Oberseite des ersten sichtbaren Körpers (auch alte Körper zählen).
    const topFace = c => {
        const b = (c.doc().bodies || []).find(x => x.visible !== false && x.bbox);
        if (!b) return 'viewport';
        const p = [0, 1, 2].map(i => (b.bbox.min[i] + b.bbox.max[i]) / 2);
        p[2] = b.bbox.max[2];
        return 'world:' + JSON.stringify(p.map(v => Math.round(v * 10) / 10 + 0));
    };

    K.add({
        id: 'rendern',
        title: 'Dein Fotostudio',
        level: 'profi',
        type: 'Rendern',
        icon: '📸',
        autoHints: true,
        steps: [
            {
                kind: 'info',
                title: 'Willkommen im Fotostudio',
                text: '<p>Heute machst du ein <b>Foto</b> von einem Modell, das es in echt gar nicht gibt. ' +
                    'Der Computer rechnet aus, wie Licht auf dein Modell fällt, wie Gold glänzt und wo Schatten liegen. ' +
                    'Dieses Ausrechnen heißt <b>Rendern</b>. Das Ergebnis sieht fast aus wie ein echtes Foto.</p>' +
                    '<p>SolidCraft hat dafür verschiedene <b>Arbeitsbereiche</b>. Ein Arbeitsbereich ist wie ein Zimmer ' +
                    'in einer Werkstatt: Dein Modell bleibt dasselbe, nur die Werkzeuge an der Wand sind andere.</p>' +
                    '<ul><li><b>Design</b> – hier konstruierst du: skizzieren, extrudieren, zusammenbauen, prüfen.</li>' +
                    '<li><b>Rendern</b> – dein Fotostudio: Materialien, Licht, Kamera und fertige Bilder.</li></ul>' +
                    '<p>Im Umschalter stehen noch vier weitere Arbeitsbereiche mit dem Zeichen <b>„Geplant“</b>. ' +
                    'Die gibt es noch nicht, sie sollen später kommen:</p>' +
                    '<ul><li><b>Animation</b> – Explosionsansichten, Bewegungsstudien und kleine Bildergeschichten.</li>' +
                    '<li><b>Simulation</b> – testen, ob ein Teil hält, wenn man drückt oder zieht.</li>' +
                    '<li><b>Fertigung</b> – das Modell für den 3D-Drucker oder die Fräse vorbereiten.</li>' +
                    '<li><b>Zeichnung</b> – technische Zeichnungen auf Papier, mit Ansichten und Maßen.</li></ul>' +
                    '<p>Los geht’s: Erst baust du ein kleines Fotomodell, dann geht es ins Studio.</p>'
            },
            {
                kind: 'learn',
                title: 'Ein Fotomodell',
                text: '<p>Für dein Foto brauchst du ein Modell. Baue schnell einen <b>Würfel</b>: ' +
                    '<b>Neue Skizze</b> auf der Bodenebene, ein <b>Rechteck</b> von etwa <b>30 × 30 mm</b>, ' +
                    '<b>Skizze beenden</b> und dann <b>30 mm</b> hoch <b>extrudieren</b>.</p>' +
                    '<p>Du hast schon ein schönes Modell im Design, zum Beispiel deinen Pokal oder deine Rakete? ' +
                    'Dann darfst du auch das fotografieren.</p>',
                tasks: [{text: 'Ein Modell steht bereit', check: model}],
                hints: [
                    ...sketchHints({plane: 'plane:XY', planeText: 'Klicke auf die Bodenebene',
                        tool: 'tool:sketch.rectangle.two_point', toolText: 'Klicke auf „Rechteck“',
                        drawText: 'Etwa 30 × 30 mm', done: model}),
                    ...extrudeHints({text: 'Tippe 30 ein, dann OK', done: model})
                ]
            },
            {
                kind: 'learn',
                title: 'Ab ins Fotostudio',
                text: '<p>Ganz oben links siehst du einen großen Knopf mit dem Wort <b>Design</b> und darunter ' +
                    '<b>Arbeitsbereich</b>. Das ist der <b>Umschalter</b>. Klicke darauf und wähle <b>Rendern</b>.</p>' +
                    '<p>Wichtig: Der Umschalter ist gesperrt, solange du gerade eine Skizze oder ein Werkzeug bearbeitest. ' +
                    'Beende das dann zuerst.</p>' +
                    '<p>Zurück zum Konstruieren kommst du später genauso: Umschalter → <b>Design</b>.</p>',
                tasks: [{text: 'Wechsle in den Arbeitsbereich „Rendern“', check: inRender}],
                hints: [
                    {target: 'handle:ribbon:workspace', text: 'Klicke auf den Umschalter',
                        done: c => c.has('workspace:menu:render') || inRender(c)},
                    {target: 'handle:workspace:menu:render', text: 'Wähle „Rendern“', done: inRender}
                ]
            },
            {
                kind: 'info',
                title: 'Dein Studio im Überblick',
                text: '<p>Schau dich in Ruhe um. So ist dein Fotostudio aufgebaut:</p>' +
                    '<ul><li><b>Oben</b> stehen vier <b>Phasen</b> – wie Stationen beim Fotografieren: ' +
                    '<b>1 Aussehen</b>, <b>2 Licht</b>, <b>3 Bildausschnitt</b> und <b>4 Ausgabe</b>. ' +
                    'Rechts daneben startet <b>Rendern</b> das Bild, <b>Abbrechen</b> stoppt es wieder.</li>' +
                    '<li><b>Links oben</b> ist die Liste <b>Szene</b>. Dort findest du die <b>Umgebung</b>, die <b>Lichter</b>, ' +
                    'deine gespeicherten <b>Aufnahmen</b>, die <b>Objekte</b> mit ihrer <b>Abnutzung</b> und die <b>Ausgabe</b> ' +
                    'mit der <b>Abtastung</b>. Mit <b>Nach Objekt</b> und <b>Nach Aussehen</b> sortierst du die Liste um.</li>' +
                    '<li><b>Links unten</b> ändert sich das Fach je nach Phase – zum Beispiel die <b>Erscheinungsbilder</b>.</li>' +
                    '<li><b>Rechts</b> ist das Feld <b>Szene</b>. Bei <b>Methode</b> wählst du, wie gerechnet wird. ' +
                    'Unter <b>Bereit zum Rendern</b> prüft <b>Jetzt prüfen</b>, ob alles passt. ' +
                    '<b>Diese Aufnahme rendern</b> startet ein Bild, <b>Alle Aufnahmen</b> rendert alle gespeicherten Blickwinkel.</li>' +
                    '<li><b>Ganz unten</b> ist die Leiste <b>Aufnahmen</b>: Mit <b>+</b> merkst du dir einen Blickwinkel, ' +
                    'daneben stehen die Bildgröße und der Knopf <b>Bild rendern</b>.</li></ul>' +
                    '<p>Keine Sorge: Hier im Studio veränderst du nie die Form deines Modells – nur, wie es aussieht.</p>'
            },
            {
                kind: 'learn',
                title: 'Phase 1: Aussehen',
                text: '<p>Jetzt bekommt dein Modell ein Material – zum Beispiel <b>Gold</b> oder <b>Holz</b>. ' +
                    'So ein Material heißt hier <b>Erscheinungsbild</b>.</p>' +
                    '<p>Klicke in der Leiste <b>Auswahl</b> auf <b>Körper</b>. Tippe links unten ins Suchfeld ' +
                    '<b>Gold</b> oder <b>Wood</b> ein – die Bibliothek ist englisch, Holz heißt dort <b>Wood</b>. Klicke auf eine Kachel und dann auf dein Modell. ' +
                    'Mit <b>Fertig</b> hörst du auf zu malen.</p>' +
                    '<p>Danach wählst du <b>Fläche</b>: Jetzt färbst du nur eine einzelne Seite, zum Beispiel die Oberseite in Holz (<b>Wood</b>).</p>' +
                    '<p>Die anderen Knöpfe: <b>Komponente</b> färbt ein ganzes Bauteil. Mit <b>Aufmalen</b> pinselst du ein ' +
                    'Erscheinungsbild auf viele Stellen nacheinander. <b>Aufnehmen</b> ist eine Pipette: Du klickst auf etwas ' +
                    'und nimmst sein Aussehen auf. Über der Kachelliste filterst du mit <b>Im Design</b>, <b>Bibliothek</b>, ' +
                    '<b>Zuletzt</b> und dem Stern <b>★</b> für Lieblinge, darunter nach <b>Metall</b>, <b>Kunststoff</b> und <b>Lack</b>.</p>' +
                    '<p>Wundere dich nicht, wenn Gold in der Vorschau dunkel aussieht: Metall spiegelt seine Umgebung. ' +
                    'Wie man das ändert, lernst du gleich bei <b>Licht</b>.</p>',
                tasks: [
                    {text: 'Gib deinem Modell ein Erscheinungsbild', check: bodyLook},
                    {text: 'Gib einer einzelnen Fläche ein anderes', check: faceLook}
                ],
                hints: [
                    {target: 'handle:render:stage:look', text: 'Klicke auf „Aussehen“',
                        done: c => stage(c) === 'look' || bodyLook(c)},
                    {target: 'handle:render:pick:body', text: 'Wähle „Körper“', done: c => pickBodies(c) || bodyLook(c)},
                    {target: 'handle:render:library-search', text: 'Suche „Gold“, Kachel, dann Modell', done: bodyLook},
                    {target: 'handle:render:pick:face', text: 'Jetzt „Fläche“ wählen', done: c => !pickBodies(c) || faceLook(c)},
                    {target: topFace, text: 'Kachel wählen, Fläche klicken', done: faceLook}
                ]
            },
            {
                kind: 'learn',
                title: 'Phase 2: Licht',
                text: '<p>Ohne Licht kein Foto! Klicke oben auf <b>2 Licht</b>.</p>' +
                    '<p>Links in der Szene siehst du drei Lampen, wie in einem echten Fotostudio: ' +
                    'Das <b>Führungslicht</b> ist die Hauptlampe. Das <b>Fülllicht</b> hellt die Schatten auf. ' +
                    'Das <b>Kantenlicht</b> strahlt von hinten und lässt die Ränder leuchten. ' +
                    'Mit dem <b>Auge</b> schaltest du eine Lampe aus und an. Der Knopf daneben lässt nur diese eine Lampe leuchten.</p>' +
                    '<p>Rechts bei <b>Methode</b> wählst du, wie der Computer rechnet:</p>' +
                    '<ul><li><b>CPU-Rasterung</b> – sehr schnell, aber ohne Spiegelungen.</li>' +
                    '<li><b>CPU-Raytracing</b> – verfolgt jeden Lichtstrahl. Das dauert länger, aber Gold glänzt dann richtig.</li>' +
                    '<li><b>GPU-Pathtracing</b> – am echtesten, braucht aber eine starke Grafikkarte.</li></ul>' +
                    '<p>Links unten unter <b>Studios und Umgebungen</b> wählst du bei <b>Bereich</b> ein fertiges Studio oder eine ' +
                    'Umgebung und klickst <b>Anwenden</b>. Klickst du links auf <b>Umgebung</b>, kannst du rechts die Umgebung ' +
                    '<b>Drehen</b>, ihre <b>Intensität</b> (Helligkeit) ändern und den <b>Hintergrund</b> wählen: ' +
                    '<b>Welt</b>, <b>Farbe</b>, <b>Verlauf</b> oder <b>Transparent</b>. ' +
                    'Darunter gibt es noch <b>Boden und Bühne</b> und die <b>Atmosphäre</b> für Nebel.</p>' +
                    '<p>Tipp: Für dein erstes Foto stellst du die Methode danach wieder auf <b>CPU-Rasterung</b> – das geht am schnellsten.</p>',
                tasks: [
                    {text: 'Öffne die Phase „Licht“', check: c => stage(c) === 'light'},
                    {text: 'Probiere eine andere Methode aus', check: methodTried},
                    {text: 'Ich habe eine Lampe aus- und wieder angeschaltet', manual: true}
                ],
                hints: [
                    {target: 'handle:render:stage:light', text: 'Klicke auf „Licht“',
                        done: c => stage(c) === 'light' || methodTried(c)},
                    {target: 'handle:render:method', text: 'Klicke bei „Methode“',
                        done: c => c.has('render:method-cpu') || methodTried(c)},
                    {target: 'handle:render:method-cpu', text: 'Wähle „CPU-Raytracing“', done: methodTried},
                    {target: 'handle:render:tree:light:1:mute', text: 'Auge: Lampe aus und an', done: () => false}
                ]
            },
            {
                kind: 'learn',
                title: 'Phase 3: Bildausschnitt',
                text: '<p>Jetzt bist du der Fotograf. Klicke auf <b>3 Bildausschnitt</b>.</p>' +
                    '<p>Oben wählst du die Kamera: <b>Orthografisch</b> zeigt alles ohne Verzerrung, wie ein Bauplan. ' +
                    'Die <b>Perspektivische Kamera</b> sieht aus wie ein echtes Foto: Was weiter weg ist, wird kleiner.</p>' +
                    '<p>Dreh und zoome dann die Ansicht, bis dir der Blick gefällt.</p>' +
                    '<p>Links unten wählst du das <b>Seitenverhältnis</b>, also die Form des Bildes: ' +
                    '<b>16:9</b> wie ein Fernseher, <b>1:1</b> quadratisch, <b>9:16</b> hochkant wie ein Handy. ' +
                    'Die <b>Hilfslinien</b> helfen beim Ausrichten: <b>Drittellinien</b> teilen das Bild in neun Felder, ' +
                    '<b>Sicherer Bereich</b> zeigt, was sicher nicht abgeschnitten wird, <b>Mittelpunkt</b> markiert die Mitte.</p>' +
                    '<p>Mit <b>Aufnahme speichern</b> merkst du dir diesen Blickwinkel unter einem Namen.</p>',
                tasks: [
                    {text: 'Öffne die Phase „Bildausschnitt“', check: c => stage(c) === 'frame'},
                    {text: 'Schalte auf „Perspektivische Kamera“', check: perspective},
                    {text: 'Dreh oder zoome die Ansicht', check: c => c.cameraMoved()}
                ],
                hints: [
                    {target: 'handle:render:stage:frame', text: 'Klicke auf „Bildausschnitt“',
                        done: c => stage(c) === 'frame' || perspective(c)},
                    {target: perspectiveTarget, text: 'Wähle „Perspektivische Kamera“', done: perspective},
                    {target: 'viewport', text: 'Dreh dir den Blick zurecht', done: c => c.cameraMoved()}
                ]
            },
            {
                kind: 'learn',
                title: 'Phase 4: Ausgabe – Klick, Foto!',
                text: '<p>Klicke auf <b>4 Ausgabe</b>. Hier stellst du ein, wie dein Bild gespeichert wird:</p>' +
                    '<ul><li>Die <b>Größe</b> in Pixeln. Links stehen Vorlagen: <b>Vorschau</b>, <b>Full HD</b>, <b>4K</b>, ' +
                    '<b>Quadrat</b> und <b>Benutzerdefiniert</b>. Ein kleines Bild ist viel schneller fertig – ' +
                    'für den ersten Versuch reichen etwa 640 × 480.</li>' +
                    '<li>Das Format: <b>PNG</b> ist ein normales Bild. <b>EXR</b> ist für Profis, die das Bild später nachbearbeiten.</li>' +
                    '<li>Die Qualität: <b>Entwurf</b>, <b>Ausgewogen</b>, <b>Hoch</b> oder <b>Benutzerdefiniert</b>. ' +
                    'Höhere Qualität heißt: weniger Krümel im Bild, aber längeres Warten.</li>' +
                    '<li><b>Nicht geprüft</b> öffnet die Prüfliste. Sie sagt dir, ob vor dem Rendern noch etwas fehlt.</li></ul>' +
                    '<p>Jetzt klicke oben rechts auf <b>Rendern</b> – und hab etwas Geduld. Oben läuft ein Balken mit, ' +
                    'wie weit der Computer schon ist.</p>' +
                    '<p>Ist das Bild fertig, erscheint oben <b>Live</b> und <b>Render 1</b>. Klicke auf <b>Render 1</b>, ' +
                    'dann siehst du dein fertiges Foto. Ziehst du den Strich in der Mitte, vergleichst du es mit der Live-Ansicht.</p>',
                tasks: [
                    {text: 'Öffne die Phase „Ausgabe“', check: c => stage(c) === 'output' || started(c)},
                    {text: 'Starte das Rendern', check: started},
                    {text: 'Dein Bild ist fertig', check: rendered},
                    {text: 'Sieh dir dein Bild an', check: viewing}
                ],
                hints: [
                    {target: 'handle:render:stage:output', text: 'Klicke auf „Ausgabe“',
                        done: c => stage(c) === 'output' || started(c)},
                    {target: 'handle:render:stage:render.start', text: 'Klicke auf „Rendern“', done: started},
                    {target: 'handle:render:compare:result:0', text: 'Klicke auf „Render 1“', done: viewing}
                ]
            },
            {
                kind: 'challenge',
                title: 'Challenge: Deine Fotoserie',
                autoHints: false,
                text: '<p>Echte Produktfotografen machen nie nur ein Bild. Probier das aus:</p>' +
                    '<ul><li>Speichere zwei Blickwinkel mit <b>Aufnahme speichern</b> und rendere beide mit <b>Alle Aufnahmen</b>.</li>' +
                    '<li>Stell die Methode auf <b>CPU-Raytracing</b> und rendere deinen Goldwürfel noch einmal. Glänzt er jetzt?</li>' +
                    '<li>Vergleiche zwei Bilder: Oben wählst du die Bilder aus, <b>Tauschen</b> wechselt die Seiten. ' +
                    '<b>Modellvorschau</b>, <b>Einpassen</b> und <b>100%</b> ändern die Ansicht, der Papierkorb löscht ein Bild.</li>' +
                    '<li>Mach dein Modell alt: Klicke links auf <b>Abnutzung</b> und gib ihm Rost, Staub oder Kratzer.</li>' +
                    '<li>Wähle als Hintergrund einen <b>Verlauf</b> in deinen Lieblingsfarben.</li></ul>',
                tasks: [{text: 'Ich habe eine Idee umgesetzt', manual: true}]
            },
            {
                kind: 'creative',
                title: 'Dein Foto für die Pinnwand',
                autoHints: false,
                text: '<p>Gestalte dein schönstes Foto: eigene Materialien, eigenes Licht, dein Lieblingsblickwinkel. ' +
                    'Rendere es so groß, wie du magst.</p>' +
                    '<p>Zum Speichern klickst du über dem fertigen Bild auf <b>PNG exportieren…</b> und wählst einen Ordner. ' +
                    'Mit <b>Kopieren</b> kannst du es auch direkt in ein anderes Programm einfügen. Das <b>×</b> schließt das Bild.</p>' +
                    '<p>Zum Schluss geht es zurück in die Werkstatt: Umschalter oben links → <b>Design</b>. ' +
                    'Deine Materialien bleiben am Modell gespeichert.</p>',
                tasks: [
                    {text: 'Ich habe mein Foto als PNG gespeichert', manual: true},
                    {text: 'Zurück im Arbeitsbereich „Design“', check: c => !inRender(c)}
                ],
                hints: [
                    {target: 'handle:render:result-export', text: 'Hier speicherst du dein Foto', done: c => !inRender(c)},
                    {target: 'handle:ribbon:workspace', text: 'Zurück zu „Design“', done: c => !inRender(c)}
                ]
            }
        ]
    });

    K.translate('en', 'rendern', {
        title: 'Your photo studio',
        type: 'Render',
        steps: [
            {title: 'Welcome to the photo studio',
                text: '<p>Today you take a <b>photo</b> of a model that doesn’t even exist in real life. ' +
                    'The computer works out how light falls on your model, how gold shines and where the shadows are. ' +
                    'This working-out is called <b>rendering</b>. The result looks almost like a real photo.</p>' +
                    '<p>For this, SolidCraft has different <b>workspaces</b>. A workspace is like a room in a workshop: ' +
                    'your model stays the same, only the tools on the wall are different.</p>' +
                    '<ul><li><b>Design</b> – this is where you build: sketch, extrude, assemble, inspect.</li>' +
                    '<li><b>Render</b> – your photo studio: materials, light, camera and finished pictures.</li></ul>' +
                    '<p>The switcher also shows four more workspaces marked <b>“Planned”</b>. ' +
                    'They don’t exist yet – they are meant to come later:</p>' +
                    '<ul><li><b>Animation</b> – exploded views, motion studies and little picture stories.</li>' +
                    '<li><b>Simulation</b> – test whether a part holds when you push or pull it.</li>' +
                    '<li><b>Manufacture</b> – get the model ready for the 3D printer or a milling machine.</li>' +
                    '<li><b>Drawing</b> – technical drawings on paper, with views and dimensions.</li></ul>' +
                    '<p>Let’s go: first you build a small model for the photo, then it’s off to the studio.</p>'},
            {title: 'A model for the photo',
                text: '<p>For your photo you need a model. Quickly build a <b>cube</b>: ' +
                    '<b>New Sketch</b> on the ground plane, a <b>Rectangle</b> of about <b>30 × 30 mm</b>, ' +
                    '<b>Finish Sketch</b> and then <b>extrude</b> it <b>30 mm</b> high.</p>' +
                    '<p>Do you already have a nice model in your design, like your trophy or your rocket? ' +
                    'Then you can take a photo of that instead.</p>'},
            {title: 'Off to the photo studio',
                text: '<p>At the very top left there is a big button with the word <b>Design</b> and <b>Workspace</b> below it. ' +
                    'That is the <b>switcher</b>. Click it and choose <b>Render</b>.</p>' +
                    '<p>Important: the switcher is locked while you are editing a sketch or using a tool. ' +
                    'Finish that first.</p>' +
                    '<p>You get back to building the same way later: switcher → <b>Design</b>.</p>'},
            {title: 'Your studio at a glance',
                text: '<p>Take your time and look around. This is how your photo studio is laid out:</p>' +
                    '<ul><li>At the <b>top</b> there are four <b>stages</b> – like stations when taking a photo: ' +
                    '<b>1 Look</b>, <b>2 Light</b>, <b>3 Frame</b> and <b>4 Output</b>. ' +
                    'To the right, <b>Render</b> starts the picture and <b>Cancel</b> stops it again.</li>' +
                    '<li><b>Top left</b> is the <b>Scene</b> list. There you find the <b>Environment</b>, the <b>Lights</b>, ' +
                    'your saved <b>Shots</b>, the <b>Objects</b> with their <b>Wear</b>, and the <b>Output</b> ' +
                    'with its <b>Sampling</b>. <b>By object</b> and <b>By look</b> sort the list differently.</li>' +
                    '<li><b>Bottom left</b> the panel changes with the stage – for example the <b>Appearances</b>.</li>' +
                    '<li>On the <b>right</b> is the <b>Scene</b> panel. Under <b>Method</b> you choose how the picture is calculated. ' +
                    'Under <b>Ready to render</b>, <b>Check now</b> checks whether everything is fine. ' +
                    '<b>Render this shot</b> starts a picture, <b>All shots</b> renders every saved viewpoint.</li>' +
                    '<li>At the very <b>bottom</b> is the <b>Shots</b> bar: <b>+</b> remembers a viewpoint, ' +
                    'next to it are the picture size and the <b>Render Image</b> button.</li></ul>' +
                    '<p>Don’t worry: in the studio you never change the shape of your model – only how it looks.</p>'},
            {title: 'Stage 1: Look',
                text: '<p>Now your model gets a material – for example <b>gold</b> or <b>wood</b>. ' +
                    'Here a material like that is called an <b>appearance</b>.</p>' +
                    '<p>In the <b>Pick</b> bar, click <b>Body</b>. Type <b>Gold</b> or <b>Wood</b> into the search box at the bottom left. ' +
                    'Click a tile and then your model. The button that appears next to it stops painting.</p>' +
                    '<p>Then choose <b>Face</b>: now you colour just one side, for example the top in wood.</p>' +
                    '<p>The other buttons: <b>Component</b> colours a whole part. With <b>Paint</b> you brush an appearance ' +
                    'onto many places one after the other. <b>Pick Up</b> is an eyedropper: you click something and take its look. ' +
                    'Above the tiles you filter with <b>In Design</b>, <b>Library</b>, <b>Recent</b> and the star <b>★</b> for favourites, ' +
                    'below that by <b>Metal</b>, <b>Plastic</b> and <b>Paint</b>.</p>' +
                    '<p>Don’t be surprised if gold looks dark in the preview: metal reflects its surroundings. ' +
                    'You’ll learn how to change that in a moment under <b>Light</b>.</p>'},
            {title: 'Stage 2: Light',
                text: '<p>No light, no photo! Click <b>2 Light</b> at the top.</p>' +
                    '<p>On the left in the scene you see three lamps, just like in a real photo studio: ' +
                    'the <b>Key</b> light is the main lamp. The <b>Fill</b> light brightens the shadows. ' +
                    'The <b>Rim</b> light shines from behind and makes the edges glow. ' +
                    'The <b>eye</b> switches a lamp off and on. The button next to it lets only this one lamp shine.</p>' +
                    '<p>On the right under <b>Method</b> you choose how the computer calculates:</p>' +
                    '<ul><li><b>CPU raster</b> – very fast, but without reflections.</li>' +
                    '<li><b>CPU ray tracing</b> – follows every ray of light. It takes longer, but gold really shines.</li>' +
                    '<li><b>GPU path tracing</b> – the most realistic, but it needs a strong graphics card.</li></ul>' +
                    '<p>At the bottom left under <b>Studios and Environments</b> you pick a ready-made studio or an environment under ' +
                    '<b>Scope</b> and click <b>Apply</b>. If you click <b>Environment</b> on the left, you can ' +
                    '<b>Rotate</b> the environment on the right, change its <b>Intensity</b> (brightness) and choose the ' +
                    '<b>Backdrop</b>: <b>World</b>, <b>Color</b>, <b>Gradient</b> or <b>Clear</b> (see-through). ' +
                    'Below that there is also <b>Ground and stage</b> and the <b>Atmosphere</b> for fog.</p>' +
                    '<p>Tip: for your first photo, set the method back to <b>CPU raster</b> afterwards – that’s the fastest.</p>'},
            {title: 'Stage 3: Frame',
                text: '<p>Now you are the photographer. Click <b>3 Frame</b>.</p>' +
                    '<p>At the top you choose the camera: <b>Orthographic</b> shows everything without distortion, like a building plan. ' +
                    'The <b>Perspective camera</b> looks like a real photo: things further away get smaller.</p>' +
                    '<p>Then turn and zoom the view until you like what you see.</p>' +
                    '<p>At the bottom left, under <b>Aspect</b>, you choose the shape of the picture: ' +
                    '<b>16:9</b> like a TV, <b>1:1</b> square, <b>9:16</b> upright like a phone. ' +
                    'The <b>Guides</b> help you line things up: <b>Thirds</b> split the picture into nine fields, ' +
                    '<b>Safe area</b> shows what will surely not be cut off, <b>Center mark</b> marks the middle.</p>' +
                    '<p><b>Save Shot</b> remembers this viewpoint under a name.</p>'},
            {title: 'Stage 4: Output – click, photo!',
                text: '<p>Click <b>4 Output</b>. This is where you set how your picture is saved:</p>' +
                    '<ul><li>The <b>size</b> in pixels. On the left are presets: <b>Preview</b>, <b>Full HD</b>, <b>4K</b>, ' +
                    '<b>Square</b> and <b>Custom</b>. A small picture is finished much faster – ' +
                    'for your first try, about 640 × 480 is enough.</li>' +
                    '<li>The format: <b>PNG</b> is a normal picture. <b>EXR</b> is for pros who edit the picture afterwards.</li>' +
                    '<li>The quality: <b>Draft</b>, <b>Balanced</b>, <b>High</b> or <b>Custom</b>. ' +
                    'Higher quality means fewer specks in the picture, but a longer wait.</li>' +
                    '<li><b>Not checked</b> opens the check list. It tells you whether anything is missing before rendering.</li></ul>' +
                    '<p>Now click <b>Render</b> at the top right – and be a little patient. A bar at the top shows ' +
                    'how far the computer has got.</p>' +
                    '<p>When the picture is ready, <b>Live</b> and <b>Render 1</b> appear at the top. Click <b>Render 1</b> ' +
                    'to see your finished photo. Drag the line in the middle to compare it with the live view.</p>'},
            {title: 'Challenge: your photo series',
                text: '<p>Real product photographers never take just one picture. Try this:</p>' +
                    '<ul><li>Save two viewpoints with <b>Save Shot</b> and render both with <b>All shots</b>.</li>' +
                    '<li>Set the method to <b>CPU ray tracing</b> and render your gold cube again. Does it shine now?</li>' +
                    '<li>Compare two pictures: choose them at the top, <b>Swap</b> switches the sides. ' +
                    '<b>Model Preview</b>, <b>Fit</b> and <b>100%</b> change the view, the bin deletes a picture.</li>' +
                    '<li>Make your model old: click <b>Wear</b> on the left and give it rust, dust or scratches.</li>' +
                    '<li>Choose a <b>Gradient</b> backdrop in your favourite colours.</li></ul>'},
            {title: 'Your photo for the pinboard',
                text: '<p>Create your best photo: your own materials, your own light, your favourite viewpoint. ' +
                    'Render it as big as you like.</p>' +
                    '<p>To save it, click <b>Export PNG…</b> above the finished picture and choose a folder. ' +
                    'With <b>Copy</b> you can also paste it straight into another program. The <b>×</b> closes the picture.</p>' +
                    '<p>Finally, back to the workshop: switcher at the top left → <b>Design</b>. ' +
                    'Your materials stay saved on the model.</p>'}
        ]
    }, {
        'Ein Modell steht bereit': 'A model is ready',
        'Etwa 30 × 30 mm': 'About 30 × 30 mm',
        'Klicke auf die Bodenebene': 'Click the ground plane',
        'Klicke auf „Rechteck“': 'Click “Rectangle”',
        'Tippe 30 ein, dann OK': 'Type 30, then OK',
        'Wechsle in den Arbeitsbereich „Rendern“': 'Switch to the “Render” workspace',
        'Klicke auf den Umschalter': 'Click the switcher',
        'Wähle „Rendern“': 'Choose “Render”',
        'Gib deinem Modell ein Erscheinungsbild': 'Give your model an appearance',
        'Gib einer einzelnen Fläche ein anderes': 'Give a single face a different one',
        'Klicke auf „Aussehen“': 'Click “Look”',
        'Wähle „Körper“': 'Choose “Body”',
        'Suche „Gold“, Kachel, dann Modell': 'Search “Gold”, tile, then model',
        'Jetzt „Fläche“ wählen': 'Now choose “Face”',
        'Kachel wählen, Fläche klicken': 'Pick a tile, click a face',
        'Öffne die Phase „Licht“': 'Open the “Light” stage',
        'Probiere eine andere Methode aus': 'Try a different method',
        'Ich habe eine Lampe aus- und wieder angeschaltet': 'I switched a lamp off and on again',
        'Klicke auf „Licht“': 'Click “Light”',
        'Klicke bei „Methode“': 'Click “Method”',
        'Wähle „CPU-Raytracing“': 'Choose “CPU ray tracing”',
        'Auge: Lampe aus und an': 'Eye: lamp off and on',
        'Öffne die Phase „Bildausschnitt“': 'Open the “Frame” stage',
        'Schalte auf „Perspektivische Kamera“': 'Switch to “Perspective camera”',
        'Dreh oder zoome die Ansicht': 'Turn or zoom the view',
        'Klicke auf „Bildausschnitt“': 'Click “Frame”',
        'Wähle „Perspektivische Kamera“': 'Choose “Perspective camera”',
        'Dreh dir den Blick zurecht': 'Turn the view until it looks good',
        'Öffne die Phase „Ausgabe“': 'Open the “Output” stage',
        'Starte das Rendern': 'Start rendering',
        'Dein Bild ist fertig': 'Your picture is ready',
        'Sieh dir dein Bild an': 'Look at your picture',
        'Klicke auf „Ausgabe“': 'Click “Output”',
        'Klicke auf „Rendern“': 'Click “Render”',
        'Klicke auf „Render 1“': 'Click “Render 1”',
        'Ich habe eine Idee umgesetzt': 'I built one of the ideas',
        'Ich habe mein Foto als PNG gespeichert': 'I saved my photo as a PNG',
        'Zurück im Arbeitsbereich „Design“': 'Back in the “Design” workspace',
        'Hier speicherst du dein Foto': 'Save your photo here',
        'Zurück zu „Design“': 'Back to “Design”'
    });
})();
