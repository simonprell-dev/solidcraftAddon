// Robustheits-Tests im echten Browser: Szenarien, in denen Kinder hängen bleiben könnten.
// Aufruf: npm run e2e:robust   (CHROME=<Pfad>, HEADFUL=1 zum Zuschauen)
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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

const browser = await puppeteer.launch({
    executablePath,
    headless: process.env.HEADFUL ? false : 'new',
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`,
        '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--lang=de-DE'],
    defaultViewport: {width: 1400, height: 900}
});

try {
    const page = await browser.newPage();
    page.on('dialog', d => d.accept()); // „Seite verlassen?“ bei ungespeichertem Design
    page.on('pageerror', e => console.log('Seitenfehler:', e.message));
    page.on('console', m => m.type() === 'error' && /course|kurs|solidcraft-access/i.test(m.location()?.url || '') && console.log('Konsole:', m.text()));
    const open = async () => {
        await page.waitForFunction(() => window.solidcraft && window.SolidcraftKurs, {timeout: 120000});
        await wait(2500);
        await page.evaluate(() => window.solidcraft.request('ui.home', {open: false}));
    };
    await page.goto('https://app.solidcraft.io/', {waitUntil: 'load', timeout: 90000});
    await open();

    const call = (m, p) => page.evaluate((m, p) => window.solidcraft.request(m, p), m, p);
    const ex = (c, p) => page.evaluate((c, p) => window.solidcraft.execute(c, p), c, p);
    const title = () => page.$eval('.sk-panel .sk-title', e => e.textContent).catch(() => null);
    const allDone = (ms = 6000) => page.waitForFunction(() => {
        const t = [...document.querySelectorAll('.sk-task')];
        return t.length && t.every(li => li.classList.contains('sk-task-done'));
    }, {timeout: ms}).then(() => true, () => false);
    const ring = () => page.$eval('.sk-ring', e => {
        const b = e.getBoundingClientRect();
        return {x: b.left + 22, y: b.top + 22};
    }).catch(() => null);
    const clickNext = async () => {
        const t = await title();
        await page.click('.sk-next');
        await page.waitForFunction(t => document.querySelector('.sk-panel .sk-title')?.textContent !== t, {timeout: 5000}, t);
    };

    // 0) Start-Knopf reagiert auch, wenn der Browser kein „click“ meldet (nur Drücken + Loslassen).
    await page.evaluate(() => {
        const l = document.querySelector('.sk-launcher');
        const r = l.getBoundingClientRect();
        const opt = {bubbles: true, clientX: r.left + 10, clientY: r.top + 10, pointerId: 1, isPrimary: true};
        l.dispatchEvent(new PointerEvent('pointerdown', opt));
        l.dispatchEvent(new PointerEvent('pointerup', opt));
    });
    log(await page.waitForSelector('.sk-level-neuling', {visible: true, timeout: 2000}).then(() => true, () => false),
        'Start-Knopf öffnet die Stufenwahl auch ohne click-Ereignis');
    // Start-Knopf: zur Sicherheit bis zu dreimal klicken (Ursache früherer Fehlschläge war fehlendes CSS, behoben in 0.4.0).
    for (let i = 0; i < 3 && !(await page.$('.sk-level-neuling')); i++) {
        await page.click('.sk-launcher');
        await page.waitForSelector('.sk-level-neuling', {visible: true, timeout: 5000}).catch(() => null);
    }
    await page.waitForSelector('.sk-level-neuling', {visible: true, timeout: 1000});
    await page.click('.sk-level-neuling');
    await page.waitForSelector('.sk-next');
    await clickNext();

    // 1) „Schau dich um“: Wer genau dorthin klickt, wo die Hand zeigt, schafft die Aufgabe.
    await page.waitForSelector('.sk-ring', {timeout: 4000}).catch(() => null);
    const r = await ring();
    if (r) await call('ui.click', {x: r.x, y: r.y});
    log(!!r && await allDone(), 'Schau dich um: Klick auf die Stelle der Hand hakt ab');

    // 2) Zurück und wieder vor: erledigter Schritt bleibt abgehakt.
    await clickNext();
    await page.click('.sk-btn-secondary'); // ←
    await page.waitForFunction(() => document.querySelector('.sk-panel .sk-title')?.textContent === 'Schau dich um', {timeout: 5000});
    log(await allDone(2000), 'Zurück zu erledigtem Schritt: Aufgaben bleiben abgehakt');
    await clickNext();

    // 3) Kursfenster liegt über dem Ziel → es weicht aus, die Hand bleibt sichtbar.
    const btn = (await call('ui.handles', {prefix: 'toolbar:sketch.create'}))[0];
    await page.evaluate(b => {
        window.SolidcraftKurs.state.pos = {x: b.x - 40, y: b.y - 20};
        window.dispatchEvent(new Event('resize'));
    }, btn);
    await wait(1200);
    const covered = await page.evaluate(b => {
        const p = document.querySelector('.sk-panel').getBoundingClientRect();
        return b.x >= p.left && b.x <= p.right && b.y >= p.top && b.y <= p.bottom;
    }, btn);
    log(!covered, 'Kursfenster über dem Ziel weicht aus');

    // 4) Eingeklappt + Neuladen: das Fenster wird nicht ständig neu aufgebaut.
    await page.click('.sk-header-actions .sk-btn-collapse'); // ▾
    await page.waitForSelector('.sk-mini');
    await page.reload({waitUntil: 'domcontentloaded', timeout: 90000});
    await open();
    await page.waitForSelector('.sk-mini', {timeout: 10000});
    await page.evaluate(() => { document.querySelector('.sk-mini').dataset.marker = '1'; });
    await wait(1500);
    const stable = await page.evaluate(() => document.querySelector('.sk-mini')?.dataset.marker === '1');
    log(stable, 'Eingeklapptes Fenster bleibt nach dem Neuladen stabil');
    await page.click('.sk-mini');
    await page.waitForSelector('.sk-next');

    // 5) Neuladen mitten im Schritt: Startzustand bleibt erhalten.
    // Schritte 3–5 per Befehl, dann in Schritt 6 Skizze anlegen, neu laden, Text schreiben.
    await ex('sketch.create', {plane: 'XY'});
    await allDone();
    await clickNext();
    await ex('sketch.rectangle.rounded', {p0: [-40, -15], p1: [40, 15], radius: 4});
    await allDone();
    await clickNext();
    await ex('sketch.finish', {});
    await ex('solid.extrude', {distance: 3});
    await allDone();
    await clickNext();
    log((await title()) === 'Deinen Namen schreiben', 'bei „Deinen Namen schreiben“ angekommen');
    await wait(800); // Startzustand des Schritts aufnehmen lassen
    await ex('sketch.create', {plane: {face: [0, 0, 3]}});
    await wait(800);
    await page.reload({waitUntil: 'domcontentloaded', timeout: 90000});
    await open();
    const docNow = await call('document.inspect', {});
    if (docNow.sketches.length < 2) {
        console.log('– SolidCraft stellt das Design nach F5 nicht wieder her: Szenario „Neuladen mitten im Schritt“ entfällt');
    } else {
        await page.waitForSelector('.sk-next', {timeout: 10000});
        if (docNow.active_sketch == null) {
            await call('ui.editFeature', {feature: docNow.sketches[docNow.sketches.length - 1].name}).catch(() => null);
            await wait(500);
        }
        await ex('sketch.text', {text: 'JO', at: [-30, -6], height: 12});
        log(await allDone(8000), 'Neuladen mitten im Schritt: Schritt bleibt lösbar');
    }

    // 6) Zwei SolidCraft-Tabs: Fortschritt im einen erscheint im anderen.
    const page2 = await browser.newPage();
    page2.on('dialog', d => d.accept());
    await page2.goto('https://app.solidcraft.io/', {waitUntil: 'domcontentloaded', timeout: 90000});
    await page2.waitForFunction(() => window.SolidcraftKurs, {timeout: 120000});
    await page2.waitForSelector('.sk-panel .sk-title', {timeout: 20000});
    await page.bringToFront();
    await page.evaluate(() => window.SolidcraftKurs.openChapter(0, 7));
    const synced = await page2.waitForFunction(
        () => document.querySelector('.sk-panel .sk-title')?.textContent === 'Bewundere dein Schild',
        {timeout: 5000}).then(() => true, () => false);
    log(synced, 'Zweiter Tab übernimmt den Fortschritt');
    if (!synced) console.log('  Tab 2:', await page2.evaluate(() => JSON.stringify({title: document.querySelector('.sk-panel .sk-title')?.textContent, panel: !!document.querySelector('.sk-panel'), display: document.querySelector('.sk-panel')?.style.display, state: window.SolidcraftKurs && {open: window.SolidcraftKurs.state.open, ch: window.SolidcraftKurs.state.chapterId, step: window.SolidcraftKurs.state.step, view: window.SolidcraftKurs.run.view}, stored: JSON.parse(localStorage.getItem('solidcraft-kurs:v1') || '{}').step})));
    await page2.close();

    // 7) Pokal-Ansicht übersteht Ein- und Ausklappen.
    await page.evaluate(() => window.SolidcraftKurs.openChapter(0, 9));
    await page.waitForSelector('.sk-next');
    await page.click('.sk-next');
    await page.waitForSelector('.sk-trophy');
    await page.click('.sk-header-actions .sk-btn-collapse'); // ▾
    await page.waitForSelector('.sk-mini');
    await page.click('.sk-header-actions .sk-btn-collapse'); // ▴
    log(await page.waitForSelector('.sk-trophy', {timeout: 2000}).then(() => true, () => false),
        'Pokal bleibt nach Ein-/Ausklappen');

    // 8) Übergang „Projekt sichern“ übersteht Neuladen.
    const hasNext = await page.$$eval('.sk-footer .sk-btn-primary', b => b.length > 0);
    if (hasNext) {
        await page.click('.sk-footer .sk-btn-primary');
        await page.waitForFunction(() => document.querySelector('.sk-panel .sk-title')?.textContent === 'Bevor es weitergeht');
        await page.reload({waitUntil: 'domcontentloaded', timeout: 90000});
        await open();
        log(await page.waitForFunction(() => document.querySelector('.sk-panel .sk-title')?.textContent === 'Bevor es weitergeht',
            {timeout: 8000}).then(() => true, () => false), 'Übergang „Projekt sichern“ übersteht Neuladen');
    } else {
        log(false, 'Übergang „Projekt sichern“: kein nächstes Kapitel vorhanden');
    }

    // 9) Nach ✕ verschwindet die Hand sofort und kommt nicht wieder.
    await page.evaluate(() => window.SolidcraftKurs.openChapter(0, 2));
    await page.waitForSelector('.sk-ring', {timeout: 4000}).catch(() => null);
    await page.click('.sk-header-actions .sk-btn-close'); // ✕
    let ringSeen = false;
    for (let i = 0; i < 10; i++) {
        await wait(60);
        if (await page.$('.sk-ring')) ringSeen = true;
    }
    log(!ringSeen, 'Nach ✕ keine Hand mehr');

    // 10) Mitten in einem Schritt zurück und wieder vor: Gezeichnetes zählt weiter, die Hand
    //     springt nicht zurück auf „Neue Skizze“. Dazu ein neues Design (der Kurs sagt das so).
    await page.evaluate(() => {
        window.SolidcraftKurs.state.open = true;
        window.SolidcraftKurs.openChapter(1, 1);   // Schlüsselanhänger: Die Grundplatte
    });
    await call('ui.documents', {action: 'new'}).catch(() => null);
    await wait(1500);
    await ex('sketch.create', {plane: 'XY'});
    await ex('sketch.rectangle.two_point', {p0: [-25, -12], p1: [25, 12]});
    const drawnBefore = await page.waitForFunction(() => document.querySelector('.sk-task')?.classList.contains('sk-task-done'),
        {timeout: 6000}).then(() => true, () => false);
    await page.click('.sk-footer .sk-btn-secondary'); // ←
    await wait(600);
    await clickNext();
    await wait(1200);
    const stillDone = await page.$eval('.sk-task', li => li.classList.contains('sk-task-done')).catch(() => false);
    const hintNow = await page.$eval('.sk-bubble', e => e.textContent).catch(() => null);
    log(drawnBefore && stillDone && hintNow !== 'Klicke auf „Neue Skizze“',
        `Zurück und vor mitten im Schritt: Rechteck zählt weiter (Hinweis: „${hintNow}“)`);
} catch (e) {
    failures++;
    console.log('✖ Abbruch:', e.message);
} finally {
    await browser.close();
}
console.log(failures ? `${failures} Fehler` : 'Robustheit ok');
process.exit(failures ? 1 : 0);
