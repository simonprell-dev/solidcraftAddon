// End-to-End-Test fürs Vorlesen: Erweiterung laden, Kurs öffnen, 🔊 klicken – die passende
// MP3-Datei aus der Erweiterung wird geladen und spielt; ⏹ beendet es. Danach Englisch.
// Aufruf: npm run e2e:audio
import {launch} from '../tools/browser.mjs';

const wait = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
const log = (ok, msg) => {
    if (!ok) failures++;
    console.log(`${ok ? '✔' : '✖'} ${msg}`);
};

const browser = await launch({extension: true, lang: 'de-DE'});
try {
    const page = await browser.newPage();
    await page.goto('https://app.solidcraft.io/', {waitUntil: 'load', timeout: 90000});
    await page.waitForFunction(() => window.solidcraft && window.SolidcraftKurs, {timeout: 120000});
    await wait(2000);
    log(await page.evaluate(() => !!document.documentElement.dataset.skBase), 'Adresse der Erweiterung ist in der Seite bekannt');
    for (let i = 0; i < 3 && !(await page.$('.sk-level-neuling')); i++) {
        await page.click('.sk-launcher');
        await page.waitForSelector('.sk-level-neuling', {visible: true, timeout: 5000}).catch(() => null);
    }
    await page.click('.sk-level-neuling');
    await page.waitForSelector('.sk-read');

    const played = async lang => {
        await page.click('.sk-read');
        const ok = await page.waitForFunction(l => {
            const c = window.SolidcraftKurs.reader.current();
            return c && c.mode === 'file' && c.src.includes(`/audio/${l}/namensschild-01.mp3`);
        }, {timeout: 8000}, lang).then(() => true, () => false);
        log(ok, `${lang}: MP3-Datei des Schritts geladen`);
        const playing = await page.waitForFunction(() => window.SolidcraftKurs.reader.playing(), {timeout: 5000}).then(() => true, () => false);
        log(playing, `${lang}: spielt`);
        log(await page.$eval('.sk-read', b => b.textContent.trim()) === '⏹', `${lang}: Knopf zeigt ⏹`);
        await page.click('.sk-read');
        await wait(300);
        log(!(await page.evaluate(() => window.SolidcraftKurs.reader.playing())), `${lang}: ⏹ beendet das Vorlesen`);
    };
    await played('de');

    // Englisch über das Kursmenü
    await page.click('.sk-header-actions .sk-btn-menu');   // ☰
    await page.waitForSelector('.sk-lang-en');
    await page.click('.sk-lang-en');
    await page.click('.sk-header-actions .sk-btn-menu');
    await wait(500);
    await played('en');

    // Automatisch vorlesen: im Menü einschalten, „Weiter“ liest den nächsten Schritt.
    await page.click('.sk-header-actions .sk-btn-menu');
    await page.waitForSelector('.sk-autoread');
    await page.click('.sk-autoread');
    await page.click('.sk-header-actions .sk-btn-menu');
    await wait(300);
    await page.click('.sk-next');
    const auto = await page.waitForFunction(() => {
        const c = window.SolidcraftKurs.reader.current();
        return c && c.mode === 'file' && c.src.includes('/audio/en/namensschild-02.mp3');
    }, {timeout: 8000}).then(() => true, () => false);
    log(auto, 'automatisch vorgelesen nach „Weiter“');
} catch (e) {
    failures++;
    console.log('✖ Abbruch:', e.message);
} finally {
    await browser.close();
}
console.log(failures ? `${failures} Fehler` : 'Vorlesen ok');
process.exit(failures ? 1 : 0);
