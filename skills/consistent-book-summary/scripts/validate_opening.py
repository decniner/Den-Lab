#!/usr/bin/env python3
"""Enforce the exact book-summary spoken opening and caption sequence."""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path


def expected_opening(book_title: str, author: str) -> str:
    return f"{book_title} by {author}. A book summary in under 3 minutes."


def validate_script(book_title: str, author: str, script: str):
    errors = []
    opening = expected_opening(book_title, author)
    if not script.startswith(opening):
        errors.append(f"Narration must begin exactly: {opening}")
    elif len(script) == len(opening) or script[len(opening)] not in " \n\r\t":
        errors.append("Summary narration must begin immediately after the required opening sentence")
    elif script[len(opening):].lstrip().startswith(("Here is", "Here's", "Now for", "Next,")):
        errors.append("Do not insert a transition between the required opening and the summary")
    return errors


def _caption_words(cues):
    result = []
    for cue in cues:
        if isinstance(cue, dict) and isinstance(cue.get("words"), list):
            result.extend(word.get("text", "") for word in cue["words"] if isinstance(word, dict))
        elif isinstance(cue, list):
            result.extend(str(word) for word in cue)
    return result


def validate_caption_opening(cues, opening):
    expected = opening.split()
    actual = _caption_words(cues)
    errors = []
    if len(actual) < len(expected):
        return ["Caption cues do not contain the complete required spoken opening"]
    for index, (got, want) in enumerate(zip(actual, expected)):
        if got != want:
            errors.append(f"Caption opening word {index + 1} must be {want!r}, got {got!r}")
            break
    return errors


def validate_project(data, root: Path):
    errors = []
    title, author = data.get("book_title"), data.get("author")
    if not isinstance(title, str) or not title.strip():
        errors.append("book_title is required for opening narration validation")
    if not isinstance(author, str) or not author.strip():
        errors.append("author is required for opening narration validation")
    if errors:
        return errors
    script_path = data.get("narration_script")
    caption_path = data.get("captions")
    if not isinstance(script_path, str) or not (root / script_path).is_file():
        errors.append(f"narration_script file missing: {script_path}")
        return errors
    script = (root / script_path).read_text(encoding="utf-8").strip()
    errors.extend(validate_script(title, author, script))
    if not isinstance(caption_path, str) or not (root / caption_path).is_file():
        errors.append(f"captions file missing: {caption_path}")
        return errors
    try:
        cues = json.loads((root / caption_path).read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return errors + [f"Cannot parse opening captions: {exc}"]
    errors.extend(validate_caption_opening(cues, expected_opening(title, author)))
    return errors


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    args = parser.parse_args()
    path = args.manifest.resolve()
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        sys.exit(f"Cannot read project manifest {path}: {exc}")
    issues = validate_project(data, path.parent)
    for issue in issues:
        print("FAIL:", issue)
    if not issues:
        print("Opening narration and caption sequence verified.")
    sys.exit(1 if issues else 0)
