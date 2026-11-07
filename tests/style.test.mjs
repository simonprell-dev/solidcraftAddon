import {test} from 'node:test';
import assert from 'node:assert/strict';
import {load} from './load.mjs';

// Minimales DOM: nur was course-style.js braucht.
function fakeDocument () {
    const nodes = [];
    const el = tag => ({tagName: tag.toUpperCase(), id: '', textContent: '', remove () { nodes.splice(nodes.indexOf(this), 1); }});
    const head = {appendChild: n => { nodes.push(n); return n; }};
    return {nodes, head, documentElement: head, createElement: el, getElementById: id => nodes.find(n => n.id === id) || null};
}

test('course-style.js fügt das Stylesheet selbst ein (unabhängig von der CSS-Registrierung)', () => {
    const document = fakeDocument();
    globalThis.document = document;
    try {
        const w = load('course/course-style.js');
        assert.equal(document.nodes.length, 1);
        assert.equal(document.nodes[0].id, 'sk-style');
        assert.match(document.nodes[0].textContent, /\.sk-launcher\s*\{[^}]*position:\s*fixed/);
        w.SolidcraftKursStyle.ensure();
        assert.equal(document.nodes.length, 1, 'kein zweites Mal');
        document.nodes[0].remove();
        w.SolidcraftKursStyle.ensure();
        assert.equal(document.nodes.length, 1, 'wieder eingefügt, wenn entfernt');
    } finally {
        delete globalThis.document;
    }
});
