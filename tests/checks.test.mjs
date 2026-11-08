// Prüfungen der Kapitel 1–6 gegen nachgestellte Modelle (Befunde aus dem Kurs-Audit).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {load} from './load.mjs';

const w = load(['course/course-data.js', 'course/context.js']);
const K = w.SolidcraftKursCourse;
const C = w.SolidcraftKursContext;

const step = (id, title) => K.chapters.find(ch => ch.id === id).steps.find(s => s.title === title);
const task = (id, title, text) => step(id, title).tasks.find(t => t.text === text).check;
const body = (name, min, max, volume, faces = {plane: 6}) =>
    ({name, bbox: {min, max}, volume_mm3: volume, face_types: faces, visible: true});
const snap = ({bodies = [], sketches = [], timeline = [], ui = {}} = {}) =>
    ({doc: {bodies, sketches, timeline, active_sketch: null}, ui, handles: new Map()});
const ctx = (before, after) => C.make(snap(after), C.makeBase(snap(before)));
const tl = (...types) => types.map(type => ({type}));

// ---------- Würfel: Augen ----------

const cube = (volume, cyl) => body('Body1', [-10, -10, 0], [10, 10, 20], volume, cyl ? {plane: 6, cylinder: cyl} : {plane: 6});
const faceSketches = counts => counts.map((n, i) => ({id: i + 2, profiles: n + 1}));   // Flächenumriss + je Kreis
const allPips = task('wuerfel', 'Alle Seiten', 'Alle 21 Augen (1 + 2 + 3 + 4 + 5 + 6)');
const sixPips = task('wuerfel', 'Alle Seiten', 'Mindestens 6 Augen');
const before = {bodies: [cube(8000, 1)], sketches: faceSketches([1])};

test('Würfel: 21 ausgeschnittene Augen haken ab', () => {
    const c = ctx(before, {bodies: [cube(7700, 21)], sketches: faceSketches([1, 6, 2, 5, 3, 4])});
    assert.equal(allPips(c), true);
});

test('Würfel: nur gezeichnete, nicht ausgeschnittene Kreise zählen nicht', () => {
    // alle Kreise gezeichnet, aber nur die 4er-Seite ausgeschnitten → 1 + 4 Mulden
    const c = ctx(before, {bodies: [cube(7900, 5)], sketches: faceSketches([1, 6, 2, 5, 3, 4])});
    assert.equal(allPips(c), false);
    assert.equal(sixPips(c), false);
});

test('Würfel: 22 Augen sind nicht „alle 21“', () => {
    const c = ctx(before, {bodies: [cube(7690, 22)], sketches: faceSketches([1, 7, 2, 5, 3, 4])});
    assert.equal(allPips(c), false);
    assert.equal(sixPips(c), true);
});

// ---------- Box: Rand mit Spiel ----------

const box = body('Body1', [-30, -20, 0], [30, 20, 30], 15552);
const lid = (volume, min = [70, -20, 0], max = [130, 20, 2]) => body('Body2', min, max, volume);
const rim = task('box', 'Der Rand mit Spiel', 'Rand auf den Deckel gebaut');
const lidBefore = {bodies: [box, lid(4800)], timeline: tl('Sketch', 'ExtrudeFeature', 'ShellFeature', 'Sketch', 'ExtrudeFeature')};

test('Box: richtiger Rand (55,6 × 35,6 × 3, verbunden) hakt ab', () => {
    const c = ctx(lidBefore, {bodies: [box, lid(4800 + 5938, [70, -20, 0], [130, 20, 5])],
        timeline: [...lidBefore.timeline, ...tl('Sketch', 'ExtrudeFeature')]});
    assert.equal(rim(c), true);
});

test('Box: nur der schmale Ring zwischen Umriss und Rechteck zählt nicht', () => {
    const c = ctx(lidBefore, {bodies: [box, lid(4800 + 1658, [70, -20, 0], [130, 20, 5])],
        timeline: [...lidBefore.timeline, ...tl('Sketch', 'ExtrudeFeature')]});
    assert.equal(rim(c), false);
});

test('Box: Rand als eigener Körper zählt nicht', () => {
    const c = ctx(lidBefore, {bodies: [box, lid(4800), body('Body3', [72, -18, 2], [128, 18, 5], 5938)],
        timeline: [...lidBefore.timeline, ...tl('Sketch', 'ExtrudeFeature')]});
    assert.equal(rim(c), false);
});

// ---------- Kombinieren: alle Teile ----------

const rumpf = body('Body1', [-10, -10, -70], [10, 10, 0], 17799);
const fin = (n, x) => body('Fin' + n, [x, -1, -25], [x + 16, 1, 0], 400);
const joinedRocket = task('rakete', 'Alles verbinden', 'Rumpf und Flossen verbunden');

test('Rakete: alles zu einem Körper verbunden hakt ab', () => {
    const c = ctx({bodies: [rumpf, fin(1, 9), fin(2, 9), fin(3, 9)]},
        {bodies: [body('Body1', [-25, -25, -70], [25, 25, 0], 18856)], timeline: tl('CombineFeature')});
    assert.equal(joinedRocket(c), true);
});

test('Rakete: nur eine Flosse verbunden zählt nicht', () => {
    const c = ctx({bodies: [rumpf, fin(1, 9), fin(2, 9), fin(3, 9)]},
        {bodies: [rumpf, fin(2, 9), fin(3, 9)], timeline: tl('CombineFeature')});
    assert.equal(joinedRocket(c), false);
});

test('Köcher: Verbinden heißt am Ende ein Körper', () => {
    const check = step('koecher', 'Fach aushöhlen und verbinden') ?
        task('koecher', 'Fach aushöhlen und verbinden', 'Verbinde beide Körper') :
        K.chapters.find(ch => ch.id === 'koecher').steps.flatMap(s => s.tasks || []).find(t => t.text === 'Verbinde beide Körper').check;
    const koecher = body('Body1', [-30, -30, 0], [30, 30, 90], 30000);
    const fach = body('Body2', [25, -10, 0], [50, 10, 60], 9000);
    assert.equal(check(ctx({bodies: [koecher, fach]}, {bodies: [koecher, fach], timeline: tl('CombineFeature')})), false);
    assert.equal(check(ctx({bodies: [koecher, fach]}, {bodies: [body('Body1', [-30, -30, 0], [50, 30, 90], 38000)],
        timeline: tl('CombineFeature')})), true);
});

// ---------- Rakete: Flosse ragt aus dem Rumpf ----------

const finTask = task('rakete', 'Eine Flosse', 'Flosse als neuer Körper');

test('Rakete: Flosse außen am Rumpf hakt ab', () => {
    const c = ctx({bodies: [rumpf]}, {bodies: [rumpf, body('Body2', [9, -1, -25], [25, 1, 0], 400)]});
    assert.equal(finTask(c), true);
});

test('Rakete: Flosse ganz im Rumpf zählt nicht', () => {
    const c = ctx({bodies: [rumpf]}, {bodies: [rumpf, body('Body2', [0, -1, -10], [8, 1, 0], 80)]});
    assert.equal(finTask(c), false);
});

// ---------- Würfel Schritt 4: Hinweise führen bis zum Ausschneiden ----------

const hintNow = (id, title, c) => step(id, title).hints.find(h => !h.done(c));

test('Würfel: nach „Skizze beenden“ ohne Ausschneiden zeigt die Hand aufs Extrudieren', () => {
    const c = ctx(before, {bodies: [cube(8000, 1)], sketches: faceSketches([1, 6]),
        timeline: tl('Sketch', 'ExtrudeFeature', 'Sketch', 'ExtrudeFeature', 'Sketch')});
    assert.equal(hintNow('wuerfel', 'Alle Seiten', c).target, 'tool:solid.extrude');
});

test('Würfel: im offenen Extrudieren-Dialog zeigt die Hand auf „Operation“', () => {
    const c = ctx(before, {bodies: [cube(8000, 1)], sketches: faceSketches([1, 6]),
        timeline: tl('Sketch', 'ExtrudeFeature', 'Sketch', 'ExtrudeFeature', 'Sketch'),
        ui: {dialog: {command: 'solid.extrude', inputs: []}}});
    assert.equal(hintNow('wuerfel', 'Alle Seiten', c).target, 'dialog:Operation');
});

test('Würfel: in der Skizze mit Kreis-Werkzeug zeigt die Hand auf „Skizze beenden“', () => {
    const s = snap({bodies: [cube(8000, 1)], sketches: faceSketches([1, 6]), ui: {tool: 'sketch.circle.center'}});
    s.doc.active_sketch = 3;
    const c = C.make(s, C.makeBase(snap(before)));
    assert.equal(hintNow('wuerfel', 'Alle Seiten', c).target, 'tool:sketch.finish');
});

// ---------- Zu dick extrudiert: Hinweis auf die Zeitleiste statt neuer Extrusion ----------

test('Namensschild: zu dicke Platte → Hinweis auf die Zeitleiste', () => {
    const c = ctx({}, {bodies: [body('Body1', [-40, -15, 0], [40, 15, 10], 24000)], sketches: [{id: 1, profiles: 1}],
        timeline: tl('Sketch', 'ExtrudeFeature')});
    assert.match(hintNow('namensschild', 'Die Platte extrudieren', c).text, /Zu dick/);
});
