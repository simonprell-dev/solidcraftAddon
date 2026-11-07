// Schreibt die SEO-Teile der GitHub-Seite: <head> aller Seiten (Titel, Beschreibung, kanonische URL,
// hreflang, Open Graph, Twitter, Favicons, JSON-LD), die FAQ (sichtbar und als FAQPage), Bilder als
// <picture> mit WebP, sowie sitemap.xml, robots.txt und 404.html.
// Aufruf: npm run build:seo   – danach prüft npm run check:seo.
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {BASE} from './check-seo.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'docs');
const version = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8')).version;
const today = new Date().toISOString().slice(0, 10);
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const URL_DE = BASE;
const URL_EN = BASE + 'en/';
const REPO = 'https://github.com/simonprell-dev/solidcraftAddon';

const FAQ = {
    de: [
        ['Was ist SolidCraft?', 'SolidCraft ist ein kostenloses, quelloffenes CAD-Programm, das direkt im Browser läuft (app.solidcraft.io). Man skizziert, extrudiert und baut Körper wie in professioneller Konstruktionssoftware – ohne Installation.'],
        ['Ist das ein offizielles SolidCraft-Produkt?', 'Nein. Es ist ein unabhängiges Open-Source-Projekt. Es nutzt die offizielle Browser-Schnittstelle von SolidCraft und verändert nichts an Ihren Modellen.'],
        ['Für welches Alter ist der Kurs?', 'Für Kinder und Jugendliche von etwa 8 bis 14 Jahren. Drei Einstiegsstufen sorgen dafür, dass Anfänger und Fortgeschrittene passend starten.'],
        ['Was ist der Unterschied zu Tinkercad?', 'Tinkercad setzt Modelle aus fertigen Grundkörpern zusammen. In SolidCraft lernen Kinder die Arbeitsweise echter CAD-Programme: Skizze zeichnen, extrudieren, Kanten abrunden, Teile passend konstruieren. Der Kurs macht diesen Einstieg kindgerecht.'],
        ['Braucht man ein Konto?', 'Nein – weder für SolidCraft noch für die Erweiterung.'],
        ['Funktioniert es auf Tablets oder Chromebooks?', 'Am besten am Computer mit Maus. Auf Chromebooks mit Chrome funktioniert die Erweiterung ebenfalls; Tablets werden nicht unterstützt.'],
        ['Welche Sprachen gibt es?', 'Deutsch und Englisch. Der Kurs folgt der Sprache von SolidCraft; im Kursmenü lässt sie sich umstellen. Weitere Sprachen können ergänzt werden.'],
        ['Muss das Modell genau die vorgeschlagenen Maße haben?', 'Nein. Die Prüfungen sind großzügig – eigene Größen und Bauwege sind ausdrücklich erlaubt.']
    ],
    en: [
        ['What is SolidCraft?', 'SolidCraft is a free, open-source CAD program that runs right in the browser (app.solidcraft.io). You sketch, extrude and build bodies like in professional design software – with nothing to install.'],
        ['Is this an official SolidCraft product?', 'No. It’s an independent open-source project. It uses SolidCraft’s official browser API and never changes your models.'],
        ['What age is the course for?', 'For children and young people aged about 8 to 14. Three starting levels let beginners and more experienced kids start at the right point.'],
        ['How is this different from Tinkercad?', 'Tinkercad builds models from ready-made shapes. In SolidCraft kids learn how real CAD programs work: draw a sketch, extrude it, round edges, design parts that fit together. The course makes that first step kid-friendly.'],
        ['Do I need an account?', 'No – neither for SolidCraft nor for the extension.'],
        ['Does it work on tablets or Chromebooks?', 'Best on a computer with a mouse. It also works on Chromebooks with Chrome; tablets aren’t supported.'],
        ['Which languages are there?', 'English and German. The course follows SolidCraft’s language; you can change it in the course menu. More languages can be added.'],
        ['Does the model need the exact suggested measurements?', 'No. The checks are generous – your own sizes and ways of building are explicitly allowed.']
    ]
};

const PAGES = [
    {file: 'index.html', lang: 'de', url: URL_DE, de: URL_DE, en: URL_EN, home: true,
        title: '3D-Kurs für Kinder: 3D-Konstruieren lernen mit SolidCraft',
        desc: 'Kostenloser 3D-Konstruktionskurs für Kinder von 8 bis 14 direkt im Web-CAD SolidCraft: Zeige-Hand, automatisch geprüfte Aufgaben, 6 Projekte für den 3D-Drucker.',
        image: 'social-preview.png', imageAlt: '3D-Kurs für SolidCraft: Namensschild in SolidCraft, rechts das Kursfenster mit abgehakten Aufgaben'},
    {file: 'en/index.html', lang: 'en', url: URL_EN, de: URL_DE, en: URL_EN, home: true,
        title: '3D design course for kids – learn CAD with SolidCraft (free)',
        desc: 'Free 3D design course for kids aged 8–14, right inside the web CAD SolidCraft: a pointing hand, automatically checked tasks and 6 projects for your 3D printer.',
        image: 'en/social-preview.png', imageAlt: '3D course for SolidCraft: a name tag in SolidCraft, with the course panel and ticked-off tasks'},
    {file: 'datenschutz.html', lang: 'de', url: BASE + 'datenschutz.html', de: BASE + 'datenschutz.html', en: BASE + 'en/privacy.html',
        title: 'Datenschutzerklärung – 3D-Kurs für SolidCraft',
        desc: 'Datenschutzerklärung der Browser-Erweiterung „3D-Kurs für SolidCraft“: keine Datenerhebung, kein Konto, kein Server – der Kursfortschritt bleibt im Browser.',
        image: 'social-preview.png', imageAlt: '3D-Kurs für SolidCraft'},
    {file: 'en/privacy.html', lang: 'en', url: BASE + 'en/privacy.html', de: BASE + 'datenschutz.html', en: BASE + 'en/privacy.html',
        title: 'Privacy policy – 3D course for SolidCraft',
        desc: 'Privacy policy of the “3D course for SolidCraft” browser extension: no data collection, no account, no server – course progress stays in your browser.',
        image: 'en/social-preview.png', imageAlt: '3D course for SolidCraft'}
];

function jsonLd (page) {
    const de = page.lang === 'de';
    const app = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: de ? 'Einführungskurs für SolidCraft – 3D-Konstruieren lernen' : 'Intro course for SolidCraft – learn 3D design',
        alternateName: de ? '3D-Kurs für SolidCraft' : '3D course for SolidCraft',
        description: page.desc,
        url: page.url,
        image: BASE + 'icon.png',
        screenshot: [1, 3, 4, 5].map(n => `${BASE}img/${page.lang}/screen-${n}.png`),
        applicationCategory: 'EducationalApplication',
        applicationSubCategory: de ? '3D-Konstruktion (CAD) für Kinder' : '3D design (CAD) for kids',
        operatingSystem: 'Windows, macOS, Linux, ChromeOS',
        browserRequirements: 'Google Chrome, Microsoft Edge oder Brave (Chromium)',
        softwareVersion: version,
        inLanguage: ['de', 'en'],
        isAccessibleForFree: true,
        offers: {'@type': 'Offer', price: '0', priceCurrency: 'EUR'},
        audience: {'@type': 'EducationalAudience', educationalRole: 'student', audienceType: de ? 'Kinder von 8 bis 14 Jahren' : 'Kids aged 8 to 14'},
        typicalAgeRange: '8-14',
        educationalUse: de ? 'Unterricht, AG, Makerspace, Zuhause' : 'Lessons, clubs, makerspaces, home',
        license: REPO + '/blob/main/LICENSE',
        downloadUrl: REPO + '/releases/latest',
        author: {'@type': 'Person', name: 'Simon Prell', url: 'https://github.com/simonprell-dev'}
    };
    const faq = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ[page.lang].map(([q, a]) => ({'@type': 'Question', name: q, acceptedAnswer: {'@type': 'Answer', text: a}}))
    };
    const site = {'@context': 'https://schema.org', '@type': 'WebSite', name: page.lang === 'de' ? '3D-Kurs für SolidCraft' : '3D course for SolidCraft',
        url: page.url, inLanguage: page.lang};
    return [app, faq, site].map(o => `<script type="application/ld+json">\n${JSON.stringify(o, null, 1)}\n</script>`).join('\n');
}

function head (page) {
    const rel = page.file.includes('/') ? '../' : '';
    const locale = page.lang === 'de' ? 'de_DE' : 'en_US';
    const altLocale = page.lang === 'de' ? 'en_US' : 'de_DE';
    return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="author" content="Simon Prell">
<meta name="theme-color" content="#E8762C">
<link rel="canonical" href="${page.url}">
<link rel="alternate" hreflang="de" href="${page.de}">
<link rel="alternate" hreflang="en" href="${page.en}">
<link rel="alternate" hreflang="x-default" href="${page.de}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${page.lang === 'de' ? '3D-Kurs für SolidCraft' : '3D course for SolidCraft'}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.desc)}">
<meta property="og:url" content="${page.url}">
<meta property="og:locale" content="${locale}">
<meta property="og:locale:alternate" content="${altLocale}">
<meta property="og:image" content="${BASE}${page.image}">
<meta property="og:image:width" content="1280">
<meta property="og:image:height" content="640">
<meta property="og:image:alt" content="${esc(page.imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.title)}">
<meta name="twitter:description" content="${esc(page.desc)}">
<meta name="twitter:image" content="${BASE}${page.image}">
<link rel="icon" type="image/svg+xml" href="${rel}logo.svg">
<link rel="icon" type="image/png" sizes="256x256" href="${rel}icon.png">
<link rel="apple-touch-icon" href="${rel}apple-touch-icon.png">
<link rel="stylesheet" href="${rel}style.css">
${page.home ? `<link rel="preload" as="image" type="image/webp" href="${rel}img/${page.lang}/screen-1.webp">\n${jsonLd(page)}\n` : ''}</head>`;
}

function body (html, page) {
    const rel = page.file.includes('/') ? '../' : '';
    // Logo im Kopf mit festen Maßen
    html = html.replace(/<img src="((?:\.\.\/)?logo\.svg)" alt="">/g, '<img src="$1" width="32" height="32" alt="">');
    // Screenshots als <picture> mit WebP; das erste Bild (sichtbar) wird bevorzugt geladen
    html = html.replace(/<picture><source[^>]*>(<img [^>]*>)<\/picture>/g, '$1');
    html = html.replace(/<img src="((?:\.\.\/)?img\/(?:de|en)\/screen-(\d)\.png)"([^>]*)>/g, (m, src, n, rest) => {
        rest = rest.replace(/\s(fetchpriority|decoding)="[^"]*"/g, '');
        const extra = n === '1' ? ' fetchpriority="high" decoding="async"' : ' decoding="async"';
        return `<picture><source srcset="${src.replace(/\.png$/, '.webp')}" type="image/webp"><img src="${src}"${rest}${extra}></picture>`;
    });
    if (page.home) {
        const items = FAQ[page.lang].map(([q, a]) => `            <details><summary>${q}</summary><p>${a}</p></details>`).join('\n');
        html = html.replace(/(            <details>[\s\S]*<\/details>\n)/, items + '\n');
    }
    void rel;
    return html;
}

for (const page of PAGES) {
    const file = path.join(docs, page.file);
    let html = fs.readFileSync(file, 'utf8');
    html = html.replace(/<head>[\s\S]*?<\/head>/, head(page));
    html = body(html, page);
    fs.writeFileSync(file, html);
    console.log('  docs/' + page.file);
}

// Sitemap mit Sprachverknüpfungen
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${PAGES.map(p => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="de" href="${p.de}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${p.en}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${p.de}"/>
    <priority>${p.home ? '1.0' : '0.3'}</priority>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(docs, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(docs, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /store/templates/\n\nSitemap: ${BASE}sitemap.xml\n`);
fs.writeFileSync(path.join(docs, '404.html'), `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Seite nicht gefunden – 3D-Kurs für SolidCraft</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/svg+xml" href="/solidcraftAddon/logo.svg">
<link rel="stylesheet" href="/solidcraftAddon/style.css">
</head>
<body>
<section>
    <div class="wrap legal">
        <img src="/solidcraftAddon/logo.svg" width="96" height="96" alt="">
        <h1>Seite nicht gefunden · Page not found</h1>
        <p>Diese Seite gibt es nicht (mehr). · This page doesn’t exist.</p>
        <p><a href="/solidcraftAddon/">Zur Startseite</a> · <a href="/solidcraftAddon/en/">Go to the English home page</a></p>
    </div>
</section>
</body>
</html>
`);
console.log('  docs/sitemap.xml, docs/robots.txt, docs/404.html');
