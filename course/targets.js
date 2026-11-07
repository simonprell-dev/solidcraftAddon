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
 *   axis:Z              Achse im Modell (über ui.at)
 *   world:[x,y,z]       Punkt im Modell in mm (über ui.at)
 *   viewport            Mitte der 3D-Ansicht
 *
 * Mit opts.search (Hinweisfeld „search“) zeigt tool: als letzten Ausweg auf die Befehlssuche.
 */
(function () {
    'use strict';

    // Texte und SolidCraft-Beschriftungen in der Kurssprache (course/i18n.js, i18n/<sprache>.js).
    const I = () => window.SolidcraftKursI18n;
    const tabName = t => I().label('tabs', t);
    const panelName = p => I().label('panels', p);
    const viaSearch = (target, name) => ({kind: 'via', target, text: I().t('via.search', {name})});

    function point (snap, name) {
        const h = snap.handles.get(name);
        return h ? {kind: 'point', x: h.x, y: h.y, name} : null;
    }

    function resolveTool (cmd, snap, cmds, opts) {
        for (const prefix of ['toolbar:', 'button:', 'dropdown:']) {
            const p = point(snap, prefix + cmd);
            if (p) return p;
        }
        // Werkzeuge, die nur über einen Aufklapper erreichbar sind: die Befehlssuche oben rechts
        // ist der sicherste Weg (Taste S).
        const search = opts && opts.search && point(snap, 'ribbon:search');
        const info = cmds && cmds.get(cmd);
        if (!info) return search ? viaSearch(search, opts.search) : null;
        // Mit Suchtext ist die Befehlssuche am sichersten (das Werkzeug kann in einem
        // Unter-Aufklapper stecken, z. B. Rechteck ▾).
        if (search) return viaSearch(search, opts.search);
        // Panel mit Aufklapper (z. B. Erstellen ▾) im Tab des Werkzeugs.
        const panel = point(snap, `panel:${info.tab}:${info.panel}`);
        if (panel) return {kind: 'via', target: panel, text: I().t('via.panel', {name: panelName(info.panel)})};
        const tab = point(snap, `tab:${info.tab}`);
        if (tab) return {kind: 'via', target: tab, text: I().t('via.tab', {name: tabName(info.tab)})};
        return null;
    }

    function resolve (target, snap, cmds, opts) {
        if (!snap || typeof target !== 'string') return null;
        const i = target.indexOf(':');
        const kind = i < 0 ? target : target.slice(0, i);
        const arg = i < 0 ? '' : target.slice(i + 1);
        switch (kind) {
        case 'tool': return resolveTool(arg, snap, cmds, opts);
        case 'tab': return point(snap, target);
        case 'handle': return point(snap, arg);
        case 'dialog': return point(snap, target);
        case 'plane': return {kind: 'need-at', spec: {plane: arg}};
        case 'axis': return {kind: 'need-at', spec: {axis: arg}};
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
