// Erzeugt die Symbole der Erweiterung (isometrischer Würfel) als PNG – ohne Abhängigkeiten.
// Aufruf: npm run icons
import fs from 'fs';
import zlib from 'zlib';

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
function chunk (type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
}
function png (size, pixel) {
    const raw = Buffer.alloc(size * (size * 4 + 1));
    for (let y = 0; y < size; y++) {
        raw[y * (size * 4 + 1)] = 0;
        for (let x = 0; x < size; x++) {
            const [r, g, b, a] = pixel(x, y, size);
            raw.set([r, g, b, a], y * (size * 4 + 1) + 1 + x * 4);
        }
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
    ihdr[8] = 8; ihdr[9] = 6;
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// Würfel: Mittelpunkt c, Kantenlänge s. Oben hell, links mittel, rechts dunkel.
function cube (x, y, size) {
    const u = (x + 0.5) / size * 2 - 1, v = (y + 0.5) / size * 2 - 1; // -1..1
    const s = 0.82, h = s * 0.5;
    const cos30 = Math.sqrt(3) / 2;
    // Top-Raute: |u|/cos30 + |v + h| / h ≤ 1  (Mitte bei v = -h)
    const top = Math.abs(u) / (s * cos30) + Math.abs(v + h) / h <= 1;
    const inSides = Math.abs(u) <= s * cos30 && v >= -h + Math.abs(u) / cos30 * 0.5 * (h / (s * 0.5)) - 0 &&
        v <= s - Math.abs(u) / cos30 * 0.5;
    if (top) return [255, 196, 120, 255];
    if (inSides && v > -h) return u < 0 ? [232, 118, 44, 255] : [168, 74, 20, 255];
    return [0, 0, 0, 0];
}

for (const size of [16, 32, 48, 128]) fs.writeFileSync(`icons/icon-${size}.png`, png(size, cube));
console.log('Symbole geschrieben.');
