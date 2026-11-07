/*
 * Sprachen des Kurses.
 *
 * Jede Sprache ist eine Datei i18n/<code>.js, die sich in window.SolidcraftKursLang einträgt:
 *   ui       Texte der Oberfläche des Kurses (Schlüssel → Text, Platzhalter {name})
 *   labels   Beschriftungen von SolidCraft in dieser Sprache: tabs, panels (für Hinweise wie
 *            „Klicke auf „Erstellen ▾““)
 *   course   (nicht für Deutsch) chapters: {<kapitel-id>: {title, type, steps: [{title, text}, …]}}
 *   phrases  (nicht für Deutsch) deutscher Kurztext → Übersetzung, für alle Aufgaben- und
 *            Hinweistexte und Suchbegriffe. Gleiche Texte (z. B. „Klicke auf „Neue Skizze““)
 *            werden so nur einmal übersetzt.
 *
 * Deutsch ist die Quellsprache: die Kursinhalte stehen auf Deutsch in course/course-data.js.
 * Welche Sprache gilt, entscheidet SolidCraft selbst (ui.prefs.language bzw. die Browsersprache),
 * damit die Button-Namen in den Texten zur Oberfläche passen. Im Kursmenü lässt sie sich ändern.
 * Fehlt eine Übersetzung, meldet `npm run check` die Stelle.
 */
(function () {
    'use strict';

    const SOURCE = 'de';
    const FALLBACK = 'en';
    const langs = () => window.SolidcraftKursLang || {};
    let current = SOURCE;

    // SolidCraft-Einstellung (z. B. 'system', 'de', 'en-GB') bzw. Browsersprache → Kurssprache.
    function detect (pref, nav) {
        const code = pref && pref !== 'system' ? pref : nav;
        const base = String(code || '').slice(0, 2).toLowerCase();
        return langs()[base] ? base : FALLBACK;
    }

    function setLang (lang) {
        current = langs()[lang] ? lang : SOURCE;
    }

    function t (key, vars) {
        const pick = l => langs()[l] && langs()[l].ui && langs()[l].ui[key];
        const text = pick(current) || pick(SOURCE) || key;
        return text.replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
    }

    function label (kind, key) {
        const pick = l => langs()[l] && langs()[l].labels && langs()[l].labels[kind] && langs()[l].labels[kind][key];
        return pick(current) || pick(SOURCE) || key;
    }

    // Kurs in eine Sprache übersetzen. Prüf-Funktionen und Ziele bleiben dieselben Objekte.
    function localize (course, lang) {
        const L = langs()[lang];
        if (lang === SOURCE || !L || !L.course) return course;
        const phrase = s => (s && L.phrases && L.phrases[s]) || s;
        const chapters = course.chapters.map(ch => {
            const tc = L.course.chapters[ch.id] || {};
            return {
                ...ch,
                title: tc.title || ch.title,
                type: tc.type || ch.type,
                steps: ch.steps.map((step, i) => {
                    const ts = (tc.steps || [])[i] || {};
                    return {
                        ...step,
                        title: ts.title || step.title,
                        text: ts.text || step.text,
                        tasks: step.tasks && step.tasks.map(task => ({...task, text: phrase(task.text)})),
                        hints: step.hints && step.hints.map(h => ({...h, text: phrase(h.text), search: phrase(h.search)}))
                    };
                })
            };
        });
        return {...course, chapters};
    }

    // Was fehlt in einer Sprache? (für npm run check und die Tests)
    function missing (course, lang) {
        const L = langs()[lang];
        const S = langs()[SOURCE];
        if (!L) return [`Sprache „${lang}“ fehlt`];
        const problems = [];
        for (const key of Object.keys(S.ui)) if (!(L.ui && L.ui[key])) problems.push(`${lang}: Oberflächentext „${key}“ fehlt`);
        for (const kind of Object.keys(S.labels)) {
            for (const key of Object.keys(S.labels[kind])) {
                if (!(L.labels && L.labels[kind] && L.labels[kind][key])) problems.push(`${lang}: Beschriftung ${kind}.${key} fehlt`);
            }
        }
        if (lang === SOURCE) return problems;
        const phrases = L.phrases || {};
        for (const ch of course.chapters) {
            const tc = L.course && L.course.chapters && L.course.chapters[ch.id];
            if (!tc || !tc.title || !tc.type) problems.push(`${lang}: Kapitel „${ch.id}“: title/type fehlt`);
            ch.steps.forEach((step, i) => {
                const ts = tc && tc.steps && tc.steps[i];
                if (!ts || !ts.title || !ts.text) problems.push(`${lang}: Kapitel „${ch.id}“ Schritt ${i + 1}: title/text fehlt`);
                const shorts = [...(step.tasks || []).map(x => x.text), ...(step.hints || []).map(x => x.text),
                    ...(step.hints || []).map(x => x.search).filter(Boolean)];
                for (const s of shorts) if (!phrases[s]) problems.push(`${lang}: Kurztext „${s}“ fehlt (phrases)`);
            });
        }
        return [...new Set(problems)];
    }

    window.SolidcraftKursI18n = {
        SOURCE, detect, setLang, t, label, localize, missing,
        lang: () => current,
        langs: () => Object.keys(langs()),
        name: code => (langs()[code] && langs()[code].name) || code
    };
})();
