// Erzeugt die Vorlese-Dateien audio/<sprache>/<kapitel>-<nn>.mp3 für jeden Kursschritt.
// Nur neue oder geänderte Texte werden neu gesprochen (audio/manifest.json merkt sich den Hash).
//
// Aufruf: npm run audio            (alle fehlenden/veralteten)
//         npm run audio -- --all   (alles neu)
// Voraussetzung: Python mit `pip install piper-tts lameenc`; Python-Pfad über TTS_PYTHON,
// Stimmen landen in .voices/ (oder PIPER_VOICES) und werden beim ersten Lauf geladen.
// Stimmen: Thorsten (Deutsch, CC0) und LJSpeech (Englisch, gemeinfrei) – frei weitergebbar.
import fs from 'fs';
import path from 'path';
import {spawnSync} from 'child_process';
import {fileURLToPath} from 'url';
import {courseFiles} from './course-files.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const VOICES = {de: 'de_DE-thorsten-high', en: 'en_US-ljspeech-high'};
const MANIFEST = path.join(root, 'audio/manifest.json');

function loadCourse () {
    const window = {};
    for (const f of [...courseFiles(), 'course/speech.js']) {
        new Function('window', fs.readFileSync(path.join(root, f), 'utf8'))(window);
    }
    return window;
}

// Alle Schritte aller Sprachen: {lang, key, file, text, hash}
export function audioItems () {
    const w = loadCourse();
    const S = w.SolidcraftKursSpeech;
    const items = [];
    for (const lang of Object.keys(VOICES)) {
        const course = w.SolidcraftKursI18n.localize(w.SolidcraftKursCourse, lang);
        for (const ch of course.chapters) {
            ch.steps.forEach((step, i) => {
                const text = S.text(step, lang);
                const file = S.file(lang, ch.id, i);
                items.push({lang, key: path.basename(file, '.mp3'), file, text, hash: S.hash(text)});
            });
        }
    }
    return items;
}

export const readManifest = () => fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};

// Fehlt eine Datei oder passt sie nicht mehr zum Text? (für npm run check)
export function checkAudio () {
    const manifest = readManifest();
    const problems = [];
    for (const it of audioItems()) {
        const have = (manifest[it.lang] || {})[it.key];
        if (!fs.existsSync(path.join(root, it.file))) problems.push(`Audio fehlt: ${it.file} (npm run audio)`);
        else if (have !== it.hash) problems.push(`Audio veraltet: ${it.file} (npm run audio)`);
    }
    return problems;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const all = process.argv.includes('--all');
    const python = process.env.TTS_PYTHON || 'python';
    const voicesDir = process.env.PIPER_VOICES || path.join(root, '.voices');
    const missingVoices = Object.values(VOICES).filter(v => !fs.existsSync(path.join(voicesDir, v + '.onnx')));
    if (missingVoices.length) {
        fs.mkdirSync(voicesDir, {recursive: true});
        const r = spawnSync(python, ['-m', 'piper.download_voices', '--download-dir', voicesDir, ...missingVoices], {stdio: 'inherit'});
        if (r.status !== 0) process.exit(1);
    }
    const manifest = readManifest();
    const items = audioItems();
    const jobs = items.filter(it => all || (manifest[it.lang] || {})[it.key] !== it.hash || !fs.existsSync(path.join(root, it.file)))
        .map(it => ({lang: it.lang, voice: VOICES[it.lang], text: it.text, out: path.join(root, it.file)}));
    console.log(`${items.length} Schritte, ${jobs.length} zu sprechen`);
    if (jobs.length) {
        const r = spawnSync(python, [path.join(root, 'tools/tts.py'), voicesDir], {input: JSON.stringify(jobs), stdio: ['pipe', 'inherit', 'inherit']});
        if (r.status !== 0) process.exit(1);
    }
    // Dateien zu Schritten, die es nicht mehr gibt, entfernen.
    const wanted = new Set(items.map(it => path.join(root, it.file)));
    for (const lang of Object.keys(VOICES)) {
        const dir = path.join(root, 'audio', lang);
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir)) {
            const full = path.join(dir, f);
            if (f.endsWith('.mp3') && !wanted.has(full)) {
                fs.unlinkSync(full);
                console.log('entfernt:', path.relative(root, full));
            }
        }
    }
    const next = {};
    for (const it of items) (next[it.lang] = next[it.lang] || {})[it.key] = it.hash;
    fs.writeFileSync(MANIFEST, JSON.stringify(next, null, 1) + '\n');
    const size = items.reduce((n, it) => n + (fs.existsSync(path.join(root, it.file)) ? fs.statSync(path.join(root, it.file)).size : 0), 0);
    console.log(`audio/manifest.json geschrieben – zusammen ${(size / 1048576).toFixed(1)} MB`);
}
