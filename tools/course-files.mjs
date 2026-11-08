// Welche Skripte lädt die Erweiterung auf app.solidcraft.io? Einzige Quelle ist PAGE_SCRIPTS in
// background.js – Tests und Werkzeuge lesen die Liste von dort.
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function pageScripts () {
    const src = fs.readFileSync(path.join(root, 'background.js'), 'utf8');
    const block = src.match(/const PAGE_SCRIPTS = \{[\s\S]*?js: \[([\s\S]*?)\]/);
    if (!block) throw new Error('PAGE_SCRIPTS.js in background.js nicht gefunden');
    return [...block[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
}

// Alles, was die Kursinhalte ausmacht: Sprachen, Übersetzungslogik, Kursdaten, Kapiteldateien.
export function courseFiles () {
    return pageScripts().filter(f => /^i18n\//.test(f) || ['course/i18n.js', 'course/course-data.js', 'course/speech.js'].includes(f) ||
        /^course\/chapters\//.test(f));
}

export const chapterFiles = () => pageScripts().filter(f => /^course\/chapters\//.test(f));
