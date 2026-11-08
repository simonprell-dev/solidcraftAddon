// E2E-Ablauf für das Kapitel „kunststoff“ (Dose mit Klick-Deckel) – so, wie ein Kind es baut.
export default {
    1: async ({ex}) => {
        await ex('sketch.create', {plane: 'XY'});
        await ex('sketch.rectangle.two_point', {p0: [-30, -20], p1: [30, 20]});
        await ex('sketch.finish', {});
        await ex('solid.extrude', {distance: 30});
        await ex('solid.shell', {faces: [[0, 0, 30]], thickness: 2});
    },
    2: ({ex, bodies}) => bodies().then(names => ex('plastic.assign_rule', {bodies: [names[0]], rule: 'ABS (1.5mm)'})),
    3: ({ex}) => ex('plastic.lip', {face: [29, 0, 30], width: 1, height: 2}),
    4: ({ex}) => ex('plastic.boss', {position: [0, 0, 2], diameter: 6, height: 10, hole_diameter: 2.5}),
    5: ({ex}) => ex('plastic.rest', {position: [22, 14, 0], width: 6, height: 1}),
    6: async ({ex}) => {
        await ex('sketch.create', {plane: 'XY'});
        await ex('sketch.rectangle.two_point', {p0: [40, -20], p1: [100, 20]});
        await ex('sketch.finish', {});
        await ex('solid.extrude', {distance: 2, operation: 'new_body'});
    },
    7: ({ex, bodies}) => bodies().then(names => ex('plastic.snap_fit', {position: [70, 17, 2], hook: [0, 1, 0], length: 12,
        thickness: 1.5, width: 6, catch_depth: 1, catch_length: 2, body: names[names.length - 1]})),
    // Fenster 7 × 3 mm in die vordere Außenwand (y = -20), Oberkante 8 mm unter dem Rand (z 19,5 … 22,5).
    8: async ({ex}) => {
        await ex('sketch.create', {plane: {face: [0, -20, 15]}});
        const {plane} = await ex('sketch.inspect', {});
        const uv = w => {
            const d = w.map((v, i) => v - plane.origin[i]);
            const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
            return [dot(d, plane.x_dir), dot(d, plane.y_dir)];
        };
        await ex('sketch.rectangle.two_point', {p0: uv([-3.5, -20, 19.5]), p1: uv([3.5, -20, 22.5])});
        await ex('sketch.finish', {});
        await ex('solid.extrude', {distance: 2, direction: 'negative', operation: 'cut'});
    }
};
