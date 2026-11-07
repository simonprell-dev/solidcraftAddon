// Lädt Erweiterungsdateien (IIFE, schreiben auf window.*) mit einem Fake-window.
// Läuft im selben Realm wie der Test, damit setTimeout & Co. und deepEqual funktionieren.
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function load (files, window = {}) {
    for (const f of [].concat(files)) {
        const code = fs.readFileSync(path.join(root, f), 'utf8');
        new Function('window', code + `\n//# sourceURL=${f}`)(window);
    }
    return window;
}

export const fixture = name => JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures', name), 'utf8'));
