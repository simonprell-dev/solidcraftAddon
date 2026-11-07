// Prüft die Kursdaten (course/course-data.js) auf typische Fehler.
// Aufruf: npm run check
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const KINDS = new Set(['info', 'learn', 'creative', 'game', 'challenge']);
const LEVELS = new Set(['neuling', 'probiert', 'profi']);
const TARGET_KINDS = new Set(['tool', 'tab', 'handle', 'dialog', 'plane', 'axis', 'world', 'viewport']);

export function knownCommands () {
    return new Set(JSON.parse(fs.readFileSync(path.join(root, 'tools/known-commands.json'), 'utf8')));
}

export function checkCourse (course, known) {
    const problems = [];
    const ids = new Set();
    for (const [ci, ch] of course.chapters.entries()) {
        const at = `Kapitel ${ci + 1} (${ch.id})`;
        if (!/^[a-z0-9-]+$/.test(ch.id || '')) problems.push(`${at}: id muss klein, ohne Umlaute sein`);
        if (ids.has(ch.id)) problems.push(`${at}: id „${ch.id}“ doppelt`);
        ids.add(ch.id);
        if (!LEVELS.has(ch.level)) problems.push(`${at}: unbekannte Stufe „${ch.level}“`);
        for (const [si, step] of (ch.steps || []).entries()) {
            const where = `${at} Schritt ${si + 1} „${step.title}“`;
            if (!KINDS.has(step.kind)) problems.push(`${where}: unbekannte Art „${step.kind}“`);
            if (!step.title || !step.text) problems.push(`${where}: title und text sind Pflicht`);
            for (const task of step.tasks || []) {
                if (typeof task.check !== 'function' && !task.manual) {
                    problems.push(`${where}: Aufgabe „${task.text}“ ohne Prüfung (check oder manual)`);
                }
            }
            for (const hint of step.hints || []) {
                if (typeof hint.done !== 'function') problems.push(`${where}: Hinweis „${hint.text}“ ohne done()`);
                if (typeof hint.target === 'function') continue; // wird erst zur Laufzeit berechnet
                const target = String(hint.target);
                const kind = target.split(':')[0];
                if (!TARGET_KINDS.has(kind)) problems.push(`${where}: unbekanntes Ziel „${target}“`);
                if (kind === 'tool' && !known.has(target.slice(5))) {
                    problems.push(`${where}: unbekanntes Werkzeug „${target}“`);
                }
            }
        }
    }
    for (const [level, id] of Object.entries(course.levels || {})) {
        if (!ids.has(id)) problems.push(`Stufe ${level}: Kapitel „${id}“ fehlt`);
    }
    return problems;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const window = {};
    new Function('window', fs.readFileSync(path.join(root, 'course/course-data.js'), 'utf8'))(window);
    const course = window.SolidcraftKursCourse;
    const problems = checkCourse(course, knownCommands());
    problems.forEach(p => console.log(p));
    const steps = course.chapters.reduce((n, ch) => n + ch.steps.length, 0);
    console.log(problems.length ? `${problems.length} Probleme` : `Kurs ok: ${course.chapters.length} Kapitel, ${steps} Schritte.`);
    process.exit(problems.length ? 1 : 0);
}
