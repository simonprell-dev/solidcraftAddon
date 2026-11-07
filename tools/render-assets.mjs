// Erzeugt alle Grafiken aus docs/logo.svg und den HTML-Vorlagen – mit einem Browser, ohne
// weitere Abhängigkeiten.
//   npm run icons    Symbole der Erweiterung (icons/) und Logos (docs/, docs/store/)
//   npm run assets   alles: Symbole, Store-Bilder je Sprache, Vorschaubilder, Flyer-PDFs
// Vorher `npm run screenshots`, damit docs/img/<sprache>/screen-*.png aktuell sind.
import fs from 'fs';
import path from 'path';
import {pathToFileURL} from 'url';
import {launch, root} from './browser.mjs';

const mode = process.argv[2] || 'all';
const LANGS = ['de', 'en'];
const p = (...a) => path.join(root, ...a);
const svg = fs.readFileSync(p('docs/logo.svg'), 'utf8');
const svgData = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');

const browser = await launch({width: 800, height: 600});
const page = await browser.newPage();

// Logo als PNG. pad: transparenter Rand (Chrome Web Store: 128er-Symbol mit 96er-Motiv).
async function logo (file, size, pad = 0) {
    await page.setViewport({width: size, height: size});
    await page.setContent(`<html><body style="margin:0;background:transparent">
        <img src="${svgData}" style="display:block;margin:${pad}px;width:${size - 2 * pad}px;height:${size - 2 * pad}px"></body></html>`);
    await page.screenshot({path: file, omitBackground: true});
    console.log('  ' + path.relative(root, file));
}

async function render (url, file, width, height) {
    await page.setViewport({width, height});
    await page.goto(url, {waitUntil: 'networkidle0'});
    await page.screenshot({path: file});
    console.log('  ' + path.relative(root, file));
}

console.log('Symbole und Logos:');
fs.mkdirSync(p('icons'), {recursive: true});
for (const size of [16, 32, 48]) await logo(p(`icons/icon-${size}.png`), size);
await logo(p('icons/icon-128.png'), 128, 16);
fs.mkdirSync(p('docs/store'), {recursive: true});
await logo(p('docs/store/haendlersymbol-128.png'), 128, 16);
await logo(p('docs/store/edge-logo-300.png'), 300);
await logo(p('docs/icon.png'), 256);
await logo(p('docs/apple-touch-icon.png'), 180);

// WebP-Fassungen der Screenshots für die GitHub-Seite (deutlich kleiner als PNG → schnelleres Laden)
async function webp (src, dst) {
    const data = 'data:image/png;base64,' + fs.readFileSync(src).toString('base64');
    const b64 = await page.evaluate(async d => {
        const img = new Image();
        img.src = d;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        return c.toDataURL('image/webp', 0.82).split(',')[1];
    }, data);
    fs.writeFileSync(dst, Buffer.from(b64, 'base64'));
}
console.log('WebP:');
for (const lang of LANGS) {
    for (let n = 1; n <= 5; n++) {
        const src = p('docs/img', lang, `screen-${n}.png`);
        if (fs.existsSync(src)) await webp(src, src.replace(/\.png$/, '.webp'));
    }
    console.log(`  docs/img/${lang}/screen-1…5.webp`);
}

if (mode !== 'icons') {
    const tpl = pathToFileURL(p('docs/store/templates/promo.html')).href;
    for (const lang of LANGS) {
        console.log(`Store-Bilder ${lang}:`);
        const dir = p('docs/store', lang);
        fs.mkdirSync(dir, {recursive: true});
        await render(`${tpl}?size=small&lang=${lang}`, path.join(dir, 'promo-440x280.png'), 440, 280);
        await render(`${tpl}?size=large&lang=${lang}`, path.join(dir, 'promo-1400x560.png'), 1400, 560);
        for (let n = 1; n <= 5; n++) {
            const src = p('docs/img', lang, `screen-${n}.png`);
            if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, `screenshot-${n}.png`));
        }
        console.log(`  docs/store/${lang}/screenshot-1…5.png (kopiert)`);
        const social = lang === 'de' ? p('docs/social-preview.png') : p('docs/en/social-preview.png');
        fs.mkdirSync(path.dirname(social), {recursive: true});
        await render(`${tpl}?size=social&lang=${lang}`, social, 1280, 640);

        // Flyer für Lehrkräfte als PDF (A4)
        await page.setViewport({width: 794, height: 1123});
        await page.goto(pathToFileURL(p('docs/flyer.html')).href + `?lang=${lang}`, {waitUntil: 'networkidle0'});
        const pdf = p('docs', `flyer-${lang}.pdf`);
        await page.pdf({path: pdf, format: 'A4', printBackground: true, margin: {top: 0, bottom: 0, left: 0, right: 0}});
        console.log('  ' + path.relative(root, pdf));
    }
}
await browser.close();
