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
 *   c.features(type)  Anzahl Elemente der Zeitleiste mit diesem Typ ('Sketch', 'ExtrudeFeature' …)
 *   c.cameraMoved()   wurde die Ansicht seit Schrittbeginn gedreht, verschoben oder gezoomt?
 *   c.has(name)       ist dieses Handle gerade sichtbar (z. B. 'dialog:OK')?
 *   c.approx(a, b, tol)
 *   c.base            Zustand bei Schrittbeginn: {camera, sketchIds, height, features}
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

    function parts (snap) {
        const doc = (snap && snap.doc) || {};
        const ui = (snap && snap.ui) || {};
        const bodies = (doc.bodies || []).filter(b => b.visible !== false);
        const box = boxOf(bodies);
        const axis = box ? thinAxis(box) : 2;
        return {doc, ui, bodies, box, axis, height: box ? box.max[axis] - box.min[axis] : 0};
    }

    // Mitte der Oberseite: auf der dünnen Achse die Seite, die weiter von der Skizzenebene
    // (Koordinate 0) entfernt ist – dorthin wurde extrudiert.
    function topOf (box, axis) {
        const p = [0, 1, 2].map(i => (box.min[i] + box.max[i]) / 2);
        p[axis] = Math.abs(box.max[axis]) >= Math.abs(box.min[axis]) ? box.max[axis] : box.min[axis];
        return p.map(v => v + 0); // -0 → 0
    }

    function makeBase (snap) {
        const {doc, ui, height} = parts(snap);
        return {
            camera: ui.camera || null,
            sketchIds: (doc.sketches || []).map(s => s.id),
            height,
            features: (doc.timeline || []).length
        };
    }

    function cameraDiffers (a, b) {
        if (!a || !b) return false;
        const num = ['distance', 'pitch', 'yaw', 'roll'].some(k => !approx(a[k] || 0, b[k] || 0, 1e-3));
        const target = [0, 1, 2].some(i => !approx((a.target || [])[i] || 0, (b.target || [])[i] || 0, 1e-2));
        return num || target;
    }

    function make (snap, base) {
        const {doc, ui, bodies, box, axis, height} = parts(snap);
        const sketches = doc.sketches || [];
        base = base || makeBase(snap);
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
            bodies: () => bodies,
            size (body) {
                const d = [0, 1, 2].map(i => body.bbox.max[i] - body.bbox.min[i]);
                return [Math.max(d[0], d[1]), Math.min(d[0], d[1]), d[2]];
            },
            height: () => height,
            top: () => box ? topOf(box, axis) : null,
            features: type => (doc.timeline || []).filter(f => f.type === type && !f.suppressed).length,
            cameraMoved: () => cameraDiffers(ui.camera, base.camera),
            has: name => !!(snap && snap.handles && snap.handles.has(name))
        };
    }

    window.SolidcraftKursContext = {make, makeBase};
})();
