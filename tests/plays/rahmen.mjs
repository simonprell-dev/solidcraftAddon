// Ablauf für das Kapitel „rahmen“ (Mini-Hocker aus Rahmenelementen) im E2E-Test tests/e2e-chapters.mjs.
// Achtung: Auf der Frontebene (XZ) zeigt die Skizzen-y-Achse nach −Z – „nach oben“ ist dort y < 0.
const tube = {kind: 'rect_tube', width: 'rohr', height: 'rohr', wall: 1.5};
export default {
    1: ({ex}) => ex('parameters.add', {name: 'rohr', expression: '6 mm'}),
    2: async ({ex}) => {
        await ex('sketch.create', {plane: 'XZ'});
        await ex('sketch.line', {points: [[-30, 0], [-30, -60], [30, -60], [30, 0]]});
        await ex('sketch.finish', {});
    },
    3: ({ex}) => ex('frame.member', {sketch: 'Sketch1', profile: tube}),
    4: async ({ex}) => {
        await ex('sketch.create', {plane: 'YZ'});
        await ex('sketch.line', {points: [[-30, 0], [-30, 60], [30, 60], [30, 0]]});
        await ex('sketch.finish', {});
        await ex('frame.member', {sketch: 'Sketch2', profile: tube});
    },
    5: async ({ex}) => {
        await ex('sketch.create', {plane: 'XY'});
        await ex('sketch.rectangle.two_point', {p0: [-30, -30], p1: [30, 30]});
        await ex('sketch.finish', {});
        await ex('frame.member', {sketch: 'Sketch3', profile: {kind: 'round_tube', diameter: 'rohr', wall: 1.5}});
    },
    6: ({ex}) => ex('parameters.change', {name: 'rohr', expression: '8 mm'})
};
