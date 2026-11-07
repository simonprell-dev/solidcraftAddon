// End-to-End-Test für die Kapitel 2–6: jedes Kapitel in einem neuen Design der echten Web-App.
// Die Konstruktion übernimmt der Test über window.solidcraft; geprüft wird, dass der Kurs jede
// Aufgabe abhakt und in jedem Lern-Schritt die Hand (mit 👆) auf ein Ziel zeigt.
// Aufruf: npm run e2e:chapters [anhaenger wuerfel …]   (HEADFUL=1 zum Zuschauen, UI_LANG=en-US auf Englisch)
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'tests/out');
fs.mkdirSync(outDir, {recursive: true});
const executablePath = [process.env.CHROME,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/chromium'].filter(Boolean).find(p => fs.existsSync(p));

const wait = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
const log = (ok, msg) => {
    if (!ok) failures++;
    console.log(`${ok ? '✔' : '✖'} ${msg}`);
};

// Würfelaugen: Kreismitten je Anzahl (Skizzenkoordinaten auf der Fläche).
const PIPS = {
    1: [[0, 0]], 2: [[-5, -5], [5, 5]], 3: [[-5, -5], [0, 0], [5, 5]],
    4: [[-5, -5], [-5, 5], [5, -5], [5, 5]], 5: [[-5, -5], [-5, 5], [0, 0], [5, -5], [5, 5]],
    6: [[-5, -5], [-5, 0], [-5, 5], [5, -5], [5, 0], [5, 5]]
};

// Pro Kapitel: Aktionen je Schritt (Index = Schritt). Fehlt ein Eintrag, wird nur abgehakt/weiter.
const PLAYS = {
    anhaenger: {
        1: async ({ex}) => {
            await ex('sketch.create', {plane: 'XY'});
            await ex('sketch.rectangle.two_point', {p0: [-25, -12], p1: [25, 12]});
            await ex('sketch.finish', {});
            await ex('solid.extrude', {distance: 4});
        },
        2: ({ex}) => ex('solid.fillet', {edges: [[25, 12, 2], [-25, 12, 2], [25, -12, 2], [-25, -12, 2]], radius: 4}),
        3: ({ex}) => ex('solid.hole', {position: [-18, 0, 4], diameter: 5})
    },
    wuerfel: {
        1: async ({ex}) => {
            await ex('sketch.create', {plane: 'XY'});
            await ex('sketch.rectangle.two_point', {p0: [-10, -10], p1: [10, 10]});
            await ex('sketch.finish', {});
            await ex('solid.extrude', {distance: 20});
        },
        2: async ({ex}) => {
            await ex('sketch.create', {plane: {face: [0, 0, 20]}});
            await ex('sketch.circle.center', {center: [0, 0], diameter: 4});
            await ex('sketch.finish', {});
            await ex('solid.extrude', {distance: 1, direction: 'negative', operation: 'cut'});
        },
        3: async ({ex}) => {
            // Gegenüber ergibt 7: oben 1 (schon da), unten 6, vorne 2, hinten 5, rechts 3, links 4.
            const faces = [[[0, 0, 0], 6], [[0, -10, 10], 2], [[0, 10, 10], 5], [[10, 0, 10], 3], [[-10, 0, 10], 4]];
            for (const [face, n] of faces) {
                await ex('sketch.create', {plane: {face}});
                // Skizzen-Nullpunkt liegt nicht unbedingt in der Flächenmitte → Mitte umrechnen.
                const {plane} = await ex('sketch.inspect', {});
                const d = face.map((v, i) => v - plane.origin[i]);
                const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
                const [u, v] = [dot(d, plane.x_dir), dot(d, plane.y_dir)];
                for (const [x, y] of PIPS[n]) await ex('sketch.circle.center', {center: [u + x, v + y], diameter: 3});
                await ex('sketch.finish', {});
                await ex('solid.extrude', {distance: 1, direction: 'negative', operation: 'cut'});
            }
        },
        4: ({ex}) => ex('solid.chamfer', {edges: [[0, 10, 20]], distance: 1})
    },
    koecher: {
        1: async ({ex}) => {
            await ex('sketch.create', {plane: 'XY'});
            await ex('sketch.circle.center', {center: [0, 0], diameter: 60});
            await ex('sketch.finish', {});
            await ex('solid.extrude', {distance: 90});
        },
        2: ({ex}) => ex('solid.shell', {faces: [[0, 0, 90]], thickness: 2}),
        3: ({ex}) => ex('solid.fillet', {edges: [[30, 0, 90]], radius: 1}),
        4: async ({ex}) => {
            await ex('sketch.create', {plane: 'XY'});
            await ex('sketch.circle.center', {center: [45, 0], diameter: 40});
            await ex('sketch.finish', {});
            await ex('solid.extrude', {distance: 60, operation: 'new_body'});
        },
        5: async ({ex, bodies}) => {
            const names = await bodies();
            await ex('solid.shell', {faces: [[58, 0, 60]], thickness: 2, body: names[names.length - 1]});
            await ex('solid.combine', {target: names[0], tools: names.slice(1), operation: 'join'});
        }
    },
    box: {
        1: async ({ex}) => {
            await ex('sketch.create', {plane: 'XY'});
            await ex('sketch.rectangle.two_point', {p0: [-30, -20], p1: [30, 20]});
            await ex('sketch.finish', {});
            await ex('solid.extrude', {distance: 30});
            await ex('solid.shell', {faces: [[0, 0, 30]], thickness: 2});
        },
        2: async ({ex}) => {
            await ex('sketch.create', {plane: 'XY'});
            await ex('sketch.rectangle.two_point', {p0: [40, -20], p1: [100, 20]});
            await ex('sketch.finish', {});
            await ex('solid.extrude', {distance: 2, operation: 'new_body'});
        },
        3: async ({ex}) => {
            await ex('sketch.create', {plane: 'XY', offset: 2});
            await ex('sketch.rectangle.center', {center: [70, 0], corner: [97.8, 17.8]});
            await ex('sketch.finish', {});
            await ex('solid.extrude', {distance: 3, operation: 'join'});
        }
    },
    rakete: {
        1: async ({ex}) => {
            await ex('sketch.create', {plane: 'XZ'});
            await ex('sketch.line', {points: [[0, 0], [10, 0], [10, 50], [0, 70]], closed: true});
            await ex('sketch.finish', {});
        },
        2: ({ex}) => ex('solid.revolve', {axis: 'Z', operation: 'new_body'}),
        3: async ({ex}) => {
            await ex('sketch.create', {plane: 'XZ'});
            await ex('sketch.line', {points: [[9, 0], [22, -6], [9, 18]], closed: true});
            await ex('sketch.finish', {});
            await ex('solid.extrude', {distance: 2, direction: 'symmetric', operation: 'new_body'});
        },
        4: async ({ex, bodies}) => {
            const names = await bodies();
            await ex('solid.pattern.circular', {bodies: [names[names.length - 1]], axis: 'Z', count: 3});
        },
        5: async ({ex, bodies}) => {
            const names = await bodies();
            await ex('solid.combine', {target: names[0], tools: names.slice(1), operation: 'join'});
        }
    }
};

const only = process.argv.slice(2);
const browser = await puppeteer.launch({
    executablePath,
    headless: process.env.HEADFUL ? false : 'new',
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`,
        '--enable-unsafe-swiftshader', '--use-angle=swiftshader', `--lang=${process.env.UI_LANG || 'de-DE'}`],
    defaultViewport: {width: 1400, height: 900}
});

try {
    const page = await browser.newPage();
    page.on('dialog', d => d.accept());
    page.on('pageerror', e => console.log('Seitenfehler:', e.message));
    await page.goto('https://app.solidcraft.io/', {waitUntil: 'load', timeout: 90000});
    await page.waitForFunction(() => window.solidcraft && window.SolidcraftKurs, {timeout: 120000});
    await wait(2500);
    const call = (m, p) => page.evaluate((m, p) => window.solidcraft.request(m, p), m, p);
    const ex = (c, p) => page.evaluate((c, p) => window.solidcraft.execute(c, p), c, p);
    const bodies = async () => (await call('document.inspect', {})).bodies.map(b => b.name);
    await call('ui.home', {open: false});

    // Start-Knopf: bei Bedarf erneut klicken (ein seltener verlorener Klick ließ sich nicht nachstellen).
    for (let i = 0; i < 3 && !(await page.$('.sk-level-neuling')); i++) {
        await page.click('.sk-launcher');
        await page.waitForSelector('.sk-level-neuling', {visible: true, timeout: 5000}).catch(() => null);
    }
    await page.waitForSelector('.sk-level-neuling', {visible: true, timeout: 1000});
    await page.click('.sk-level-neuling');
    await page.waitForSelector('.sk-next');

    // Kapitel in der Sprache, die der Kurs gerade zeigt (UI_LANG=en-US für Englisch).
    const chapters = await page.evaluate(() => window.SolidcraftKurs.chapters().map(ch => ({
        id: ch.id, auto: ch.autoHints,
        steps: ch.steps.map(s => ({kind: s.kind, title: s.title, hints: !!(s.hints && s.hints.length),
            manual: (s.tasks || []).map(t => !!t.manual)}))
    })));

    const allDone = (ms = 10000) => page.waitForFunction(() => {
        const t = [...document.querySelectorAll('.sk-task')];
        return t.every(li => li.classList.contains('sk-task-done'));
    }, {timeout: ms}).then(() => true, () => false);

    for (const [ci, ch] of chapters.entries()) {
        if (ci === 0 || (only.length && !only.includes(ch.id))) continue;
        // Jedes Kapitel in einem neuen, leeren Design – wie im Übergang „Projekt sichern“.
        await call('ui.documents', {action: 'new'}).catch(() => null);
        await wait(800);
        await page.evaluate(ci => window.SolidcraftKurs.openChapter(ci, 0), ci);
        await wait(600);
        const play = PLAYS[ch.id] || {};
        for (const [si, step] of ch.steps.entries()) {
            const where = `${ch.id} ${si + 1} „${step.title}“`;
            await page.waitForFunction(t => document.querySelector('.sk-panel .sk-title')?.textContent === t,
                {timeout: 5000}, step.title).catch(() => null);
            if (step.kind === 'learn' && step.hints) {
                // Hinweise einschalten, falls das Kapitel sie nicht automatisch zeigt.
                const off = await page.$eval('.sk-btn-hint', b => !b.classList.contains('sk-on')).catch(() => false);
                if (off) await page.click('.sk-btn-hint');
                const ring = await page.waitForSelector('.sk-ring', {timeout: 5000}).then(() => true, () => false);
                log(ring, `${where}: Hand zeigt (${await page.$eval('.sk-bubble', e => e.textContent).catch(() => '–')})`);
            }
            if (play[si]) await play[si]({ex, call, bodies});
            // Selbst-Abhaken
            const items = await page.$$('.sk-task');
            for (const [i, li] of items.entries()) if (step.manual[i]) await li.click();
            if ((step.manual || []).length) {
                const ok = await allDone();
                const auto = step.manual.filter(m => !m).length;
                log(ok, `${where}: ${auto ? 'automatisch abgehakt' : 'selbst abgehakt'}`);
                if (!ok) {
                    console.log('  Kurs sieht:', await page.evaluate(() => {
                        const K = window.SolidcraftKurs;
                        const c = window.SolidcraftKursContext.make(K.run.snap, K.run.base);
                        return JSON.stringify({bodies: c.bodies().map(b => b.name), bodyCount: c.bodyCount(), base: K.run.base,
                            height: c.height(), volume: Math.round(c.volume()), cyl: c.faceCount('cylinder'),
                            tl: (K.run.snap.doc.timeline || []).map(t => t.type)});
                    }));
                }
            }
            if (step.kind === 'learn') await page.screenshot({path: path.join(outDir, `${ch.id}-${si + 1}.png`)});
            await page.click('.sk-next');
            await wait(300);
        }
        log(await page.$('.sk-trophy') !== null, `${ch.id}: Kapitel geschafft – Pokal`);
    }
} catch (e) {
    failures++;
    console.log('✖ Abbruch:', e.message);
} finally {
    await browser.close();
}
console.log(failures ? `${failures} Fehler` : 'Kapitel 2–6 ok');
process.exit(failures ? 1 : 0);
