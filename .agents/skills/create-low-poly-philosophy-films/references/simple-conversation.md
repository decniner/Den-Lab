# Approved simple human–AI conversation

This preset reproduces the approved “If You Were the Devil?” production: 20 turns, about two minutes, white faceted characters, a small phone on the shared table, alternating close-ups and charcoal cutaways, Peter Yearsley / Caro Davy Chatterbox voices, one-word captions, and no ending title or credits card.

## Start a new production

Use the existing pinned narration environment. Initialize outside the installed skill folder:

```sh
python <skill>/scripts/init_simple.py --project /absolute/new-project --reuse-tts-from /absolute/existing-film-project
```

`--reuse-tts-from` is optional. It links only existing pinned model/voice assets and the acoustic alignment cache. It never copies credentials or a prior film's generated dialogue. Without reuse, follow chatterbox.md and obtain any required installation approval before large downloads.

The helper copies the renderer and approved template into the production. It refuses to overwrite nonempty folders. Use `<project>/pipeline/scripts/make_film.py` for validate, audio, samples, render and verify. Keep fonts appropriate to the host.

## Adapt the story

- Write a fresh back-and-forth conversation. Use easy words and familiar objects. Let the human misunderstand or challenge the AI; let jokes carry the explanation.
- Keep the opening question direct. A pretend devil or villain is a story device, not a factual claim about a machine.
- Replace `dialogue.json`, `storyboard.json`, title and output name together. Rebuild the turn-indexed drawings in the local `story_visuals.py` to match the new subject. The bundled phone, cake, sock-loving dog and kindness icons are examples, not a reusable plot for every topic.
- The bundled renderer calls `story_visuals.draw` for dialogue shots. The physical phone replaces the old glass in `world`. `SHARED_TURNS` identifies wide shots; update it when changing the shot plan.
- Keep `tail_seconds: 0` and `closing_lines: []`. End after the spoken open question. Do not add a title or credits outro by default.

## Keep faces visible

The supplied wide camera places the human head around y=320–430 and robot head around y=450–560 on a 720×1280 canvas. Flat graphics belong above y=280, or in the central gap if they stay clear of both heads. Keep the speaker captions at y=920. Camera or character changes require fresh measurements.

After audio alignment creates scenes.json, inspect early and late frames of each turn. Run:

```sh
python <project>/pipeline/scripts/check_face_clearance.py --project /absolute/new-project
```

This checks the included renderer's projected head mesh regions against the unadorned wide scene at three times per shared turn. It writes face_clearance.json. Update the helper if the camera or mesh topology changes. It supplements visual review; it does not replace checking exported frames or close-ups.

## Deliver and upload

Include the finished MP4, synchronized SRT, script, storyboard, metadata, verification report and a one-word centered cover. Check the cover at phone size. When upload is requested, use the configured private uploader, then upload the matching cover in YouTube Studio, Save, reload and visually confirm it. An API upload response alone does not prove the right cover is selected. Public publishing needs an explicit request. Simple language alone does not mean the video is directed at children; set the audience from the actual content and intended viewers.
