# Approved production baseline

`mans-search-for-meaning/approved/` contains the user-approved 2:24 master, cover, contact sheets, frame-review sheets, acceptance report, and verification metadata. Treat these as immutable. Before use, run `python scripts/verify_baseline.py`; the SHA-256 manifest covers every versioned file beneath this directory except itself.

`mans-search-for-meaning/inputs/` and `assets/` preserve the source narration, timing/caption configuration, dependency lock, and reviewed still artwork. The three original visual references are identified by filename and hash in `mans-search-for-meaning/inputs/reference-manifest.json` but are not copied into Git because they are user/library reference media. A fresh machine must receive those exact files through an authorized source and verify their hashes before matching the references.

Human approval is the source of truth for visual quality. Automated tests protect the production contract and file identity; they do not replace image review or Windows execution.

## Second golden production: *Meditations*

`meditations/approved/` and `meditations/inputs/` lock the user-approved Marcus Aurelius production, including the MP4, cover, three artwork contact sheets, rendered-frame review, narration audio/script, timed captions, caption style, and all 30 reviewed scene illustrations. The source project manifest records `af_heart`, 1080×1920, 30 FPS, frame-zero narration, emotional reviews, and a 147.067-second runtime. The shared SHA-256 manifest covers every file in both golden packages; verification fails on missing, changed, or unmanifested files.

The historical *Meditations* narration says “A book summary in under 3 minutes:” with a colon, and its approved caption cue carries that exact punctuation. Preserve these approved source bytes. Every new production must instead pass the exact opening contract in `NARRATION_SPEC.md`, ending the required sentence with a period before immediately continuing into the summary.
