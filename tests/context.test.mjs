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
