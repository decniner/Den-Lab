# Quality assurance checklist

Before delivery, verify and record:

- Factual claims match the retained research sources and each narration beat has relevant footage.
- Every used asset has a source page, creator, provider, license URL, download date, restrictions, attribution record, and completed third-party-rights review.
- The actual voice matches the configured choice; narration is intelligible, natural, and not unnaturally sped up.
- Output is MP4 with H.264 video and AAC audio, requested dimensions, frame rate, and duration. Decode the complete file with FFmpeg/FFprobe.
- No missing clips, accidental black frames, frozen stretches, unintended silence, clipped audio, or abrupt audio edits.
- Captions match the spoken narration and are synchronized, readable on a phone, and clear of interface controls and important footage.
- Inspect the opening, ending, every scene transition, and representative frames from the full timeline. Listen to the beginning, middle, end, and each audio transition.
- A short proof render was inspected before the full render when practical.

Record checks as `passed`, `failed`, or `not checked`. Never infer a pass from a generated report when the underlying media was not actually inspected.
