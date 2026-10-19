# Production mechanics

The bundled [renderer](painterly_render.py) and [verifier](painterly_verify.py) are working reference implementations from the reviewed Silent Extinction revision. They are examples to adapt, not drop-in general-purpose generators. They expect a project-local `config.py` exporting `ROOT` and `FFMPEG`, Pillow, local artwork, measured narration, and storyboard JSON. They contain story-specific titles, source hashes, 94-shot/129-paragraph assertions, and an approved 30-second opening; replace these values for another story. Do not copy successful review manifests to pretend a new project has been inspected.

## Timeline and cache

Storyboard shots contain `id`, `asset`, `kind`, `visual_type`, `start`, `end`, `paragraphs`, `heading` and `chapter`. Use `kind: painting`, with `visual_type: cinematic` or `painterly-diagram`. Give every shot a unique asset. Round each scene to frames on a continuous 30 fps timeline. For visual revisions reuse the measured voice and timing, adapting scene divisions to complete narration beats.

Render cache keys combine the shot JSON, renderer revision and source image SHA-256. Changing artwork invalidates only affected clips. Avoid unnecessary renderer changes midway through a long production. Source PNGs are scaled/cropped, decoded once, looped from a one-frame cache, and processed by zoompan. Two FFmpeg threads and the veryfast preset worked on the reference CPU. Use leading-zero duration strings such as `0.18`, not `.18`, in fade filters.

Use source-art reviews before encoding and actual-export reviews after assembly. A review manifest records only images actually inspected. Wait for source generation to finish and verify complete assets before final assembly; concatenate each scene once. Frame counts determine total picture duration. Mux the complete mastered narration, preserving its rate and timing.

## Checks

Run a full decode of the delivered filename. Compare expected and decoded frame counts, video dimensions/rate/pixel format, audio rate, immutable source hashes, ordered spoken words and paragraph coverage. Confirm unique source PNG hashes and asset use; also visually check composition similarity, which hashes cannot detect. Sample every shot from the delivered MP4. Compare short source/export audio envelopes near beginning, middle and end for drift; meter loudness and true peak. Verify the intended final black/silent tail when used.

Timestamped subtitles may use model-derived voice timings; label that limitation rather than claiming independent acoustic alignment. Camera motion and painted character expressions do not prove body animation. Report actual capabilities.

## Reviewed example

The reference project is `C:/Users/DenDev/Documents/Codex/2026-10-10/whiteboard2/silent-extinction-full`. Its `python run.py` resumes the cached painterly rendering, verification and report without generating new images or narration. Treat this path as an optional local example, not a required dependency of the skill.

The reviewed export is `output/silent-extinction-documentary-painterly.mp4`: 16:43.867, 30,116 frames, 1,810 narration words, six approved opening shots plus 94 distinct paintings. Of the 94, 91 are cinematic and three are painterly physical explanatory scenes. Sixty-one new paintings replaced the previous plain diagrams; the other 33 distinct paintings were retained once each. These counts describe the example, not mandatory lengths for future videos.
