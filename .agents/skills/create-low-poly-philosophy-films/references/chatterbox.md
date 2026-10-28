# Local Chatterbox narration and captions

## Environment

For user-wide Codex use on another machine, copy the complete repository skill directory to `~/.agents/skills/create-low-poly-philosophy-films/` (or the machine's existing user skill root). The repository copy under `.agents/skills/` is discovered while working in that repository; global installation is a separate copy. ChatGPT's personal installation is managed through Skill Creator.

Use Python 3.11 or 3.12 in an isolated project environment. Install CPU Torch first to avoid downloading CUDA packages. Keep model weights, environments and generated media outside the skill directory and the source repository. Allow approximately 6 GB for dependencies and models. Use the matching Windows or macOS environment Python path instead of `.venv/bin/python` there.

```bash
python3 -m venv /absolute/project/.venv
/absolute/project/.venv/bin/python -m pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cpu
/absolute/project/.venv/bin/python -m pip install -r /absolute/skill/scripts/requirements-chatterbox.txt
/absolute/project/.venv/bin/python /absolute/skill/scripts/make_film.py setup-voice --project /absolute/project
/absolute/project/.venv/bin/python /absolute/skill/scripts/make_film.py audio --project /absolute/project
```

`setup-voice` fetches the official pinned model revision and two reference recordings, checking SHA-256 values from `assets/chatterbox_manifest.json`. TLS verification stays enabled and honours configured CA bundles. Stop on access denial, gated assets or mismatched hashes. Never route around a policy block. `audio` synthesizes locally, verifies cache contents, and runs acoustic alignment. Use the same environment Python for all film commands.

## Voices, rights and provenance

Use Chatterbox Turbo `chatterbox-tts==0.1.7`, with model revision `749d1c1a46eb10492095d68fbcf55691ccf137cd` from [Resemble AI](https://huggingface.co/ResembleAI/chatterbox-turbo). Code and model card use MIT licensing. Retain built-in PerTh watermarking. Check current terms when changing model versions.

Use `voice-zero/peter_yearsley.wav` for HUMAN and `voice-zero/caro_davy.wav` for AI from [Kyutai's voice repository](https://huggingface.co/kyutai/tts-voices). Its Voice-Zero section identifies these recordings as CC0. Do not substitute its noncommercial Expresso or EARS recordings. Reference-recording licences and software licences do not provide blanket guarantees about every possible use of someone's identity; identify the output as synthetic and avoid deceptive impersonation.

Optional `human_reference`, `ai_reference`, `human_voice_label`, and `ai_voice_label` override the defaults. Resolve relative reference paths against the project; confirm the new recording's rights before using it. `chatterbox_model_dir` can point to a shared verified model cache. Keep `tts_threads` at 2 by default.

## Acoustic timing and repairs

The alignment script uses TorchAudio 2.6 Wav2Vec2 CTC forced alignment to locate authored words in the actual WAVs. It preserves punctuation, records confidence and independent greedy recognition in `alignment_report.json`, and writes `scenes.json` and `dialogue.wav`. Word timing is an acoustic estimate at model/frame resolution; inspect difficult starts and endings rather than claiming phoneme-perfect synchronization.

The renderer shows only the active word. It does not anticipate the first word, display future phrase words, or keep a completed phrase through a pause. Default `caption_font_size: 44` and `caption_y: 920` apply on the internal 720×1280 canvas. At 1080×1920 these are 66 px and y=1380. Platform overlays vary, so visually check the export at phone size.

Chatterbox can clip or mispronounce a final word even when the input text is correct. Review the audio, or use a separate local recognizer to flag uncertain wording. A greedy-recognition spelling discrepancy alone does not prove the audio is wrong. For a confirmed unclear turn, set a different seed by zero-based index:

```json
{"chatterbox_seeds": {"6": 2113}}
```

Rerun `audio`, `samples`, and `render`. The seed invalidates that turn's audio cache; alignment updates all following scene times. Do not reuse word times after replacing or changing the speed of audio. Validate `verification.json` and inspect `export_contact.jpg` before delivery. Do not claim a subjective listening review if only waveform or transcript checks were available.

For an explicitly requested Edge alternative, set `audio_engine: "edge"`, supply its voice/rate fields, and install `scripts/requirements.txt`. Service accessibility and usage terms must be checked separately; never switch to a paid service automatically.
