// SEO-Check für die GitHub-Seite (docs/): Titel, Beschreibungen, kanonische URLs, Sprachverknüpfungen,
// Vorschauen für soziale Medien, strukturierte Daten, Bilder, interne Links, Sitemap und robots.txt.
// Aufruf: npm run check:seo
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'docs');
export const BASE = 'https://simonprell-dev.github.io/solidcraftAddon/';

// Seiten, die in die Suche sollen, mit ihrer Gegenstück-Seite in der anderen Sprache.
export const PAGES = [
    {file: 'index.html', lang: 'de', alt: 'en/index.html'},
    {file: 'en/index.html', lang: 'en', alt: 'index.html'},
    {file: 'datenschutz.html', lang: 'de', alt: 'en/privacy.html'},
    {file: 'en/privacy.html', lang: 'en', alt: 'datenschutz.html'}
];
const url = file => BASE + file.replace(/(^|\/)index\.html$/, '$1');

const attr = (html, re) => (html.match(re) || [])[1];
const meta = (html, key) => attr(html, new RegExp(`<meta\\s+(?:name|property)="${key}"\\s+content="([^"]*)"`, 'i'));

export function checkSeo () {
    const problems = [];
    for (const page of PAGES) {
        const at = page.file;
        const html = fs.readFileSync(path.join(docs, page.file), 'utf8');
        const dir = path.dirname(path.join(docs, page.file));
        const title = attr(html, /<title>([^<]*)<\/title>/);
        if (!title || title.length < 20 || title.length > 65) problems.push(`${at}: <title> sollte 20–65 Zeichen haben (${title ? title.length : 0})`);
        const desc = meta(html, 'description');
        if (!desc || desc.length < 110 || desc.length > 165) problems.push(`${at}: meta description sollte 110–165 Zeichen haben (${desc ? desc.length : 0})`);
        if (attr(html, /<html lang="([^"]+)"/) !== page.lang) problems.push(`${at}: <html lang> sollte „${page.lang}“ sein`);
        const canonical = attr(html, /<link rel="canonical" href="([^"]+)"/);
        if (canonical !== url(page.file)) problems.push(`${at}: canonical sollte ${url(page.file)} sein (ist ${canonical})`);
        for (const [lang, file] of [[page.lang, page.file], [page.lang === 'de' ? 'en' : 'de', page.alt]]) {
            const href = attr(html, new RegExp(`<link rel="alternate" hreflang="${lang}" href="([^"]+)"`));
            if (href !== url(file)) problems.push(`${at}: hreflang ${lang} sollte ${url(file)} sein (ist ${href})`);
        }
        const xdef = attr(html, /<link rel="alternate" hreflang="x-default" href="([^"]+)"/);
        if (!xdef || !xdef.startsWith(BASE)) problems.push(`${at}: hreflang x-default fehlt`);
        for (const key of ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt', 'og:locale', 'og:type', 'twitter:card']) {
            if (!meta(html, key)) problems.push(`${at}: ${key} fehlt`);
        }
        if (meta(html, 'og:url') && meta(html, 'og:url') !== url(page.file)) problems.push(`${at}: og:url passt nicht zu canonical`);
        const ogImage = meta(html, 'og:image');
        if (ogImage && ogImage.startsWith(BASE) && !fs.existsSync(path.join(docs, ogImage.slice(BASE.length)))) {
            problems.push(`${at}: og:image ${ogImage} existiert nicht`);
        }
        if (!/<link rel="apple-touch-icon"/.test(html)) problems.push(`${at}: apple-touch-icon fehlt`);
        // Strukturierte Daten müssen gültiges JSON sein
        for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
            try {
                JSON.parse(m[1]);
            } catch (e) {
                problems.push(`${at}: JSON-LD ungültig (${e.message})`);
            }
        }
        if (page.file.endsWith('index.html')) {
            const types = [...html.matchAll(/"@type":\s*"([^"]+)"/g)].map(m => m[1]);
            for (const t of ['SoftwareApplication', 'FAQPage']) if (!types.includes(t)) problems.push(`${at}: JSON-LD ${t} fehlt`);
            if ((html.match(/<h1[\s>]/g) || []).length !== 1) problems.push(`${at}: genau eine <h1> erwartet`);
        }
        // Bilder: alt-Text und Maße (gegen Layout-Sprünge)
        for (const m of html.matchAll(/<img\b[^>]*>/g)) {
            const tag = m[0];
            if (!/\balt="/.test(tag)) problems.push(`${at}: Bild ohne alt: ${tag.slice(0, 60)}`);
            if (!/\bwidth="\d+"/.test(tag) || !/\bheight="\d+"/.test(tag)) problems.push(`${at}: Bild ohne width/height: ${tag.slice(0, 60)}`);
        }
        // Interne Links und Dateien müssen existieren
        for (const m of html.matchAll(/(?:href|src|srcset)="([^"#?]+)(?:[#?][^"]*)?"/g)) {
            const ref = m[1].split(' ')[0];
            if (/^(https?:|mailto:|data:)/.test(ref) || !ref) continue;
            let target = path.join(dir, ref);
            if (ref.endsWith('/')) target = path.join(target, 'index.html');
            if (!fs.existsSync(target)) problems.push(`${at}: Verweis auf fehlende Datei ${ref}`);
        }
    }
    // Sitemap und robots.txt
    const sitemapFile = path.join(docs, 'sitemap.xml');
    if (!fs.existsSync(sitemapFile)) {
        problems.push('docs/sitemap.xml fehlt');
    } else {
        const sitemap = fs.readFileSync(sitemapFile, 'utf8');
        for (const page of PAGES) if (!sitemap.includes(`<loc>${url(page.file)}</loc>`)) problems.push(`sitemap.xml: ${url(page.file)} fehlt`);
    }
    const robotsFile = path.join(docs, 'robots.txt');
    if (!fs.existsSync(robotsFile) || !fs.readFileSync(robotsFile, 'utf8').includes(`Sitemap: ${BASE}sitemap.xml`)) {
        problems.push('docs/robots.txt fehlt oder verweist nicht auf die Sitemap');
    }
    if (!fs.existsSync(path.join(docs, '404.html'))) problems.push('docs/404.html fehlt');
    return problems;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const problems = checkSeo();
    problems.forEach(p => console.log(p));
    console.log(problems.length ? `${problems.length} SEO-Probleme` : 'SEO ok');
    process.exit(problems.length ? 1 : 0);
}
