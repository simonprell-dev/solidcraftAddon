import {test} from 'node:test';
import assert from 'node:assert/strict';
import {load} from './load.mjs';

const FILES = ['i18n/de.js', 'i18n/en.js', 'course/i18n.js'];
const fresh = () => load([...FILES, 'course/course-data.js', 'course/targets.js']);

test('detect: Sprache wie SolidCraft (Einstellung, sonst Browser), unbekannt → Englisch', () => {
    const I = fresh().SolidcraftKursI18n;
    assert.equal(I.detect('system', 'de-DE'), 'de');
    assert.equal(I.detect('system', 'en-US'), 'en');
    assert.equal(I.detect('de', 'en-US'), 'de');
    assert.equal(I.detect('en-GB', 'de-AT'), 'en');
    assert.equal(I.detect('fr', 'de-DE'), 'en');
    assert.equal(I.detect(undefined, 'de'), 'de');
    assert.equal(I.detect(null, undefined), 'en');
});

test('t: Texte je Sprache, Platzhalter, Rückfall auf Deutsch', () => {
    const w = fresh();
    const I = w.SolidcraftKursI18n;
    I.setLang('de');
    assert.equal(I.t('nav.next'), 'Weiter →');
    assert.equal(I.t('header.step', {n: 2, title: 'Rakete', step: 3, total: 9}), 'Kapitel 2: Rakete · 3/9');
    I.setLang('en');
    assert.equal(I.t('nav.next'), 'Next →');
    assert.equal(I.t('header.step', {n: 2, title: 'Rocket', step: 3, total: 9}), 'Chapter 2: Rocket · 3/9');
    delete w.SolidcraftKursLang.en.ui['nav.next'];
    assert.equal(I.t('nav.next'), 'Weiter →');
    assert.equal(I.t('gibt.es.nicht'), 'gibt.es.nicht');
});

test('localize: englischer Kurs, Prüf-Funktionen bleiben dieselben, Deutsch unverändert', () => {
    const w = fresh();
    const I = w.SolidcraftKursI18n;
    const course = w.SolidcraftKursCourse;
    const en = I.localize(course, 'en');
    assert.equal(en.chapters[0].title, 'Your name tag');
    assert.equal(en.chapters[0].steps[0].title, 'What are we building?');
    const step = en.chapters[0].steps[2];
    assert.equal(step.tasks[0].text, 'Click “New Sketch”');
    assert.equal(step.tasks[0].check, course.chapters[0].steps[2].tasks[0].check);
    assert.equal(step.hints[0].done, course.chapters[0].steps[2].hints[0].done);
    assert.equal(en.levels, course.levels);
    const de = I.localize(course, 'de');
    assert.equal(de.chapters[0].steps[2].tasks[0].text, course.chapters[0].steps[2].tasks[0].text);
    assert.equal(course.chapters[0].title, 'Dein Namensschild', 'Original bleibt deutsch');
});

test('missing: die englische Fassung ist vollständig (Kurs und Oberfläche)', () => {
    const w = fresh();
    assert.deepEqual(w.SolidcraftKursI18n.missing(w.SolidcraftKursCourse, 'en'), []);
});

test('missing: findet fehlende Schritte, Kurztexte und Oberflächentexte', () => {
    const w = fresh();
    const en = w.SolidcraftKursLang.en;
    en.course.chapters.wuerfel.steps[1] = null;
    delete en.phrases['Klicke auf „Hülle“'];
    delete en.ui['nav.back'];
    const problems = w.SolidcraftKursI18n.missing(w.SolidcraftKursCourse, 'en');
    assert.ok(problems.some(p => /wuerfel.*2/.test(p)), 'Schritt fehlt');
    assert.ok(problems.some(p => /Klicke auf „Hülle“/.test(p)), 'Kurztext fehlt');
    assert.ok(problems.some(p => /nav\.back/.test(p)), 'Oberflächentext fehlt');
});

test('Hand-Hinweise auf Englisch mit englischen Beschriftungen', () => {
    const w = fresh();
    w.SolidcraftKursI18n.setLang('en');
    const T = w.SolidcraftKursTargets;
    const snap = names => ({ui: {}, handles: new Map(names.map(n => [n, {x: 1, y: 2}]))});
    const cmds = new Map([['sketch.text', {tab: 'SKETCH', panel: 'CREATE'}], ['solid.combine', {tab: 'SOLID', panel: 'MODIFY'}]]);
    assert.equal(T.resolve('tool:sketch.text', snap(['panel:SKETCH:CREATE']), cmds).text, 'Click “Create ▾”');
    assert.equal(T.resolve('tool:sketch.text', snap(['tab:SKETCH']), cmds).text, 'Open the “Sketch” tab at the top');
    assert.equal(T.resolve('tool:solid.combine', snap(['ribbon:search']), cmds, {search: 'Combine'}).text,
        'Click here and search for “Combine”');
});

test('Kurs-Check prüft alle Sprachen und die _locales-Dateien', async () => {
    const {checkLanguages} = await import('../tools/check-course.mjs');
    assert.deepEqual(checkLanguages(), []);
});
