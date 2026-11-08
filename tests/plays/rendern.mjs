// E2E-Ablauf für das Kapitel „rendern“ (Fotostudio) – so, wie ein Kind es macht.
// Rendern mit SwiftShader ist langsam: Bildgröße klein stellen und auf das Ergebnis warten.
const clickHandle = async (call, name, wait) => {
    const h = (await call('ui.handles')).find(x => x.name === name);
    if (h) await call('ui.click', {x: h.x, y: h.y});
    if (wait) await wait(1000);
    return !!h;
};
const render = async call => (await call('ui.inspect')).render || {};

export default {
    1: async ({ex}) => {
        await ex('sketch.create', {plane: 'XY'});
        await ex('sketch.rectangle.two_point', {p0: [-15, -15], p1: [15, 15]});
        await ex('sketch.finish', {});
        await ex('solid.extrude', {distance: 30});
    },
    2: async ({call, wait}) => {
        await clickHandle(call, 'ribbon:workspace', wait);
        await clickHandle(call, 'workspace:menu:render', wait);
        await wait(1500);
    },
    4: async ({ex, call, bodies, wait}) => {
        await clickHandle(call, 'render:pick:body', wait);
        const [body] = await bodies();
        await ex('appearance.assign', {bodies: [body], appearance: 'starter.metal.gold-warm'});
        await clickHandle(call, 'render:pick:face', wait);
        await ex('appearance.assign', {faces: [[0, 0, 30]], appearance: 'Wood - Oak'});
    },
    5: async ({call, wait}) => {
        await clickHandle(call, 'render:stage:light', wait);
        await clickHandle(call, 'render:method', wait);
        await clickHandle(call, 'render:method-cpu', wait);
        await clickHandle(call, 'render:tree:light:1:mute', wait);
        await clickHandle(call, 'render:tree:light:1:mute', wait);
        // Für das schnelle erste Foto zurück auf CPU-Rasterung (Tipp im Text).
        await clickHandle(call, 'render:method', wait);
        await clickHandle(call, 'render:method-raster', wait);
    },
    6: async ({call, wait}) => {
        await clickHandle(call, 'render:stage:frame', wait);
        if (!await clickHandle(call, 'dialog::Perspektivische Kamera', wait)) {
            await clickHandle(call, 'dialog::Perspective camera', wait);
        }
        await clickHandle(call, 'axis_view:home', wait);
    },
    7: async ({ex, call, wait}) => {
        await clickHandle(call, 'render:stage:output', wait);
        await ex('render.output.size', {width: 160, height: 120, custom: true});
        await wait(500);
        await clickHandle(call, 'render:stage:render.start', wait);
        for (let i = 0; i < 180 && !((await render(call)).results || []).length; i++) await wait(1000);
        await wait(1000);
        await clickHandle(call, 'render:compare:result:0', wait);
    },
    9: async ({call, wait}) => {
        await clickHandle(call, 'ribbon:workspace', wait);
        await clickHandle(call, 'workspace:menu:design', wait);
    }
};
