/*
 * Hintergrund der Erweiterung: Symbol in der Browserleiste.
 *
 *   Klick         öffnet SolidCraft (oder holt einen offenen SolidCraft-Tab nach vorn).
 *   Rechtsklick   Erweiterung an/aus, Lernfortschritt zurücksetzen, Hilfe.
 *
 * Die Kursskripte werden hier registriert statt im Manifest, damit sie sich abschalten
 * lassen. Sie laufen in der Seite (MAIN world), weil nur dort window.solidcraft erreichbar
 * ist. Der Kursfortschritt liegt deshalb im localStorage von app.solidcraft.io.
 */
'use strict';

const EDITOR_URL = 'https://app.solidcraft.io/';
const HELP_URL = 'https://github.com/simonprell-dev/solidcraftAddon#benutzung';
const APP_TABS = 'https://app.solidcraft.io/*';
const STATE_KEY = 'solidcraft-kurs:v1';

const PAGE_SCRIPTS = {
    id: 'solidcraft-kurs',
    matches: [APP_TABS],
    js: [
        'lib/solidcraft-access.js',
        'course/context.js',
        'course/targets.js',
        'course/course-data.js',
        'course/course.js'
    ],
    css: ['course/course.css'],
    runAt: 'document_idle',
    world: 'MAIN'
};

// Läuft immer, auch bei abgeschalteter Erweiterung: holt ein Zurücksetzen nach, das
// angefordert wurde, während kein SolidCraft-Tab offen war.
const RESET_SCRIPT = {
    id: 'reset-pending',
    matches: [APP_TABS],
    js: ['reset-pending.js'],
    runAt: 'document_start'
};

// ---------- Ein/Aus ----------

async function isEnabled () {
    const {enabled = true} = await chrome.storage.local.get('enabled');
    return enabled;
}

async function applyEnabled (enabled) {
    const registered = (await chrome.scripting.getRegisteredContentScripts()).map(s => s.id);
    if (registered.length) await chrome.scripting.unregisterContentScripts({ids: registered});
    await chrome.scripting.registerContentScripts(enabled ? [PAGE_SCRIPTS, RESET_SCRIPT] : [RESET_SCRIPT]);

    await chrome.action.setBadgeText({text: enabled ? '' : 'AUS'});
    await chrome.action.setBadgeBackgroundColor({color: '#7D8299'});
    await chrome.action.setTitle({title: enabled ?
        'Einführungskurs für SolidCraft\nKlick: SolidCraft öffnen · Rechtsklick: Einstellungen' :
        'Einführungskurs für SolidCraft (ausgeschaltet)\nRechtsklick zum Einschalten'});
}

// ---------- Kontextmenü ----------

function createMenu (enabled) {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({id: 'enabled', type: 'checkbox', checked: enabled,
            title: 'Erweiterung eingeschaltet', contexts: ['action']});
        chrome.contextMenus.create({id: 'reset', title: 'Lernfortschritt zurücksetzen …', contexts: ['action']});
        chrome.contextMenus.create({id: 'help', title: 'Hilfe und Anleitung', contexts: ['action']});
    });
}

async function setup () {
    const enabled = await isEnabled();
    createMenu(enabled);
    await applyEnabled(enabled);
}

chrome.runtime.onInstalled.addListener(setup);
chrome.runtime.onStartup.addListener(setup);

chrome.contextMenus.onClicked.addListener(async info => {
    if (info.menuItemId === 'enabled') {
        await chrome.storage.local.set({enabled: info.checked});
        await applyEnabled(info.checked);
        notifyTabs(info.checked ?
            'Die Erweiterung ist eingeschaltet. Lade die Seite neu (F5), damit sie wirkt.' :
            'Die Erweiterung ist ausgeschaltet. Lade die Seite neu (F5), damit sie verschwindet.');
    } else if (info.menuItemId === 'reset') {
        await resetProgress();
    } else if (info.menuItemId === 'help') {
        chrome.tabs.create({url: HELP_URL});
    }
});

// ---------- Klick aufs Symbol ----------

chrome.action.onClicked.addListener(async () => {
    const [tab] = await chrome.tabs.query({url: APP_TABS});
    if (tab) {
        await chrome.tabs.update(tab.id, {active: true});
        await chrome.windows.update(tab.windowId, {focused: true});
    } else {
        await chrome.tabs.create({url: EDITOR_URL});
    }
});

// ---------- Lernfortschritt zurücksetzen ----------

async function resetProgress () {
    const tabs = await chrome.tabs.query({url: APP_TABS});
    if (!tabs.length) {
        // Kein SolidCraft offen: beim nächsten Besuch erledigt reset-pending.js das.
        await chrome.storage.local.set({resetPending: true});
        return;
    }
    // Im ersten Tab nachfragen, damit nicht aus Versehen alles weg ist (Tab dafür nach vorn holen).
    await chrome.tabs.update(tabs[0].id, {active: true}).catch(() => null);
    const [answer] = await chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        world: 'MAIN',
        func: () => window.confirm('Lernfortschritt im Einführungskurs wirklich zurücksetzen?\n\n' +
            'Alle abgehakten Schritte und die gewählte Stufe gehen verloren. Deine Konstruktionen bleiben erhalten.')
    }).catch(() => [null]);
    if (answer === null) {
        // Rückfrage ging nicht (z. B. Tab schläft): nicht still zurücksetzen, sondern beim nächsten
        // Laden von SolidCraft erledigen – und das ehrlich sagen.
        await chrome.storage.local.set({resetPending: true});
        notifyTabs('Der Lernfortschritt wird zurückgesetzt, sobald du SolidCraft neu lädst (F5).');
        return;
    }
    if (!answer.result) return;

    const results = await Promise.all(tabs.map(tab => chrome.scripting.executeScript({
        target: {tabId: tab.id},
        world: 'MAIN',
        args: [STATE_KEY],
        func: key => {
            try {
                localStorage.removeItem(key);
            } catch (e) { /* egal */ }
            // Ein laufender Kurs (course.js) hält den Stand im Speicher und setzt sich selbst zurück.
            window.dispatchEvent(new CustomEvent('solidcraft-kurs-reset'));
        }
    }).then(() => true, () => false)));
    // Ein Tab ließ sich nicht erreichen → dort beim nächsten Laden nachholen.
    if (results.includes(false)) await chrome.storage.local.set({resetPending: true});
    notifyTabs('Der Lernfortschritt wurde zurückgesetzt.');
}

// ---------- Kurze Meldung in offenen SolidCraft-Tabs ----------

async function notifyTabs (text) {
    const tabs = await chrome.tabs.query({url: APP_TABS});
    tabs.forEach(tab => chrome.scripting.executeScript({
        target: {tabId: tab.id},
        args: [text],
        func: message => {
            const old = document.getElementById('sk-toast');
            if (old) old.remove();
            const toast = document.createElement('div');
            toast.id = 'sk-toast';
            toast.textContent = message;
            Object.assign(toast.style, {
                position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)',
                zIndex: 10002, maxWidth: '90vw', padding: '12px 18px', borderRadius: '10px',
                background: '#E8762C', color: '#fff', font: 'bold 14px system-ui, sans-serif',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)'
            });
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 6000);
        }
    }).catch(() => null));
}
