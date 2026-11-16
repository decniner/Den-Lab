---
name: paper-diorama-explainer
description: Use when creating or revising a finished faceless landscape explainer in a layered handmade paper-diorama style, especially when free local production, textured route maps, cutout ships or characters, clearly noticeable animation, and Kokoro Adam narration are requested. Excludes ordinary slides, script-only work, and uploading.
---

# Paper diorama explainer

Create a complete narrated film in the approved Paper Atlas style: textured cream paper, cutout scenery, faceless figures, readable maps, attached soft shadows and clearly visible parallax and subject movement. Use the [approved style image](assets/approved-style.jpg) as the visual reference. Default to1920×1080,24fps, local Kokoro American-English `am_adam` at0.94 speed. Respect a new explicit voice, duration or format request. The approved Adam choice overrides a generic Michael default.

## Production contract

- Production is free of media-generation credits: draw original paper shapes and textures locally with Pillow/NumPy, animate and encode locally with FFmpeg. Use public-domain map geometry. Do not introduce credit-based image/video services, paid TTS, stock subscriptions or trials.
- Verify the narrative against reliable sources before narration. Historical timelines distinguish departures from port calls, successive commanders, original participants from total survivors, and original goals from later outcomes. Make unfamiliar societies active participants, not empty scenery. Record sources and any uncertainty.
- Organize the explanation into meaningful scenes, usually10–20seconds each, timed from actual audio. No fixed scene count or forced duration. Identify the next location/date clearly; use paper reveals or geographic transitions with a narrative purpose.
- Compose independent background, middle, foreground and typography planes. Use cream/teal/moss/ochre/terracotta, irregular cut edges, paper grain and soft offset shadows. Keep labels above foreground waves and other occluders. Default to noticeable animation: sailing cutouts, independently rolling wave layers,4.5% camera pushes and travelling route cursors. Hold typography still and preserve label readability. Keep labels registered to their map plane.
- Characters are blank-faced paper silhouettes. Adapt ships, clothing and props to the subject's period and culture. The bundled European carrack and captain are subject-specific examples.
- Reconcile Kokoro timestamps with every spoken word. Captions remain fixed within each cue; only the spoken word turns terracotta. Label map tracks as simplified and never imply a precise daily historical route.

## Reuse and validation

Read [production.md](references/production.md) before executing the bundled starter. It contains real code and a Magellan example, not a universal story generator. Initialize a separate project; replace its narrative, subject-specific artwork and route coordinates. Reuse successful geometry, narration, source assets and scene caches when unchanged.

Inspect an encoded short proof before the full render. Then verify complete decoding, dimensions/frame rate/frame count, audio coverage/peaks, source-caption order and bounds, active-word color and actual within-scene movement. Inspect every exported scene frame, especially map labels and cultural/period details. Record technical timing separately from pronunciation, full listening or independent acoustic alignment; do not claim checks not performed.

Deliver a playable MP4, clean narration, SRT, sources and verification. Include editable layered artwork/source when useful. Saving the film does not authorize publishing or uploading it.
