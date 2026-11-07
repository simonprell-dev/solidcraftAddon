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
