/*
 * Vorleser: spielt die mitgelieferte MP3-Datei eines Schritts (audio/<sprache>/…) ab. Fehlt sie,
 * passt sie nicht mehr zum Text (Hash in audio/manifest.json) oder lässt sie sich nicht laden,
 * liest die Sprachausgabe des Browsers denselben Text vor.
 *
 * create({base, manifest, Audio, synth, Utterance, onChange})
 *   base()      Adresse der Erweiterung ('chrome-extension://…/') oder null
 *   manifest()  Promise auf {lang: {key: hash}} oder null
 *   onChange(playing)  wird bei Start und Ende aufgerufen
 *   onUnavailable()    keine Aufnahme und keine lokale Stimme – es kann nicht vorgelesen werden
 * item: {lang, key, file, text, hash} – siehe course/speech.js
 */
(function () {
    'use strict';

    const VOICE_LANG = {de: 'de-DE', en: 'en-US'};

    function create ({base, manifest, Audio, synth, Utterance, onChange, onUnavailable}) {
        let audio = null;
        let speaking = false;
        let token = 0;
        let manifestPromise = null;

        const notify = () => onChange && onChange(playing());
        const playing = () => !!(audio && !audio.paused) || speaking;

        function stop () {
            token++;
            if (audio) audio.pause();
            audio = null;
            if (synth) synth.cancel();
            speaking = false;
            notify();
        }

        // Stimmen laden im Browser oft erst nach dem ersten Aufruf (Ereignis voiceschanged).
        function voicesReady () {
            const now = (synth.getVoices && synth.getVoices()) || [];
            if (now.length || !synth.addEventListener) return Promise.resolve(now);
            return new Promise(resolve => {
                const done = () => {
                    clearTimeout(timer);
                    if (synth.removeEventListener) synth.removeEventListener('voiceschanged', done);
                    resolve(synth.getVoices() || []);
                };
                const timer = setTimeout(done, 1500);
                synth.addEventListener('voiceschanged', done);
            });
        }

        async function speak (item, my) {
            if (my !== token) return;
            if (!synth || !Utterance) return unavailable();
            // Nur lokale Stimmen: Online-Stimmen (z. B. „Google Deutsch“) schicken den Text an einen
            // Server. Ohne bestätigte lokale Stimme wird nicht vorgelesen.
            const voices = await voicesReady();
            if (my !== token) return;
            const voice = voices.find(v => v.localService && (v.lang || '').toLowerCase().startsWith(item.lang));
            if (!voice) return unavailable();
            const u = new Utterance(item.text);
            u.lang = VOICE_LANG[item.lang] || item.lang;
            u.voice = voice;
            u.rate = 0.95;
            u.onend = u.onerror = () => {
                if (my !== token) return;
                speaking = false;
                notify();
            };
            speaking = true;
            synth.speak(u);
            notify();
        }

        function unavailable () {
            if (onUnavailable) onUnavailable();
        }

        async function play (item) {
            stop();
            const my = token;
            const root = base();
            // Nur ein erfolgreich geladenes Manifest merken – sonst beim nächsten Mal neu versuchen.
            if (!manifestPromise) {
                manifestPromise = Promise.resolve(manifest()).catch(() => null)
                    .then(m => { if (!m) manifestPromise = null; return m; });
            }
            const m = await manifestPromise;
            if (my !== token) return;
            const fresh = root && Audio && m && m[item.lang] && m[item.lang][item.key] === item.hash;
            if (!fresh) return speak(item, my);
            const a = new Audio(root + item.file);
            audio = a;
            a.addEventListener('ended', () => {
                if (audio === a) audio = null;
                notify();
            });
            a.addEventListener('error', () => {
                if (audio !== a) return;
                audio = null;
                speak(item, my);
            });
            const started = a.play();
            notify();   // läuft schon, auch wenn play() erst nach dem Laden fertig ist
            try {
                await started;
            } catch (e) {
                if (audio === a) {
                    audio = null;
                    speak(item, my);
                }
                return;
            }
            notify();
        }

        function current () {
            if (audio && !audio.paused) return {mode: 'file', src: audio.src};
            return speaking ? {mode: 'speech', src: null} : null;
        }

        return {play, stop, playing, current};
    }

    window.SolidcraftKursReader = {create};
})();
