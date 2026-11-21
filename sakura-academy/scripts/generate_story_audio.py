#!/usr/bin/env python3
"""Generate bundled Japanese audio for the original N5 story sentences."""

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
source = (PROJECT / "src/n5-stories.js").read_text()
match = re.search(r"const N5_STORIES=(\[.*?\]);", source, re.S)
if not match:
    raise SystemExit("Could not find N5_STORIES in src/n5-stories.js")
stories = json.loads(match.group(1))
manifest_path = PROJECT / "src/speech-audio-manifest.json"
manifest = json.loads(manifest_path.read_text())
audio_dir = PROJECT / "audio/speech"
audio_dir.mkdir(parents=True, exist_ok=True)
pipeline = KPipeline(lang_code="j")

with tempfile.TemporaryDirectory(prefix="sakura-stories-") as tmp:
    wav = Path(tmp) / "story.wav"
    for story in stories:
        for line in story["sentences"]:
            phrase = line["kanji"]
            key = re.sub(r"\s+", "", unicodedata.normalize("NFC", phrase))
            synthesis_text = line["kana"]
            fingerprint = f"{key}|{synthesis_text}"
            filename = f"ja-{hashlib.sha256(fingerprint.encode('utf-8')).hexdigest()[:14]}.mp3"
            destination = audio_dir / filename
            if not destination.exists():
                chunks = [np.asarray(audio) for _, _, audio in pipeline(synthesis_text, voice="jf_alpha", speed=0.9)]
                if not chunks:
                    raise RuntimeError(f"Kokoro returned no audio for: {phrase}")
                sf.write(wav, np.concatenate(chunks), 24000)
                subprocess.run([
                    "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(wav),
                    "-ac", "1", "-ar", "24000", "-codec:a", "libmp3lame", "-b:a", "48k", str(destination),
                ], check=True)
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
worker = re.sub(r"const AUDIO_ASSETS = \[.*?\];", declaration, worker, count=1, flags=re.S)
worker_path.write_text(worker)
print(f"Bundled {sum(len(story['sentences']) for story in stories)} story sentences.")
