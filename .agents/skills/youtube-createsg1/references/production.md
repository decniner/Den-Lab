# Painterly whiteboard production mechanics

## Project setup and reference assets

Create a dedicated writable project with `scripts/new_project.py PROJECT_DIRECTORY`. The bundled `assets/pipeline/` contains a working four-scene AI-takeover example, original generated paintings, saved prompts and rendering/speech code. It excludes model weights, dependency packages, generated audio, videos and prototype approvals. Run the copied code in the new project, not inside the installed skill.

For an unrelated subject, generate fresh relevant paintings and adapt the headings, screen coordinates, character continuity and scene-to-paragraph mapping. The sample expects five narration paragraphs and four scenes; timing.py raises on a different paragraph count rather than silently borrowing incompatible timing.

Default delivery: about 30 seconds at 1920x1080/30 fps, H.264/yuv420p and 48 kHz AAC. Measured complete narration can extend runtime. Supplied words remain immutable; new narration changes require new timing and sound cues.

## Art direction and generation

Use built-in image generation to create original finished raster illustrations. Read imagegen when applying that tool. On this host, built-in generation saves images under the Codex generated-images directory; copy selected originals into the project immediately. Do not leave consuming code dependent on that external temporary location. No CLI/API fallback is authorized merely by using this skill.

Ask for a wide 16:9 finished illustration, not a multi-panel collage. Specify the narrative beat, detailed environment, expressive believable characters, watercolor/gouache texture, delicate contours, warm natural lighting, atmospheric depth and gentle ivory-paper edge fade. Leave generous upper/lower paper margins for native text. Request no generated logos, typography or drawing-tool overlay.

The first successful painting becomes the palette, architectural and character reference. Label reference images by role in subsequent prompts. For a final return to an established location, edit the original atmosphere while preserving camera, architecture, silhouettes and identities. The included generation-prompts.json demonstrates these separate generation/reference/edit roles.

Inspect source paintings for faces, fingers, perspective, repeated poses, clothing, unwanted pseudo-text and visual consistency. A sample film can maintain coherent character identity without establishing frame-accurate character animation. Do not claim an exact studio match, studio affiliation, or hand-painted studio originals. The generated images are original AI interpretations of the requested aesthetic.

## Local prerequisites

config.py keeps renderer and voice dependencies separate. On the originating machine, Python 3.14 uses existing Pillow and FFmpeg under:

`C:/Users/DenDev/Documents/Codex/2026-10-01/check-my-computers-bios-firmware-using-powershell-and-sh/.render-deps`

Portable Python 3.12, Kokoro/PyTorch and model weights are under:

`C:/Users/DenDev/Documents/Codex/2026-10-07/hi-there/brutal-truth-money-kokoro-v4`

Treat these paths as discovery hints. Configure WHITEBOARD_RENDER_DEPS and WHITEBOARD_VOICE_SETUP or adapt config to the actual environment. Do not mix Python 3.14 binary Pillow packages into the Python 3.12 speech process. The isolated portable interpreter does not automatically add sibling project files to sys.path; run.py adds the project explicitly through runpy.

Reference existing general dependencies read-only rather than copying large environments. The pipeline needs no GPU, large local image/video model or uncompressed video intermediates. Installed Georgia fonts are rasterized, not redistributed.

## Contours and drawing tool

prepare_artwork.py preserves original paintings. It finds strong raster edges at 800x450, links neighboring edge pixels, weights facial contours, simplifies and smooths them, groups by scene semantics and orders by nearby endpoints. It saves approximate ordered polylines and a derived contour preview. Those are not original illustrator brush paths; inspect and refine tracing if it produces noise or missing facial features.

The tiny original pencil uses a 24x48 transparent canvas, roughly 40 px visible length and 5 px body width. Its tip anchor is `(4,43)`. Keep this anchor and compositor translation consistent. A large marker blocked earlier illustrations; retain the tiny scale unless the user explicitly requests otherwise.

The default reveal has three stages:

1. A faint pre-existing edge underdrawing preserves delicate facial/environment detail.
2. Darker ordered contours progress by cumulative arc length, with weighted speed variation, easing and pen lifts; the pencil tip follows the active partial endpoint. Dense drawing is accelerated.
3. After the contour pass, a separate smooth color finish resolves to the complete painting. This is a compositing effect, not a physical pencil depositing paint.

Do not use thick contour-guided paint ribbons: the sample prototype produced distracting holes in faces and hair. Do not use rectangular bitmap wipes. Assess the complete reveal, not only the attractive finished source image. If faithful real-time artist drawing is required, this template alone does not establish it.

Camera motion is restrained and transforms artwork and pencil together. Native headings remain sharp in the paper margin. Warning text belongs within real display surfaces; adapt coordinates after inspecting each new image. The final shot returns to the same location using the edited final painting, then pulls back and fades to black.

## Narration and sound

generate_narration.py uses local Kokoro KModel/KPipeline, language `b`, voice `bm_george`, four CPU threads and native speed 1.08 in the sample. Calibrate native rate for the new text and desired tone. Save raw takes. Outer-silence trimming uses 10 ms RMS windows, a conservative threshold and leading/trailing margins; preserve internal pauses and quiet consonants.

Match every authored word to model tokens and adjust timing by exact trim samples and paragraph offsets. Hash the immutable script. These timing events are model estimates, not independently verified pronunciation/alignment. Cache unchanged narration on visual-only revisions.

timing.py rounds scene boundaries to frames before deriving durations. mix_audio.py creates original room tone, restrained harmonic tension, filtered marker sound, taps and alerts, with voice-envelope ducking. Align scratch windows with the pencil phase and skip scratching during the final painted return. Match alert times to visible warnings. The sample master targets -16 LUFS and -1.5 dBTP at 48 kHz; verify decoded audio rather than assuming filters imply a pass.

## Prototype, rendering and verification

From a copied project with reviewed source paintings:

```powershell
python run.py artwork
python run.py prototype
# Inspect sampled frames and decode the actual five-second prototype.
# Record genuine review/prototype-review.json.
python run.py narration
python run.py finish
```

The review file is required before full rendering; it is an execution interlock, not automatic evidence of visual success. Record actual inspected frames and corrections. For a visual revision, reuse existing speech rather than regenerating it unnecessarily.

render.py streams RGB frames to FFmpeg and encodes scenes independently at CRF 18 / veryfast as a CPU-friendly starting point. Mux only successful scene exports. Use versioned filenames if an existing video is open or cannot be overwritten; do not require the user to close unrelated applications to make progress.

verify.py decodes the actual exported MP4 completely, checks frame count and formats, exact word coverage and script hash, compares source/export 10 ms RMS envelopes at beginning/middle/end, checks decoded peaks and final black frame, writes separate subtitles and extracts a contact sheet. Verify the newly revised filename rather than an older file. Its artwork observations are example-specific; replace them with the new production's actual review.

Check warning text positions, margins, transitions, tiny-pencil visibility and finished painting detail in actual export frames. A quiet-run motion scan can flag unintentional frozen intervals; it cannot judge narrative relevance or art quality. Full human listening, continuous playback, independent acoustic word alignment and real-device review remain separate unavailable checks when they have not occurred.

Deliver the new film and exact path together with original PNGs, prompts, derived contours/schedules, audio/timing, code, reproduction instructions and a report separating measured checks from interpretive style/quality assessments.
