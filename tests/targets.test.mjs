import {test} from 'node:test';
import assert from 'node:assert/strict';
import {load} from './load.mjs';

const T = load('course/targets.js').SolidcraftKursTargets;

const snap = (names, viewport = [0, 34, 1400, 866]) => ({
    ui: {viewport},
    handles: new Map(names.map((n, i) => [n, {x: 100 + i, y: 50}]))
});
const cmds = new Map([
    ['solid.extrude', {tab: 'SOLID', panel: 'CREATE', label: 'Extrude'}],
    ['sketch.text', {tab: 'SKETCH', panel: 'CREATE', label: 'Text'}],
    ['sketch.create', {tab: 'SOLID', panel: 'CREATE', label: 'Create Sketch'}]
]);

test('tool: zeigt auf den Toolbar-Button', () => {
    const r = T.resolve('tool:solid.extrude', snap(['tab:MODEL', 'toolbar:solid.extrude']), cmds);
    assert.deepEqual(r, {kind: 'point', x: 101, y: 50, name: 'toolbar:solid.extrude'});
});

test('tool: nimmt auch den Eintrag eines offenen Aufklappers', () => {
    const r = T.resolve('tool:sketch.text', snap(['dropdown:sketch.text']), cmds);
    assert.equal(r.kind, 'point');
    assert.equal(r.name, 'dropdown:sketch.text');
});

test('tool: ohne Button → erst das Panel aufklappen (deutscher Name)', () => {
    const r = T.resolve('tool:sketch.text', snap(['tab:SKETCH', 'panel:SKETCH:CREATE']), cmds);
    assert.equal(r.kind, 'via');
    assert.equal(r.target.name, 'panel:SKETCH:CREATE');
    assert.equal(r.text, "Klicke auf „Erstellen ▾“");
});

test('tool: ohne Button und Panel → erst den Tab öffnen (deutscher Name)', () => {
    const r = T.resolve('tool:sketch.text', snap(['tab:SKETCH']), cmds);
    assert.equal(r.kind, 'via');
    assert.equal(r.target.name, 'tab:SKETCH');
    assert.equal(r.text, "Öffne oben den Tab „Skizze“");
});

test('tab: und handle: zeigen auf das Handle', () => {
    assert.equal(T.resolve('tab:MODEL', snap(['tab:MODEL']), cmds).name, 'tab:MODEL');
    assert.equal(T.resolve('handle:appbar:save', snap(['appbar:save']), cmds).name, 'appbar:save');
});

test('dialog: zeigt auf das Dialogfeld', () => {
    assert.equal(T.resolve('dialog:Distance', snap(['dialog:Distance']), cmds).name, 'dialog:Distance');
});

test('plane: und world: brauchen ui.at', () => {
    assert.deepEqual(T.resolve('plane:XY', snap([]), cmds), {kind: 'need-at', spec: {plane: 'XY'}});
    assert.deepEqual(T.resolve('world:[0,0,3]', snap([]), cmds), {kind: 'need-at', spec: {world: [0, 0, 3]}});
});

test('viewport → Mitte des Viewports', () => {
    assert.deepEqual(T.resolve('viewport', snap([]), cmds), {kind: 'point', x: 700, y: 467, name: 'viewport'});
});

test('unbekanntes oder fehlendes Ziel → null', () => {
    assert.equal(T.resolve('tab:MODEL', snap([]), cmds), null);
    assert.equal(T.resolve('quatsch', snap([]), cmds), null);
    assert.equal(T.resolve('tool:solid.extrude', null, cmds), null);
});
