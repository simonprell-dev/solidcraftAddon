/*
 * Stylesheet des Kurses (Kursfenster, Hand, Sprechblase, Konfetti, Start-Knopf).
 *
 * Der Kurs fügt es selbst als <style id="sk-style"> ein, statt sich auf das Einfügen per
 * registerContentScripts zu verlassen: Das ging in Tests in etwa jedem fünften frischen Browser
 * schief (Skripte liefen, CSS fehlte – der Start-Knopf lag dann unsichtbar unter SolidCraft).
 * ensure() prüft das bei jedem Takt erneut.
 */
(function () {
    'use strict';

    const CSS = `
/* Einführungskurs für SolidCraft – Kursfenster, Hand, Sprechblase, Konfetti.
   SolidCraft zeichnet alles in ein <canvas>; alles hier liegt darüber. */

.sk-panel, .sk-modal, .sk-launcher, .sk-bubble {
    --sk-orange: #E8762C;
    --sk-orange-dark: #B85A1C;
    --sk-ink: #1F2430;
    --sk-muted: #5F6675;
    --sk-bg: #FFFFFF;
    --sk-soft: #FFF4EA;
    --sk-green: #2E9E4F;
    font: 14px/1.45 system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--sk-ink);
    box-sizing: border-box;
}
.sk-panel *, .sk-modal * { box-sizing: border-box; }

/* ---------- Kursfenster ---------- */

.sk-panel {
    position: fixed;
    z-index: 10000;
    width: 340px;
    max-height: calc(100vh - 16px);
    display: flex;
    flex-direction: column;
    background: var(--sk-bg);
    border-radius: 14px;
    box-shadow: 0 10px 34px rgba(0, 0, 0, 0.35);
    overflow: hidden;
}
.sk-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 10px 8px 14px;
    background: var(--sk-orange);
    color: #fff;
    cursor: move;
    user-select: none;
    touch-action: none;
}
.sk-header-titles { flex: 1; min-width: 0; }
.sk-header-brand { font-weight: 700; font-size: 15px; }
.sk-header-sub { font-size: 12px; opacity: 0.92; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sk-header-actions { display: flex; gap: 2px; }
.sk-icon-btn {
    border: 0; background: transparent; color: #fff; font-size: 16px;
    width: 30px; height: 30px; border-radius: 8px; cursor: pointer;
}
.sk-icon-btn:hover { background: rgba(255, 255, 255, 0.2); }

.sk-progress { display: flex; gap: 3px; padding: 6px 14px; background: var(--sk-soft); }
.sk-pip { flex: 1; height: 6px; border-radius: 3px; background: #E5D6C8; }
.sk-pip-done { background: var(--sk-green); }
.sk-pip-active { outline: 2px solid var(--sk-orange); outline-offset: 1px; }

.sk-mini { padding: 10px 14px; cursor: pointer; font-weight: 600; }
.sk-body { padding: 12px 16px 6px; overflow-y: auto; }
.sk-kind {
    display: inline-block; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 10px;
    background: var(--sk-soft); color: var(--sk-orange-dark);
}
.sk-kind-challenge { background: #FFF3C4; color: #8A6500; }
.sk-kind-creative { background: #F0E6FF; color: #6B3FB8; }
.sk-title { margin: 8px 0 6px; font-size: 18px; line-height: 1.25; }
.sk-text p { margin: 0 0 8px; }
.sk-text ul { margin: 0 0 8px; padding-left: 20px; }
.sk-text b { color: var(--sk-orange-dark); }
.sk-center { text-align: center; }
.sk-soon { color: var(--sk-muted); font-size: 12px; margin-top: 10px; }

.sk-tasks { list-style: none; margin: 10px 0 6px; padding: 0; }
.sk-task { display: flex; gap: 8px; align-items: flex-start; padding: 6px 4px; border-radius: 8px; }
.sk-task-manual { cursor: pointer; }
.sk-task-manual:hover { background: var(--sk-soft); }
.sk-check {
    flex: none; width: 20px; height: 20px; border-radius: 6px; border: 2px solid #C9CDD6; margin-top: 1px;
    display: flex; align-items: center; justify-content: center; font-size: 13px; color: #fff;
}
.sk-task-done .sk-check { background: var(--sk-green); border-color: var(--sk-green); }
.sk-task-done .sk-check::after { content: "✓"; }
.sk-task-done .sk-task-text { color: var(--sk-muted); text-decoration: line-through; }

.sk-success {
    display: none; margin: 8px 0; padding: 8px 10px; border-radius: 10px;
    background: #E6F6EA; color: #1C6B35;
}
.sk-loading { padding: 6px 16px 10px; color: var(--sk-muted); font-size: 12px; }

.sk-footer { display: flex; gap: 8px; align-items: center; padding: 10px 16px 14px; }
.sk-spacer { flex: 1; }
.sk-btn {
    border: 0; border-radius: 10px; padding: 8px 12px; font: inherit; font-weight: 600; cursor: pointer;
}
.sk-btn-primary { background: var(--sk-orange); color: #fff; margin-left: auto; }
.sk-btn-primary:hover { background: var(--sk-orange-dark); }
.sk-btn-secondary { background: #EEF0F4; color: var(--sk-ink); }
.sk-btn-hint { background: var(--sk-soft); color: var(--sk-orange-dark); flex: 1; }
.sk-btn-hint.sk-on { background: #FFE2C9; }
.sk-muted { opacity: 0.55; }
.sk-pulse { animation: sk-pulse 1.2s ease-in-out infinite; }
@keyframes sk-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(232, 118, 44, 0.6); }
    50% { box-shadow: 0 0 0 8px rgba(232, 118, 44, 0); }
}

.sk-menu-chapter { margin-bottom: 10px; }
.sk-menu-chapter-title { font-weight: 700; margin: 6px 0; }
.sk-menu-level { font-size: 11px; font-weight: 600; color: var(--sk-muted); margin-left: 6px; }
.sk-menu-step {
    display: flex; gap: 8px; width: 100%; text-align: left; border: 0; background: transparent;
    padding: 5px 8px; border-radius: 8px; font: inherit; cursor: pointer; color: var(--sk-ink);
}
.sk-menu-step:hover { background: var(--sk-soft); }
.sk-current { background: #FFE2C9; font-weight: 600; }
.sk-menu-level-btn { width: 100%; margin: 6px 0 10px; }
.sk-trophy { font-size: 56px; text-align: center; margin-top: 8px; }

/* ---------- Hand, Ring, Sprechblase ---------- */

.sk-overlay { position: fixed; inset: 0; z-index: 9999; pointer-events: none; }
.sk-ring {
    position: fixed; width: 44px; height: 44px; border-radius: 50%;
    border: 3px solid var(--sk-orange, #E8762C);
    box-shadow: 0 0 0 4px rgba(232, 118, 44, 0.25);
    animation: sk-ring 1.3s ease-out infinite;
}
@keyframes sk-ring {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(1.35); opacity: 0.2; }
}
.sk-hand {
    position: fixed; font-size: 34px; line-height: 1;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.45));
    animation: sk-tap 1s ease-in-out infinite;
}
.sk-hand-down { animation-name: sk-tap-down; }
@keyframes sk-tap { 0%, 100% { transform: translateY(6px); } 50% { transform: translateY(-2px); } }
@keyframes sk-tap-down { 0%, 100% { transform: translateY(-6px); } 50% { transform: translateY(2px); } }
.sk-bubble {
    position: fixed; max-width: 240px; padding: 8px 12px; border-radius: 12px;
    background: #1F2430; color: #fff; font-weight: 600;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

/* ---------- Start-/Wiederöffnen-Knopf ---------- */

.sk-launcher {
    position: fixed; z-index: 10000; left: 50%; bottom: 18px; transform: translateX(-50%);
    display: flex; gap: 8px; align-items: center;
    border: 0; border-radius: 22px; padding: 9px 18px;
    background: var(--sk-orange); color: #fff; font-weight: 700; cursor: pointer;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
}
.sk-launcher:hover { background: var(--sk-orange-dark); }
.sk-launcher-icon { font-size: 18px; }

/* ---------- Stufenwahl ---------- */

.sk-modal-backdrop {
    position: fixed; inset: 0; z-index: 10001; background: rgba(15, 18, 26, 0.6);
    display: flex; align-items: center; justify-content: center; padding: 16px;
}
.sk-modal {
    position: relative; width: min(760px, 100%); max-height: calc(100vh - 32px); overflow-y: auto;
    background: #fff; border-radius: 18px; padding: 24px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.sk-modal-close {
    position: absolute; right: 12px; top: 12px; border: 0; background: #EEF0F4;
    width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 15px;
}
.sk-modal-brand { color: var(--sk-orange); font-weight: 700; }
.sk-modal-title { margin: 4px 0 6px; font-size: 24px; }
.sk-modal-text { margin: 0 0 16px; color: var(--sk-muted); }
.sk-level-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }
.sk-level-card {
    text-align: left; border: 2px solid #EEF0F4; background: #fff; border-radius: 14px; padding: 14px;
    font: inherit; cursor: pointer; color: var(--sk-ink);
}
.sk-level-card:hover { border-color: var(--sk-orange); background: var(--sk-soft); }
.sk-level-icon { font-size: 30px; }
.sk-level-title { font-weight: 700; font-size: 16px; margin: 4px 0; }
.sk-level-text { color: var(--sk-muted); font-size: 13px; }
.sk-level-start { margin-top: 10px; font-weight: 600; color: var(--sk-orange-dark); font-size: 13px; }
.sk-resume { display: block; width: 100%; margin-top: 16px; }

/* ---------- Konfetti ---------- */

.sk-confetti {
    position: fixed; z-index: 10003; width: 8px; height: 12px; border-radius: 2px; pointer-events: none;
    animation: sk-confetti 1.5s cubic-bezier(0.2, 0.7, 0.4, 1) forwards;
}
@keyframes sk-confetti {
    0% { transform: translate(0, 0) rotate(0); opacity: 1; }
    60% { opacity: 1; }
    100% { transform: translate(var(--x), calc(var(--y) + 320px)) rotate(var(--r)); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
    .sk-ring, .sk-hand, .sk-pulse, .sk-confetti { animation: none; }
}
`;

    function ensure () {
        if (document.getElementById('sk-style')) return;
        const style = document.createElement('style');
        style.id = 'sk-style';
        style.textContent = CSS;
        (document.head || document.documentElement).appendChild(style);
    }

    ensure();
    window.SolidcraftKursStyle = {ensure};
})();
