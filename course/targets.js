/*
 * Hinweis-Ziele → Bildschirmpunkt (egui-Punkte relativ zum Canvas).
 *
 *   tool:<command id>   Button in der Toolbar oder Eintrag eines Aufklappers. Ist er nicht
 *                       sichtbar, zeigt der Hinweis zuerst auf das Panel (z. B. ERSTELLEN ▾)
 *                       oder auf den Tab, in dem das Werkzeug liegt („via“).
 *   tab:<NAME>          Tab der Multifunktionsleiste, z. B. tab:MODEL, tab:SKETCH
 *   handle:<name>       beliebiges Handle aus ui.handles, z. B. handle:appbar:save
 *   dialog:<Label>      Feld im offenen Dialog, z. B. dialog:Distance, dialog:OK
 *   plane:XY            Ebene im Modell (über ui.at)
 *   world:[x,y,z]       Punkt im Modell in mm (über ui.at)
 *   viewport            Mitte der 3D-Ansicht
 */
(function () {
    'use strict';

    // Beschriftungen, wie die deutsche Oberfläche sie zeigt (SolidCraft 0.30, geprüft per Screenshot).
    const TAB_DE = {MODEL: 'Modell', SKETCH: 'Skizze', SURFACE: 'Fläche', ASSEMBLE: 'Zusammenbau',
        INSERT: 'Einfügen', INSPECT: 'Prüfen', MANAGE: 'Verwalten', VIEW: 'Ansicht', 'SHEET METAL': 'Blech'};
    const PANEL_DE = {CREATE: 'Erstellen', MODIFY: 'Ändern', ARRANGE: 'Anordnen', CONSTRUCT: 'Konstruktion',
        CONFIGURE: 'Konfigurieren', CONSTRAIN: 'Abhängigkeiten', PATTERN: 'Muster', REFERENCE: 'Referenz',
        INSPECT: 'Prüfen'};

    const tabName = t => TAB_DE[t] || t;
    const panelName = p => PANEL_DE[p] || p;

    function point (snap, name) {
        const h = snap.handles.get(name);
        return h ? {kind: 'point', x: h.x, y: h.y, name} : null;
    }

    function resolveTool (cmd, snap, cmds) {
        for (const prefix of ['toolbar:', 'button:', 'dropdown:']) {
            const p = point(snap, prefix + cmd);
            if (p) return p;
        }
        const info = cmds && cmds.get(cmd);
        if (!info) return null;
        // Panel mit Aufklapper (z. B. ERSTELLEN ▾) im Tab des Werkzeugs.
        const panel = point(snap, `panel:${info.tab}:${info.panel}`);
        if (panel) return {kind: 'via', target: panel, text: `Klicke auf „${panelName(info.panel)} ▾“`};
        const tab = point(snap, `tab:${info.tab}`);
        if (tab) return {kind: 'via', target: tab, text: `Öffne oben den Tab „${tabName(info.tab)}“`};
        return null;
    }

    function resolve (target, snap, cmds) {
        if (!snap || typeof target !== 'string') return null;
        const i = target.indexOf(':');
        const kind = i < 0 ? target : target.slice(0, i);
        const arg = i < 0 ? '' : target.slice(i + 1);
        switch (kind) {
        case 'tool': return resolveTool(arg, snap, cmds);
        case 'tab': return point(snap, target);
        case 'handle': return point(snap, arg);
        case 'dialog': return point(snap, target);
        case 'plane': return {kind: 'need-at', spec: {plane: arg}};
        case 'world': {
            try {
                return {kind: 'need-at', spec: {world: JSON.parse(arg)}};
            } catch (e) {
                return null;
            }
        }
        case 'viewport': {
            const v = snap.ui && snap.ui.viewport;
            if (!v) return null;
            return {kind: 'point', x: v[0] + v[2] / 2, y: v[1] + v[3] / 2, name: 'viewport'};
        }
        default: return null;
        }
    }

    window.SolidcraftKursTargets = {resolve, tabName, panelName};
})();
