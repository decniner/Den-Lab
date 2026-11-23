#!/usr/bin/env python3
"""Bundle offline Japanese audio for every Kanji listening sample."""

import hashlib
import json
import re
import subprocess
import tempfile
import unicodedata
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro import KPipeline

PROJECT = Path(__file__).resolve().parents[1]
source = (PROJECT / "src/data/kanji-listening.js").read_text()
match = re.search(r"globalThis\.SAKURA_KANJI_LISTENING=Object\.freeze\((\[.*?\])\);", source, re.S)
if not match:
    raise SystemExit("Could not find SAKURA_KANJI_LISTENING in src/data/kanji-listening.js")
items = json.loads(match.group(1))
manifest_path = PROJECT / "src/speech-audio-manifest.json"
manifest = json.loads(manifest_path.read_text())
audio_dir = PROJECT / "audio/speech"
audio_dir.mkdir(parents=True, exist_ok=True)


def audio_key(text):
    return re.sub(r"\s+", "", unicodedata.normalize("NFC", text))


phrases = []
FEMALE_VOICES = ("jf_alpha", "jf_gongitsune", "jf_tebukuro")
for item in items:
    key = audio_key(item["kanji"])
    spoken_text = item.get("audioText", item["kana"])
    phoneme_replacements = item.get("audioPhonemeReplacements", [])
    override_key = json.dumps(phoneme_replacements, ensure_ascii=False, separators=(",", ":"))
    fingerprint = f"{key}|{spoken_text}"
    if phoneme_replacements:
        fingerprint += f"|{override_key}"
    filename = f"ja-{hashlib.sha256(fingerprint.encode('utf-8')).hexdigest()[:14]}.mp3"
    destination = audio_dir / filename
    phrases.append((key, spoken_text, phoneme_replacements, filename, destination))

pipeline = KPipeline(lang_code="j")
def synthesize(spoken_text, replacements, voice):
    if replacements:
        phonemes, _ = pipeline.g2p(spoken_text)
        for replacement in replacements:
            phonemes, count = re.subn(re.escape(replacement["from"]), replacement["to"], phonemes, count=1)
            if count != 1:
                raise RuntimeError(f"Pronunciation override did not match Kokoro phonemes: {replacement}")
        return [np.asarray(result.audio) for result in pipeline.generate_from_tokens(phonemes, voice=voice, speed=0.9)]
    return [np.asarray(audio) for _, _, audio in pipeline(spoken_text, voice=voice, speed=0.9)]

with tempfile.TemporaryDirectory(prefix="sakura-kanji-listening-") as tmp:
    wav = Path(tmp) / "kanji-listening.wav"
    for index, (key, spoken_text, replacements, filename, destination) in enumerate(phrases, 1):
        voice_paths = {}
        for voice in FEMALE_VOICES:
            variant_filename = filename if voice == "jf_alpha" else f"ja-{hashlib.sha256(f'{key}|{spoken_text}|{json.dumps(replacements, ensure_ascii=False)}|{voice}'.encode('utf-8')).hexdigest()[:14]}.mp3"
            variant_destination = audio_dir / variant_filename
            voice_paths[voice] = f"./audio/speech/{variant_filename}"
            if not variant_destination.exists():
                chunks = synthesize(spoken_text, replacements, voice)
                if not chunks:
                    raise RuntimeError(f"Kokoro returned no audio for: {key} ({voice})")
                sf.write(wav, np.concatenate(chunks), 24000)
                subprocess.run([
                    "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(wav),
                    "-ac", "1", "-ar", "24000", "-codec:a", "libmp3lame", "-b:a", "48k", str(variant_destination),
                ], check=True)
        manifest[key] = {"src": voice_paths["jf_alpha"], "pitch": [], "voices": voice_paths}
        if index % 20 == 0 or index == len(phrases):
            print(f"Bundled voice variants for {index}/{len(phrases)} kanji clips", flush=True)

manifest_json = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
(PROJECT / "src/speech-audio-manifest.json").write_text(manifest_json)
(PROJECT / "src/speech-audio-manifest.js").write_text(
    "globalThis.SAKURA_AUDIO=Object.freeze(" + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ");\n"
)

worker_path = PROJECT / "sw.js"
worker = worker_path.read_text()
assets = sorted({asset for entry in manifest.values() for asset in [entry["src"], *entry.get("voices", {}).values()]})
declaration = "const AUDIO_ASSETS = [\n" + "".join(f"  '{asset}',\n" for asset in assets) + "];"
worker, count = re.subn(r"const AUDIO_ASSETS = \[.*?\];", declaration, worker, count=1, flags=re.S)
if count != 1:
    raise SystemExit("Could not update AUDIO_ASSETS in sw.js")
worker_path.write_text(worker)
print(f"Bundled three voices for {len(items)} kanji listening samples.")
