#!/usr/bin/env python3
"""Validate timing and baseline invariants of caption cue JSON."""
import json
import sys
from pathlib import Path

def validate(cues):
    errors = []
    previous_end = 0
    for i, cue in enumerate(cues):
        start, end = cue.get("start_ms"), cue.get("end_ms")
        if not isinstance(start, (int,float)) or not isinstance(end, (int,float)) or start < 0 or end <= start:
            errors.append(f"Cue {i}: invalid timing")
            continue
        if start < previous_end:
            errors.append(f"Cue {i}: overlaps previous cue")
        previous_end = end
        words = cue.get("words", [])
        if not words or len(words) > 20:
            errors.append(f"Cue {i}: missing/excessive words")
        baseline = cue.get("baseline_px")
        if not isinstance(baseline, (int,float)):
            errors.append(f"Cue {i}: missing numeric baseline_px")
        last = start
        for j, word in enumerate(words):
            ws, we = word.get("start_ms"), word.get("end_ms")
            if not isinstance(ws,(int,float)) or not isinstance(we,(int,float)) or not (start <= ws < we <= end) or ws < last:
                errors.append(f"Cue {i} word {j}: invalid/overlapping timing")
            else:
                last = we
            if not word.get("text", "").strip():
                errors.append(f"Cue {i} word {j}: empty text")
            if word.get("baseline_px", baseline) != baseline:
                errors.append(f"Cue {i} word {j}: raised/lowered baseline")
    return errors

if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: python scripts/validate_captions.py cues.json")
    errors = validate(json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")))
    for error in errors:
        print("FAIL:", error)
    sys.exit(1 if errors else 0)
