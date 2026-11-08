// E2E-Ablauf für das Kapitel „flaeche“ (Vase aus Flächen) – so, wie ein Kind es baut.
const clickHandle = async (call, name) => {
    const h = (await call('ui.handles')).find(x => x.name === name);
    if (h) await call('ui.click', {x: h.x, y: h.y});
};

export default {
    1: async ({ex, call, wait}) => {
        await clickHandle(call, 'tab:SURFACE');
        await wait(300);
        await ex('sketch.create', {plane: 'YZ'});
        await ex('sketch.line', {points: [[0, 0], [25, 0], [30, 40], [18, 80], [22, 100]]});
        await ex('sketch.finish', {});
    },
    2: async ({ex, call}) => {
        const doc = await call('document.inspect', {});
        const sketch = Math.max(...doc.sketches.map(s => s.id));
        await ex('surface.revolve', {sketch, curves: ['l1', 'l2', 'l3', 'l4'], axis: 'Z'});
    },
    3: ({call}) => clickHandle(call, 'axis_view:z'),
    4: ({ex, bodies}) => bodies().then(names => ex('surface.extend', {body: names[0], edges: [[22, 0, 100]], distance: 10})),
    5: ({ex, bodies}) => bodies().then(names => ex('surface.thicken', {bodies: [names[0]], thickness: 2}))
};
