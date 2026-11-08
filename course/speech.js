/*
 * Vorlesen: aus einem Kursschritt den Text machen, der gesprochen wird.
 *
 * Dieselbe Funktion nutzen tools/build-audio.mjs (erzeugt die MP3-Dateien unter audio/<sprache>/)
 * und course.js (spielt sie ab oder liest – falls eine Datei fehlt oder veraltet ist – mit der
 * Sprachausgabe des Browsers vor). hash() verrät, ob eine Audiodatei noch zum Text passt.
 */
(function () {
    'use strict';

    const WORDS = {
        de: {tasks: 'Deine Aufgaben:', times: 'mal', then: ', dann ', and: 'und', mm: 'Millimeter', deg: 'Grad',
            to: 'bis', plus: 'plus', minus: 'minus', equals: 'gleich',
            subs: [[/\bz\. ?B\./g, 'zum Beispiel'], [/\bd\. ?h\./g, 'das heißt'], [/\bca\./g, 'circa'], [/\bggf\./g, 'gegebenenfalls']]},
        en: {tasks: 'Your tasks:', times: 'by', then: ', then ', and: 'and', mm: 'millimeters', deg: 'degrees',
            to: 'to', plus: 'plus', minus: 'minus', equals: 'equals',
            subs: [[/\be\.g\./g, 'for example'], [/\bi\.e\./g, 'that is'], [/\bapprox\./g, 'approximately']]}
    };

    const ENTITIES = {'&nbsp;': ' ', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': '\''};

    // HTML → Sätze: Absätze und Listenpunkte enden mit einem Punkt.
    function plain (html, w) {
        return String(html || '')
            .replace(/<\/(p|li|h\d|div)>/gi, '. ')
            .replace(/<br\s*\/?>/gi, '. ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&amp;/g, ` ${w.and} `)
            .replace(/&[a-z#0-9]+;/gi, e => ENTITIES[e] || ' ');
    }

    function speakable (s, w) {
        for (const [re, to] of w.subs) s = s.replace(re, to);
        return s
            .replace(/\p{Extended_Pictographic}|\u{FE0F}|\u{200D}/gu, '')
            .replace(/(\p{L})[’'](\p{L})/gu, "$1'$2")
            .replace(/[„“”"«»‚‘’]/g, '')
            .replace(/[▾▴▸◂…]/g, '')
            // Bereich: Halbgeviertstrich oder Bindestrich ohne Leerzeichen („2–5“, „2-5“);
            // „10 - 4“ und „10 − 4“ sind Rechnungen.
            .replace(/(\d)\s*–\s*(\d)/g, `$1 ${w.to} $2`)
            .replace(/(\d)-(\d)/g, `$1 ${w.to} $2`)
            .replace(/(\d)\s*\+\s*(\d)/g, `$1 ${w.plus} $2`)
            .replace(/(\d)\s*[−-]\s*(\d)/g, `$1 ${w.minus} $2`)
            .replace(/\s*=\s*/g, ` ${w.equals} `)
            .replace(/\b(\d)D\b/g, '$1 D')
            .replace(/\s*→\s*/g, w.then)
            .replace(/(\d)\s*×\s*(\d)/g, `$1 ${w.times} $2`)
            .replace(/(\d)\s*mm\b/g, `$1 ${w.mm}`)
            .replace(/(\d)\s*°/g, `$1 ${w.deg}`)
            .replace(/\b(STL|DXF|SVG|STEP|PLA|CAD)\b/g, m => m.split('').join(' '))
            .replace(/\b([XYZ])([XYZ])\b/g, '$1 $2')
            .replace(/\s+–\s+/g, ', ')
            .replace(/\s+/g, ' ')
            .replace(/\s+([.,:;!?])/g, '$1')
            .replace(/([.!?:])(\s*\.)+/g, '$1')
            .replace(/,\s*\./g, '.')
            .trim();
    }

    const sentence = s => s && !/[.!?:]$/.test(s) ? s + '.' : s;

    function text (step, lang) {
        const w = WORDS[lang] || WORDS.en;
        const parts = [sentence(speakable(plain(step.title, w), w)), sentence(speakable(plain(step.text, w), w))];
        const tasks = (step.tasks || []).map(t => sentence(speakable(plain(t.text, w), w))).filter(Boolean);
        if (tasks.length) parts.push(w.tasks + ' ' + tasks.join(' '));
        return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    }

    // FNV-1a, 32 Bit – genügt, um geänderte Texte zu erkennen.
    function hash (s) {
        let h = 0x811c9dc5;
        for (const ch of String(s)) {
            const code = ch.codePointAt(0);
            h ^= code & 0xff;
            h = Math.imul(h, 0x01000193) >>> 0;
            if (code > 0xff) {
                h ^= code >>> 8;
                h = Math.imul(h, 0x01000193) >>> 0;
            }
        }
        return h.toString(16).padStart(8, '0');
    }

    const file = (lang, chapterId, index) => `audio/${lang}/${chapterId}-${String(index + 1).padStart(2, '0')}.mp3`;

    window.SolidcraftKursSpeech = {text, hash, file};
})();
