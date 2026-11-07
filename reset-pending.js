/*
 * Läuft auf app.solidcraft.io vor allen anderen Skripten (isolierte Welt, gleicher
 * localStorage wie die Seite). Wurde der Lernfortschritt über das Symbol zurückgesetzt,
 * während kein SolidCraft-Tab offen war, wird das hier nachgeholt.
 */
'use strict';

chrome.storage.local.get('resetPending').then(({resetPending}) => {
    if (!resetPending) return;
    try {
        localStorage.removeItem('solidcraft-kurs:v1');
    } catch (e) { /* egal */ }
    chrome.storage.local.remove('resetPending');
});
