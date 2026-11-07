/*
 * Prüf-Kontext c für die Aufgaben und Hinweise in course-data.js.
 *
 *   c.tool()          Command-ID des aktiven Werkzeugs (z. B. 'sketch.text') oder null
 *   c.dialog()        Command-ID des offenen Dialogs (z. B. 'solid.extrude') oder null
 *   c.dialogPicked(label)  wie viel ist im Dialogfeld gewählt (z. B. 'Profiles')?
 *   c.inSketch()      ist gerade eine Skizze offen?
 *   c.activeSketch()  die offene Skizze {id, name, curves, profiles, …} oder null
 *   c.sketches()      alle Skizzen
 *   c.newSketches()   Anzahl Skizzen, die es bei Schrittbeginn noch nicht gab
 *   c.bodies()        alle Körper (mit bbox {min, max} in mm)
 *   c.size(body)      [Länge, Breite, Höhe] in mm (Länge ≥ Breite, Höhe = z)
 *   c.height()        Dicke aller Körper zusammen in mm (entlang ihrer dünnsten Richtung –
 *                     so zählt auch eine Platte, die auf der Front- oder Seitenebene steht)
 *   c.top()           Mittelpunkt der Oberseite aller Körper [x, y, z] oder null
 *   c.top('long')     dasselbe entlang der längsten Richtung (z. B. Oberkante eines Köchers)
 *   c.sketchCenter()  Mitte der neuesten Skizze [x, y, z] (aus sketch.inspect) oder null
 *   c.bodyCount(), c.largest(), c.volume() (mm³), c.faceCount('cylinder' | 'sphere' | 'cone' …)
 *   c.features(type)  Anzahl Elemente der Zeitleiste mit diesem Typ ('Sketch', 'ExtrudeFeature' …)
 *   c.newFeatures(type)  davon neu seit Schrittbeginn ('FilletFeature', 'HoleFeature', 'ShellFeature' …)
 *   c.cameraMoved()   wurde die Ansicht seit Schrittbeginn gedreht, verschoben oder gezoomt?
 *   c.has(name)       ist dieses Handle gerade sichtbar (z. B. 'dialog:OK')?
 *   c.approx(a, b, tol)
 *   c.base            Zustand bei Schrittbeginn: {camera, sketchIds, height, volume, bodyCount,
 *                     features, types, ignore}. Körper aus base.ignore (lagen schon vor dem Kapitel
 *                     im Design) zählen nirgends mit.
 */
(function () {
    'use strict';

    const approx = (a, b, tol) => Math.abs(a - b) <= tol;

    function boxOf (bodies) {
        const boxes = bodies.map(b => b.bbox).filter(Boolean);
        if (!boxes.length) return null;
        const min = [0, 1, 2].map(i => Math.min(...boxes.map(b => b.min[i])));
        const max = [0, 1, 2].map(i => Math.max(...boxes.map(b => b.max[i])));
        return {min, max};
    }

    // Die Platte kann auf jeder Ebene liegen (XY, XZ, YZ – z. B. wenn die Ansicht gedreht war).
    // Ihre „Höhe“ ist deshalb die Ausdehnung entlang der dünnsten Richtung aller Körper.
    function thinAxis (box) {
        const d = [0, 1, 2].map(i => box.max[i] - box.min[i]);
        return d.indexOf(Math.min(...d));
    }

    function longAxis (box) {
        const d = [0, 1, 2].map(i => box.max[i] - box.min[i]);
        return d.indexOf(Math.max(...d));
    }

    // ignore: Namen von Körpern, die schon vor dem Kapitel im Design lagen – sie zählen nicht mit.
    function parts (snap, ignore) {
        const doc = (snap && snap.doc) || {};
        const ui = (snap && snap.ui) || {};
        const bodies = (doc.bodies || []).filter(b => b.visible !== false && !(ignore || []).includes(b.name));
        const box = boxOf(bodies);
        const axis = box ? thinAxis(box) : 2;
        const volume = bodies.reduce((v, b) => v + (b.volume_mm3 || 0), 0);
        return {doc, ui, bodies, box, axis, volume, height: box ? box.max[axis] - box.min[axis] : 0};
    }

    // Mitte der Oberseite: auf der gewählten Achse die Seite, die weiter von der Skizzenebene
    // (Koordinate 0) entfernt ist – dorthin wurde extrudiert.
    function topOf (box, axis) {
        const p = [0, 1, 2].map(i => (box.min[i] + box.max[i]) / 2);
        p[axis] = Math.abs(box.max[axis]) >= Math.abs(box.min[axis]) ? box.max[axis] : box.min[axis];
        return p.map(v => v + 0); // -0 → 0
    }

    const typeCounts = doc => (doc.timeline || []).filter(f => !f.suppressed)
        .reduce((m, f) => Object.assign(m, {[f.type]: (m[f.type] || 0) + 1}), {});

    function makeBase (snap, ignore) {
        const {doc, ui, bodies, height, volume} = parts(snap, ignore);
        return {
            camera: ui.camera || null,
            sketchIds: (doc.sketches || []).map(s => s.id),
            height,
            volume,
            bodyCount: bodies.length,
            features: (doc.timeline || []).length,
            types: typeCounts(doc),
            ignore: ignore || []
        };
    }

    function cameraDiffers (a, b) {
        if (!a || !b) return false;
        const num = ['distance', 'pitch', 'yaw', 'roll'].some(k => !approx(a[k] || 0, b[k] || 0, 1e-3));
        const target = [0, 1, 2].some(i => !approx((a.target || [])[i] || 0, (b.target || [])[i] || 0, 1e-2));
        return num || target;
    }

    // Mitte der Skizze (Umriss aller Kurven) in Weltkoordinaten – aus sketch.inspect.
    function sketchCenter (sketch) {
        if (!sketch || !sketch.plane || !(sketch.curves || []).length) return null;
        const pts = [];
        for (const k of sketch.curves) {
            if (k.construction) continue;
            if (k.start_at) pts.push(k.start_at);
            if (k.end_at) pts.push(k.end_at);
            if (k.center_at) {
                const r = k.radius || 0;
                pts.push([k.center_at[0] - r, k.center_at[1] - r], [k.center_at[0] + r, k.center_at[1] + r]);
            }
        }
        if (!pts.length) return null;
        const mid = i => (Math.min(...pts.map(p => p[i])) + Math.max(...pts.map(p => p[i]))) / 2;
        const [u, v] = [mid(0), mid(1)];
        const {origin, x_dir: xd, y_dir: yd} = sketch.plane;
        return [0, 1, 2].map(i => origin[i] + u * xd[i] + v * yd[i] + 0);
    }

    function make (snap, base) {
        base = base || makeBase(snap);
        const {doc, ui, bodies, box, axis, height, volume} = parts(snap, base.ignore);
        const sketches = doc.sketches || [];
        const types = typeCounts(doc);
        return {
            base,
            approx,
            tool: () => ui.tool || null,
            dialog: () => (ui.dialog && ui.dialog.command) || null,
            dialogPicked (label) {
                const input = ui.dialog && (ui.dialog.inputs || []).find(i => i.label === label);
                return input ? (input.items || []).length : 0;
            },
            inSketch: () => doc.active_sketch != null,
            activeSketch: () => sketches.find(s => s.id === doc.active_sketch) || null,
            sketches: () => sketches,
            newSketches: () => sketches.filter(s => !base.sketchIds.includes(s.id)).length,
            sketchCenter: () => sketchCenter(snap && snap.sketch),
            bodies: () => bodies,
            bodyCount: () => bodies.length,
            largest: () => bodies.reduce((a, b) => (!a || (b.volume_mm3 || 0) > (a.volume_mm3 || 0) ? b : a), null),
            size (body) {
                const d = [0, 1, 2].map(i => body.bbox.max[i] - body.bbox.min[i]);
                return [Math.max(d[0], d[1]), Math.min(d[0], d[1]), d[2]];
            },
            height: () => height,
            volume: () => volume,
            faceCount: type => bodies.reduce((n, b) => n + ((b.face_types || {})[type] || 0), 0),
            top: mode => box ? topOf(box, mode === 'long' ? longAxis(box) : axis) : null,
            features: type => types[type] || 0,
            newFeatures: type => Math.max(0, (types[type] || 0) - ((base.types || {})[type] || 0)),
            cameraMoved: () => cameraDiffers(ui.camera, base.camera),
            has: name => !!(snap && snap.handles && snap.handles.has(name))
        };
    }

    window.SolidcraftKursContext = {make, makeBase};
})();
