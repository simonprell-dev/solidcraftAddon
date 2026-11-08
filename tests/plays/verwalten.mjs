// E2E-Ablauf für das Kapitel „verwalten“ (Baukasten mit Parametern).
// Fenster und Dialoge werden wie von einem Kind per Klick geöffnet; die Werte trägt der Test über
// window.solidcraft ein (die Tabellenfelder lassen sich headless nicht zuverlässig betippen).
const offset = page => page.evaluate(() => {
    const r = document.getElementById('solidcraft_canvas').getBoundingClientRect();
    return {x: r.left, y: r.top};
});

async function click ({page, call, wait}, name, opts) {
    let h = null;
    for (let i = 0; i < 30 && !h; i++) {
        h = (await call('ui.handles')).find(x => x.name === name);
        if (!h) await wait(200);
    }
    if (!h) throw new Error('Handle fehlt: ' + name);
    const o = await offset(page);
    // Liegt das Kursfenster über dem Ziel (z. B. über dem ✕ eines SolidCraft-Fensters), schiebt es
    // ein Kind beiseite – der Test auch, sonst träfe der Klick das Kursfenster.
    await page.evaluate((x, y) => {
        const hit = document.elementFromPoint(x, y);
        const panel = hit && hit.closest('.sk-panel');
        if (panel) Object.assign(panel.style, {left: '16px', top: '420px', right: 'auto'});
    }, o.x + h.x, o.y + h.y);
    await page.mouse.click(o.x + h.x, o.y + h.y, opts);
    await wait(700);
}

const tool = async (ctx, tab, cmd) => {
    await click(ctx, 'tab:' + tab);
    await click(ctx, 'toolbar:' + cmd);
    await ctx.wait(1500);
};

export default {
    1: async ctx => {
        await tool(ctx, 'MANAGE', 'parameters.change');
        await click(ctx, 'params:close');
        await ctx.ex('parameters.add', {name: 'breite', expression: '40'});
        await ctx.ex('parameters.add', {name: 'hoehe', expression: '20'});
    },
    2: async ({ex, wait}) => {
        await ex('sketch.create', {plane: 'XY'});
        await ex('sketch.rectangle.two_point', {p0: [-20, -15], p1: [20, 15]});
        await ex('sketch.finish', {});
        await ex('solid.extrude', {distance: 'hoehe'});
        await ex('view.apply', {view: 'iso'});
        await wait(1500);
    },
    3: async ctx => {
        await tool(ctx, 'MANAGE', 'parameters.change');
        await click(ctx, 'params:close');
        await ctx.ex('parameters.change', {name: 'hoehe', expression: '35'});
        await ctx.wait(1500);
    },
    4: async ctx => {
        await tool(ctx, 'MANAGE', 'config.configure');
        await click(ctx, 'dialog:Cancel');
        await ctx.ex('config.configure', {params: ['hoehe']});
        await ctx.ex('config.row', {name: 'gross', values: {'param:hoehe': '50'}});
        await ctx.wait(1500);
        await ctx.ex('config.activate', {row: 'gross'});
        await ctx.wait(1500);
    },
    5: async ({ex, wait}) => {
        await ex('material.assign', {bodies: ['Body1'], material: 'PLA'});
        await ex('appearance.assign', {bodies: ['Body1'], color: '#e05a2b'});
        await wait(2000);
    },
    6: async ({ex, wait}) => {
        await ex('document.units', {units: 'cm'});
        await wait(2000);
        await ex('document.units', {units: 'mm'});
        await wait(2000);
    },
    7: async ({ex, wait}) => {
        await ex('parameters.add', {name: 'wand', expression: '2'});
        await wait(1500);
    }
};
