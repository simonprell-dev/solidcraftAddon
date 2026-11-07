// Nimmt die Screenshots für GitHub-Seite und Store mit der echten Erweiterung in der echten
// SolidCraft-Web-App auf – je Sprache (de, en) fünf Bilder in 1280 × 800.
//   docs/img/<lang>/screen-1.png … screen-5.png
// Aufruf: npm run screenshots   (einzelne Sprache: npm run screenshots -- en)
import fs from 'fs';
import path from 'path';
import {launch, root} from './browser.mjs';

const wait = ms => new Promise(r => setTimeout(r, ms));
const LANGS = {de: 'de-DE', en: 'en-US'};
const only = process.argv.slice(2);

async function shoot (lang) {
    const outDir = path.join(root, 'docs/img', lang);
    fs.mkdirSync(outDir, {recursive: true});
    const browser = await launch({extension: true, lang: LANGS[lang], width: 1280, height: 800});
    try {
        const page = await browser.newPage();
        page.on('dialog', d => d.accept());
        await page.goto('https://app.solidcraft.io/', {waitUntil: 'load', timeout: 90000});
        await page.waitForFunction(() => window.solidcraft && window.SolidcraftKurs, {timeout: 120000});
        await wait(2500);
        const call = (m, p) => page.evaluate((m, p) => window.solidcraft.request(m, p), m, p);
        const ex = (c, p) => page.evaluate((c, p) => window.solidcraft.execute(c, p), c, p);
        const shot = async (n, settle = 1800) => {
            await wait(settle); // Konfetti und Animationen abklingen lassen
            await page.screenshot({path: path.join(outDir, `screen-${n}.png`)});
            console.log(`  ${lang}/screen-${n}.png`);
        };
        const allDone = () => page.waitForFunction(() => [...document.querySelectorAll('.sk-task')]
            .every(li => li.classList.contains('sk-task-done')), {timeout: 10000}).catch(() => null);
        const openStep = async (ci, si) => {
            await page.evaluate((ci, si) => window.SolidcraftKurs.openChapter(ci, si), ci, si);
            await wait(800);
        };
        const view = async () => {
            await call('ui.view', {view: 'iso'});
            await call('ui.view', {view: 'fit'});
        };
        await call('ui.home', {open: false});

        // 2) Stufenwahl
        for (let i = 0; i < 3 && !(await page.$('.sk-level-neuling')); i++) {
            await page.click('.sk-launcher');
            await page.waitForSelector('.sk-level-neuling', {visible: true, timeout: 5000}).catch(() => null);
        }
        await shot(2, 600);
        await page.click('.sk-level-neuling');

        // 1) Hand zeigt auf „Neue Skizze“ (Kapitel 1, Schritt 3)
        await openStep(0, 2);
        await page.waitForSelector('.sk-ring', {timeout: 5000}).catch(() => null);
        await shot(1, 900);

        // 3) Namensschild fertig, Aufgabe abgehakt (Kapitel 1, Schritt 7)
        await ex('sketch.create', {plane: 'XY'});
        await ex('sketch.rectangle.rounded', {p0: [-40, -15], p1: [40, 15], radius: 4});
        await ex('sketch.finish', {});
        await ex('solid.extrude', {distance: 3});
        await openStep(0, 6);
        await ex('sketch.create', {plane: {face: [0, 0, 3]}});
        await ex('sketch.text', {text: lang === 'de' ? 'ANNA' : 'ALEX', at: [-28, -6], height: 12});
        await ex('sketch.finish', {});
        await ex('solid.extrude', {distance: 2, operation: 'join'});
        await ex('appearance.assign', {bodies: ['Body1'], color: '#3C8DDE'}).catch(() => null);
        await view();
        await allDone();
        await shot(3);

        // 4) Spielwürfel mit allen Augen (Kapitel 3, Schritt 4) – in einem neuen Design
        await call('ui.documents', {action: 'new'}).catch(() => null);
        await wait(800);
        // Wie ein Kind: Würfel und erstes Auge sind schon da, wenn es zu „Alle Seiten“ kommt.
        await openStep(2, 1);
        await ex('sketch.create', {plane: 'XY'});
        await ex('sketch.rectangle.two_point', {p0: [-10, -10], p1: [10, 10]});
        await ex('sketch.finish', {});
        await ex('solid.extrude', {distance: 20});
        await ex('sketch.create', {plane: {face: [0, 0, 20]}});
        await ex('sketch.circle.center', {center: [0, 0], diameter: 3.4});
        await ex('sketch.finish', {});
        await ex('solid.extrude', {distance: 1, direction: 'negative', operation: 'cut'});
        await openStep(2, 3);
        const PIPS = {1: [[0, 0]], 2: [[-5, -5], [5, 5]], 3: [[-5, -5], [0, 0], [5, 5]],
            4: [[-5, -5], [-5, 5], [5, -5], [5, 5]], 5: [[-5, -5], [-5, 5], [0, 0], [5, -5], [5, 5]],
            6: [[-5, -5], [-5, 0], [-5, 5], [5, -5], [5, 0], [5, 5]]};
        for (const [face, n] of [[[0, 0, 0], 6], [[0, -10, 10], 2], [[0, 10, 10], 5], [[10, 0, 10], 3], [[-10, 0, 10], 4]]) {
            await ex('sketch.create', {plane: {face}});
            const {plane} = await ex('sketch.inspect', {});
            const d = face.map((v, i) => v - plane.origin[i]);
            const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
            const [u, v] = [dot(d, plane.x_dir), dot(d, plane.y_dir)];
            for (const [x, y] of PIPS[n]) await ex('sketch.circle.center', {center: [u + x, v + y], diameter: 3.4});
            await ex('sketch.finish', {});
            await ex('solid.extrude', {distance: 1, direction: 'negative', operation: 'cut'});
        }
        await ex('solid.chamfer', {edges: [[0, 10, 20], [10, 0, 20], [0, -10, 20], [-10, 0, 20]], distance: 0.8}).catch(() => null);
        await ex('appearance.assign', {bodies: ['Body1'], color: '#F4F1EA'}).catch(() => null);
        await view();
        await allDone();
        await shot(4);

        // 5) Rakete mit drei Flossen (Kapitel 6, Schritt 6) – in einem neuen Design
        await call('ui.documents', {action: 'new'}).catch(() => null);
        await wait(800);
        await openStep(5, 5);
        await ex('sketch.create', {plane: 'XZ', flip: true});
        await ex('sketch.line', {points: [[0, 0], [10, 0], [10, 50], [0, 70]], closed: true});
        await ex('sketch.finish', {});
        await ex('solid.revolve', {axis: 'Z', operation: 'new_body'});
        await ex('sketch.create', {plane: 'XZ', flip: true});
        await ex('sketch.line', {points: [[9, 0], [22, -6], [9, 18]], closed: true});
        await ex('sketch.finish', {});
        await ex('solid.extrude', {distance: 2, direction: 'symmetric', operation: 'new_body'});
        let names = (await call('document.inspect', {})).bodies.map(b => b.name);
        await ex('solid.pattern.circular', {bodies: [names[names.length - 1]], axis: 'Z', count: 3});
        names = (await call('document.inspect', {})).bodies.map(b => b.name);
        await ex('solid.combine', {target: names[0], tools: names.slice(1), operation: 'join'});
        names = (await call('document.inspect', {})).bodies.map(b => b.name);
        await ex('appearance.assign', {bodies: [names[0]], color: '#E8762C'}).catch(() => null);
        await view();
        await allDone();
        await shot(5);
    } finally {
        await browser.close();
    }
}

for (const lang of Object.keys(LANGS)) {
    if (only.length && !only.includes(lang)) continue;
    console.log(`Screenshots ${lang}:`);
    await shoot(lang);
}
