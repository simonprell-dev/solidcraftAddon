import {test} from 'node:test';
import assert from 'node:assert/strict';
import {load, fixture} from './load.mjs';

const C = load('course/context.js').SolidcraftKursContext;
const cam = fixture('camera.json');

const snap = (docName, extra = {}) => ({
    ui: {tool: null, dialog: null, camera: cam.before, ...extra.ui},
    handles: new Map((extra.handles || []).map(n => [n, {x: 1, y: 1}])),
    doc: typeof docName === 'string' ? fixture(docName) : docName
});
const make = (s, baseSnap) => C.make(s, C.makeBase(baseSnap || s));

test('leeres Design: keine Skizze, Höhe 0', () => {
    const c = make(snap('doc-empty.json'));
    assert.equal(c.inSketch(), false);
    assert.equal(c.height(), 0);
    assert.equal(c.bodies().length, 0);
});

test('offene Skizze wird erkannt', () => {
    const c = make(snap('doc-sketch-open.json'));
    assert.equal(c.inSketch(), true);
    assert.equal(c.activeSketch().name, 'Sketch1');
});

test('Rechteck in der offenen Skizze: ein Profil', () => {
    assert.equal(make(snap('doc-sketch-rect.json')).activeSketch().profiles, 1);
});

test('Platte 80 × 30 × 3', () => {
    const c = make(snap('doc-plate.json'));
    assert.ok(c.approx(c.height(), 3, 0.01));
    const [l, b, h] = c.size(c.bodies()[0]);
    assert.ok(c.approx(l, 80, 0.01) && c.approx(b, 30, 0.01) && c.approx(h, 3, 0.01));
});

test('Platte mit erhabenem Text: Höhe 5', () => {
    const c = make(snap('doc-plate-text.json'), snap('doc-plate.json'));
    assert.ok(c.approx(c.height(), 5, 0.01));
    assert.ok(c.approx(c.base.height, 3, 0.01));
    assert.equal(c.features('ExtrudeFeature'), 2);
});

test('Text als eigener Körper (nicht verbunden) zählt auch zur Höhe', () => {
    const doc = fixture('doc-plate.json');
    doc.bodies.push({name: 'Body2', bbox: {min: [-30, -6, 3], max: [30, 6, 5]}, visible: true});
    assert.ok(make(snap(doc)).approx(make(snap(doc)).height(), 5, 0.01));
});

test('neue Skizze seit Schrittbeginn wird gezählt', () => {
    const c = make(snap('doc-text-sketch.json'), snap('doc-plate.json'));
    assert.equal(c.newSketches(), 1);
    assert.equal(c.activeSketch().curves, 64);
});

test('Kamera bewegt sich → cameraMoved', () => {
    const before = snap('doc-empty.json');
    const after = snap('doc-empty.json', {ui: {camera: cam.after}});
    assert.equal(C.make(after, C.makeBase(before)).cameraMoved(), true);
    assert.equal(C.make(before, C.makeBase(before)).cameraMoved(), false);
});

test('Werkzeug, Dialog und Handles', () => {
    const s = snap('doc-empty.json', {ui: {tool: 'sketch.text', dialog: {command: 'solid.extrude'}}, handles: ['dialog:OK']});
    const c = make(s);
    assert.equal(c.tool(), 'sketch.text');
    assert.equal(c.dialog(), 'solid.extrude');
    assert.equal(c.has('dialog:OK'), true);
    assert.equal(c.has('dialog:Distance'), false);
});

test('fehlendes doc bricht nichts', () => {
    const c = make({ui: {}, handles: new Map(), doc: null});
    assert.equal(c.inSketch(), false);
    assert.equal(c.height(), 0);
    assert.equal(c.newSketches(), 0);
});

test('dialogPicked zählt die Auswahl eines Dialogfelds', () => {
    const dialog = {command: 'solid.extrude', inputs: [{active: true, items: [], label: 'Profiles'}]};
    assert.equal(make(snap('doc-empty.json', {ui: {dialog}})).dialogPicked('Profiles'), 0);
    dialog.inputs[0].items = [{type: 'profile'}];
    assert.equal(make(snap('doc-empty.json', {ui: {dialog}})).dialogPicked('Profiles'), 1);
    assert.equal(make(snap('doc-empty.json')).dialogPicked('Profiles'), 0);
});

// Platte auf der Frontebene (XZ): steht aufrecht, Dicke entlang -Y.
function standingPlate (thickness) {
    const doc = fixture('doc-plate.json');
    doc.bodies[0].bbox = {min: [-40, -thickness, -15], max: [40, 0, 15]};
    return doc;
}

test('aufrechte Platte (XZ-Ebene): Dicke entlang der dünnsten Richtung', () => {
    const c = make(snap(standingPlate(3)));
    assert.ok(c.approx(c.height(), 3, 0.01));
});

test('aufrechte Platte: Oberseite liegt auf der Seite weg von der Skizzenebene', () => {
    const c = make(snap(standingPlate(3)));
    assert.deepEqual(c.top(), [0, -3, 0]);
});

test('aufrechte Platte mit Text: Dicke wächst auf 5', () => {
    const c = make(snap(standingPlate(5)), snap(standingPlate(3)));
    assert.ok(c.approx(c.height(), 5, 0.01));
    assert.ok(c.approx(c.base.height, 3, 0.01));
});

test('liegende Platte: Oberseite oben', () => {
    assert.deepEqual(make(snap('doc-plate.json')).top().map(v => Math.round(v * 10) / 10), [0, 0, 3]);
});

// ---------- Phase 2 ----------

const withTimeline = (docName, types) => {
    const doc = fixture(docName);
    types.forEach((type, i) => doc.timeline.push({id: 100 + i, name: type + i, type}));
    return doc;
};

test('newFeatures zählt nur Elemente, die seit Schrittbeginn dazukamen', () => {
    const c = make(snap(withTimeline('doc-plate.json', ['FilletFeature'])), snap('doc-plate.json'));
    assert.equal(c.newFeatures('FilletFeature'), 1);
    assert.equal(c.newFeatures('ExtrudeFeature'), 0);
});

test('volume, faceCount, bodyCount, largest', () => {
    const c = make(snap('doc-plate.json'));
    assert.ok(c.approx(c.volume(), 7158.8, 0.5));
    assert.equal(c.faceCount('cylinder'), 4);
    assert.equal(c.bodyCount(), 1);
    assert.equal(c.largest().name, 'Body1');
    assert.ok(c.approx(c.base.volume, 7158.8, 0.5));
});

test('top("long"): Oberseite entlang der längsten Richtung (stehender Zylinder)', () => {
    const doc = fixture('doc-plate.json');
    doc.bodies[0].bbox = {min: [-30, -30, 0], max: [30, 30, 80]};
    assert.deepEqual(make(snap(doc)).top('long'), [0, 0, 80]);
});

test('sketchCenter: Mitte der neuesten Skizze in Weltkoordinaten', () => {
    const lines = (pts) => pts.map((p, i) => ({type: 'line', start_at: p, end_at: pts[(i + 1) % pts.length]}));
    const s = snap('doc-plate.json');
    s.sketch = {plane: {origin: [0, 0, 20], x_dir: [1, 0, 0], y_dir: [0, 1, 0]},
        curves: lines([[-25, -12], [25, -12], [25, 12], [-25, 12]])};
    assert.deepEqual(make(s).sketchCenter(), [0, 0, 20]);
    s.sketch = {plane: {origin: [0, 0, 0], x_dir: [1, 0, 0], y_dir: [0, 0, -1]},
        curves: [...lines([[0, 0], [10, 0], [10, 40]]), {type: 'circle', center_at: [30, 30], radius: 2}]};
    assert.deepEqual(make(s).sketchCenter(), [16, 0, -20]);
    assert.equal(make(snap('doc-plate.json')).sketchCenter(), null);
});

test('Körper vom Kapitelstart werden ignoriert', () => {
    const s = snap('doc-plate.json');
    const c = C.make(s, C.makeBase(s, ['Body1']));
    assert.equal(c.bodies().length, 0);
    assert.equal(c.height(), 0);
    assert.equal(c.volume(), 0);
});

test('top(2): Oberseite entlang einer festen Achse (Würfel: alle Seiten gleich lang)', () => {
    const doc = fixture('doc-plate.json');
    doc.bodies[0].bbox = {min: [-10, -10, 0], max: [10, 10, 20]};
    assert.deepEqual(make(snap(doc)).top(2), [0, 0, 20]);
});
