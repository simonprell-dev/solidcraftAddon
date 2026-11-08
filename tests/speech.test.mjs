import {test} from 'node:test';
import assert from 'node:assert/strict';
import {load} from './load.mjs';

const S = load('course/speech.js').SolidcraftKursSpeech;

test('text(): Titel, Text ohne HTML und Aufgaben als vorlesbare Sätze', () => {
    const step = {
        title: 'Ein Rechteck zeichnen',
        text: '<p>Wähle <b>Rechteck</b> und klicke zwei Ecken.</p><ul><li>Mausrad: zoomen</li><li>Rechte Maustaste: drehen</li></ul>',
        tasks: [{text: 'Wähle „Rechteck“'}, {text: 'Zeichne das Rechteck'}]
    };
    assert.equal(S.text(step, 'de'),
        'Ein Rechteck zeichnen. Wähle Rechteck und klicke zwei Ecken. Mausrad: zoomen. Rechte Maustaste: drehen. ' +
        'Deine Aufgaben: Wähle Rechteck. Zeichne das Rechteck.');
});

test('text(): Maße, Zeichen und Abkürzungen werden ausgesprochen (Deutsch)', () => {
    const t = S.text({title: 'Maße', text: '<p>z. B. 80 × 30 mm, 45°, Datei → Als STL exportieren, Ebene XY 🙂</p>'}, 'de');
    assert.equal(t, 'Maße. zum Beispiel 80 mal 30 Millimeter, 45 Grad, Datei, dann Als S T L exportieren, Ebene X Y.');
});

test('text(): Englisch mit eigenen Wörtern', () => {
    const t = S.text({title: 'Size', text: '<p>e.g. 80 × 30 mm → OK</p>', tasks: [{text: 'Draw it'}]}, 'en');
    assert.equal(t, 'Size. for example 80 by 30 millimeters, then OK. Your tasks: Draw it.');
});

test('text(): HTML-Entities und doppelte Leerzeichen', () => {
    assert.equal(S.text({title: 'A &amp; B', text: '<p>x&nbsp;&nbsp;y</p>'}, 'de'), 'A und B. x y.');
});

test('hash(): stabil, kurz, ändert sich mit dem Text', () => {
    assert.equal(S.hash('Hallo'), S.hash('Hallo'));
    assert.notEqual(S.hash('Hallo'), S.hash('Hallo!'));
    assert.match(S.hash('Hallo'), /^[0-9a-f]{8}$/);
});

test('file(): Dateiname je Sprache, Kapitel und Schritt', () => {
    assert.equal(S.file('de', 'namensschild', 0), 'audio/de/namensschild-01.mp3');
    assert.equal(S.file('en', 'blech', 11), 'audio/en/blech-12.mp3');
});

test('text(): Apostrophe bleiben, Bereiche und Rechenzeichen werden gesprochen', () => {
    assert.equal(S.text({title: 'You’re', text: '<p>2–5 mm, 1 + 2 = 3, 3D printer, Create ▾ …</p>'}, 'en'),
        'You\'re. 2 to 5 millimeters, 1 plus 2 equals 3, 3 D printer, Create.');
    assert.equal(S.text({title: 'Maße', text: '<p>2–5 mm, 10 − 4 = 6, 3D-Drucker</p>'}, 'de'),
        'Maße. 2 bis 5 Millimeter, 10 minus 4 gleich 6, 3 D-Drucker.');
});

test('text(): „10 - 4“ ist Minus, „2-5“ und „2–5“ sind Bereiche', () => {
    assert.equal(S.text({title: 'R', text: '<p>10 - 4 = 6, 2-5 mm, 2 – 5 mm</p>'}, 'de'),
        'R. 10 minus 4 gleich 6, 2 bis 5 Millimeter, 2 bis 5 Millimeter.');
});
