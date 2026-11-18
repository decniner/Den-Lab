# Book summary production agent rules

Read SKILL.md, STYLE_LOCK.md, CAPTION_SPEC.md and reference-manifest.json before generating. Missing or unverified reference means STOP before visual generation. Do not infer an exact style from a title or cover.

Use deterministic components for typography and timing, and lock dependency versions. Do not rewrite visual components per book. Produce a 10-second test first, inspect alongside approved reference, then continue only after approval.

Run scripts/validate_manifest.py and scripts/validate_captions.py against the actual project data. Report failures and unknowns. Never claim full visual equivalence from metadata checks alone.

Do not commit copyrighted reference video or third-party fonts without appropriate rights. Store local paths/hashes in a private manifest; commit only a sanitized manifest with no personal paths.
