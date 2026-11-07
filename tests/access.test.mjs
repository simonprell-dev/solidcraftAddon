import {test} from 'node:test';
import assert from 'node:assert/strict';
import {load} from './load.mjs';

// Fake-API: zählt Aufrufe je Methode, antwortet aus einer Tabelle.
function fakeApi (answers = {}) {
    const calls = [];
    let revision = 1;
    const api = {
        calls,
        setRevision (r) { revision = r; },
        request (method, params) {
            calls.push(method);
            if (answers[method] instanceof Error) return Promise.reject(answers[method]);
            if (method === 'document.revision') return Promise.resolve({document_id: 1, revision});
            if (method === 'ui.inspect') return Promise.resolve(answers[method] || {tool: null, dialog: null, viewport: [0, 34, 1400, 866]});
            if (method === 'ui.handles') return Promise.resolve(answers[method] || [{name: 'tab:MODEL', x: 10, y: 20}]);
            if (method === 'document.inspect') return Promise.resolve({revision, bodies: [], sketches: []});
            if (method === 'ui.at') return Promise.resolve([700, 449]);
            return Promise.reject(new Error('unknown ' + method));
        },
        commands () {
            calls.push('commands');
            return Promise.resolve([{id: 'solid.extrude', tab: 'SOLID', panel: 'CREATE', label: 'Extrude'}]);
        }
    };
    return api;
}

const access = win => load('lib/solidcraft-access.js', win).SolidcraftKursAccess;

test('ready() ist false, solange window.solidcraft fehlt', () => {
    assert.equal(access({}).ready(), false);
});

test('snapshot() liefert null ohne window.solidcraft', async () => {
    assert.equal(await access({}).snapshot(), null);
});

test('snapshot() liefert ui, handles als Map und doc', async () => {
    const api = fakeApi();
    const snap = await access({solidcraft: api}).snapshot();
    assert.equal(snap.ui.viewport[2], 1400);
    assert.deepEqual(snap.handles.get('tab:MODEL'), {x: 10, y: 20});
    assert.deepEqual(snap.doc.bodies, []);
    assert.equal(snap.revision, 1);
});

test('zwei gleichzeitige snapshot()-Aufrufe teilen sich die Anfragen', async () => {
    const api = fakeApi();
    const a = access({solidcraft: api});
    await Promise.all([a.snapshot(), a.snapshot()]);
    assert.equal(api.calls.filter(m => m === 'ui.inspect').length, 1);
});

test('document.inspect nur bei neuer Revision', async () => {
    const api = fakeApi();
    const a = access({solidcraft: api});
    await a.snapshot();
    await a.snapshot();
    assert.equal(api.calls.filter(m => m === 'document.inspect').length, 1);
    api.setRevision(2);
    const snap = await a.snapshot();
    assert.equal(api.calls.filter(m => m === 'document.inspect').length, 2);
    assert.equal(snap.revision, 2);
});

test('abgelehnte Anfrage → snapshot() null, kein Fehler', async () => {
    const api = fakeApi({'ui.inspect': new Error('SolidCraft is not running')});
    assert.equal(await access({solidcraft: api}).snapshot(), null);
});

test('at() liefert Punkt, bei Fehler null', async () => {
    assert.deepEqual(await access({solidcraft: fakeApi()}).at({plane: 'XY'}), [700, 449]);
    assert.equal(await access({solidcraft: fakeApi({'ui.at': new Error('x')})}).at({plane: 'XY'}), null);
});

test('commands() liefert Map id → {tab, panel, label} und fragt nur einmal', async () => {
    const api = fakeApi();
    const a = access({solidcraft: api});
    const m = await a.commands();
    await a.commands();
    assert.deepEqual(m.get('solid.extrude'), {tab: 'SOLID', panel: 'CREATE', label: 'Extrude'});
    assert.equal(api.calls.filter(c => c === 'commands').length, 1);
});
