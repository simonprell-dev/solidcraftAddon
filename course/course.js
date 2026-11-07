/*
 * Einführungskurs für SolidCraft: Kursfenster, Zeige-Hand, Prüfung der Aufgaben.
 *
 * Alle 200 ms holt der Kurs über lib/solidcraft-access.js einen Snapshot der App (Werkzeug,
 * Dialog, Button-Positionen, Modell), prüft damit die Aufgaben des aktuellen Schritts
 * (course/context.js) und zeigt mit der Hand auf das nächste Ziel (course/targets.js).
 * Inhalte stehen in course/course-data.js.
 */
(function () {
    'use strict';

    const A = window.SolidcraftKursAccess;
    const C = window.SolidcraftKursContext;
    const T = window.SolidcraftKursTargets;
    const {chapters, levels} = window.SolidcraftKursCourse;

    const STATE_KEY = 'solidcraft-kurs:v1';
    const TICK_MS = 200;

    const KIND = {
        info: {label: 'Info', icon: '💡'},
        learn: {label: 'Lernen', icon: '🧩'},
        creative: {label: 'Kreativ', icon: '🎨'},
        game: {label: 'Anschauen', icon: '🔍'},
        challenge: {label: 'Challenge', icon: '⭐'}
    };
    const LEVELS = [
        {id: 'neuling', icon: '🌱', title: 'Neuling', text: 'Ich habe noch nie am Computer etwas in 3D gebaut.'},
        {id: 'probiert', icon: '🔧', title: 'Schon mal ausprobiert', text: 'Ich kenne Tinkercad oder ein anderes 3D-Programm ein bisschen.'},
        {id: 'profi', icon: '🚀', title: 'Ich kenne mich aus', text: 'Skizzieren und Extrudieren kenne ich schon.'}
    ];
    const chapterIndex = id => Math.max(0, chapters.findIndex(ch => ch.id === id));

    // ---------- Gespeicherter Zustand ----------

    function defaultState () {
        return {started: false, open: false, collapsed: false, chapterId: chapters[0].id, step: 0,
            done: {}, manual: {}, pos: null, transition: null, bases: {}, chapterBodies: {}};
    }
    function loadState () {
        let loaded = defaultState();
        try {
            loaded = Object.assign(loaded, JSON.parse(localStorage.getItem(STATE_KEY) || '{}'));
        } catch (e) { /* Standardwerte */ }
        loaded.chapter = chapterIndex(loaded.chapterId);
        loaded.step = Math.min(Math.max(0, loaded.step || 0), chapters[loaded.chapter].steps.length - 1);
        return loaded;
    }
    function saveState () {
        state.chapterId = chapters[state.chapter].id;
        try {
            const {chapter, ...stored} = state;
            localStorage.setItem(STATE_KEY, JSON.stringify(stored));
        } catch (e) { /* egal */ }
    }
    const state = loadState();

    // ---------- Laufzeit des aktuellen Schritts ----------

    const run = {base: null, needBase: true, hintsOn: false, wasComplete: false, taskDone: [], view: state.transition ? 'transition' : 'step',
        snap: null, at: new Map()};

    const currentChapter = () => chapters[state.chapter];
    const currentStep = () => currentChapter().steps[state.step];
    const stepId = (ci, si) => `${chapters[ci].id}.${si}`;

    function enterStep () {
        const step = currentStep();
        run.needBase = true;   // Zustand bei Schrittbeginn kommt mit dem nächsten Snapshot
        run.wasComplete = !!state.done[stepId(state.chapter, state.step)];
        // Ein schon geschaffter Schritt (z. B. nach „←“) bleibt abgehakt.
        run.taskDone = run.wasComplete ? (step.tasks || []).map(() => true) : [];
        const auto = step.autoHints !== undefined ? step.autoHints : currentChapter().autoHints;
        run.hintsOn = !!auto && step.kind !== 'info';
        run.view = 'step';
        saveState();
        renderPanel();
    }

    function evaluateTasks (c) {
        const step = currentStep();
        const id = stepId(state.chapter, state.step);
        return (step.tasks || []).map((task, i) => {
            if (task.manual) return !!state.manual[`${id}.${i}`];
            // Einmal erledigt bleibt erledigt (z. B. „Werkzeug gewählt“).
            if (run.taskDone[i]) return true;
            let ok = false;
            try {
                ok = !!task.check(c);
            } catch (e) { /* Modell im Umbau */ }
            run.taskDone[i] = ok;
            return ok;
        });
    }

    // ---------- Hinweise ----------

    function activeHint (c) {
        if (!run.hintsOn || run.view !== 'step') return null;
        return (currentStep().hints || []).find(h => {
            try {
                return !(h.done && h.done(c));
            } catch (e) {
                return true;
            }
        }) || null;
    }

    function hintTarget (hint, c) {
        try {
            return typeof hint.target === 'function' ? hint.target(c) : hint.target;
        } catch (e) {
            return null;
        }
    }

    // Ziel → {x, y, text} in Fensterkoordinaten, oder null.
    async function locate (target, text, snap, opts) {
        const res = T.resolve(target, snap, await A.commands(), opts);
        if (!res) return null;
        let p = res;
        if (res.kind === 'via') {
            p = res.target;
            text = res.text;
        } else if (res.kind === 'need-at') {
            const key = JSON.stringify(res.spec);
            const xy = await A.at(res.spec);
            if (xy) run.at.set(key, xy);
            const cached = xy || run.at.get(key);
            if (!cached) return null;
            p = {x: cached[0], y: cached[1]};
        }
        const off = A.canvasOffset();
        return {x: p.x + off.x, y: p.y + off.y, text};
    }

    // ---------- Overlay mit Hand und Sprechblase ----------

    let overlay;
    let lastHintKey = '';
    function ensureOverlay () {
        if (overlay && document.body.contains(overlay)) return overlay;
        overlay = el('div', 'sk-overlay');
        document.body.appendChild(overlay);
        return overlay;
    }
    function clearOverlay () {
        if (overlay) overlay.innerHTML = '';
        lastHintKey = '';
    }

    const overlaps = (a, b, gap = 4) => a.left < b.right + gap && a.right > b.left - gap &&
        a.top < b.bottom + gap && a.bottom > b.top - gap;
    const fits = r => r.left >= 4 && r.top >= 4 && r.right <= window.innerWidth - 4 && r.bottom <= window.innerHeight - 4;

    function placeBubble (text, anchor) {
        const bubble = el('div', 'sk-bubble');
        bubble.textContent = text;
        overlay.appendChild(bubble);
        const w = bubble.offsetWidth;
        const h = bubble.offsetHeight;
        const cx = anchor.left + anchor.width / 2;
        const cy = anchor.top + anchor.height / 2;
        const centered = Math.max(8, Math.min(window.innerWidth - w - 8, cx - w / 2));
        const spots = [
            new DOMRect(centered, anchor.bottom + 8, w, h),
            new DOMRect(anchor.right + 12, cy - h / 2, w, h),
            new DOMRect(anchor.left - w - 12, cy - h / 2, w, h),
            new DOMRect(centered, anchor.top - h - 8, w, h)
        ];
        const p = panel && state.open && panel.getBoundingClientRect();
        const spot = spots.find(r => fits(r) && !(p && overlaps(r, p))) || spots.find(fits) || spots[0];
        bubble.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, spot.left))}px`;
        bubble.style.top = `${Math.max(8, Math.min(window.innerHeight - h - 8, spot.top))}px`;
    }

    // Liegt das Ziel unter dem Kursfenster, rückt das Fenster auf die andere Seite.
    function dodgePanel (pt) {
        if (!panel || !state.open) return;
        const p = panel.getBoundingClientRect();
        const m = 40;
        if (pt.x < p.left - m || pt.x > p.right + m || pt.y < p.top - m || pt.y > p.bottom + m) return;
        const left = pt.x > window.innerWidth / 2;
        state.pos = {x: left ? 16 : window.innerWidth - p.width - 16, y: p.top};
        clampPanel();
        saveState();
    }

    function drawPoint (pt) {
        ensureOverlay();
        dodgePanel(pt);
        const key = `${Math.round(pt.x)},${Math.round(pt.y)}|${pt.text}|${panelKey()}`;
        if (key === lastHintKey) return;
        overlay.innerHTML = '';
        lastHintKey = key;

        const ring = el('div', 'sk-ring');
        ring.style.left = `${pt.x - 22}px`;
        ring.style.top = `${pt.y - 22}px`;
        overlay.appendChild(ring);

        // Hand unter dem Ziel; ganz unten im Fenster darüber (zeigt dann nach unten).
        const below = pt.y + 90 < window.innerHeight;
        const hand = el('div', `sk-hand ${below ? '' : 'sk-hand-down'}`);
        hand.textContent = below ? '👆' : '👇';
        const hx = pt.x - 16;
        const hy = below ? pt.y + 10 : pt.y - 52;
        hand.style.left = `${hx}px`;
        hand.style.top = `${hy}px`;
        overlay.appendChild(hand);
        placeBubble(pt.text, new DOMRect(Math.min(pt.x - 22, hx), Math.min(pt.y - 22, hy), 44, 86));
    }

    const panelKey = () => {
        if (!panel || !state.open) return '';
        const r = panel.getBoundingClientRect();
        return `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}`;
    };

    // ---------- Kursfenster ----------

    let panel;

    function el (tag, cls, html) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html !== undefined) e.innerHTML = html;
        return e;
    }

    function button (cls, html, title, onClick) {
        const b = el('button', cls, html);
        b.type = 'button';
        if (title) b.title = title;
        b.addEventListener('click', e => {
            e.stopPropagation();
            onClick(e);
        });
        return b;
    }

    // Tastendrücke im Kursfenster nicht an SolidCraft weiterreichen (sonst startet z. B. „E“ Extrudieren).
    function shield (node) {
        ['keydown', 'keyup', 'pointerdown', 'wheel'].forEach(type => node.addEventListener(type, e => e.stopPropagation()));
    }

    function ensurePanel () {
        if (panel && document.body.contains(panel)) return panel;
        panel = el('div', 'sk-panel');
        shield(panel);
        document.body.appendChild(panel);
        return panel;
    }

    function renderPanel () {
        ensurePanel();
        wasReady = A.ready();
        panel.style.display = state.open ? '' : 'none';
        if (!state.open) {
            clearOverlay();
            updateLauncher();
            return;
        }
        panel.classList.toggle('sk-collapsed', state.collapsed);
        panel.innerHTML = '';

        const chapter = currentChapter();
        const step = currentStep();

        const header = el('div', 'sk-header');
        const titles = el('div', 'sk-header-titles');
        titles.appendChild(el('div', 'sk-header-brand', '3D-Kurs'));
        titles.appendChild(el('div', 'sk-header-sub', state.transition ?
            `Projekt sichern → Kapitel ${chapterIndex(state.transition) + 1}` :
            `Kapitel ${state.chapter + 1}: ${chapter.title} · ${state.step + 1}/${chapter.steps.length}`));
        header.appendChild(titles);
        const actions = el('div', 'sk-header-actions');
        actions.appendChild(button('sk-icon-btn', '☰', 'Kapitelübersicht', () => {
            run.view = run.view === 'menu' ? (state.transition ? 'transition' : 'step') : 'menu';
            state.collapsed = false;
            renderPanel();
        }));
        actions.appendChild(button('sk-icon-btn', state.collapsed ? '▴' : '▾',
            state.collapsed ? 'Ausklappen' : 'Einklappen', () => {
                state.collapsed = !state.collapsed;
                saveState();
                renderPanel();
            }));
        actions.appendChild(button('sk-icon-btn', '✕', 'Kurs schließen (Fortschritt bleibt gespeichert)', () => {
            state.open = false;
            saveState();
            renderPanel();
        }));
        header.appendChild(actions);
        makeDraggable(header);
        panel.appendChild(header);

        const progress = el('div', 'sk-progress');
        chapter.steps.forEach((s, i) => {
            const pip = el('span', 'sk-pip');
            if (state.done[stepId(state.chapter, i)]) pip.classList.add('sk-pip-done');
            if (i === state.step) pip.classList.add('sk-pip-active');
            pip.title = s.title;
            progress.appendChild(pip);
        });
        panel.appendChild(progress);

        if (state.collapsed) {
            const mini = el('div', 'sk-mini');
            mini.textContent = state.transition ? '💾 Projekt sichern' : `${KIND[step.kind].icon} ${step.title}`;
            mini.addEventListener('click', () => {
                state.collapsed = false;
                saveState();
                renderPanel();
            });
            panel.appendChild(mini);
            clampPanel();
            return;
        }

        const body = el('div', 'sk-body');
        if (run.view === 'menu') {
            renderMenu(body);
        } else if (run.view === 'transition') {
            renderTransition(body);
        } else if (run.view === 'done') {
            renderDone(body);
        } else {
            renderStep(body, step);
        }
        panel.appendChild(body);
        if (run.view === 'step') panel.appendChild(renderFooter(step));
        if (run.view === 'transition') panel.appendChild(renderTransitionFooter());
        if (run.view === 'done') panel.appendChild(renderDoneFooter());
        if (!wasReady) panel.appendChild(el('div', 'sk-loading', 'SolidCraft lädt noch …'));
        clampPanel();
        lastHintKey = '';
        lastResultsKey = '';
    }

    function taskList (tasks, idPrefix) {
        const list = el('ul', 'sk-tasks');
        tasks.forEach((task, i) => {
            const li = el('li', 'sk-task');
            li.dataset.index = i;
            li.appendChild(el('span', 'sk-check'));
            li.appendChild(el('span', 'sk-task-text', task.text));
            if (task.manual) {
                li.classList.add('sk-task-manual');
                li.title = 'Zum Abhaken klicken';
                li.addEventListener('click', () => {
                    const key = `${idPrefix}.${i}`;
                    state.manual[key] = !state.manual[key];
                    saveState();
                    lastResultsKey = '';
                    if (run.view === 'transition') renderPanel();
                });
            }
            list.appendChild(li);
        });
        return list;
    }

    function renderStep (body, step) {
        const kind = KIND[step.kind];
        body.appendChild(el('div', `sk-kind sk-kind-${step.kind}`, `${kind.icon} ${kind.label}`));
        body.appendChild(el('h3', 'sk-title', step.title));
        body.appendChild(el('div', 'sk-text', step.text));
        if (step.tasks && step.tasks.length) body.appendChild(taskList(step.tasks, stepId(state.chapter, state.step)));
        body.appendChild(el('div', 'sk-success'));
    }

    function renderFooter (step) {
        const footer = el('div', 'sk-footer');
        footer.appendChild(button('sk-btn sk-btn-secondary', '←', 'Zurück', () => go(-1)));
        if (step.hints && step.hints.length && step.kind !== 'info') {
            footer.appendChild(button(`sk-btn sk-btn-hint ${run.hintsOn ? 'sk-on' : ''}`,
                run.hintsOn ? '👆 Hinweise aus' : '👆 Zeig mir wie', 'Zeigt, wo du klicken musst', () => {
                    run.hintsOn = !run.hintsOn;
                    renderPanel();
                }));
        } else {
            footer.appendChild(el('span', 'sk-spacer'));
        }
        footer.appendChild(button('sk-btn sk-btn-primary sk-next', 'Weiter →', '', () => go(1)));
        return footer;
    }

    function renderMenu (body) {
        body.appendChild(el('h3', 'sk-title', 'Kapitel'));
        chapters.forEach((chapter, ci) => {
            const section = el('div', 'sk-menu-chapter');
            section.appendChild(el('div', 'sk-menu-chapter-title',
                `${ci + 1}. ${chapter.icon || ''} ${chapter.title} <span class="sk-menu-level">${chapter.type}</span>`));
            chapter.steps.forEach((s, si) => {
                const done = state.done[stepId(ci, si)];
                section.appendChild(button(`sk-menu-step ${ci === state.chapter && si === state.step ? 'sk-current' : ''}`,
                    `<span>${done ? '✅' : KIND[s.kind].icon}</span> ${s.title}`, '', () => openChapter(ci, si)));
            });
            body.appendChild(section);
        });
        body.appendChild(button('sk-btn sk-btn-secondary sk-menu-level-btn', 'Stufe neu wählen', '', showLevelDialog));
    }

    let lastResultsKey = '';
    function updatePanelTasks (results, complete) {
        if (!panel || state.collapsed || run.view !== 'step') return;
        panel.querySelectorAll('.sk-task').forEach(li => {
            li.classList.toggle('sk-task-done', !!results[li.dataset.index]);
        });
        const step = currentStep();
        const next = panel.querySelector('.sk-next');
        const success = panel.querySelector('.sk-success');
        const hasTasks = step.tasks && step.tasks.length;
        if (next) {
            next.textContent = isLastStep() ? 'Kapitel fertig ✓' : 'Weiter →';
            next.classList.toggle('sk-pulse', !!(complete && hasTasks));
            next.classList.toggle('sk-muted', !!(hasTasks && !complete));
            next.title = hasTasks && !complete ? 'Du kannst auch überspringen' : '';
        }
        if (success) {
            if (complete && hasTasks) {
                const following = nextStepInfo();
                success.innerHTML = `<b>Super gemacht! 🎉</b>${following ? `<br>Als Nächstes: ${following}` : ''}`;
                success.style.display = 'block';
            } else {
                success.style.display = 'none';
            }
        }
        clampPanel();
    }

    const isLastStep = () => state.step === currentChapter().steps.length - 1;

    function nextStepInfo () {
        if (!isLastStep()) {
            const s = currentChapter().steps[state.step + 1];
            return `${KIND[s.kind].icon} ${s.title}`;
        }
        const nc = chapters[state.chapter + 1];
        return nc ? `📘 Kapitel ${state.chapter + 2}: ${nc.title}` : '';
    }

    function go (delta) {
        const cur = currentStep();
        if (delta > 0 && !(cur.tasks && cur.tasks.length)) state.done[stepId(state.chapter, state.step)] = true;
        if (delta > 0 && isLastStep()) {
            state.done[stepId(state.chapter, state.step)] = true;
            showChapterDone();
            return;
        }
        const target = state.step + delta;
        if (target < 0) {
            if (state.chapter === 0) return;
            state.chapter--;
            state.step = currentChapter().steps.length - 1;
        } else {
            state.step = target;
        }
        enterStep();
    }

    function openChapter (ci, si) {
        state.transition = null;
        state.chapter = ci;
        state.step = si;
        enterStep();
    }

    function showChapterDone () {
        saveState();
        run.view = 'done';
        clearOverlay();
        renderPanel();
        confetti();
    }

    function renderDone (body) {
        const nextChapter = chapters[state.chapter + 1];
        body.appendChild(el('div', 'sk-trophy', '🏆'));
        body.appendChild(el('h3', 'sk-title sk-center', `Kapitel „${currentChapter().title}“ geschafft!`));
        body.appendChild(el('div', 'sk-text sk-center', nextChapter ?
            `<p>Stark! Bereit für das nächste Projekt: <b>${nextChapter.title}</b>?</p>` :
            '<p>Du hast den ganzen 3D-Kurs geschafft. Jetzt bist du ein echter Konstrukteur! 🚀</p>'));
    }

    function renderDoneFooter () {
        const nextChapter = chapters[state.chapter + 1];
        const row = el('div', 'sk-footer');
        row.appendChild(button('sk-btn sk-btn-secondary', 'Zur Übersicht', '', () => {
            run.view = 'menu';
            renderPanel();
        }));
        if (nextChapter) {
            row.appendChild(button('sk-btn sk-btn-primary', 'Weiter →', 'Projekt sichern und nächstes Kapitel starten', () => {
                state.transition = nextChapter.id;
                run.view = 'transition';
                saveState();
                renderPanel();
            }));
        }
        return row;
    }

    // ---------- Projekt sichern zwischen den Kapiteln ----------

    const TRANSITION_TASKS = [
        {text: 'Speichere dein Projekt (oben: Speichern)', manual: true, target: 'handle:appbar:save', hint: 'Hier speichern'},
        {text: 'Öffne ein neues, leeres Design (oben: +)', manual: true, target: 'handle:tab:new', hint: 'Neues Design'}
    ];

    function renderTransition (body) {
        body.appendChild(el('div', 'sk-kind sk-kind-creative', '💾 Projekt sichern'));
        body.appendChild(el('h3', 'sk-title', 'Bevor es weitergeht'));
        body.appendChild(el('div', 'sk-text', '<p>Speichere dein fertiges Projekt, damit es nicht verloren geht. ' +
            'Dann beginnst du das nächste Kapitel in einem neuen, leeren Design.</p>'));
        body.appendChild(taskList(TRANSITION_TASKS, `transition.${state.transition}`));
        requestAnimationFrame(() => panel.querySelectorAll('.sk-task').forEach(li => {
            li.classList.toggle('sk-task-done', !!state.manual[`transition.${state.transition}.${li.dataset.index}`]);
        }));
    }

    function renderTransitionFooter () {
        const footer = el('div', 'sk-footer');
        footer.appendChild(el('span', 'sk-spacer'));
        footer.appendChild(button('sk-btn sk-btn-primary', `Kapitel ${chapterIndex(state.transition) + 1} starten →`, '',
            () => openChapter(chapterIndex(state.transition), 0)));
        return footer;
    }

    function transitionHint () {
        const i = TRANSITION_TASKS.findIndex((t, k) => !state.manual[`transition.${state.transition}.${k}`]);
        return i < 0 ? null : TRANSITION_TASKS[i];
    }

    // ---------- Konfetti ----------

    function confetti () {
        if (!panel) return;
        const rect = panel.getBoundingClientRect();
        const colors = ['#E8762C', '#FFC478', '#3CB4E1', '#59C059', '#9966FF', '#FFBF00'];
        for (let i = 0; i < 40; i++) {
            const piece = el('div', 'sk-confetti');
            piece.style.left = `${rect.left + rect.width / 2}px`;
            piece.style.top = `${rect.top + 40}px`;
            piece.style.background = colors[i % colors.length];
            piece.style.setProperty('--x', `${(Math.random() - 0.5) * 420}px`);
            piece.style.setProperty('--y', `${-80 - Math.random() * 220}px`);
            piece.style.setProperty('--r', `${Math.random() * 720}deg`);
            document.body.appendChild(piece);
            setTimeout(() => piece.remove(), 1600);
        }
    }

    // ---------- Fenster verschieben ----------

    function makeDraggable (handle) {
        handle.addEventListener('pointerdown', e => {
            if (e.target.closest('button')) return;
            const start = panel.getBoundingClientRect();
            const ox = e.clientX - start.left;
            const oy = e.clientY - start.top;
            handle.setPointerCapture(e.pointerId);
            const move = ev => {
                state.pos = {x: ev.clientX - ox, y: ev.clientY - oy};
                clampPanel();
            };
            const up = () => {
                handle.removeEventListener('pointermove', move);
                handle.removeEventListener('pointerup', up);
                saveState();
            };
            handle.addEventListener('pointermove', move);
            handle.addEventListener('pointerup', up);
        });
    }

    function clampPanel () {
        if (!panel) return;
        const w = panel.offsetWidth;
        const h = panel.offsetHeight;
        // Standard: rechts unten, über der Zeitleiste.
        const pos = state.pos || {x: window.innerWidth - w - 16, y: window.innerHeight - h - 96};
        panel.style.left = `${Math.max(4, Math.min(window.innerWidth - w - 4, pos.x))}px`;
        panel.style.top = `${Math.max(4, Math.min(window.innerHeight - h - 4, pos.y))}px`;
    }

    // ---------- Stufenwahl ----------

    function showLevelDialog () {
        const old = document.querySelector('.sk-modal-backdrop');
        if (old) old.remove();
        const backdrop = el('div', 'sk-modal-backdrop');
        shield(backdrop);
        const modal = el('div', 'sk-modal');
        modal.appendChild(button('sk-modal-close', '✕', 'Schließen', () => backdrop.remove()));
        modal.appendChild(el('div', 'sk-modal-brand', 'Einführungskurs'));
        modal.appendChild(el('h2', 'sk-modal-title', '3D-Kurs starten'));
        modal.appendChild(el('p', 'sk-modal-text', 'Wie gut kennst du dich mit 3D-Konstruieren schon aus? ' +
            'Je nach Stufe startest du an einer anderen Stelle im Kurs.'));

        const grid = el('div', 'sk-level-grid');
        LEVELS.forEach(level => {
            const ci = chapterIndex(levels[level.id]);
            const card = button(`sk-level-card sk-level-${level.id}`, '', '', () => {
                backdrop.remove();
                state.started = true;
                state.open = true;
                state.collapsed = false;
                state.level = level.id;
                openChapter(ci, 0);
            });
            card.appendChild(el('div', 'sk-level-icon', level.icon));
            card.appendChild(el('div', 'sk-level-title', level.title));
            card.appendChild(el('div', 'sk-level-text', level.text));
            card.appendChild(el('div', 'sk-level-start', `Start: Kapitel ${ci + 1}`));
            grid.appendChild(card);
        });
        modal.appendChild(grid);

        if (state.started) {
            modal.appendChild(button('sk-btn sk-btn-primary sk-resume',
                `Weitermachen: Kapitel ${state.chapter + 1}, „${currentStep().title}“`, '', () => {
                    backdrop.remove();
                    state.open = true;
                    state.collapsed = false;
                    if (state.transition) {
                        run.view = 'transition';
                        renderPanel();
                    } else {
                        enterStep();
                    }
                }));
        }
        backdrop.appendChild(modal);
        backdrop.addEventListener('click', e => {
            if (e.target === backdrop) backdrop.remove();
        });
        document.body.appendChild(backdrop);
    }

    // ---------- Knopf zum Starten bzw. Wiederöffnen ----------

    let launcher;
    function updateLauncher () {
        const show = !state.open && !document.querySelector('.sk-modal-backdrop');
        if (!launcher || !document.body.contains(launcher)) {
            launcher = button('sk-launcher', '', 'Einführungskurs öffnen', () => {
                if (!state.started) {
                    showLevelDialog();
                    return;
                }
                state.open = true;
                state.collapsed = false;
                saveState();
                if (state.transition) run.view = 'transition';
                renderPanel();
            });
            shield(launcher);
            document.body.appendChild(launcher);
        }
        // Nur bei geänderter Beschriftung neu setzen – sonst verschluckt der Austausch Klicks.
        const label = state.started ? 'Kurs öffnen' : '3D-Kurs starten';
        if (launcher.dataset.label !== label) {
            launcher.dataset.label = label;
            launcher.innerHTML = `<span class="sk-launcher-icon">🎓</span><span>${label}</span>`;
        }
        launcher.style.display = show ? '' : 'none';
    }

    // ---------- Hauptschleife ----------

    let busy = false;
    let wasReady = false;
    async function tick () {
        if (busy) return;
        busy = true;
        try {
            await step();
        } finally {
            busy = false;
        }
    }

    async function step () {
        updateLauncher();
        if (!state.open) {
            if (overlay) clearOverlay();
            return;
        }
        // Im Hintergrund-Tab nichts abfragen: Anfragen würden sich sonst stauen.
        if (document.hidden) return;
        if (!panel || !document.body.contains(panel)) renderPanel();
        // Nur neu aufbauen, wenn SolidCraft wirklich gerade fertig geladen hat – ein Neuaufbau
        // ersetzt die Knöpfe und kann einen Klick verschlucken.
        if (A.ready() !== wasReady) renderPanel();
        const snap = await A.snapshot();
        if (!snap) return;
        run.snap = snap;
        if (run.needBase) {
            // Den Zustand bei Schrittbeginn merken – auch über ein Neuladen hinweg, solange es
            // dasselbe Design ist. Sonst zählte z. B. eine schon angelegte Skizze nicht mehr als neu.
            const id = stepId(state.chapter, state.step);
            const saved = state.bases[id];
            if (saved && saved.doc === snap.documentId) {
                run.base = saved.base;
            } else {
                run.base = C.makeBase(snap, chapterIgnore(snap));
                state.bases = {[id]: {doc: snap.documentId, base: run.base}};
                saveState();
            }
            run.needBase = false;
            run.at.clear();
        }
        const c = C.make(snap, run.base);

        if (run.view === 'transition') {
            const t = transitionHint();
            const pt = t && await locate(t.target, t.hint, snap);
            return pt && state.open && run.view === 'transition' ? drawPoint(pt) : clearOverlay();
        }
        if (run.view !== 'step') return clearOverlay();

        const results = evaluateTasks(c);
        const cur = currentStep();
        const hasTasks = !!(cur.tasks && cur.tasks.length);
        const complete = !hasTasks || results.every(Boolean);
        const resultsKey = `${state.chapter}.${state.step}|${results.join()}|${complete}|${state.collapsed}`;
        if (resultsKey !== lastResultsKey) {
            lastResultsKey = resultsKey;
            updatePanelTasks(results, complete);
            if (complete && hasTasks && !run.wasComplete) {
                run.wasComplete = true;
                state.done[stepId(state.chapter, state.step)] = true;
                saveState();
                renderProgressPips();
                confetti();
            }
        }

        const hint = activeHint(c);
        const target = hint && hintTarget(hint, c);
        const pt = target && await locate(target, hint.text, snap, {search: hint.search});
        // Zwischendurch kann der Schritt gewechselt haben – dann nichts Altes zeichnen.
        if (pt && state.open && run.view === 'step' && activeHint(c) === hint) drawPoint(pt);
        else clearOverlay();
    }

    // Beim ersten Schritt eines Kapitels merken, welche Körper schon im Design liegen (z. B. vom
    // vorigen Kapitel) – die Prüfungen des Kapitels sehen sie dann nicht.
    function chapterIgnore (snap) {
        const id = currentChapter().id;
        let rec = state.chapterBodies[id];
        if (state.step === 0 && (!rec || rec.doc !== snap.documentId)) {
            rec = {doc: snap.documentId, names: ((snap.doc && snap.doc.bodies) || []).map(b => b.name)};
            state.chapterBodies = {...state.chapterBodies, [id]: rec};
            saveState();
        }
        return rec && rec.doc === snap.documentId ? rec.names : [];
    }

    function renderProgressPips () {
        if (!panel) return;
        panel.querySelectorAll('.sk-pip').forEach((pip, i) => {
            pip.classList.toggle('sk-pip-done', !!state.done[stepId(state.chapter, i)]);
        });
    }

    window.addEventListener('resize', () => {
        clampPanel();
        lastHintKey = '';
    });

    // Ein anderer SolidCraft-Tab hat den Fortschritt gespeichert → hier übernehmen.
    window.addEventListener('storage', e => {
        if (e.key !== STATE_KEY || e.newValue === null) return;
        const before = `${state.chapterId}|${state.step}|${state.transition}`;
        const loaded = loadState();
        Object.keys(state).forEach(key => delete state[key]);
        Object.assign(state, loaded);
        if (`${state.chapterId}|${state.step}|${state.transition}` === before) {
            // Nur Haken oder Fensterlage geändert: neu zeichnen, nichts speichern.
            lastResultsKey = '';
            renderPanel();
            return;
        }
        run.view = state.transition ? 'transition' : 'step';
        if (state.transition) renderPanel();
        else enterStep();
    });

    // Rechtsklick aufs Erweiterungs-Symbol → „Lernfortschritt zurücksetzen“ (background.js)
    window.addEventListener('solidcraft-kurs-reset', () => {
        try {
            localStorage.removeItem(STATE_KEY);
        } catch (e) { /* egal */ }
        Object.keys(state).forEach(key => delete state[key]);
        Object.assign(state, loadState());
        run.needBase = true;
        run.view = 'step';
        lastResultsKey = '';
        lastHintKey = '';
        const dialog = document.querySelector('.sk-modal-backdrop');
        if (dialog) dialog.remove();
        renderPanel();
    });

    // Für den End-to-End-Test und zur Fehlersuche in der Konsole.
    window.SolidcraftKurs = {state, run, showLevelDialog, openChapter};

    setInterval(tick, TICK_MS);
})();
