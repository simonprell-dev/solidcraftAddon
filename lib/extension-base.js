/*
 * Läuft in der isolierten Welt auf app.solidcraft.io: Die Kursskripte in der Seite (MAIN world)
 * kennen chrome.runtime nicht. Damit sie die mitgelieferten Vorlese-Dateien (audio/…) abspielen
 * können, steht die Adresse der Erweiterung hier als data-sk-base am <html>-Element.
 */
'use strict';

document.documentElement.dataset.skBase = chrome.runtime.getURL('');
