// End-to-End-Test: lädt die Erweiterung in Chrome, öffnet die echte SolidCraft-Web-App und
// spielt Kapitel 1 „Namensschild“ durch. Die Konstruktion übernimmt der Test über
// window.solidcraft (ui.click, ui.start, execute) – geprüft wird, dass der Kurs jede Aufgabe
// abhakt und die Hand an den richtigen Stellen zeigt.
// Aufruf: npm run e2e   (CHROME=<Pfad> für einen anderen Browser, HEADFUL=1 zum Zuschauen)
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'tests/out');
fs.mkdirSync(outDir, {recursive: true});

// Google Chrome (ab Version 137) ignoriert --load-extension; Edge und Chromium laden sie noch.
const CANDIDATES = [process.env.CHROME,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/chromium', '/usr/bin/google-chrome'].filter(Boolean);
const executablePath = CANDIDATES.find(p => fs.existsSync(p));

const wait = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
const log = (ok, msg) => {
    if (!ok) failures++;
    console.log(`${ok ? '✔' : '✖'} ${msg}`);
};

const browser = await puppeteer.launch({
    executablePath,
    headless: process.env.HEADFUL ? false : 'new',
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`,
        '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--lang=de-DE', '--window-size=1400,900'],
    defaultViewport: {width: 1400, height: 900}
});

try {
    const page = await browser.newPage();
    page.on('pageerror', e => console.log('Seitenfehler:', e.message));
    await page.goto('https://app.solidcraft.io/', {waitUntil: 'load', timeout: 90000});
    await page.waitForFunction(() => window.solidcraft, {timeout: 120000});
    await wait(2500);

    const call = (m, p) => page.evaluate((m, p) => window.solidcraft.request(m, p), m, p);
    const ex = (c, p) => page.evaluate((c, p) => window.solidcraft.execute(c, p), c, p);
    const handle = async name => (await call('ui.handles', {prefix: name})).find(h => h.name === name);
    await call('ui.home', {open: false});

    // Der Kurs muss geladen sein: Start-Knopf unten.
    const loaded = await page.waitForSelector('.sk-launcher', {visible: true, timeout: 20000}).then(() => true, () => false);
    log(loaded, 'Erweiterung geladen, Start-Knopf sichtbar');
    if (!loaded) throw new Error('Kurs nicht geladen – lädt dieser Browser entpackte Erweiterungen?');

    // Start-Knopf: bei Bedarf erneut klicken (ein seltener verlorener Klick ließ sich nicht nachstellen).
    for (let i = 0; i < 3 && !(await page.$('.sk-level-neuling')); i++) {
        await page.click('.sk-launcher');
        await page.waitForSelector('.sk-level-neuling', {visible: true, timeout: 5000}).catch(() => null);
    }
    await page.waitForSelector('.sk-level-neuling', {visible: true, timeout: 1000});
    log(true, 'Stufenwahl öffnet sich');
    await page.click('.sk-level-neuling');
    await page.waitForSelector('.sk-panel .sk-title');

    const title = () => page.$eval('.sk-panel .sk-title', e => e.textContent);
    const next = async () => {
        const before = await title();
        await page.click('.sk-next');
        await page.waitForFunction(t => document.querySelector('.sk-panel .sk-title')?.textContent !== t, {timeout: 5000}, before);
    };
    const taskDone = async (i, ms = 8000) => page.waitForFunction(i => {
        const li = document.querySelectorAll('.sk-task')[i];
        return li && li.classList.contains('sk-task-done');
    }, {timeout: ms}, i).then(() => true, () => false);
    const allDone = async (ms = 8000) => page.waitForFunction(() => {
        const t = [...document.querySelectorAll('.sk-task')];
        return t.length && t.every(li => li.classList.contains('sk-task-done'));
    }, {timeout: ms}).then(() => true, () => false);
    // Hand zeigt mit der Ring-Mitte höchstens tol Pixel neben den Punkt.
    const ringAt = async (x, y, tol = 6, ms = 4000) => page.waitForFunction((x, y, tol) => {
        const r = document.querySelector('.sk-ring');
        if (!r) return false;
        const b = r.getBoundingClientRect();
        return Math.abs(b.left + 22 - x) <= tol && Math.abs(b.top + 22 - y) <= tol;
    }, {timeout: ms}, x, y, tol).then(() => true, () => false);
    const bubble = () => page.$eval('.sk-bubble', e => e.textContent).catch(() => null);
    const shot = name => page.screenshot({path: path.join(outDir, `${name}.png`)});

    // 1 Info
    log((await title()) === 'Was bauen wir?', 'Schritt 1: Info');
    await next();

    // 2 Umschauen
    log(await page.$('.sk-hand') !== null || await page.waitForSelector('.sk-hand', {timeout: 3000}).then(() => true, () => false),
        'Schritt 2: Hand sichtbar');
    await call('ui.view', {view: 'front'});
    log(await allDone(), 'Schritt 2: Kamera bewegt → abgehakt');
    await next();

    // 3 Skizze starten
    let h = await handle('toolbar:sketch.create');
    log(await ringAt(h.x, h.y), 'Schritt 3: Hand zeigt auf „Neue Skizze“');
    await shot('schritt3-hand');
    await call('ui.click', {x: h.x, y: h.y});
    log(await taskDone(0), 'Schritt 3: Dialog „Neue Skizze“ erkannt');
    const xy = await call('ui.at', {plane: 'XY'});
    log(await ringAt(xy[0], xy[1], 12), 'Schritt 3: Hand zeigt auf die XY-Ebene');
    await call('ui.click', {x: xy[0], y: xy[1]});
    log(await allDone(), 'Schritt 3: Skizze offen → abgehakt');
    await next();

    // 4 Rechteck
    h = await handle('toolbar:sketch.rectangle.two_point');
    log(!!h && await ringAt(h.x, h.y), 'Schritt 4: Hand zeigt auf „Rechteck“');
    await call('ui.start', {command: 'sketch.rectangle.two_point'});
    log(await taskDone(0), 'Schritt 4: Werkzeug erkannt');
    await call('ui.key', {key: 'Escape'});
    await ex('sketch.rectangle.rounded', {p0: [-40, -15], p1: [40, 15], radius: 4});
    log(await allDone(), 'Schritt 4: Rechteck erkannt');
    await next();

    // 5 Extrudieren
    h = await handle('toolbar:sketch.finish');
    log(!!h && await ringAt(h.x, h.y), 'Schritt 5: Hand zeigt auf „Skizze beenden“');
    await ex('sketch.finish', {});
    log(await taskDone(0), 'Schritt 5: Skizze beendet');
    h = await handle('toolbar:solid.extrude');
    log(!!h && await ringAt(h.x, h.y), 'Schritt 5: Hand zeigt auf „Extrudieren“');
    await call('ui.click', {x: h.x, y: h.y});
    await wait(600);
    const dist = await handle('dialog:Distance');
    const viewportHint = (await bubble()) === 'Klicke in dein Rechteck';
    log(viewportHint || (dist && await ringAt(dist.x, dist.y)), 'Schritt 5: Hand führt durch den Extrudieren-Dialog');
    await shot('schritt5-dialog');
    await call('ui.key', {key: 'Escape'});
    await ex('solid.extrude', {distance: 3});
    log(await allDone(), 'Schritt 5: Platte 3 mm erkannt');
    await next();

    // 6 Text
    h = await handle('toolbar:sketch.create');
    await call('ui.click', {x: h.x, y: h.y});
    await wait(500);
    // Oberseite aus dem echten Modell – in Schritt 2 wurde die Ansicht gedreht, die Platte kann
    // also auch auf der Frontebene stehen.
    const doc = await call('document.inspect', {measure: true});
    const topWorld = await page.evaluate(d => window.SolidcraftKursContext.make({ui: {}, handles: new Map(), doc: d}).top(), doc);
    const top = await call('ui.at', {world: topWorld});
    log(await ringAt(top[0], top[1], 12), 'Schritt 6: Hand zeigt auf die Oberseite');
    await call('ui.click', {x: top[0], y: top[1]});
    log(await taskDone(0), 'Schritt 6: Skizze auf der Oberseite erkannt');
    const textHints = ['Wähle „Text“', 'Klicke auf „Erstellen ▾“', 'Öffne oben den Tab „Skizze“'];
    await page.waitForFunction(t => t.includes(document.querySelector('.sk-bubble')?.textContent), {timeout: 3000}, textHints)
        .catch(() => null);
    log(textHints.includes(await bubble()), `Schritt 6: Hinweis zum Text-Werkzeug („${await bubble()}“)`);
    if (!textHints.includes(await bubble())) {
        console.log('  Diagnose:', await page.evaluate(async () => {
            const K = window.SolidcraftKurs;
            const c = window.SolidcraftKursContext.make(K.run.snap, K.run.base);
            const step = window.SolidcraftKursCourse.chapters[0].steps[K.state.step];
            const hints = step.hints.map(h => { try { return h.done(c); } catch (e) { return 'ERR ' + e.message; } });
            const cmds = await window.SolidcraftKursAccess.commands();
            return JSON.stringify({step: step.title, tool: c.tool(), dialog: c.dialog(), inSketch: c.inSketch(),
                newSketches: c.newSketches(), hintsDone: hints, hintsOn: K.run.hintsOn, view: K.run.view,
                resolveText: window.SolidcraftKursTargets.resolve('tool:sketch.text', K.run.snap, cmds),
                panelHandles: [...K.run.snap.handles.keys()].filter(n => /panel:SKETCH|dropdown|tab:SKETCH/.test(n))});
        }));
    }
    await shot('schritt6-text');
    await call('ui.start', {command: 'sketch.text'});
    log(await taskDone(1), 'Schritt 6: Text-Werkzeug erkannt');
    await call('ui.key', {key: 'Escape'});
    await ex('sketch.text', {text: 'ANNA', at: [-30, -6], height: 12});
    log(await allDone(), 'Schritt 6: Name erkannt');
    await next();

    // 7 Herausheben
    await ex('sketch.finish', {});
    log(await taskDone(0), 'Schritt 7: Skizze beendet');
    await ex('solid.extrude', {distance: 2, operation: 'join'});
    log(await allDone(10000), 'Schritt 7: Text 2 mm erhaben erkannt');
    await shot('schritt7-fertig');
    await next();

    // 8–10 Selbst abhaken
    for (const n of [8, 9, 10]) {
        for (const li of await page.$$('.sk-task')) await li.click();
        log(await allDone(), `Schritt ${n}: selbst abgehakt`);
        await page.click('.sk-next');
        await wait(300);
    }
    log(await page.$('.sk-trophy') !== null, 'Kapitel geschafft – Pokal');
    await shot('kapitel1');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('solidcraft-kurs:v1')));
    log(Object.keys(stored.done).length === 10, 'Fortschritt gespeichert (10 Schritte)');
} catch (e) {
    failures++;
    console.log('✖ Abbruch:', e.message);
} finally {
    await browser.close();
}
console.log(failures ? `${failures} Fehler` : 'Kapitel 1 ok');
process.exit(failures ? 1 : 0);
