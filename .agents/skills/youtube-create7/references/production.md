# Production mechanics

## Inputs and adaptation

Use a named project with `script.txt`, `chapters.json`, `production_config.json`, `storyboard.json`, `narration/`, `audio/`, `artwork/`, `renders/`, `subtitles/`, `logs/` and `output/`. Preserve earlier exports. Store a source SHA256 and distinguish visual headings from spoken text. Derive expected counts from the new script: nine chapters and 164 sentences belong to the reference film, not future requirements.

Prefer Python/Pillow or another available native vector renderer plus FFmpeg. The previously completed local reference is `Den-Lab/silent-extinction-documentary` in the originating workspace. It is optional context, not a dependency of this skill. Its `direction.py`, scene text, metadata, source parsing and count assertions are topic-specific; adapt them before reuse. Do not copy its narration/timeline into a new film.

## Narration and word events

Discover local Kokoro weights, `bm_george.pt`, configuration, compatible Python, PyTorch and audio dependencies. Keep renderer and voice Python environments separate when their binary packages differ. The reference setup uses `KPipeline(lang_code='b')`, 24 kHz mono PCM narration and four CPU threads; final AAC is 48 kHz. Treat local paths and versions as discoverable configuration.

Synthesize manageable paragraph takes. Cache identity includes exact text, native speed, language, voice identity/hash, engine version, model/config hashes and sample rate. Validate cached WAV hash, finite samples, channel count and matching metadata before reuse.

Measure speed using the summed spoken take durations; report runtime including pauses separately. Native rates around 1.06–1.17 achieved roughly127wpm in the reference, but calibrate each script instead of treating those numbers as universal. Apply quieter/slower later delivery only when the brief warrants it.

Use engine token timestamps where available. Reconcile normalized tokens against every original word, handling contractions/punctuation without changing authored text. After trimming audio, subtract the exact trim offset from timestamps and add the final paragraph timeline offset. Check positive durations, order and exact source word coverage. Model events are alignment estimates, not independent acoustic verification.

Reserve explicit dramatic breaks, chapter transitions and any requested final silent hold. Avoid using added silence to satisfy a target rate. Derive a single frame-rounded master duration and all chapter/scene/audio boundaries from the final take. If narration changes, regenerate affected timing, subtitles, visuals and cue effects.

## Direction and drawing synchronization

Each beat records source sentence, chapter, scene, start/end, next start, label, actions, word events and effect trigger. Anchor critical changes to the significant spoken word, such as "revoked", "redirected" or "fail". Introduce future objects when first mentioned rather than drawing the complete future diagram at scene entry.

Reveal polylines by cumulative arc length: at fraction q, render q times total path distance, including the partial segment. Do not allocate equal duration to paths of very different length. Cache finished vector layers and composite only changing elements.

State belongs to the scene/story timeline, not the current sentence: access stays denied, failed nodes stay failed, redirected resources stay redirected, faded figures do not reappear. Animate flows along actual connections. Keep a shutdown hand in contact after its press. Ensure later labels still describe the diagram after a state change.

Use subtle original motion with meaning: migrating resource arrows, cascading node failure, capability curves, city depth/parallax and operating machinery. When a drawing finishes early during a long sentence, reveal the next relevant detail or synchronize a causal action; a random global zoom does not resolve a semantic pause.

For sequential lists, activate each corresponding object as its term is spoken. Labels must name the actual list: a check on "control" should label control, not a reused danger condition. Check overlays against established labels and the disclosure/footer.

## Geometry and sound

Measure the rendered font's actual bounding boxes. Use approximately28px or larger diagram labels at1080p, larger headings, and generous margins; adapt to composition and inspect small previews. Check pairwise text intersections and frame bounds. Intentional short crossfades need separate inspection because both scenes coexist during a dissolve.

Use original procedural ambience or licensed tracks with recorded provenance. Shape soundtrack intensity to the narrative. Duck beneath the actual voice envelope, level the mix and verify decoded AAC peaks. A reference loudness target is -16LUFS with true peak below -1dBFS; assess intelligibility by listening when available. Fade music/FX before a requested silent final hold and verify the decoded audio there.

## Rendering and checkpoints

Render native widescreen frames and encode chapter segments at stable30fps. CRF17–20 with an appropriate x264 preset is a useful starting range, not a fixed requirement. Cache identity covers rendering code, assets, fonts/settings and timing that affect each segment. A complete marker records boundaries, expected frames, source digest, file bytes/hash and successful full decode. An existing file or old marker alone does not prove it is reusable.

If only a scoped branch changes, reuse other segments only with an explicit proof that their rendering inputs/behavior are unaffected and their bytes remain verified. Keep this evidence. Prefer conservative rerendering when scope cannot be proven. Assemble via compatible segment concatenation, mux normalized AAC, and fully decode the final exported MP4.

## Actual export QA

Check the final file, including after revisions:

1. Codec, pixel format, resolution, aspect ratio, fps, sample rate, duration and exact expected frame count; complete decode with no errors.
2. Immutable script hash, exact ordered source/event coverage, complete sentence direction, no duplicated or missing passages, and complete SRT word coverage with positive, ordered, nonoverlapping cue intervals. Derive expected counts from the new project.
3. Typography bounds/intersections on established frames, chapter/contact sheets, semantic before/after frames, opening and ending, and small-screen previews.
4. Physical artwork motion separately from changing captions/header/footer. Sample roughly once per second; crop the illustration region and compute frame-difference RMS. A reference threshold of0.12 on downscaled RGB identified four-second lulls. Calibrate for the actual style. Declare intentional holds from the storyboard; inspect flagged passages and fix unintended freezes instead of lowering the threshold to hide them.
5. Unexpected black intervals, clipping, excessive unexplained silence and source/export synchronization. Compare audio envelopes at the beginning, middle and end; the reference uses10ms windows and requires lag no larger than10ms with strong correlation. This checks export drift, not independent word pronunciation alignment.
6. Watch/listen to the complete export when possible. Record unavailable subjective/acoustic/device checks explicitly as unverified.

For the motion scan, run `python /ABSOLUTE/SKILL/DIRECTORY/scripts/audit_art_motion.py VIDEO --ffmpeg FFMPEG_PATH --report REPORT.json`, substituting this skill's actual directory and using absolute video/report paths when working from another project. Defaults assume1920x1080, with crop `1760:730:80:170` excluding headers/footer and selective title band. Adjust crop for the actual composition. Declare a storyboard-confirmed final hold with `--intentional-hold-start SECONDS`; leave it unset if none exists. The scanner returns nonzero for unintended quiet runs and prints their timestamps. It cannot judge narrative relevance.

## Final artifacts

Provide the full MP4 and separate SRT, source/audio/timing/storyboard, code/assets and reproduction instructions, sources/licenses, original thumbnail at1280x720, YouTube metadata and chapter times derived from the final render. Disclose synthetic narration and fictional/speculative events when applicable. The production report separates observed automated passes, sampled visual inspection and unavailable quality gates. Do not upload without an explicit upload request.
