# Philippine edition verification

Edition: philippine-news-20261003-en. English, 80-second vertical video.
Source checks: GMA/Mynt IPO announcement, PIA/CCC climate preparedness release,
and Olympic Council of Asia/TV5 Yape result, all published October 2, 2026.
Individual claims are mapped in script.json and links in sources.json.

Actual local Windows speech generated. Word-event caption timestamps follow
measured speech and restrained tempo adjustment (0.87–1.05). All 43 caption
groups stay within the 80-second timeline, without overlaps; peak reading rate
21.42 characters/second. Full FFmpeg decode passed. Video is exactly 80.0 seconds,
1080x1920, 30 fps/2400 frames, H.264 with AAC audio; mean narration level -16.1 dB.
Five visual previews at 3, 12, 34, 60 and 77 seconds inspected.

MP4 SHA256: cec8d06e73099c6e33ea685f6c8d0d641817985c457cdd1628e298692c039c54

The actual YouTube API insert and subsequent readback confirmed video ID
vmKakT9SqyU, URL https://www.youtube.com/watch?v=vmKakT9SqyU,
privacyStatus private, uploadStatus uploaded on October 3 JST. This does not claim
completed YouTube transcoding. No public publishing or paid generation jobs ran.
OAuth, upload session and recovery state stay local and are excluded from Git.

Fixture unit tests use artificial bundle bytes and mocked YouTube responses;
they are separate from these real sources, rendered media, and live upload.
