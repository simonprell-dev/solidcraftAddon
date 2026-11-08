// Ablauf für das Kapitel „blech“ (Handyständer aus Blech) im E2E-Test tests/e2e-chapters.mjs.
export default {
    1: async ({ex}) => {
        await ex('sketch.create', {plane: 'XY'});
        await ex('sketch.rectangle.two_point', {p0: [-35, -20], p1: [35, 20]});
        await ex('sketch.finish', {});
        await ex('sheet.flange', {sketch: 'Sketch1'});
    },
    2: ({ex}) => ex('sheet.manage_rules', {name: 'Steel (mm)', thickness: '2 mm'}),
    3: async ({ex}) => {
        await ex('sheet.flange', {edges: [[0, 20, 2]], height: 80, angle: 70});
        await ex('sheet.flange', {edges: [[0, -20, 2]], height: 15, angle: 90});
    },
    4: ({ex}) => ex('sheet.hem', {edges: [[0, -20, 15]], length: 5}),
    5: async ({ex}) => {
        await ex('sheet.unfold', {});
        await ex('sheet.refold', {});
    },
    6: async ({call, wait}) => {
        await call('ui.start', {command: 'sheet.flat_pattern'});
        await wait(2000);
        await call('ui.start', {command: 'sheet.flat_pattern'}).catch(() => null);
    }
};
