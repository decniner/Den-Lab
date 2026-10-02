# Japan Explained design

An independent English explainer project under Den-Lab/japan-facts-video. Reuse
the proven standard-library resumable uploader and immutable edition store by
vendoring them into this project; leave the news project unchanged.

Research discovers candidates from a configurable editorial catalog, ranks ten
on surprise, explanation, source quality and visual potential, and selects an
uncovered canonical fact with category rotation. The catalog is a finite seed
library, not a claim of unrestricted autonomous web discovery. Live research
fetches independent publisher pages and requires reviewed fact packs whose exact
supporting quotations remain present. Unsupported, stale-reviewed or malformed
content stops. Original scripts are bound to a content review checksum and every
sentence maps to claim IDs. Retrieved pages are parsed as text, never executed.

The first fact is the mechanism of Shinkansen earthquake early warning. JR East
documents railway operation, USGS independently explains wave speeds and signals,
and JMA explains warning limitations. No unsupported timing or speed numbers.

Free installed Windows speech at normal speed produces word events; use its
measured duration (45-60 seconds) without forced acceleration. Original animated
vector diagrams and typography, captions, thumbnail and a source-linked metadata
manifest form each edition. Validate media by probing/full decoding, audio level,
caption event alignment, safe areas and measured text bounds. Manual frame/audio
inspection is required before first upload of a rendered edition.

Persistent canonical fact keys, aliases and claim fingerprints reject renamed
repeat topics. A global history lock reserves topics across editions. Upload and
public approval use edition locks and checksum-bound artifacts. Private default,
correct-channel checks, bounded session recovery, API readback and no duplicate
inserts remain unchanged. Public publishing requires exact edition approval.

Daily scheduling is supported by a dedicated Windows runner with durable state,
but starts disabled. Offline dry-run uses explicit fixtures, never masquerades as
live research/media/upload success. The live sample is produced and uploaded only
after factual and visual/audio validation. Paid providers are not called.

Session authorization permits inline implementation and private sample upload.
No public publishing or schedule activation is authorized by this implementation.
