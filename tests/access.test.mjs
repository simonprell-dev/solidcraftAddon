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

test('document.inspect neu, wenn Werkzeug oder Dialog wechseln (Revision hinkt nach)', async () => {
    const ui = {tool: 'sketch.rectangle.two_point', dialog: null, viewport: [0, 0, 1, 1]};
    const api = fakeApi({'ui.inspect': ui});
    const a = access({solidcraft: api});
    await a.snapshot();
    ui.tool = null; // z. B. „Skizze beenden“ – document.revision bleibt gleich
    await a.snapshot();
    assert.equal(api.calls.filter(m => m === 'document.inspect').length, 2);
    ui.dialog = {command: 'solid.extrude'};
    await a.snapshot();
    assert.equal(api.calls.filter(m => m === 'document.inspect').length, 3);
});

test('document.inspect spätestens nach einer Sekunde neu', async t => {
    t.mock.timers.enable({apis: ['Date'], now: 0});
    const api = fakeApi();
    const a = access({solidcraft: api});
    await a.snapshot();
    t.mock.timers.tick(500);
    await a.snapshot();
    assert.equal(api.calls.filter(m => m === 'document.inspect').length, 1);
    t.mock.timers.tick(600);
    await a.snapshot();
    assert.equal(api.calls.filter(m => m === 'document.inspect').length, 2);
});

test('snapshot() liefert die Dokument-ID (für gespeicherte Schritt-Startzustände)', async () => {
    const snap = await access({solidcraft: fakeApi()}).snapshot();
    assert.equal(snap.documentId, 1);
});

test('snapshot() holt sketch.inspect der neuesten Skizze, wenn das Modell neu gelesen wird', async () => {
    const api = fakeApi();
    const orig = api.request.bind(api);
    let asked = null;
    api.request = (method, params) => {
        if (method === 'document.inspect') {
            api.calls.push(method);
            return Promise.resolve({bodies: [], sketches: [{id: 1}, {id: 3}], active_sketch: null});
        }
        if (method === 'engine.execute') {
            api.calls.push(method);
            asked = params;
            return Promise.resolve({plane: {origin: [0, 0, 0]}, curves: []});
        }
        return orig(method, params);
    };
    const a = access({solidcraft: api});
    const snap = await a.snapshot();
    assert.deepEqual(asked, {command: 'sketch.inspect', params: {sketch: 3}});
    assert.deepEqual(snap.sketch.plane.origin, [0, 0, 0]);
    await a.snapshot();
    assert.equal(api.calls.filter(m => m === 'engine.execute').length, 1);
});

test('prefs() liest die SolidCraft-Einstellungen (Sprache), bei Fehler null', async () => {
    const api = fakeApi();
    const orig = api.request.bind(api);
    api.request = (m, p) => m === 'ui.prefs' ? Promise.resolve({language: 'system', dark: true}) : orig(m, p);
    assert.equal((await access({solidcraft: api}).prefs()).language, 'system');
    assert.equal(await access({solidcraft: fakeApi()}).prefs(), null);
    assert.equal(await access({}).prefs(), null);
});

test('addRead(): zusätzliche, nur lesende engine-Befehle landen in snap.extra', async () => {
    const api = fakeApi();
    const seen = [];
    const base = api.request.bind(api);
    api.request = (method, params) => {
        if (method === 'engine.execute') {
            seen.push(params.command);
            return params.command === 'joint.list' ? Promise.resolve([{name: 'Drehgelenk'}]) : Promise.reject(new Error('x'));
        }
        return base(method, params);
    };
    const a = access({solidcraft: api});
    a.addRead({key: 'joints', command: 'joint.list'});
    a.addRead({key: 'kaputt', command: 'gibt.es.nicht'});
    a.addRead({key: 'joints', command: 'joint.list'});   // doppelt → nur einmal
    const snap = await a.snapshot();
    assert.deepEqual(snap.extra.joints, [{name: 'Drehgelenk'}]);
    assert.equal(snap.extra.kaputt, null);
    assert.equal(seen.filter(c => c === 'joint.list').length, 1);
});

test('addRead() mit chapter: läuft nur, solange dieses Kapitel offen ist', async () => {
    const api = fakeApi();
    const seen = [];
    const base = api.request.bind(api);
    api.request = (method, params) => {
        if (method === 'engine.execute') {
            seen.push(params.command);
            return Promise.resolve([]);
        }
        return base(method, params);
    };
    const a = access({solidcraft: api});
    a.addRead({key: 'm', command: 'inspect.measure', chapter: 'verwalten'});
    let snap = await a.snapshot();
    assert.equal(seen.length, 0);
    assert.equal(snap.extra.m, undefined);
    a.setChapter('verwalten');
    api.setRevision(2);
    snap = await a.snapshot();
    assert.deepEqual(seen, ['inspect.measure']);
    assert.deepEqual(snap.extra.m, []);
});
