"""Erzeugt MP3-Sprachdateien mit Piper (offline, freie Stimmen).

Aufruf (macht tools/build-audio.mjs):
    python tools/tts.py <voices-dir> <jobs.json>
jobs.json (UTF-8): [{"lang": "de", "voice": "de_DE-thorsten-high", "text": "...", "out": "audio/de/x-01.mp3"}, ...]

Benötigt: pip install piper-tts lameenc
"""
import io
import json
import os
import re
import sys
import wave

import lameenc
from piper import PiperVoice, SynthesisConfig

# Typische Reste falsch dekodierter Umlaute (UTF-8 als cp1252 gelesen)
MOJIBAKE = re.compile("Ã.|Â.|â€")

PAUSE_S = 0.35        # Pause zwischen Sätzen
BITRATE = 32          # kbit/s, mono – reicht für Sprache
SPEED = {"de": 1.08, "en": 1.05}   # length_scale > 1 = etwas langsamer (Kinder)


def synth(voice, text, lang):
    cfg = SynthesisConfig(length_scale=SPEED.get(lang, 1.0))
    rate = voice.config.sample_rate
    pause = b"\x00\x00" * int(rate * PAUSE_S)
    pcm = io.BytesIO()
    for chunk in voice.synthesize(text, syn_config=cfg):
        pcm.write(chunk.audio_int16_bytes)
        pcm.write(pause)
    enc = lameenc.Encoder()
    enc.set_bit_rate(BITRATE)
    enc.set_in_sample_rate(rate)
    enc.set_channels(1)
    enc.set_quality(2)
    return enc.encode(pcm.getvalue()) + enc.flush()


def main():
    voices_dir, jobs_file = sys.argv[1], sys.argv[2]
    # Ausdrücklich UTF-8: Unter Windows wäre sonst cp1252 Standard, und aus „ö“ würde „Ã¶“ –
    # die Stimme sagt dann „A Tilde Absatz“.
    with open(jobs_file, encoding="utf-8") as f:
        jobs = json.load(f)
    for job in jobs:
        if MOJIBAKE.search(job["text"]):
            sys.exit(f"Kaputte Zeichen (Kodierung) in {job['out']}: {MOJIBAKE.search(job['text']).group(0)!r}")
    loaded = {}
    for i, job in enumerate(jobs, 1):
        name = job["voice"]
        if name not in loaded:
            loaded[name] = PiperVoice.load(os.path.join(voices_dir, name + ".onnx"))
        data = synth(loaded[name], job["text"], job["lang"])
        os.makedirs(os.path.dirname(job["out"]), exist_ok=True)
        with open(job["out"], "wb") as f:
            f.write(data)
        print(f"[{i}/{len(jobs)}] {job['out']} ({len(data) // 1024} KB)", flush=True)


if __name__ == "__main__":
    main()
