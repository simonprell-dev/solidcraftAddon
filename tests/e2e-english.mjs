// End-to-End-Test der Sprachen: Browser auf Englisch → SolidCraft und Kurs auf Englisch;
// Sprache im Kursmenü umstellen; Kurs folgt einer Sprachänderung in SolidCraft.
// Aufruf: npm run e2e:english   (HEADFUL=1 zum Zuschauen)
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

const browser = await puppeteer.launch({
    executablePath,
    headless: process.env.HEADFUL ? false : 'new',
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`,
        '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--lang=en-US'],
    defaultViewport: {width: 1400, height: 900}
});

try {
    const page = await browser.newPage();
    page.on('dialog', d => d.accept());
    page.on('pageerror', e => console.log('Page error:', e.message));
    await page.goto('https://app.solidcraft.io/', {waitUntil: 'load', timeout: 90000});
    await page.waitForFunction(() => window.solidcraft && window.SolidcraftKurs, {timeout: 120000});
    await wait(2500);
    const call = (m, p) => page.evaluate((m, p) => window.solidcraft.request(m, p), m, p);
    const ex = (c, p) => page.evaluate((c, p) => window.solidcraft.execute(c, p), c, p);
    const title = () => page.$eval('.sk-panel .sk-title', e => e.textContent).catch(() => null);
    const waitTitle = (t, ms = 8000) => page.waitForFunction(t => document.querySelector('.sk-panel .sk-title')?.textContent === t,
        {timeout: ms}, t).then(() => true, () => false);
    await call('ui.home', {open: false});

    // Start-Knopf und Stufenwahl auf Englisch
    const launcher = await page.waitForFunction(() => document.querySelector('.sk-launcher')?.textContent.includes('Start 3D course'),
        {timeout: 15000}).then(() => true, () => false);
    log(launcher, 'Launcher in English (“Start 3D course”)');
    for (let i = 0; i < 3 && !(await page.$('.sk-level-neuling')); i++) {
        await page.click('.sk-launcher');
        await page.waitForSelector('.sk-level-neuling', {visible: true, timeout: 5000}).catch(() => null);
    }
    log(await page.$eval('.sk-level-neuling .sk-level-title', e => e.textContent) === 'Beginner', 'Level dialog in English');
    await page.click('.sk-level-neuling');
    log(await waitTitle('What are we building?'), 'Step 1 in English');
    await page.click('.sk-next');

    // Schritt 2 → 3, Hand mit englischem Text auf „New Sketch“
    await waitTitle('Look around');
    await call('ui.view', {view: 'front'});
    await page.waitForFunction(() => [...document.querySelectorAll('.sk-task')].every(li => li.classList.contains('sk-task-done')), {timeout: 6000}).catch(() => null);
    await page.click('.sk-next');
    log(await waitTitle('Start a sketch'), 'Step 3 in English');
    const bubble = await page.waitForFunction(() => document.querySelector('.sk-bubble')?.textContent === 'Click “New Sketch”',
        {timeout: 5000}).then(() => true, () => false);
    log(bubble, 'Hand bubble in English (“Click “New Sketch””)');
    const h = (await call('ui.handles', {prefix: 'toolbar:sketch.create'}))[0];
    const ring = await page.$eval('.sk-ring', e => { const b = e.getBoundingClientRect(); return [b.left + 22, b.top + 22]; }).catch(() => null);
    log(!!ring && Math.abs(ring[0] - h.x) < 6 && Math.abs(ring[1] - h.y) < 6, 'Hand points at the “New Sketch” button');
    await page.screenshot({path: path.join(outDir, 'english-step3.png')});
    await ex('sketch.create', {plane: 'XY'});
    log(await page.waitForFunction(() => [...document.querySelectorAll('.sk-task')].every(li => li.classList.contains('sk-task-done')),
        {timeout: 6000}).then(() => true, () => false), 'Tasks tick off in English too');

    // Sprache im Menü auf Deutsch, dann zurück auf automatisch
    await page.click('.sk-header-actions .sk-btn-menu'); // ☰
    await page.waitForSelector('.sk-lang-de');
    log(await page.$eval('.sk-menu-lang .sk-menu-chapter-title', e => e.textContent).then(t => t.includes('Language')), 'Menu shows “Language”');
    await page.click('.sk-lang-de');
    await page.click('.sk-header-actions .sk-btn-menu'); // ☰ zurück zum Schritt
    log(await waitTitle('Eine Skizze starten'), 'Switched to German via the menu');
    await page.click('.sk-header-actions .sk-btn-menu');
    await page.waitForSelector('.sk-lang-auto');
    await page.click('.sk-lang-auto');
    await page.click('.sk-header-actions .sk-btn-menu');
    log(await waitTitle('Start a sketch'), 'Back to automatic → English');

    // SolidCraft selbst auf Deutsch umstellen → Kurs folgt
    const before = (await call('ui.prefs', {})).language;
    await call('ui.prefs', {language: 'de'});
    log(await waitTitle('Eine Skizze starten', 12000), 'Course follows SolidCraft’s language setting (de)');
    await call('ui.prefs', {language: before || 'system'});
    log(await waitTitle('Start a sketch', 12000), 'Course follows it back (system → English)');
} catch (e) {
    failures++;
    console.log('✖ Abort:', e.message);
} finally {
    await browser.close();
}
console.log(failures ? `${failures} failures` : 'English ok');
process.exit(failures ? 1 : 0);
