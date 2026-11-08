// E2E-Ablauf für das Kapitel „pruefen“ (Detektiv-Werkstatt): baut und klickt wie ein Kind.
const offset = page => page.evaluate(() => {
    const r = document.getElementById('solidcraft_canvas').getBoundingClientRect();
    return {x: r.left, y: r.top};
});

async function handle (call, wait, name) {
    for (let i = 0; i < 30; i++) {
        const h = (await call('ui.handles')).find(x => x.name === name);
        if (h) return h;
        await wait(200);
    }
    throw new Error('Handle fehlt: ' + name);
}

// Echter Mausklick auf ein Handle (auch Rechtsklick).
async function click ({page, call, wait}, name, opts) {
    const h = await handle(call, wait, name);
    const o = await offset(page);
    await page.mouse.click(o.x + h.x, o.y + h.y, opts);
    await wait(700);
}

// Klick ins Modell: erst hinfahren (SolidCraft sucht beim Überfahren, was unter der Maus liegt), dann klicken.
async function clickAt ({page, call, wait}, spec) {
    const p = await call('ui.at', spec);
    const o = await offset(page);
    await page.mouse.move(o.x + p[0] - 5, o.y + p[1] - 5);
    await wait(300);
    await page.mouse.move(o.x + p[0], o.y + p[1]);
    await wait(500);
    await page.mouse.down();
    await wait(80);
    await page.mouse.up();
    await wait(700);
}

const tool = async (ctx, tab, cmd) => {
    await click(ctx, 'tab:' + tab);
    await click(ctx, 'toolbar:' + cmd);
};

export default {
    1: async ({ex, wait}) => {
        await ex('sketch.create', {plane: 'XY'});
        await ex('sketch.circle.center', {center: [0, 0], diameter: 60});
        await ex('sketch.finish', {});
        await ex('solid.extrude', {distance: 80});
        await ex('solid.shell', {faces: [[0, 0, 80]], thickness: 3});
        await ex('view.apply', {view: 'iso'});
        await wait(500);
    },
    2: async ctx => {
        await tool(ctx, 'INSPECT', 'inspect.measure');
        await wait(ctx, 1200);
        await clickAt(ctx, {world: [0, -30, 40]});
        await wait(ctx, 1500);
        await ctx.page.keyboard.press('Escape');
        await click(ctx, 'toolbar:inspect.center_of_mass');
        await wait(ctx, 1500);
        await ctx.page.keyboard.press('Escape');
        await click(ctx, 'toolbar:component.properties');
        await wait(ctx, 1500);
        // Das Eigenschaften-Fenster liegt mitten über dem Modell – wieder schließen.
        await click(ctx, 'dialog:close');
    },
    3: async ctx => {
        await ctx.page.keyboard.press('Escape');
        await tool(ctx, 'INSPECT', 'inspect.section');
        await wait(ctx, 1200);
        await clickAt(ctx, {plane: 'XZ'});
        await click(ctx, 'dialog:OK');
        await wait(ctx, 1500);
    },
    4: async ctx => {
        const {ex} = ctx;
        // Schnitt wieder ausschalten (× am Schild), dann den Stift bauen.
        await click(ctx, 'viewport_status:Section:inspect.section:close').catch(() => null);
        await ex('sketch.create', {plane: 'XZ'});
        await ex('sketch.circle.center', {center: [0, -40], diameter: 8});   // XZ: y zeigt nach −Z
        await ex('sketch.finish', {});
        await ex('solid.extrude', {distance: 80, direction: 'symmetric', operation: 'new_body'});
        await wait(ctx, 1500);
        await tool(ctx, 'INSPECT', 'inspect.interference');
        await wait(ctx, 1500);
        const names = (await ctx.call('ui.handles')).map(h => h.name);
        await click(ctx, names.find(n => /^dialog:button::(Berechnen|Compute|Calculate)$/.test(n)));
        await wait(ctx, 2500);
    },
    5: async ctx => {
        await click(ctx, 'dialog:OK').catch(() => null);
        for (const cmd of ['inspect.zebra', 'inspect.curvature_map', 'inspect.draft']) {
            await tool(ctx, 'INSPECT', cmd);
            await wait(ctx, 1500);
        }
    },
    6: async ctx => {
        await click(ctx, 'history:first');
        await wait(ctx, 1500);
        await tool(ctx, 'INSPECT', 'timeline.play');
        await wait(ctx, 5000);
    },
    7: async ctx => {
        await click(ctx, 'tab:VIEW');
        await click(ctx, 'row:Named Views', {button: 'right'});
        await click(ctx, 'menu:ui.newView');
        await wait(ctx, 1500);
        await click(ctx, 'axis_view:z');
        await wait(ctx, 2000);
        const views = (await ctx.ex('view.list', {})).views;
        await click(ctx, 'row:' + views[views.length - 1].name, {button: 'right'});
        await click(ctx, 'menu:ui.restoreView');
        await wait(ctx, 2000);
    },
    8: async ctx => {
        await tool(ctx, 'INSPECT', 'inspect.curvature_comb');
        await wait(ctx, 1500);
    }
};

function wait (ctx, ms) {
    return ctx.wait(ms);
}
