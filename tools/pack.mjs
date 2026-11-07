// Packt die Erweiterung für Store und manuelle Installation – ohne Abhängigkeiten (ZIP selbst geschrieben).
//   dist/solidcraft-kurs-<version>.zip         Ordner „solidcraft-kurs/“ mit README und LICENSE (zum Entpacken)
//   dist/solidcraft-kurs-<version>-store.zip   manifest.json im Wurzelverzeichnis (Chrome Web Store, Edge Add-ons)
// Aufruf: npm run pack
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import {fileURLToPath} from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Genau das, was die Erweiterung zur Laufzeit braucht.
const FILES = ['manifest.json', 'background.js', 'reset-pending.js', 'LICENSE'];
const DIRS = ['_locales', 'course', 'i18n', 'icons', 'lib'];

const CRC = new Int32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    return c;
});
const crc32 = buf => {
    let c = -1;
    for (const b of buf) c = CRC[(c ^ b) & 0xFF] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
};

// Feste Zeit (1.1.1980, 00:00), damit gleiche Quellen ein gleiches ZIP ergeben.
const DOS_DATE = (0 << 9) | (1 << 5) | 1;

function zip (entries) {
    const local = [];
    const central = [];
    let offset = 0;
    for (const {name, data} of entries) {
        const nameBuf = Buffer.from(name, 'utf8');
        const deflated = zlib.deflateRawSync(data, {level: 9});
        const crc = crc32(data);
        const head = Buffer.alloc(30);
        head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(0x0800, 6);
        head.writeUInt16LE(8, 8); head.writeUInt16LE(0, 10); head.writeUInt16LE(DOS_DATE, 12); head.writeUInt32LE(crc, 14);
        head.writeUInt32LE(deflated.length, 18); head.writeUInt32LE(data.length, 22);
        head.writeUInt16LE(nameBuf.length, 26); head.writeUInt16LE(0, 28);
        local.push(head, nameBuf, deflated);
        const cen = Buffer.alloc(46);
        cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6);
        cen.writeUInt16LE(0x0800, 8); cen.writeUInt16LE(8, 10); cen.writeUInt16LE(0, 12); cen.writeUInt16LE(DOS_DATE, 14);
        cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(deflated.length, 20); cen.writeUInt32LE(data.length, 24);
        cen.writeUInt16LE(nameBuf.length, 28); cen.writeUInt32LE(offset, 42);
        central.push(cen, nameBuf);
        offset += head.length + nameBuf.length + deflated.length;
    }
    const cenBuf = Buffer.concat(central);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
    end.writeUInt32LE(cenBuf.length, 12); end.writeUInt32LE(offset, 16);
    return Buffer.concat([...local, cenBuf, end]);
}

function collect () {
    const out = FILES.map(f => f);
    const walk = dir => fs.readdirSync(path.join(root, dir), {withFileTypes: true}).forEach(e => {
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) walk(rel);
        else out.push(rel);
    });
    DIRS.forEach(walk);
    return out.sort();
}

const version = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8')).version;
const files = collect();
for (const f of files) {
    if (!fs.existsSync(path.join(root, f))) throw new Error(`fehlt: ${f}`);
}
// Jede im Manifest bzw. in background.js genannte Datei muss im Paket sein.
const bg = fs.readFileSync(path.join(root, 'background.js'), 'utf8');
for (const m of bg.matchAll(/'((?:lib|course|i18n)\/[^']+\.(?:js|css))'/g)) {
    if (!files.includes(m[1])) throw new Error(`background.js lädt ${m[1]}, das nicht im Paket ist`);
}
fs.mkdirSync(path.join(root, 'dist'), {recursive: true});
const read = f => fs.readFileSync(path.join(root, f));
const store = zip(files.map(f => ({name: f, data: read(f)})));
const manual = zip([...files, 'README.md'].map(f => ({name: `solidcraft-kurs/${f}`, data: read(f)})));
const storeFile = path.join(root, 'dist', `solidcraft-kurs-${version}-store.zip`);
const manualFile = path.join(root, 'dist', `solidcraft-kurs-${version}.zip`);
fs.writeFileSync(storeFile, store);
fs.writeFileSync(manualFile, manual);
console.log(`${files.length} Dateien`);
console.log(`${path.relative(root, storeFile)} (${Math.round(store.length / 1024)} KB) – zum Hochladen im Store`);
console.log(`${path.relative(root, manualFile)} (${Math.round(manual.length / 1024)} KB) – zum Entpacken und „Entpackte Erweiterung laden“`);
