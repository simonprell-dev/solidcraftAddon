import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tick = () => new Promise(r => setTimeout(r, 0));

// Nachgebautes chrome-Objekt: registrierte Skripte, offene Tabs, Listener.
function fakeChrome ({registered = [], tabs = [], hasCourse = () => false} = {}) {
    const listeners = {};
    const on = name => ({addListener: fn => { listeners[name] = fn; }});
    const log = [];
    let scripts = registered.map(s => ({...s}));
    const slow = () => new Promise(r => setTimeout(r, 5)); // asynchron wie im Browser
    const chrome = {
        log, listeners, scripts: () => scripts,
        runtime: {onInstalled: on('installed'), onStartup: on('startup')},
        i18n: {getMessage: k => k},
        storage: {local: {get: async () => ({}), set: async () => {}, remove: async () => {}}},
        action: {onClicked: on('action'), setBadgeText: async () => {}, setBadgeBackgroundColor: async () => {}, setTitle: async () => {}},
        contextMenus: {removeAll: cb => cb && cb(), create: () => {}, onClicked: on('menu')},
        tabs: {query: async () => tabs, create: async () => {}, update: async () => {}},
        windows: {update: async () => {}},
        scripting: {
            async getRegisteredContentScripts () { await slow(); return scripts.map(s => ({...s})); },
            async unregisterContentScripts ({ids}) { await slow(); log.push(['unregister', ids]); scripts = scripts.filter(s => !ids.includes(s.id)); },
            async registerContentScripts (list) {
                await slow();
                for (const s of list) if (scripts.some(x => x.id === s.id)) throw new Error(`Duplicate script ID '${s.id}'`);
                log.push(['register', list.map(s => s.id)]);
                scripts.push(...list.map(s => ({...s})));
            },
            async executeScript ({target, files, func}) {
                await slow();
                if (files) { log.push(['inject', target.tabId, files.length]); return [{result: undefined}]; }
                return [{result: func && func.toString().includes('SolidcraftKurs') ? hasCourse(target.tabId) : undefined}];
            }
        }
    };
    return chrome;
}

function loadBackground (chrome) {
    const code = fs.readFileSync(path.join(root, 'background.js'), 'utf8');
    new Function('chrome', code)(chrome);
}

const settle = async () => { for (let i = 0; i < 40; i++) await new Promise(r => setTimeout(r, 5)); };

test('Installation und Start gleichzeitig: am Ende sind beide Skripte registriert, kein Fehler', async () => {
    const chrome = fakeChrome();
    loadBackground(chrome);
    chrome.listeners.installed({reason: 'install'});
    chrome.listeners.startup();
    await settle();
    assert.deepEqual(chrome.scripts().map(s => s.id).sort(), ['reset-pending', 'solidcraft-kurs']);
});

test('Browserstart mit schon registrierten Skripten: nichts wird abgemeldet (keine Lücke)', async () => {
    const first = fakeChrome();
    loadBackground(first);
    first.listeners.installed({reason: 'install'});
    await settle();
    const chrome = fakeChrome({registered: first.scripts()});
    loadBackground(chrome);
    chrome.listeners.startup();
    await settle();
    assert.equal(chrome.log.filter(([op]) => op === 'unregister').length, 0);
    assert.equal(chrome.scripts().length, 2);
});

test('Geänderte Skriptliste (Update) wird ersetzt', async () => {
    const chrome = fakeChrome({registered: [{id: 'solidcraft-kurs', js: ['alt.js'], matches: ['https://app.solidcraft.io/*'], runAt: 'document_idle', world: 'MAIN'}]});
    loadBackground(chrome);
    chrome.listeners.installed({reason: 'update'});
    await settle();
    const kurs = chrome.scripts().find(s => s.id === 'solidcraft-kurs');
    assert.ok(kurs.js.includes('course/course.js'));
});

test('Installation: offene SolidCraft-Tabs ohne Kurs bekommen den Kurs sofort', async () => {
    const chrome = fakeChrome({tabs: [{id: 7, url: 'https://app.solidcraft.io/'}, {id: 8, url: 'https://app.solidcraft.io/'}],
        hasCourse: id => id === 8});
    loadBackground(chrome);
    chrome.listeners.installed({reason: 'install'});
    await settle();
    const injected = chrome.log.filter(([op]) => op === 'inject').map(([, id]) => id);
    assert.deepEqual(injected, [7]);
});
