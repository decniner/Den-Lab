# Approved production baseline

`mans-search-for-meaning/approved/` contains the user-approved 2:24 master, cover, contact sheets, frame-review sheets, acceptance report, and verification metadata. Treat these as immutable. Before use, run `python scripts/verify_baseline.py`; the SHA-256 manifest covers every versioned file beneath this directory except itself.

`mans-search-for-meaning/inputs/` and `assets/` preserve the source narration, timing/caption configuration, dependency lock, and reviewed still artwork. The three original visual references are identified by filename and hash in `mans-search-for-meaning/inputs/reference-manifest.json` but are not copied into Git because they are user/library reference media. A fresh machine must receive those exact files through an authorized source and verify their hashes before matching the references.

Human approval is the source of truth for visual quality. Automated tests protect the production contract and file identity; they do not replace image review or Windows execution.
