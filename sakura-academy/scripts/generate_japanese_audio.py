#!/usr/bin/env python3
"""Generate compact, offline Japanese lesson audio with the local Kokoro install."""

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
CONTENT = (PROJECT / "src/content.js").read_text()
LESSON_DATA = re.search(r"const LESSONS=(\[.*?\]), KANA=", CONTENT, re.S)
if not LESSON_DATA:
    raise SystemExit("Could not find LESSONS in src/content.js")
LESSONS = json.loads(LESSON_DATA.group(1))
PRONUNCIATION_OVERRIDES = json.loads(
    (PROJECT / "scripts/pronunciation-overrides.json").read_text()
)


def audio_key(text: str) -> str:
    return re.sub(r"\s+", "", unicodedata.normalize("NFC", text))


def pitch_contour(samples: np.ndarray, sample_rate: int = 24000) -> list[float]:
    """Return a 32-point, median-centered F0 contour in semitones."""
    frame_size, hop = 1024, 480
    min_lag, max_lag = sample_rate // 420, sample_rate // 75
    values = []
    window = np.hanning(frame_size)
    for start in range(0, max(1, len(samples) - frame_size), hop):
        frame = samples[start:start + frame_size]
        if len(frame) < frame_size or float(np.sqrt(np.mean(frame * frame))) < 0.008:
            continue
        frame = (frame - np.mean(frame)) * window
        spectrum = np.fft.rfft(frame, n=frame_size * 2)
        autocorrelation = np.fft.irfft(spectrum * np.conj(spectrum))[:frame_size]
        region = autocorrelation[min_lag:max_lag + 1]
        lag = min_lag + int(np.argmax(region))
        confidence = float(autocorrelation[lag] / max(autocorrelation[0], 1e-8))
        if confidence < 0.3:
            continue
        hz = sample_rate / lag
        values.append(69 + 12 * np.log2(hz / 440))
    if len(values) < 8:
        return []
    x = np.linspace(0, 1, len(values))
    contour = np.interp(np.linspace(0, 1, 32), x, values)
    contour -= np.median(contour)
    return [round(float(np.clip(value, -12, 12)), 1) for value in contour]


phrases = {}
for lesson in LESSONS:
    candidates = [lesson["jp"]]
    for word in lesson["vocab"]:
        candidates.extend((word["jp"], word["example"]))
    candidates.extend(line["jp"] for line in lesson["dialogue"])
    for phrase in candidates:
        key = audio_key(phrase)
        if key:
            phrases.setdefault(key, {"phrase": phrase, "voice": "jf_alpha", "base_key": key})
    for line in lesson["dialogue"]:
        if line["who"] == "B" and line["jp"] and line["en"]:
            base_key = audio_key(line["jp"])
            voice_key = f"dialogue:B:{base_key}"
            phrases[voice_key] = {"phrase": line["jp"], "voice": "jm_kumo", "base_key": base_key}

pipeline = KPipeline(lang_code="j")
audio_dir = PROJECT / "audio/speech"
audio_dir.mkdir(parents=True, exist_ok=True)
manifest = {}

with tempfile.TemporaryDirectory(prefix="sakura-kokoro-") as tmp:
    temp_dir = Path(tmp)
    for index, (key, item) in enumerate(phrases.items(), 1):
        phrase, voice, base_key = item["phrase"], item["voice"], item["base_key"]
        filename = f"ja-{hashlib.sha256(key.encode('utf-8')).hexdigest()[:14]}.mp3"
        destination = audio_dir / filename
        synthesis_text = PRONUNCIATION_OVERRIDES.get(base_key, phrase)
        if not destination.exists() or key in PRONUNCIATION_OVERRIDES:
            chunks = [np.asarray(audio) for _, _, audio in pipeline(synthesis_text, voice=voice, speed=0.9)]
            if not chunks:
                raise RuntimeError(f"Kokoro returned no audio for: {phrase}")
            wav = temp_dir / "speech.wav"
            sf.write(wav, np.concatenate(chunks), 24000)
            subprocess.run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(wav),
                "-ac", "1", "-ar", "24000", "-codec:a", "libmp3lame", "-b:a", "48k", str(destination),
            ], check=True)
        decoded = subprocess.run([
            "ffmpeg", "-v", "error", "-i", str(destination), "-ac", "1", "-ar", "24000",
            "-f", "f32le", "-",
        ], check=True, stdout=subprocess.PIPE).stdout
        samples = np.frombuffer(decoded, dtype=np.float32)
        manifest[key] = {
            "src": f"./audio/speech/{filename}",
            "pitch": pitch_contour(samples),
        }
        if index % 20 == 0 or index == len(phrases):
            print(f"Generated {index}/{len(phrases)} phrases", flush=True)

manifest_json = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
(PROJECT / "src/speech-audio-manifest.json").write_text(manifest_json)
(PROJECT / "src/speech-audio-manifest.js").write_text(
    "globalThis.SAKURA_AUDIO=Object.freeze(" + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ");\n"
)

sw_path = PROJECT / "sw.js"
sw = sw_path.read_text()
assets = sorted({entry["src"] for entry in manifest.values()})
asset_declaration = "const AUDIO_ASSETS = [\n" + "".join(f"  '{asset}',\n" for asset in assets) + "];"
sw = re.sub(r"const AUDIO_ASSETS = \[.*?\];", asset_declaration, sw, count=1, flags=re.S)
sw_path.write_text(sw)
print(f"Manifest: {len(manifest)} unique phrases, {len(assets)} MP3 files", flush=True)
