import {test} from 'node:test';
import assert from 'node:assert/strict';
import {load} from './load.mjs';

const H = load('course/hint-flow.js').SolidcraftKursHintFlow;

const rect = (left, top, width, height) => ({left, top, width, height, right: left + width, bottom: top + height});

test('pickSpot(): Sprechblase verdeckt nie einen gemiedenen Punkt (OK-Knopf)', () => {
    const below = rect(500, 300, 200, 40);      // würde den OK-Knopf bei (600, 320) verdecken
    const left = rect(280, 270, 200, 40);
    const spot = H.pickSpot([below, left], {width: 1400, height: 900}, {points: [{x: 600, y: 320}]});
    assert.equal(spot, left);
});

test('pickSpot(): meidet Rechtecke (Kursfenster) und bleibt im Fenster', () => {
    const offscreen = rect(1300, 300, 200, 40);
    const onPanel = rect(100, 100, 200, 40);
    const free = rect(600, 100, 200, 40);
    const spot = H.pickSpot([offscreen, onPanel, free], {width: 1400, height: 900}, {rects: [rect(50, 50, 380, 500)]});
    assert.equal(spot, free);
});

test('pickSpot(): passt nichts, dann die erste Stelle im Fenster', () => {
    const a = rect(500, 300, 200, 40);
    assert.equal(H.pickSpot([a], {width: 1400, height: 900}, {points: [{x: 600, y: 320}]}), a);
});

const field = {target: 'dialog:Width', text: 'Breite 1, Höhe 2, OK', done: () => false};

test('afterTyping(): nach dem Tippen in ein Dialogfeld zeigt die Hand auf OK', () => {
    const h = H.afterTyping(field, {shownAt: 1000, typedAt: 2000, now: 3500, hasOk: true, okText: 'Klicke auf „OK“'});
    assert.equal(h.target, 'dialog:OK');
    assert.equal(h.text, 'Klicke auf „OK“');
    assert.equal(h.done, field.done);
});

test('afterTyping(): bleibt beim Feld, solange nicht getippt oder noch getippt wird', () => {
    const base = {shownAt: 1000, now: 3500, hasOk: true, okText: 'OK'};
    assert.equal(H.afterTyping(field, {...base, typedAt: 0}), field);          // nie getippt
    assert.equal(H.afterTyping(field, {...base, typedAt: 500}), field);        // vor dem Hinweis getippt
    assert.equal(H.afterTyping(field, {...base, typedAt: 3000}), field);       // tippt gerade noch
    assert.equal(H.afterTyping(field, {...base, typedAt: 2000, hasOk: false}), field);
});

test('afterTyping(): gilt nur für Dialogfelder, nicht für OK, Knöpfe oder das Modell', () => {
    const o = {shownAt: 1000, typedAt: 2000, now: 3500, hasOk: true, okText: 'OK'};
    for (const target of ['dialog:OK', 'dialog:ok', 'dialog:Cancel', 'tool:solid.extrude', 'viewport', 'world:[0,0,0]']) {
        const hint = {target, text: 'x', done: () => false};
        assert.equal(H.afterTyping(hint, o), hint, target);
    }
    const fn = {target: () => 'dialog:Width', text: 'x', done: () => false};
    assert.equal(H.afterTyping(fn, o).target, 'dialog:OK', 'Ziel als Funktion zählt mit');
});
