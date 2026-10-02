"""Join real SAPI WAV segments and derive caption boundaries from measured frames."""
import argparse
import json
import wave
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--script", required=True); parser.add_argument("--segments", required=True)
    parser.add_argument("--audio", required=True); parser.add_argument("--captions", required=True)
    args = parser.parse_args()
    script = json.loads(Path(args.script).read_text(encoding="utf-8"))
    captions = []; cursor = 0; expected = None
    with wave.open(args.audio, "wb") as output:
        for index, segment in enumerate(script["segments"]):
            path = Path(args.segments) / f"segment-{index:04}.wav"
            with wave.open(str(path), "rb") as source:
                params = (source.getnchannels(), source.getsampwidth(), source.getframerate())
                if expected is None:
                    expected = params; output.setnchannels(params[0]); output.setsampwidth(params[1]); output.setframerate(params[2])
                if expected != params: raise ValueError("Narration segment audio formats differ")
                frames = source.getnframes()
                if frames <= 0: raise ValueError("Narration segment is empty")
                output.writeframes(source.readframes(frames))
                stop = cursor + frames / params[2]
                captions.append({"start": cursor, "end": stop, "text": segment["text"]}); cursor = stop
    Path(args.captions).write_text(json.dumps(captions, indent=2), encoding="utf-8")
    print(json.dumps({"event": "narration_joined", "duration": cursor, "segments": len(captions)}))

if __name__ == "__main__": main()
