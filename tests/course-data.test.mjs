import {test} from 'node:test';
import assert from 'node:assert/strict';
import {load} from './load.mjs';
import {checkCourse, knownCommands} from '../tools/check-course.mjs';

const course = load('course/course-data.js').SolidcraftKursCourse;

test('Kursdaten haben keine Probleme', () => {
    assert.deepEqual(checkCourse(course, knownCommands()), []);
});

test('Kapitel 1 ist das Namensschild mit 10 Schritten', () => {
    const ch = course.chapters[0];
    assert.equal(ch.id, 'namensschild');
    assert.equal(ch.steps.length, 10);
});

test('Prüfwerkzeug findet unbekannte Werkzeuge, fehlende Prüfungen und doppelte IDs', () => {
    const bad = {
        chapters: [
            {id: 'a', title: 'A', level: 'neuling', steps: [
                {kind: 'learn', title: 'x', text: 'x', tasks: [{text: 'ohne Prüfung'}],
                    hints: [{target: 'tool:gibt.es.nicht', text: 'x', done: () => false}]}
            ]},
            {id: 'a', title: 'A2', level: 'neuling', steps: [{kind: 'info', title: 'y', text: 'y'}]}
        ],
        levels: {neuling: 'a'}
    };
    const problems = checkCourse(bad, new Set(['solid.extrude']));
    assert.ok(problems.some(p => /gibt\.es\.nicht/.test(p)), 'unbekanntes Werkzeug');
    assert.ok(problems.some(p => /ohne Prüfung/.test(p)), 'Aufgabe ohne check/manual');
    assert.ok(problems.some(p => /doppelt/.test(p)), 'doppelte Kapitel-ID');
});

test('Prüfwerkzeug meldet unbekannte Zielarten und kaputte Stufen', () => {
    const bad = {
        chapters: [{id: 'b', title: 'B', level: 'neuling', steps: [
            {kind: 'learn', title: 'x', text: 'x', tasks: [{text: 't', manual: true}],
                hints: [{target: 'flug:irgendwas', text: 'x', done: () => false}]}
        ]}],
        levels: {neuling: 'fehlt'}
    };
    const problems = checkCourse(bad, new Set());
    assert.ok(problems.some(p => /flug:irgendwas/.test(p)));
    assert.ok(problems.some(p => /fehlt/.test(p)));
});

test('Namensschild: auch ein einzelnes „I“ zählt als Name, ein leerer Flächenumriss nicht', () => {
    const C = load('course/context.js').SolidcraftKursContext;
    const step = course.chapters[0].steps.find(s => s.title === 'Deinen Namen schreiben');
    const nameTask = step.tasks[2];
    const doc = sketches => ({active_sketch: 3, bodies: [], timeline: [], sketches});
    const base = C.makeBase({ui: {}, doc: doc([{id: 1, curves: 4, profiles: 1}])});
    const c = sk => C.make({ui: {}, handles: new Map(), doc: doc([{id: 1, curves: 4, profiles: 1}, sk])}, base);
    assert.equal(nameTask.check(c({id: 3, curves: 8, profiles: 2})), true);   // „I“ auf der Fläche
    assert.equal(nameTask.check(c({id: 3, curves: 4, profiles: 1})), false);  // nur der Umriss
    assert.equal(nameTask.check(c({id: 3, curves: 8, profiles: 1})), false);  // Umriss mit runden Ecken
});

// ---------- Hinweis-Ketten und Prüfungen der Kapitel 2–6 (Review Phase 2) ----------

const Ctx = load('course/context.js').SolidcraftKursContext;
const chapter = id => course.chapters.find(ch => ch.id === id);
const stepOf = (id, title) => chapter(id).steps.find(s => s.title === title);
const body = (name, min, max, extra = {}) => ({name, visible: true, bbox: {min, max}, volume_mm3: 1000, face_types: {}, ...extra});
const mk = ({doc = {}, ui = {}, baseDoc = {}}) => {
    const full = d => ({active_sketch: null, bodies: [], sketches: [], timeline: [], ...d});
    const snapNow = {ui, handles: new Map(), doc: full(doc)};
    return Ctx.make(snapNow, Ctx.makeBase({ui: {}, handles: new Map(), doc: full(baseDoc)}));
};
const active = (step, c) => step.hints.find(h => !h.done(c));
const targetOf = (h, c) => typeof h.target === 'function' ? h.target(c) : h.target;

test('Köcher: eine flache Scheibe ist kein 40 mm hoher Zylinder', () => {
    const task = stepOf('koecher', 'Ein Zylinder').tasks[1];
    const cyl = h => ({bodies: [body('Body1', [-30, -30, 0], [30, 30, h], {face_types: {cylinder: 1, plane: 2}})]});
    assert.equal(task.check(mk({doc: cyl(9)})), false);
    assert.equal(task.check(mk({doc: cyl(90)})), true);
});

test('Köcher: „Oberseite“ zeigt auf die Oberseite, auch wenn der Zylinder breiter als hoch ist', () => {
    const step = stepOf('koecher', 'Aushöhlen');
    const c = mk({doc: {bodies: [body('Body1', [-30, -30, 0], [30, 30, 45])]}, ui: {dialog: {command: 'solid.shell', inputs: []}}});
    assert.equal(targetOf(step.hints[1], c), 'world:[0,0,45]');
});

test('Box „Der Rand mit Spiel“: Dialog „Neue Skizze“ geht weiter zur Deckelplatte, danach Extrudieren-Hinweise', () => {
    const step = stepOf('box', 'Der Rand mit Spiel');
    const two = [body('Body1', [-30, -20, 0], [30, 20, 30]), body('Body2', [40, -20, 0], [100, 20, 2])];
    const base = {bodies: two, sketches: [{id: 1}, {id: 2}]};
    const dlg = mk({doc: base, baseDoc: base, ui: {dialog: {command: 'sketch.create', inputs: []}}});
    assert.equal(active(step, dlg).text, 'Klicke auf die Deckelplatte');
    const finished = mk({doc: {...base, sketches: [{id: 1}, {id: 2}, {id: 3, profiles: 2}]}, baseDoc: base});
    assert.equal(targetOf(active(step, finished), finished), 'tool:solid.extrude');
});

test('Skizzen-Kette: Skizze ohne Zeichnung verlassen → Hand wieder auf „Neue Skizze“', () => {
    const step = stepOf('anhaenger', 'Die Grundplatte');
    const c = mk({doc: {sketches: [{id: 1, profiles: 0}]}});   // neue, leere Skizze, nicht mehr offen
    assert.equal(targetOf(active(step, c), c), 'tool:sketch.create');
});

test('Rakete: offene Form beendet → die Kette ist nicht fertig, die Hand hilft weiter', () => {
    const step = stepOf('rakete', 'Die halbe Rakete');
    const c = mk({doc: {sketches: [{id: 1, profiles: 0, curves: 4}]}});
    assert.ok(active(step, c), 'es gibt noch einen Hinweis');
});

test('Würfel „Alle Seiten“: bei 21 Augen sind alle Hinweise erledigt', () => {
    const step = stepOf('wuerfel', 'Alle Seiten');
    // Würfel nach dem ersten Auge (Schrittbeginn) und nach allen Seiten: Skizzen mit 1 + n Profilen.
    const cube = vol => body('Body1', [-10, -10, 0], [10, 10, 20], {volume_mm3: vol});
    const sides = [1, 6, 2, 5, 3, 4].map((n, i) => ({id: i + 2, profiles: n + 1}));
    const c = mk({doc: {bodies: [cube(7900)], sketches: [{id: 1, profiles: 1}, ...sides]},
        baseDoc: {bodies: [cube(7987)], sketches: [{id: 1, profiles: 1}, sides[0]]}});
    assert.equal(active(step, c), undefined);
    assert.equal(step.tasks[1].check(c), true);
    // Eine Vollrundung bringt Zylinderflächen, aber keine Augen.
    const rounded = mk({doc: {bodies: [body('Body1', [-10, -10, 0], [10, 10, 20], {volume_mm3: 7950, face_types: {cylinder: 12, sphere: 8}})],
        sketches: [{id: 1, profiles: 1}, sides[0]]}, baseDoc: {bodies: [cube(7987)], sketches: [{id: 1, profiles: 1}, sides[0]]}});
    assert.equal(step.tasks[1].check(rounded), false);
});

test('Würfel „Kanten brechen“: mit Vollrundung führt die Hand zum Radius', () => {
    const step = stepOf('wuerfel', 'Kanten brechen');
    const dlg = {command: 'solid.fillet', inputs: [{label: 'Edges', items: [{}]}]};
    const c = mk({doc: {bodies: [body('Body1', [-10, -10, 0], [10, 10, 20])]}, ui: {dialog: dlg}});
    assert.equal(targetOf(active(step, c), c), 'dialog:Radius');
});

test('Box „Die Box“: zu flach extrudiert → Hand bleibt beim Extrudieren statt zur Hülle zu springen', () => {
    const step = stepOf('box', 'Die Box');
    const c = mk({doc: {bodies: [body('Body1', [-30, -20, 0], [30, 20, 5])], sketches: [{id: 1, profiles: 1}]}});
    assert.notEqual(targetOf(active(step, c), c), 'tool:solid.shell');
});

test('Kapiteldateien: add() hängt an, translate() trägt Englisch ein, helpers sind da', () => {
    const w = load('course/course-data.js');
    const K = w.SolidcraftKursCourse;
    const n = K.chapters.length;
    for (const name of ['sketchHints', 'extrudeHints', 'exportStep', 'world', 'dims', 'newBody', 'plate']) {
        assert.equal(typeof K.helpers[name], 'function', name);
    }
    K.add({id: 'neu', title: 'Neu', level: 'profi', steps: [{kind: 'info', title: 'a', text: 'b'}]});
    assert.equal(K.chapters.length, n + 1);
    assert.equal(K.chapters[n].id, 'neu');
    K.translate('en', 'neu', {title: 'New', type: 'Sheet', steps: [{title: 'A', text: 'B'}]}, {'Hallo': 'Hello'});
    assert.equal(w.SolidcraftKursLang.en.course.chapters.neu.title, 'New');
    assert.equal(w.SolidcraftKursLang.en.phrases.Hallo, 'Hello');
});

test('Alle Kapiteldateien aus background.js laden ohne Fehler', async () => {
    const {courseFiles} = await import('../tools/course-files.mjs');
    const files = courseFiles();
    assert.ok(files.includes('course/course-data.js'));
    const w = load(files);
    assert.ok(w.SolidcraftKursCourse.chapters.length >= 6);
});
