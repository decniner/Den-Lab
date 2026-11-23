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
for item in items:
    key = audio_key(item["kanji"])
    fingerprint = f"{key}|{item['kana']}"
    filename = f"ja-{hashlib.sha256(fingerprint.encode('utf-8')).hexdigest()[:14]}.mp3"
    destination = audio_dir / filename
    phrases.append((key, item["kana"], filename, destination))

missing = [item for item in phrases if not item[3].exists()]
if missing:
    pipeline = KPipeline(lang_code="j")
    with tempfile.TemporaryDirectory(prefix="sakura-kanji-listening-") as tmp:
        wav = Path(tmp) / "kanji-listening.wav"
        for index, (key, reading, filename, destination) in enumerate(missing, 1):
            chunks = [np.asarray(audio) for _, _, audio in pipeline(reading, voice="jf_alpha", speed=0.9)]
            if not chunks:
                raise RuntimeError(f"Kokoro returned no audio for: {key}")
            sf.write(wav, np.concatenate(chunks), 24000)
            subprocess.run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(wav),
                "-ac", "1", "-ar", "24000", "-codec:a", "libmp3lame", "-b:a", "48k", str(destination),
            ], check=True)
            if index % 20 == 0 or index == len(missing):
                print(f"Generated {index}/{len(missing)} kanji clips", flush=True)

for key, reading, filename, destination in phrases:
    manifest[key] = {"src": f"./audio/speech/{filename}", "pitch": []}

manifest_json = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
(PROJECT / "src/speech-audio-manifest.json").write_text(manifest_json)
(PROJECT / "src/speech-audio-manifest.js").write_text(
    "globalThis.SAKURA_AUDIO=Object.freeze(" + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ");\n"
)

worker_path = PROJECT / "sw.js"
worker = worker_path.read_text()
assets = sorted({entry["src"] for entry in manifest.values()})
declaration = "const AUDIO_ASSETS = [\n" + "".join(f"  '{asset}',\n" for asset in assets) + "];"
worker, count = re.subn(r"const AUDIO_ASSETS = \[.*?\];", declaration, worker, count=1, flags=re.S)
if count != 1:
    raise SystemExit("Could not update AUDIO_ASSETS in sw.js")
worker_path.write_text(worker)
print(f"Bundled audio for {len(items)} kanji listening samples ({len(missing)} newly generated).")
