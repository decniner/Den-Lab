# Neural narration change

The existing adapter is Windows System.Speech/Zira Desktop at rate zero. Extend
only speech production; preserve reviewed research, immutable rendered editions,
caption validation, private upload recovery and separate public approval.

Official Azure Speech uses an existing SpeechServices resource. Before any request,
read Azure resource metadata and verify F0, region and matching supplied resource
key. Never create resources, modify a SKU or accept S0. Environment-only secrets.
Use the official Speech SDK for final word events, bounded worker timeouts and
normal-speed WAV output. List voices live and reject unsupported style settings.

Optional edge-tts is a community service integration, not Azure or a Microsoft
supported SDK. Private audition is separately opted into. Published-video use
requires documented service-rights verification; current public information does
not establish a commercial output grant. No automatic fallback to SAPI.

Cache keyed by provider, voice, settings and exact text, with audio/event checksums
and locks. Preview voices are selected from current provider metadata: two
conversational choices and a documentary-like choice. All read identical text
with Japanese place names and numbers. Previews are local, not uploaded or pushed.
The user selects an exact preview checksum before neural full-edition synthesis.
Changing settings invalidates that selection. Newly generated final audio rebuilds
captions and scene timing, and duration failure requires script editing/review.

Tests first: F0 guard, missing credentials, unsupported styles/fast rate,
voice-list failure, timing mapping, cache integrity, no fallback, selection binding
and no upload during previews. Generate previews only after provider availability
and experimental opt-in if applicable. Stop for the user's voice selection.
