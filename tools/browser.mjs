// Gemeinsamer Browser-Start für Werkzeuge und Tests (Edge/Chromium, weil Google Chrome ab 137
// entpackte Erweiterungen nicht mehr per Startparameter lädt).
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const executablePath = [process.env.CHROME,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/microsoft-edge', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']
    .filter(Boolean).find(p => fs.existsSync(p));

export function launch ({extension = false, lang = 'de-DE', width = 1400, height = 900} = {}) {
    const args = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', `--lang=${lang}`];
    if (extension) args.push(`--disable-extensions-except=${root}`, `--load-extension=${root}`);
    return puppeteer.launch({
        executablePath,
        headless: process.env.HEADFUL ? false : 'new',
        args,
        defaultViewport: {width, height}
    });
}
