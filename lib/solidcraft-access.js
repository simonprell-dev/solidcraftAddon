/*
 * Zugriff auf die laufende SolidCraft-Web-App über ihre offizielle Browser-Schnittstelle
 * window.solidcraft (siehe docs/browser-api.md im SolidCraft-Repository).
 *
 * Die Erweiterung liest nur: ui.inspect (Werkzeug, Dialog, Kamera, Viewport), ui.handles
 * (Bildschirmpunkte der Buttons), document.inspect (Skizzen, Körper, Zeitleiste) und ui.at
 * (Bildschirmpunkt einer Ebene oder eines 3D-Punkts). Sie verändert das Modell nie.
 */
(function () {
    'use strict';

    const TIMEOUT_MS = 2000;

    const api = () => window.solidcraft;
    const ready = () => !!(api() && typeof api().request === 'function');

    function withTimeout (promise) {
        let timer;
        return Promise.race([
            promise,
            new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS); })
        ]).finally(() => clearTimeout(timer));
    }

    const request = (method, params) => withTimeout(api().request(method, params || {}));

    let running = null;   // laufender Snapshot: höchstens einer gleichzeitig
    let doc = null;       // zuletzt gelesenes document.inspect
    let docKey = null;    // Dokument, Revision, Werkzeug und Dialog dazu
    let docTime = 0;      // wann zuletzt gelesen
    let sketch = null;    // sketch.inspect der neuesten (oder offenen) Skizze
    const DOC_MAX_AGE_MS = 1000;

    async function takeSnapshot () {
        const [ui, handleList, rev] = await Promise.all([
            request('ui.inspect'),
            request('ui.handles'),
            request('document.revision')
        ]);
        // document.revision hinkt manchmal nach (z. B. bei „Skizze beenden“). Deshalb das Modell
        // auch neu lesen, wenn Werkzeug oder Dialog wechseln, und spätestens nach DOC_MAX_AGE_MS.
        const key = [rev.document_id, rev.revision, ui && ui.tool, ui && ui.dialog && ui.dialog.command].join('|');
        if (key !== docKey || !doc || Date.now() - docTime >= DOC_MAX_AGE_MS) {
            doc = await request('document.inspect', {measure: true, sketch_counts: true});
            docKey = key;
            docTime = Date.now();
            sketch = await inspectSketch(doc);
        }
        const handles = new Map();
        for (const h of handleList || []) if (!handles.has(h.name)) handles.set(h.name, {x: h.x, y: h.y});
        return {ui, handles, doc, sketch, documentId: rev.document_id, revision: rev.revision, time: Date.now()};
    }

    // Lage und Kurven der offenen bzw. neuesten Skizze – damit die Hand auf sie zeigen kann.
    // sketch.inspect liest nur (kein Fenster, kein Rückgängig-Schritt).
    async function inspectSketch (d) {
        const ids = (d.sketches || []).map(s => s.id);
        const id = d.active_sketch != null ? d.active_sketch : (ids.length ? Math.max(...ids) : null);
        if (id == null) return null;
        try {
            return await request('engine.execute', {command: 'sketch.inspect', params: {sketch: id}});
        } catch (e) {
            return null;
        }
    }

    function snapshot () {
        if (!ready()) return Promise.resolve(null);
        if (!running) {
            running = takeSnapshot()
                .catch(() => null)
                .finally(() => { running = null; });
        }
        return running;
    }

    async function at (spec) {
        if (!ready()) return null;
        try {
            const p = await request('ui.at', spec);
            return Array.isArray(p) && p.length >= 2 ? [p[0], p[1]] : null;
        } catch (e) {
            return null;
        }
    }

    let commandMap = null;
    async function commands () {
        if (commandMap) return commandMap;
        if (!ready()) return new Map();
        try {
            const list = await withTimeout(api().commands());
            commandMap = new Map(list.map(c => [c.id, {tab: c.tab, panel: c.panel, label: c.label}]));
            return commandMap;
        } catch (e) {
            return new Map();
        }
    }

    // ui.handles und ui.at liefern egui-Punkte relativ zum Canvas. In der Web-App entspricht ein
    // Punkt einem CSS-Pixel; dazu kommt nur die Lage des Canvas im Fenster.
    function canvasOffset () {
        const canvas = typeof document !== 'undefined' && document.getElementById('solidcraft_canvas');
        if (!canvas) return {x: 0, y: 0};
        const r = canvas.getBoundingClientRect();
        return {x: r.left, y: r.top};
    }

    window.SolidcraftKursAccess = {ready, snapshot, at, commands, canvasOffset};
})();
