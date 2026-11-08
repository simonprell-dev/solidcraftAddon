/*
 * Kleine Regeln dafür, wo Hand und Sprechblase hinzeigen.
 *
 * pickSpot(spots, viewport, avoid)
 *   Wählt aus möglichen Stellen für die Sprechblase die erste, die ganz im Fenster liegt und weder
 *   ein gemiedenes Rechteck (Kursfenster) noch einen gemiedenen Punkt (OK/Abbrechen im Dialog)
 *   verdeckt. Passt keine, die erste, die ins Fenster passt.
 *
 * afterTyping(hint, {shownAt, typedAt, now, hasOk, okText, c})
 *   SolidCraft verrät nicht, was in einem Dialogfeld steht. Zeigt die Hand auf ein Dialogfeld und
 *   das Kind hat seitdem getippt (und kurz aufgehört), zeigt sie stattdessen auf „OK“.
 */
(function () {
    'use strict';

    const TYPING_PAUSE_MS = 1200;
    const BUTTONS = /^dialog:(ok|cancel|close|apply)$/i;

    const inside = (r, vp) => r.left >= 0 && r.top >= 0 && r.right <= vp.width && r.bottom <= vp.height;
    const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    // Punkte großzügig als kleines Feld meiden (Knöpfe sind etwa 70 × 28 px).
    const around = p => ({left: p.x - 40, right: p.x + 40, top: p.y - 18, bottom: p.y + 18});

    function pickSpot (spots, viewport, avoid = {}) {
        const blocked = [...(avoid.rects || []), ...(avoid.points || []).map(around)];
        return spots.find(r => inside(r, viewport) && !blocked.some(b => overlaps(r, b))) ||
            spots.find(r => inside(r, viewport)) || spots[0];
    }

    function targetOf (hint, c) {
        if (typeof hint.target !== 'function') return String(hint.target || '');
        try {
            return String(hint.target(c) || '');
        } catch (e) {
            return '';
        }
    }

    function afterTyping (hint, {shownAt, typedAt, now, hasOk, okText, c}) {
        if (!hint || !hasOk || !typedAt || typedAt <= shownAt || now - typedAt < TYPING_PAUSE_MS) return hint;
        const target = targetOf(hint, c);
        if (!target.startsWith('dialog:') || BUTTONS.test(target)) return hint;
        return {target: 'dialog:OK', text: okText, done: hint.done};
    }

    window.SolidcraftKursHintFlow = {pickSpot, afterTyping, TYPING_PAUSE_MS};
})();
