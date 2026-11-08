// E2E-Ablauf für das Kapitel „zusammenbau“ (Windrad): baut Mast und Rotor, macht Komponenten daraus,
// verbindet sie mit einem Drehgelenk (Wie gebaut), dreht den Rotor und fügt eine Schraube ein.
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export default {
    1: async ({ex}) => {
        // Mast 8 × 8 × 100 mm
        await ex('sketch.create', {plane: 'XY'});
        await ex('sketch.rectangle.two_point', {p0: [-4, -4], p1: [4, 4]});
        await ex('sketch.finish', {});
        await ex('solid.extrude', {distance: 100});
        // Rotor vorne oben auf dem Mast: Nabe und zwei gekreuzte Flügel, als neuer Körper
        await ex('sketch.create', {plane: {face: [0, -4, 90]}});
        const {plane} = await ex('sketch.inspect', {});
        const d = [0, -4, 92].map((v, i) => v - plane.origin[i]);
        const [u, v] = [dot(d, plane.x_dir), dot(d, plane.y_dir)];
        await ex('sketch.circle.center', {center: [u, v], diameter: 12});
        await ex('sketch.rectangle.two_point', {p0: [u - 45, v - 2], p1: [u + 45, v + 2]});
        await ex('sketch.rectangle.two_point', {p0: [u - 2, v - 45], p1: [u + 2, v + 45]});
        await ex('sketch.finish', {});
        await ex('solid.extrude', {distance: 4, operation: 'new_body'});
    },
    2: async ({ex, bodies}) => {
        await ex('component.from_bodies', {bodies: await bodies()});
    },
    // 3: Der Mast ist schon fixiert (erstes Bauteil), der Rotor frei – nichts zu tun.
    4: async ({ex}) => {
        const {components} = await ex('component.list', {});
        const occ = components.flatMap(k => (k.occurrences || []).map(o => Object.assign({}, o, {bodies: k.bodies})));
        const mast = occ.find(o => o.grounded);
        const rotor = occ.find(o => !o.grounded);
        await ex('joint.as_built', {type: 'revolute', a: rotor.name, b: mast.name,
            at: {occurrence: rotor.name, face: [0, -8, 92]}});
    },
    5: async ({ex}) => {
        const {joints} = await ex('joint.list', {});
        await ex('joint.drive', {joint: joints[0].name, value: 45});
    },
    6: ({ex}) => ex('parts.fastener', {family: 'socket_head_cap_screw', size: 'M3', length: 10,
        point: [20, 0, 0], direction: [0, 0, 1]})
};
