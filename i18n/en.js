/*
 * English. Button names match SolidCraft's English UI (0.30, checked by screenshot):
 * New Sketch, Extrude, Revolve, Hole, Fillet, Chamfer, Shell, Mirror, Pattern, Line, Rectangle,
 * Circle, Finish Sketch, Search commands, File; dialog fields Distance, Operation (Join, Cut,
 * New Body), Edges, Radius, Diameter, Thickness, Axis, Quantity, Objects, Target Body, Tool Bodies.
 */
(function () {
    'use strict';
    window.SolidcraftKursLang = window.SolidcraftKursLang || {};
    window.SolidcraftKursLang.en = {
        name: 'English',
        labels: {
            tabs: {MODEL: 'Model', SKETCH: 'Sketch', SURFACE: 'Surface', ASSEMBLE: 'Assemble', INSERT: 'Insert',
                INSPECT: 'Inspect', MANAGE: 'Manage', VIEW: 'View', 'SHEET METAL': 'Sheet Metal', SOLID: 'Solid', WELDMENTS: 'Weldments', PLASTIC: 'Plastic', MESH: 'Mesh', UTILITIES: 'Utilities'},
            panels: {CREATE: 'Create', MODIFY: 'Modify', ARRANGE: 'Arrange', CONSTRUCT: 'Construct',
                CONFIGURE: 'Configure', CONSTRAIN: 'Constrain', PATTERN: 'Pattern', REFERENCE: 'Reference',
                INSPECT: 'Inspect', EDIT: 'Edit', CONVERT: 'Convert'}
        },
        ui: {
            'btn.read': 'Read aloud',
            'btn.stopRead': 'Stop reading',
            'menu.read': 'Read aloud',
            'read.unavailable': 'Reading aloud isn’t possible right now: no suitable voice is installed on this device.',
            'hint.ok': 'All filled in? Then click “OK”',
            'read.auto': 'Read every step aloud automatically',
            'kind.info': 'Info',
            'kind.learn': 'Learn',
            'kind.creative': 'Create',
            'kind.game': 'Look',
            'kind.challenge': 'Challenge',
            'level.neuling.title': 'Beginner',
            'level.neuling.text': 'I have never built anything in 3D on a computer.',
            'level.probiert.title': 'I’ve tried it',
            'level.probiert.text': 'I know Tinkercad or another 3D program a little.',
            'level.profi.title': 'I know my way around',
            'level.profi.text': 'I already know sketching and extruding.',
            'brand': '3D course',
            'header.step': 'Chapter {n}: {title} · {step}/{total}',
            'header.transition': 'Save project → chapter {n}',
            'btn.menu': 'Chapter overview',
            'btn.expand': 'Expand',
            'btn.collapse': 'Collapse',
            'btn.close': 'Close course (your progress is kept)',
            'loading': 'SolidCraft is still loading …',
            'task.clickToCheck': 'Click to tick off',
            'nav.back': 'Back',
            'nav.next': 'Next →',
            'nav.chapterDone': 'Chapter done ✓',
            'nav.skip': 'You can skip this too',
            'hints.on': '👆 Show me how',
            'hints.off': '👆 Hide hints',
            'hints.title': 'Shows you where to click',
            'menu.title': 'Chapters',
            'menu.level': 'Choose level again',
            'menu.language': 'Language',
            'lang.auto': 'Automatic (like SolidCraft)',
            'success.title': 'Well done! 🎉',
            'success.next': 'Next up: {what}',
            'next.chapter': '📘 Chapter {n}: {title}',
            'done.title': 'Chapter “{title}” complete!',
            'done.next': '<p>Awesome! Ready for the next project: <b>{title}</b>?</p>',
            'done.all': '<p>You finished the whole 3D course. You’re a real designer now! 🚀</p>',
            'done.overview': 'Overview',
            'done.nextTitle': 'Save your project and start the next chapter',
            'transition.kind': '💾 Save project',
            'transition.title': 'Before you go on',
            'transition.text': '<p>Save your finished project so it doesn’t get lost. ' +
                'Then start the next chapter in a new, empty design.</p>',
            'transition.save': 'Save your project (top: Save)',
            'transition.saveHint': 'Save here',
            'transition.new': 'Open a new, empty design (top: +)',
            'transition.newHint': 'New design',
            'transition.start': 'Start chapter {n} →',
            'modal.close': 'Close',
            'modal.brand': 'Intro course',
            'modal.title': 'Start the 3D course',
            'modal.text': 'How much do you already know about 3D design? Depending on your level you start at a different point in the course.',
            'modal.start': 'Start: chapter {n}',
            'modal.resume': 'Continue: chapter {n}, “{title}”',
            'launcher.title': 'Open the intro course',
            'launcher.open': 'Open course',
            'launcher.start': 'Start 3D course',
            'via.panel': 'Click “{name} ▾”',
            'via.tab': 'Open the “{name}” tab at the top',
            'via.search': 'Click here and search for “{name}”'
        },
        course: {
            chapters: {
                namensschild: {
                    title: 'Your name tag',
                    type: 'Basics',
                    steps: [
                        {title: 'What are we building?',
                            text: '<p>You’re designing your own <b>name tag</b> – a flat plate with your name standing out on top. ' +
                                'At the end you can print it on a 3D printer.</p>' +
                                '<p>On the way you’ll learn the most important things in 3D design:</p>' +
                                '<ul><li>drawing a <b>sketch</b> (flat, like on paper)</li>' +
                                '<li><b>extruding</b> it – pulling it up into 3D</li>' +
                                '<li>writing <b>text</b> and raising it</li></ul>' +
                                '<p>The hand 👆 always shows you where to click.</p>'},
                        {title: 'Look around',
                            text: '<p>In the middle you see the <b>3D space</b>. Before we build, learn how to look around:</p>' +
                                '<ul><li><b>Turn the mouse wheel</b>: zoom in and out</li>' +
                                '<li>Hold the <b>right mouse button</b> and drag: rotate</li>' +
                                '<li>Hold the <b>middle mouse button</b> (press the wheel) and drag: move the view</li>' +
                                '<li>The <b>view cube</b> at the top right: click a side to look from there</li></ul>'},
                        {title: 'Start a sketch',
                            text: '<p>Every 3D part starts with a <b>sketch</b>: a flat drawing on a plane.</p>' +
                                '<p>Click <b>New Sketch</b> at the top. Then choose the plane you want to draw on – ' +
                                'take the flat <b>ground plane</b> (it’s called <b>XY</b>).</p>'},
                        {title: 'Draw a rectangle',
                            text: '<p>Now draw the shape of your tag. Choose <b>Rectangle</b> and click one corner, ' +
                                'then the opposite corner.</p>' +
                                '<p>A good size is <b>80 × 30 mm</b>. While you drag, SolidCraft shows the measurements. ' +
                                'You can type them in directly – the <b>Tab</b> key switches between width and height. ' +
                                'Bigger or smaller is fine too!</p>'},
                        {title: 'Extrude the plate',
                            text: '<p>Your rectangle is still completely flat. First finish the sketch with <b>Finish Sketch</b>.</p>' +
                                '<p>Then click <b>Extrude</b>: it pulls the shape up. Click inside your rectangle, ' +
                                'type <b>3</b> into <b>Distance</b> (that’s 3 mm) and click <b>OK</b>.</p>' +
                                '<p>Too thick? Double-click the extrusion in the timeline at the bottom and change the distance.</p>'},
                        {title: 'Write your name',
                            text: '<p>Now your name goes on the tag. You need a new sketch for that – this time right ' +
                                '<b>on the top</b> of the plate.</p>' +
                                '<p>Click <b>New Sketch</b> and then the top face. Choose the <b>Text</b> tool, click on the plate ' +
                                'where your name should start, and type your name.</p>' +
                                '<p>Tip: a text height of about <b>12 mm</b> fits nicely on an 80 mm tag.</p>'},
                        {title: 'Raise your name',
                            text: '<p>Your name is flat on the plate now. Let it stand out!</p>' +
                                '<p>Finish the sketch, click <b>Extrude</b> and click <b>each letter once</b> – ' +
                                'not the holes inside letters like A, o or e. ' +
                                'Type <b>2</b> into <b>Distance</b>. <b>Operation</b> should say <b>Join</b> – ' +
                                'then the plate and the letters become one single part.</p>' +
                                '<p>Nothing sticks out? Then your sketch is not on the top face. Press <b>Ctrl + Z</b> until ' +
                                'everything back to before the sketch is undone, and start it again – this time on the top face.</p>'},
                        {title: 'Admire your tag',
                            text: '<p>Done – your name tag is finished! 🎉</p>' +
                                '<p>Turn it with the view cube and look at it from every side. If you like, give it a colour: ' +
                                'click the tag and press the <b>A</b> key (for <b>Appearance</b>).</p>'},
                        {title: 'Challenge: make it special',
                            text: '<p>Your turn! Pick at least one idea – this time without the hand:</p>' +
                                '<ul><li>Make the text bigger or smaller (double-click the sketch in the timeline)</li>' +
                                '<li>Write a second word underneath, e.g. your class</li>' +
                                '<li>Cut a <b>hole</b> for a string: draw a circle and extrude it with the operation <b>Cut</b></li></ul>'},
                        {title: 'Ready to print',
                            text: '<p>A 3D printer needs an <b>STL file</b>.</p>' +
                                '<p>Open the <b>File</b> menu at the top left and choose <b>Export STL</b>. ' +
                                'You can then load the file into your printer’s program.</p>' +
                                '<p>Also save your project so you can keep working on it later.</p>'}
                    ]
                },
                anhaenger: {
                    title: 'Your keychain',
                    type: 'Basics',
                    steps: [
                        {title: 'What are we building?',
                            text: '<p>Now you’re building a <b>keychain</b>: a plate with round corners and a <b>hole</b> for the key ring.</p>' +
                                '<p>You already know the plate from the name tag. Two tools are new:</p>' +
                                '<ul><li><b>Fillet</b> – makes sharp edges round</li>' +
                                '<li><b>Hole</b> – drills a round hole</li></ul>'},
                        {title: 'The base plate',
                            text: '<p>Build the plate like the name tag: <b>New Sketch</b> on the ground plane, draw a <b>Rectangle</b>, ' +
                                '<b>Finish Sketch</b> and <b>Extrude</b>.</p>' +
                                '<p>A good size is <b>50 × 25 mm</b> and <b>4 mm</b> thick – then the keychain is sturdy.</p>'},
                        {title: 'Round the corners',
                            text: '<p>Sharp corners poke you in your pocket. Click <b>Fillet</b> (or press the <b>F</b> key).</p>' +
                                '<p>Then click the <b>four short edges at the corners</b> one after another – the edges that go ' +
                                'straight up. Type <b>4</b> into <b>Radius</b> and click <b>OK</b>.</p>'},
                        {title: 'A hole for the ring',
                            text: '<p>Now the hole for the key ring is missing. Click <b>Hole</b> (key <b>H</b>) and then the top face – ' +
                                '<b>close to one end</b>, but not right at the edge.</p>' +
                                '<p>Type <b>5</b> into <b>Diameter</b> (5 mm) and click <b>OK</b>.</p>'},
                        {title: 'Admire your keychain',
                            text: '<p>Done! 🎉 Turn the keychain and look through the hole.</p>' +
                                '<p>Give it a colour: click the keychain and press the <b>A</b> key.</p>'},
                        {title: 'Challenge: your own keychain',
                            text: '<p>Pick at least one idea – without the hand:</p>' +
                                '<ul><li>Put your <b>initials</b> on the keychain, raised (like on the name tag)</li>' +
                                '<li>Break the top edge with <b>Chamfer</b> instead of rounding it</li>' +
                                '<li>Build a keychain in another shape – e.g. from a <b>Circle</b></li></ul>'},
                        {title: 'Ready to print',
                            text: '<p>Save your keychain as an <b>STL file</b> for the 3D printer: <b>File</b> menu → <b>Export STL</b>.</p>' +
                                '<p>Also save your project so you can keep working on it later.</p>'}
                    ]
                },
                wuerfel: {
                    title: 'Your game die',
                    type: 'Game',
                    steps: [
                        {title: 'What are we building?',
                            text: '<p>A real <b>game die</b> to print! It is 20 mm big and has the right <b>pips</b> (dots) on every side.</p>' +
                                '<p>New things you’ll learn:</p>' +
                                '<ul><li>drawing a <b>Circle</b></li>' +
                                '<li>using <b>Cut</b> to take material away instead of adding it</li>' +
                                '<li>breaking edges with <b>Chamfer</b> so the die rolls nicely</li></ul>' +
                                '<p>Did you know? Opposite sides of a die always add up to <b>7</b>.</p>'},
                        {title: 'A cube',
                            text: '<p>On the ground plane, draw a <b>square</b> with the <b>Rectangle</b> tool: <b>20 × 20 mm</b>. ' +
                                'Finish the sketch and extrude it <b>20 mm</b> high.</p>' +
                                '<p>All three sides the same length – your cube is ready!</p>'},
                        {title: 'The first pip',
                            text: '<p>A pip is a small dent. Start a <b>New Sketch</b> on the <b>top face</b> and use <b>Circle</b> ' +
                                'to draw a circle in the middle: click the centre first, then drag – about <b>4 mm</b> across.</p>' +
                                '<p>Finish the sketch and click <b>Extrude</b>. Click inside the circle and choose <b>Cut</b> under ' +
                                '<b>Operation</b>. Type <b>1</b> into <b>Distance</b>. If the preview points outwards, use ' +
                                '<b>Reverse Direction</b>.</p>'},
                        {title: 'All sides',
                            text: '<p>Now every side gets its pips: <b>1 to 6</b>. Opposite each other are 1 and 6, 2 and 5, 3 and 4.</p>' +
                                '<p>Tip: you can draw <b>several circles in one sketch</b> and cut them all at once. ' +
                                'Rotate the die with the right mouse button to reach the other sides.</p>' +
                                '<p>Need help? Press <b>👆 Show me how</b>.</p>'},
                        {title: 'Break the edges',
                            text: '<p>A real die has no sharp edges. Click <b>Chamfer</b> and then the edges – quickest is all twelve. ' +
                                'Type <b>1</b> into <b>Distance</b> and click <b>OK</b>.</p>' +
                                '<p>Round edges with <b>Fillet</b> work too!</p>'},
                        {title: 'Die check',
                            text: '<p>Turn your die all the way around once. Is everything right?</p>'},
                        {title: 'Challenge: die workshop',
                            text: '<p>Pick an idea:</p>' +
                                '<ul><li>Round pips like little balls: search for <b>Sphere</b> at the top and choose the operation <b>Cut</b></li>' +
                                '<li>A <b>giant die</b> with 30 mm</li>' +
                                '<li>A die with <b>symbols</b> instead of pips – e.g. text or stars</li></ul>'},
                        {title: 'Ready to print',
                            text: '<p>Save your die as an <b>STL file</b> for the 3D printer: <b>File</b> menu → <b>Export STL</b>.</p>' +
                                '<p>Also save your project so you can keep working on it later.</p>'}
                    ]
                },
                koecher: {
                    title: 'Your pencil holder',
                    type: 'Everyday',
                    steps: [
                        {title: 'What are we building?',
                            text: '<p>A <b>pencil holder</b> for your desk – with a small extra compartment.</p>' +
                                '<p>New things you’ll learn:</p>' +
                                '<ul><li><b>Shell</b> – hollows out a body, leaving a wall</li>' +
                                '<li><b>New Body</b> – build a second part without changing the first one</li>' +
                                '<li><b>Combine</b> – join two bodies into one</li></ul>'},
                        {title: 'A cylinder',
                            text: '<p>Start a <b>New Sketch</b> on the ground plane and use <b>Circle</b> to draw a circle around the ' +
                                'centre – about <b>60 mm</b> across.</p>' +
                                '<p>Finish the sketch and extrude the circle <b>90 mm</b> high. Now there’s a thick column!</p>'},
                        {title: 'Hollow it out',
                            text: '<p>A column is not a pencil holder. Click <b>Shell</b> and then the <b>top face</b> – ' +
                                'that face becomes the opening.</p>' +
                                '<p>Type <b>2</b> into <b>Thickness</b> (a 2 mm wall) and click <b>OK</b>.</p>'},
                        {title: 'Round the rim',
                            text: '<p>The top rim is sharp. Click <b>Fillet</b> and then the <b>outer top edge</b>. ' +
                                'Type <b>1</b> into <b>Radius</b> – more would be too much, the wall is only 2 mm thick.</p>'},
                        {title: 'A second compartment',
                            text: '<p>For your eraser and sharpener we build a small compartment <b>next to it</b>. On the ground plane, ' +
                                'draw a second circle (about <b>40 mm</b>) that <b>overlaps the big circle a little</b>.</p>' +
                                '<p>Extrude it <b>60 mm</b> high and choose <b>New Body</b> under <b>Operation</b> – ' +
                                'that way your pencil holder stays as it is.</p>'},
                        {title: 'Hollow out and combine',
                            text: '<p>Hollow out the compartment with <b>Shell</b> too (click the top face, thickness 2).</p>' +
                                '<p>Then turn both bodies into one: search for <b>Combine</b> at the top. Click the big pencil holder ' +
                                'as the <b>Target Body</b>, the compartment as the <b>Tool Bodies</b>, and click <b>OK</b>.</p>'},
                        {title: 'Admire your pencil holder',
                            text: '<p>Turn the pencil holder and look inside. Give it a colour (key <b>A</b>).</p>'},
                        {title: 'Challenge: your design',
                            text: '<ul><li>A <b>hexagonal</b> pencil holder: search for <b>Inscribed Polygon</b> instead of a circle</li>' +
                                '<li>Your <b>name</b> raised on the wall</li>' +
                                '<li>A third compartment – or feet underneath</li></ul>'},
                        {title: 'Ready to print',
                            text: '<p>Save your pencil holder as an <b>STL file</b> for the 3D printer: <b>File</b> menu → <b>Export STL</b>.</p>' +
                                '<p>Also save your project so you can keep working on it later.</p>'}
                    ]
                },
                box: {
                    title: 'Box with lid',
                    type: 'Engineering',
                    steps: [
                        {title: 'What are we building?',
                            text: '<p>A <b>box with a lid</b> that really fits. You need two parts for that – and a little maths.</p>' +
                                '<p>Important for 3D printing: two parts that go into each other need some <b>play</b> ' +
                                '(also called <b>clearance</b> or <b>tolerance</b>). If the lid’s rim is exactly as big as the opening, ' +
                                'it gets stuck. With <b>0.2 mm</b> of air on each side, it fits.</p>' +
                                '<p>You need two tools for it: <b>Shell</b> hollows out a body and leaves a wall. ' +
                                'And if you set the <b>Operation</b> to <b>New Body</b> when extruding, you get a second, ' +
                                'separate part.</p>' +
                                '<p>The hand only helps when you press <b>👆 Show me how</b>.</p>'},
                        {title: 'The box',
                            text: '<p>On the ground plane, draw a rectangle <b>60 × 40 mm</b> and extrude it <b>30 mm</b> high.</p>' +
                                '<p>Hollow it out with <b>Shell</b>: click the top face, <b>thickness 2</b>. The opening is now ' +
                                '<b>56 × 36 mm</b> on the inside (60 − 2 × 2 and 40 − 2 × 2).</p>'},
                        {title: 'The lid plate',
                            text: '<p>The lid is built <b>next to</b> the box. On the ground plane, draw a second rectangle ' +
                                '<b>60 × 40 mm</b> with <b>Center Rectangle</b>: put its centre on the red <b>X axis</b>, ' +
                                'at about <b>100 mm</b>. That way the lid lies apart from the box, and you can find its ' +
                                'centre again later.</p>' +
                                '<p>Extrude it <b>2 mm</b> and choose <b>New Body</b> under <b>Operation</b>.</p>'},
                        {title: 'The rim with clearance',
                            text: '<p>Under the lid goes a rim that reaches into the opening. Let’s calculate:</p>' +
                                '<p>Opening 56 × 36 mm, minus 2 × 0.2 mm clearance = <b>55.6 × 35.6 mm</b>.</p>' +
                                '<p>Start a <b>New Sketch</b> on the lid plate and use <b>Center Rectangle</b> to draw a ' +
                                'rectangle of that size – centre again at <b>100 mm</b> on the X axis, right in the middle of ' +
                                'the lid plate. Extrude it <b>3 mm</b> with <b>Join</b>. ' +
                                'The lid is printed just the way it lies – to put it on, simply turn it over.</p>'},
                        {title: 'Does it fit?',
                            text: '<p>Turn your parts and compare: is the lid’s rim <b>a tiny bit smaller</b> than the opening of the box?</p>' +
                                '<p>Pro tip: in the <b>Inspect</b> tab you’ll find a tool to <b>Measure</b>.</p>'},
                        {title: 'Challenge: your box',
                            text: '<ul><li>A <b>handle</b> on top of the lid</li>' +
                                '<li>A <b>divider</b> inside the box for two compartments</li>' +
                                '<li>Your <b>name</b> on the lid</li>' +
                                '<li>Round corners – careful: then the rim needs round corners too!</li></ul>'},
                        {title: 'Ready to print',
                            text: '<p>Save the box and lid as an <b>STL file</b> for the 3D printer: <b>File</b> menu → <b>Export STL</b>.</p>' +
                                '<p>Also save your project so you can keep working on it later.</p>'}
                    ]
                },
                rakete: {
                    title: 'Your rocket',
                    type: 'Engineering',
                    steps: [
                        {title: 'What are we building?',
                            text: '<p>A <b>rocket</b> with three fins! Round parts aren’t put together from circles and cones – ' +
                                'instead you draw <b>half of the outline</b> and <b>spin</b> it once around – like on a pottery wheel.</p>' +
                                '<p>New things you’ll learn:</p>' +
                                '<ul><li><b>Line</b> – draw shapes point by point</li>' +
                                '<li><b>Revolve</b> – spin an outline around an axis</li>' +
                                '<li><b>Circular Pattern</b> – copy a part several times around a circle</li></ul>' +
                                '<p>The hand helps when you press <b>👆 Show me how</b>.</p>'},
                        {title: 'Half a rocket',
                            text: '<p>Start a <b>New Sketch</b> on the <b>front plane</b> (the upright plane, XZ).</p>' +
                                '<p>Use <b>Line</b> to draw the right half of the rocket – point by point, starting at the <b>origin</b>: ' +
                                '10 mm to the right, 50 mm up, diagonally to the tip back on the centre line (20 mm higher) ' +
                                'and back down to the start. The shape must be <b>closed</b> – then it gets coloured inside. ' +
                                'Then <b>Finish Sketch</b>.</p>'},
                        {title: 'Revolve',
                            text: '<p>Click <b>Revolve</b>. Choose your outline (click inside the shape) and as the <b>Axis</b> the blue ' +
                                '<b>Z axis</b> – the upright centre line. Click <b>OK</b>.</p>' +
                                '<p>The half shape turns into a round rocket body! Is it hanging <b>upside down</b> in the model? ' +
                                'That’s not a mistake – on the front plane, sketches in SolidCraft point downwards. ' +
                                'In your printer’s program you simply stand it the right way up.</p>'},
                        {title: 'A fin',
                            text: '<p>Start another <b>New Sketch</b> on the front plane and use <b>Line</b> to draw a <b>triangle</b> ' +
                                'at the bottom right of the body, for example with the corners <b>(9|0)</b>, <b>(25|0)</b> and ' +
                                '<b>(9|25)</b>. That way it <b>reaches about 1 mm into the body</b> – otherwise the fin won’t hold ' +
                                'after printing – and sticks out far enough.</p>' +
                                '<p>Extrude it <b>2 mm</b>: set the <b>Direction</b> to <b>Symmetric</b> and the <b>Operation</b> to <b>New Body</b>.</p>'},
                        {title: 'Three fins',
                            text: '<p>One fin is not enough. Search for <b>Circular Pattern</b> at the top. Choose your fin as the ' +
                                '<b>Objects</b>, the Z axis as the <b>Axis</b>, and set the <b>Quantity</b> to <b>3</b>. ' +
                                '<b>OK</b> – now there are three fins, nicely spread out.</p>'},
                        {title: 'Combine everything',
                            text: '<p>For printing, the rocket should be <b>one</b> part. Search for <b>Combine</b>: the ' +
                                '<b>Target Body</b> is the rocket body, the <b>Tool Bodies</b> are all three fins. <b>OK</b>.</p>'},
                        {title: 'Ready for launch?',
                            text: '<p>3 … 2 … 1 … 🚀 Turn your rocket from every side and give it colours.</p>'},
                        {title: 'Challenge: space workshop',
                            text: '<ul><li>A <b>porthole</b>: a circle on the body, cut in a little with <b>Cut</b></li>' +
                                '<li>A different tip – round or really pointy</li>' +
                                '<li>Use <b>Revolve</b> to build a <b>spinning top</b>: draw an outline, revolve, done!</li></ul>'},
                        {title: 'Ready to print',
                            text: '<p>Save your rocket as an <b>STL file</b> for the 3D printer: <b>File</b> menu → <b>Export STL</b>.</p>' +
                                '<p>Also save your project so you can keep working on it later.</p>'}
                    ]
                }
            }
        },
        // German short text (tasks, hints, search terms) → English
        phrases: {
            'Zoome oder drehe die Ansicht': 'Zoom or rotate the view',
            'Klicke auf „Z“: Blick von oben': 'Click “Z”: view from above',
            'Klicke auf „Neue Skizze“': 'Click “New Sketch”',
            'Wähle die Bodenebene (XY)': 'Choose the ground plane (XY)',
            'Klicke auf die Bodenebene': 'Click the ground plane',
            'Wähle „Rechteck“': 'Choose “Rectangle”',
            'Zeichne das Rechteck': 'Draw the rectangle',
            'Klicke auf „Rechteck“': 'Click “Rectangle”',
            'Klicke nacheinander zwei Ecken': 'Click two corners, one after the other',
            'Beende die Skizze': 'Finish the sketch',
            'Extrudiere die Platte 2–5 mm dick': 'Extrude the plate 2–5 mm thick',
            'Klicke auf „Skizze beenden“': 'Click “Finish Sketch”',
            'Klicke auf „Extrudieren“': 'Click “Extrude”',
            'Klicke in dein Rechteck': 'Click inside your rectangle',
            'Tippe 3 ein, dann OK': 'Type 3, then OK',
            'Starte eine Skizze auf der Oberseite': 'Start a sketch on the top face',
            'Wähle das Werkzeug „Text“': 'Choose the “Text” tool',
            'Schreibe deinen Namen': 'Write your name',
            'Klicke auf die Oberseite der Platte': 'Click the top of the plate',
            'Wähle „Text“': 'Choose “Text”',
            'Klicke hierhin und tippe deinen Namen': 'Click here and type your name',
            'Extrudiere den Text nach oben': 'Extrude the text upwards',
            'Klicke die Buchstaben an': 'Click the letters',
            'Klicke jeden Buchstaben einmal an': 'Click each letter once',
            'Zu dick? Doppelklick unten in der Zeitleiste auf die Extrusion': 'Too thick? Double-click the extrusion in the timeline below',
            'Kein Würfel? Doppelklick unten in der Zeitleiste auf die Extrusion': 'Not a cube? Double-click the extrusion in the timeline below',
            '„Ausschneiden“, Abstand 1 – Vorschau nach innen? Dann OK': '“Cut”, distance 1 – preview pointing in? Then OK',
            'Kreise anklicken, „Ausschneiden“, Abstand 1 – Vorschau nach innen? Dann OK':
                'Click the circles, “Cut”, distance 1 – preview pointing in? Then OK',
            'Etwas überlappend zeichnen': 'Draw it overlapping a little',
            'Mitte bei 100 mm auf der X-Achse, 60 × 40': 'Centre at 100 mm on the X axis, 60 × 40',
            'Mitte bei 100 mm, dann 55,6 × 35,6': 'Centre at 100 mm, then 55.6 × 35.6',
            'Tippe 2 ein, dann OK': 'Type 2, then OK',
            'Schau dir dein Schild von unten an': 'Look at your tag from below',
            'Gib deinem Schild eine Farbe': 'Give your tag a colour',
            'Von unten anschauen': 'Look from below',
            'Ich habe eine Idee umgesetzt': 'I built one of the ideas',
            'Neue Skizze': 'New sketch',
            'Ich habe die STL-Datei gespeichert': 'I saved the STL file',
            'Ich habe mein Projekt gespeichert': 'I saved my project',
            'Hier ist das Datei-Menü': 'Here is the File menu',
            'Zeichne ein Rechteck': 'Draw a rectangle',
            'Extrudiere die Platte (3–6 mm dick)': 'Extrude the plate (3–6 mm thick)',
            'Tippe 4 ein, dann OK': 'Type 4, then OK',
            'Wähle „Vollrundung“': 'Choose “Fillet”',
            'Runde die Ecken ab': 'Round the corners',
            'Klicke auf „Vollrundung“': 'Click “Fillet”',
            'Klicke die Kanten an den Ecken': 'Click the edges at the corners',
            'Wähle „Bohrung“': 'Choose “Hole”',
            'Bohre das Loch': 'Drill the hole',
            'Klicke auf „Bohrung“': 'Click “Hole”',
            'Klicke hierhin – nah am Ende': 'Click here – close to the end',
            'Tippe 5 ein, dann OK': 'Type 5, then OK',
            'Ich habe durch das Loch geschaut': 'I looked through the hole',
            'Mein Anhänger hat eine Farbe': 'My keychain has a colour',
            'Zeichne ein Quadrat': 'Draw a square',
            'Extrudiere es zum Würfel': 'Extrude it into a cube',
            'Klicke zwei Ecken (20 × 20)': 'Click two corners (20 × 20)',
            'Tippe 20 ein, dann OK': 'Type 20, then OK',
            'Zeichne einen Kreis auf der Oberseite': 'Draw a circle on the top face',
            'Schneide das Auge aus': 'Cut out the pip',
            'Klicke auf die Oberseite': 'Click the top face',
            'Klicke auf „Kreis“': 'Click “Circle”',
            'Mitte klicken, dann ziehen': 'Click the centre, then drag',
            'Klicke in den Kreis': 'Click inside the circle',
            '„Ausschneiden“, Abstand 1, OK': '“Cut”, distance 1, OK',
            'Mindestens 6 Augen': 'At least 6 pips',
            'Alle 21 Augen (1 + 2 + 3 + 4 + 5 + 6)': 'All 21 pips (1 + 2 + 3 + 4 + 5 + 6)',
            'Neue Skizze auf der nächsten Seite': 'New sketch on the next side',
            'Klicke auf die nächste Seite': 'Click the next side',
            'Kreise zeichnen': 'Draw circles',
            'Wähle „Abschrägung“ oder „Vollrundung“': 'Choose “Chamfer” or “Fillet”',
            'Brich die Kanten': 'Break the edges',
            'Klicke auf „Abschrägung“': 'Click “Chamfer”',
            'Klicke die Kanten an': 'Click the edges',
            'Tippe 1 ein, dann OK': 'Type 1, then OK',
            'Jede Zahl von 1 bis 6 kommt genau einmal vor': 'Every number from 1 to 6 appears exactly once',
            'Gegenüber ergibt es immer 7': 'Opposite sides always add up to 7',
            'Hier suchen': 'Search here',
            'Zeichne einen Kreis': 'Draw a circle',
            'Extrudiere ihn mindestens 40 mm hoch': 'Extrude it at least 40 mm high',
            'Tippe 90 ein, dann OK': 'Type 90, then OK',
            'Wähle „Hülle“': 'Choose “Shell”',
            'Höhle den Zylinder aus': 'Hollow out the cylinder',
            'Klicke auf „Hülle“': 'Click “Shell”',
            'Runde den Rand ab': 'Round the rim',
            'Klicke die obere Kante': 'Click the top edge',
            'Zeichne den zweiten Kreis': 'Draw the second circle',
            'Extrudiere ihn als neuen Körper': 'Extrude it as a new body',
            'Neben dem Köcher zeichnen': 'Draw next to the holder',
            'Klicke in den neuen Kreis': 'Click inside the new circle',
            '„Neuer Körper“, Abstand 60, OK': '“New Body”, distance 60, OK',
            'Höhle das Fach aus': 'Hollow out the compartment',
            'Verbinde beide Körper': 'Combine both bodies',
            'Oberseite klicken, Dicke 2, OK': 'Click the top, thickness 2, OK',
            'Suche „Kombinieren“': 'Search for “Combine”',
            'Zuerst den großen Köcher': 'First the big holder',
            'Dann das Fach, OK': 'Then the compartment, OK',
            'Ich habe von oben hineingeschaut': 'I looked inside from above',
            'Mein Köcher hat eine Farbe': 'My pencil holder has a colour',
            'Box mindestens 15 mm hoch': 'Box at least 15 mm high',
            'Box ausgehöhlt': 'Box hollowed out',
            '60 × 40 mm': '60 × 40 mm',
            'Tippe 30 ein, dann OK': 'Type 30, then OK',
            'Deckelplatte als neuer Körper': 'Lid plate as a new body',
            'Neben der Box: 60 × 40': 'Next to the box: 60 × 40',
            '„Neuer Körper“, Abstand 2, OK': '“New Body”, distance 2, OK',
            'Rand auf den Deckel gebaut': 'Rim built on the lid',
            'Ich habe nachgerechnet: Rand = Öffnung − 0,4 mm': 'I checked the maths: rim = opening − 0.4 mm',
            'Klicke auf die Deckelplatte': 'Click the lid plate',
            '„Rechteck vom Mittelpunkt“': '“Center Rectangle”',
            'Mitte, dann 55,6 × 35,6': 'Centre, then 55.6 × 35.6',
            'Klicke in das Rechteck': 'Click inside the rectangle',
            'Abstand 3, „Verbinden“, OK': 'Distance 3, “Join”, OK',
            'Der Rand ist kleiner als die Öffnung': 'The rim is smaller than the opening',
            'Zeichne die geschlossene halbe Form': 'Draw the closed half shape',
            'Klicke auf die Frontebene': 'Click the front plane',
            'Klicke auf „Linie“': 'Click “Line”',
            'Punkt für Punkt klicken': 'Click point by point',
            'Wähle „Drehen“': 'Choose “Revolve”',
            'Dreh das Profil zum Rumpf': 'Revolve the outline into the body',
            'Klicke auf „Drehen“': 'Click “Revolve”',
            'Klicke in deine Form': 'Click inside your shape',
            'Dann die blaue Z-Achse, OK': 'Then the blue Z axis, OK',
            'Flosse als neuer Körper': 'Fin as a new body',
            'Ein Dreieck zeichnen': 'Draw a triangle',
            'Klicke in das Dreieck': 'Click inside the triangle',
            'Symmetrisch, „Neuer Körper“, 2, OK': 'Symmetric, “New Body”, 2, OK',
            'Drei Flossen im Kreis': 'Three fins in a circle',
            'Suche „Radiales Muster“': 'Search for “Circular Pattern”',
            'Klicke die Flosse an': 'Click the fin',
            'Achse: die Z-Achse': 'Axis: the Z axis',
            'Anzahl 3, dann OK': 'Quantity 3, then OK',
            'Rumpf und Flossen verbunden': 'Body and fins combined',
            'Zuerst den Rumpf': 'First the rocket body',
            'Dann alle Flossen, OK': 'Then all the fins, OK',
            'Meine Rakete ist startklar': 'My rocket is ready for launch',
            // Suchbegriffe für die Befehlssuche
            'Kombinieren': 'Combine',
            'Radiales Muster': 'Circular Pattern',
            'Rechteck vom Mittelpunkt': 'Center Rectangle'
        }
    };
})();
