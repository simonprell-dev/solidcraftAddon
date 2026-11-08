import {test} from 'node:test';
import assert from 'node:assert/strict';
import {load} from './load.mjs';

const R = load('course/reader.js').SolidcraftKursReader;

// Fake-Audio: merkt sich Quelle und Aufrufe, Fehler/Ende per Hand auslösen.
function fakes () {
    const audios = [];
    const spoken = [];
    let cancelled = 0;
    class FakeAudio {
        constructor (src) {
            this.src = src;
            this.paused = true;
            this.listeners = {};
            audios.push(this);
        }
        addEventListener (ev, fn) { this.listeners[ev] = fn; }
        play () { this.paused = false; return Promise.resolve(); }
        pause () { this.paused = true; }
        fire (ev) { this.listeners[ev] && this.listeners[ev](); }
    }
    const synth = {
        speak (u) { spoken.push(u); },
        cancel () { cancelled++; },
        getVoices: () => [{name: 'Hedda', lang: 'de-DE', localService: true}, {name: 'Zira', lang: 'en-US', localService: true}],
        addEventListener (ev, fn) { (this.listeners = this.listeners || {})[ev] = fn; },
        removeEventListener () {}
    };
    class Utterance {
        constructor (text) { this.text = text; }
    }
    return {audios, spoken, synth, Utterance, FakeAudio, cancelled: () => cancelled};
}

const item = {lang: 'de', key: 'namensschild-01', file: 'audio/de/namensschild-01.mp3', text: 'Hallo.', hash: 'abc'};

test('spielt die MP3-Datei, wenn sie zum Text passt', async () => {
    const f = fakes();
    const r = R.create({base: () => 'chrome-extension://id/', manifest: async () => ({de: {'namensschild-01': 'abc'}}),
        Audio: f.FakeAudio, synth: f.synth, Utterance: f.Utterance});
    await r.play(item);
    assert.equal(f.audios.length, 1);
    assert.equal(f.audios[0].src, 'chrome-extension://id/audio/de/namensschild-01.mp3');
    assert.equal(r.playing(), true);
    f.audios[0].fire('ended');
    assert.equal(r.playing(), false);
});

test('veraltete oder fehlende Datei → Sprachausgabe des Browsers in der richtigen Sprache', async () => {
    const f = fakes();
    const r = R.create({base: () => 'x/', manifest: async () => ({de: {'namensschild-01': 'alt'}}),
        Audio: f.FakeAudio, synth: f.synth, Utterance: f.Utterance});
    await r.play(item);
    assert.equal(f.audios.length, 0);
    assert.equal(f.spoken.length, 1);
    assert.equal(f.spoken[0].text, 'Hallo.');
    assert.equal(f.spoken[0].lang, 'de-DE');
});

test('ohne Erweiterungs-Adresse oder bei Ladefehler → Sprachausgabe', async () => {
    const f = fakes();
    const r = R.create({base: () => null, manifest: async () => null, Audio: f.FakeAudio, synth: f.synth, Utterance: f.Utterance});
    await r.play({...item, lang: 'en'});
    assert.equal(f.spoken[0].lang, 'en-US');

    const g = fakes();
    const r2 = R.create({base: () => 'x/', manifest: async () => ({de: {'namensschild-01': 'abc'}}),
        Audio: g.FakeAudio, synth: g.synth, Utterance: g.Utterance});
    await r2.play(item);
    g.audios[0].fire('error');
    await new Promise(res => setTimeout(res, 0));   // Sprachausgabe wartet auf die Stimmenliste
    assert.equal(g.spoken.length, 1);
});

test('stop() hält Datei und Sprachausgabe an; neues play() stoppt das alte', async () => {
    const f = fakes();
    const changes = [];
    const r = R.create({base: () => 'x/', manifest: async () => ({de: {'namensschild-01': 'abc', 'namensschild-02': 'd'}}),
        Audio: f.FakeAudio, synth: f.synth, Utterance: f.Utterance, onChange: p => changes.push(p)});
    await r.play(item);
    await r.play({...item, key: 'namensschild-02', file: 'audio/de/namensschild-02.mp3', hash: 'd'});
    assert.equal(f.audios[0].paused, true);
    assert.equal(f.audios[1].paused, false);
    r.stop();
    assert.equal(f.audios[1].paused, true);
    assert.ok(f.cancelled() >= 1);
    assert.equal(r.playing(), false);
    assert.equal(changes[changes.length - 1], false);
});

test('ohne Audio und ohne Sprachausgabe passiert nichts (kein Fehler)', async () => {
    const r = R.create({base: () => null, manifest: async () => null, Audio: null, synth: null, Utterance: null});
    await r.play(item);
    assert.equal(r.playing(), false);
});

test('Sprachausgabe nimmt nur lokale Stimmen (nichts geht an einen Server)', async () => {
    const f = fakes();
    f.synth.getVoices = () => [
        {name: 'Google Deutsch', lang: 'de-DE', localService: false},
        {name: 'Hedda', lang: 'de-DE', localService: true},
        {name: 'Zira', lang: 'en-US', localService: true}
    ];
    const r = R.create({base: () => null, manifest: async () => null, Audio: null, synth: f.synth, Utterance: f.Utterance});
    await r.play(item);
    assert.equal(f.spoken[0].voice.name, 'Hedda');

    const g = fakes();
    g.synth.getVoices = () => [{name: 'Google Deutsch', lang: 'de-DE', localService: false}];
    const r2 = R.create({base: () => null, manifest: async () => null, Audio: null, synth: g.synth, Utterance: g.Utterance});
    await r2.play(item);
    assert.equal(g.spoken.length, 0, 'ohne lokale Stimme lieber gar nicht vorlesen');
});

test('current(): verrät, ob Datei oder Sprachausgabe läuft', async () => {
    const f = fakes();
    const r = R.create({base: () => 'x/', manifest: async () => ({de: {'namensschild-01': 'abc'}}),
        Audio: f.FakeAudio, synth: f.synth, Utterance: f.Utterance});
    assert.equal(r.current(), null);
    await r.play(item);
    assert.deepEqual(r.current(), {mode: 'file', src: 'x/audio/de/namensschild-01.mp3'});
    await r.play({...item, hash: 'neu'});
    assert.deepEqual(r.current(), {mode: 'speech', src: null});
    r.stop();
    assert.equal(r.current(), null);
});

test('Stimmen noch nicht geladen: wartet auf voiceschanged, liest nie mit unbestätigter Stimme', async () => {
    const f = fakes();
    let voices = [];
    f.synth.getVoices = () => voices;
    const r = R.create({base: () => null, manifest: async () => null, Audio: null, synth: f.synth, Utterance: f.Utterance});
    const p = r.play(item);
    await new Promise(res => setTimeout(res, 20));
    assert.equal(f.spoken.length, 0);
    voices = [{name: 'Hedda', lang: 'de-DE', localService: true}];
    f.synth.listeners.voiceschanged();
    await p;
    assert.equal(f.spoken[0].voice.name, 'Hedda');
});

test('keine lokale Stimme: onUnavailable meldet es, nichts bleibt hängen', async () => {
    const f = fakes();
    f.synth.getVoices = () => [{name: 'Google Deutsch', lang: 'de-DE', localService: false}];
    let told = 0;
    const r = R.create({base: () => null, manifest: async () => null, Audio: null, synth: f.synth, Utterance: f.Utterance,
        onUnavailable: () => told++});
    await r.play(item);
    assert.equal(told, 1);
    assert.equal(r.playing(), false);
});

test('Fehler der Sprachausgabe beendet das Vorlesen', async () => {
    const f = fakes();
    const r = R.create({base: () => null, manifest: async () => null, Audio: null, synth: f.synth, Utterance: f.Utterance});
    await r.play(item);
    assert.equal(r.playing(), true);
    f.spoken[0].onerror({error: 'synthesis-failed'});
    assert.equal(r.playing(), false);
});

test('fehlgeschlagenes Manifest wird beim nächsten Mal neu geladen', async () => {
    const f = fakes();
    let calls = 0;
    const r = R.create({base: () => 'x/', manifest: async () => (++calls === 1 ? null : {de: {'namensschild-01': 'abc'}}),
        Audio: f.FakeAudio, synth: f.synth, Utterance: f.Utterance});
    await r.play(item);
    assert.equal(f.audios.length, 0);
    await r.play(item);
    assert.equal(f.audios.length, 1);
});
