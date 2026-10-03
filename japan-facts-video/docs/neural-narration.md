# Neural narration and voice auditions

The previous edition used **Microsoft Zira Desktop / Windows System.Speech**,
an installed desktop voice. The new recommended adapter is **official Azure
Speech**. `edge-tts` is offered as a separate, optional **community integration
with Edge's online service**, not a Microsoft supported SDK or an Azure resource.
Selecting a neural provider never silently falls back to Zira.

## Current preview output

On 2026-10-03 JST, the live Edge voice list was retrieved and three private
auditions were generated from identical original text:

| File under `voice-previews/edge-audition/` | Current voice | Intended reading | Measured duration |
| --- | --- | --- | --- |
| `conversational-1.wav` | `en-US-JennyNeural` | Conversational audition | 25.488s |
| `conversational-2.wav` | `en-US-AndrewMultilingualNeural` | Conversational audition | 23.976s |
| `documentary.wav` | `en-US-GuyNeural` | Documentary audition | 25.416s |

Jenny and Andrew use rate 0%; Guy uses −3%. Pitch is unchanged. These are
neutral Edge deliveries; the labels describe the intended audition role, not
Azure `chat`/`documentary` style support. Choose by listening. The assistant
interface cannot receive audio input and does not claim a listening assessment.

The passage contains Tokyo, Kyoto, Osaka, Shinjuku, **3 days**, **2,500 yen** and
**8:15**. The trip/budget numbers are explicitly illustrative pronunciation
examples, not reported travel facts. `passage.json`, `voices.json`,
`previews.json` and per-preview native word events record exact provenance,
settings, checksums and timing. Audio and caches are local and ignored by Git.

The current clips are **Edge auditions, not Azure clips**: no Azure credentials
were found. The experimental adapter was explicitly configured for private
audition during implementation. No full video, new narration edition, YouTube
upload, public publish, resource creation or paid job ran during this step.

## Provider terms checked 2026-10-03

[Azure pricing](https://azure.microsoft.com/en-us/pricing/details/speech/) lists
F0 neural TTS at **500,000 characters per month**. F0 availability depends on the
account/region and existing resource limits. This adapter verifies the actual
resource SKU and matching key, rejects all paid SKUs, and never changes a tier.
Quota exhaustion stops synthesis; no paid retry or upgrade exists.

**Free synthesis is not a publication-rights grant.** The current
[Microsoft Product Terms, Text-to-Speech Services](https://www.microsoft.com/licensing/terms/en-US/productoffering/MicrosoftAzure/allprograms)
expressly grant prebuilt neural-voice output use rights to paid-tier TTS
customers. We cannot infer rights to use F0 output in a published/monetized
channel from the free allowance. Review the agreement applicable to your
account or obtain written Microsoft clarification; do not upgrade the resource
as part of this workflow.

The [edge-tts project](https://github.com/rany2/edge-tts) documents access to
Edge's service, live voice listing, and rate/volume/pitch controls. Its package
license does not grant rights to Microsoft's service or its output. Microsoft’s
[June 2026 Edge Read Aloud discussion](https://learn.microsoft.com/en-us/answers/questions/5925556/commercial-use-of-edge-read-aloud-voices-via-edge)
states that public documentation does not explicitly settle commercial output
rights; that forum answer is not a binding license. The
[Microsoft Services Agreement](https://www.microsoft.com/en-us/servicesagreement)
and applicable Edge/account terms must be reviewed for the actual use.

For editions intended for public publishing, synthesis requires a named rights review with
`reviewer`, `terms_url` and `permission_evidence` in `azure_publication_rights`
or `edge_publication_rights`. This is a record of verified applicable permission,
not an automatic license check or permission grant. Do not fill it with an
assumption, generic package license or the pricing page. Private audition does
not create permission to publish its output. Public publishing with unverified
rights remains blocked. An explicitly authorized private review may instead set
`private_review_only: true` and `private_review_authorization` to the owner's
actual instruction. Its immutable speech provenance records `private-review-only`;
the public-publishing command rejects that edition before any API publishing call.
This records private scope, not Microsoft permission or verified publication rights.

## Windows setup: official Azure Speech, F0 only

Install optional adapters into the interpreter used for this project:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-speech.txt
```

For this workspace the installed interpreter is `..\..\.venv\Scripts\python.exe`
from `japan-neural-worktree\japan-facts-video`. Tested dependencies are official
Speech SDK **1.52.0** and edge-tts **7.2.8**. Neither installed package was used to
create an Azure resource or enable billing.

Use an existing **SpeechServices F0** resource, or create F0 yourself in Azure
Portal if available. If the portal only offers S0, stop. Record its resource ID,
region and key privately. Install Azure CLI from Microsoft's official
distribution and run `az login` for the resource-owning account. The signed-in
identity must be allowed to read that resource and list its keys. The adapter
gets a management token via CLI, reads resource metadata and compares the
supplied key against that F0 resource's keys. Only metadata/key-read operations
are used; no ARM resource write or SKU change is implemented.

Set credentials for the current PowerShell session without putting the key in
command history, JSON, Git or logs:

```powershell
$speechSecret = Read-Host 'Azure Speech key' -AsSecureString
$speechCredential = New-Object System.Management.Automation.PSCredential('speech',$speechSecret)
$env:AZURE_SPEECH_KEY = $speechCredential.GetNetworkCredential().Password
$env:AZURE_SPEECH_REGION = 'japaneast' # actual F0 resource region
$env:AZURE_SPEECH_RESOURCE_ID = '/subscriptions/YOUR-ID/resourceGroups/YOUR-GROUP/providers/Microsoft.CognitiveServices/accounts/YOUR-RESOURCE'
```

An existing privately supplied `AZURE_MANAGEMENT_TOKEN` can replace Azure CLI
login; it needs the same resource read/listKeys permissions and must be renewed
when expired. Do not paste credentials into chat. CI deployments should supply
secrets from their secret store, never committed configuration. No Azure secret
has been added to this repository or its workflows.

Copy the example to ignored local configuration, set `tts_provider` to
`azure-speech`, keep FFmpeg/FFprobe paths configured, then retrieve current voices:

```powershell
Copy-Item config.example.json config.azure.local.json # only if destination absent
python -m japan_facts --config config.azure.local.json speech-voices --output voice-previews/azure
python -m japan_facts --config config.azure.local.json voice-previews --output voice-previews/azure
```

Voice IDs are checked against the live list. Candidate preferences are used only
when present, with supported styles read from live metadata; an unsupported
style fails. The Azure SDK emits native word-boundary timing events and 24-kHz
PCM audio. Edge requests word events and its supported prosody controls; custom
SSML styles/pauses are rejected. No unavailable voice name is assumed to work.

## Optional Edge private audition

For a deliberate experimental audition, set `tts_provider: "edge-tts"` and
`edge_experimental_opt_in: true` in ignored `config.edge.local.json`, then:

```powershell
python -m japan_facts --config config.edge.local.json voice-previews --output voice-previews/edge-audition
```

This does not authenticate to Azure or use its F0 quota. Service availability and
terms can change. Provider errors stop the command with a clear message. There
is no automatic Azure→Edge or Edge→desktop switch.

## Select first, regenerate later

Listen to all three files. **Do not run full video generation during audition.**
Once the user selects an exact preview, record it using the SHA in `previews.json`:

```powershell
python -m japan_facts --config config.edge.local.json select-voice --preview conversational-2 --approve-preview EXACT_PREVIEW_SHA --preview-root voice-previews/edge-audition
```

`select-voice` records choice only; it does not synthesize an edition, change
configuration or upload. Set the configuration's `voice` and `speech_settings`
to the selected entry, and set `voice_selection` to the saved selection path.
Changing provider/voice/settings requires a matching new preview selection.
Edge and Azure previews are not interchangeable even when voice names match.

After selection and rights verification, create a **new edition** using the
existing reviewed fact/script checks. Never overwrite the already uploaded
Shinkansen edition or remove its upload state/topic reservation. A new rendition
of the same fact needs an intentional edition/revision workflow; changing its
topic identity to bypass history is not allowed. The current immutable-edition
rule safely rejects rendering over the uploaded edition. Create an explicit
revision without resetting topic history:

```powershell
python -m japan_facts --config config.edge.local.json revise-edition --edition NEW_EDITION_ID --parent PATH_TO_PARENT_EDITION --approve-parent EXACT_PARENT_VIDEO_SHA256
python -m japan_facts --config config.edge.local.json render --edition NEW_EDITION_ID
```

This verifies the parent artifacts, keeps the same fact identity and source
review date, and copies only research inputs. Upload sessions, inspection and
render artifacts are newly created. Retrying the same revision cannot overwrite
an existing edition. Inspect and upload through the usual separate commands.

Neural output regenerates final WAV, word-derived captions and scene spans via
the existing render pipeline. It measures natural duration and still requires
45–60 seconds. If outside that range, shorten/expand conversational phrasing,
review the changed script and regenerate; do not increase speed to force a fit.
Native pauses plus light, supported SSML delivery are preferable to dramatic
pitch shifts or exaggerated emphasis. Phone-caption checks occur at video
generation, not during audio-only audition.

## Settings, cache and recovery

`speech_settings` supports rate −10…+10%, pitch −2…+2 Hz, volume −10…0%, Azure
advertised style, style degree 0.5…1.2, and Azure sentence pauses 0…350ms. Defaults
are normal rate, unchanged pitch/volume, neutral style and native punctuation.
The example style degree is restrained at 0.8. Edge cannot apply Azure styles
or custom sentence pauses; unsupported settings fail.

Cache identity includes provider, exact voice, all delivery settings and exact
text. WAV and native event checksums are verified under per-entry locks. A
completed cache hit synthesizes nothing. Completed provider output is recoverable
after a later local conversion failure only when request/response identity match.
Voice discovery never falls back to an old list: each response has a fresh nonce.
Each child is limited to 95 seconds; native/network work has shorter request
timeouts. Synthesis is not automatically retried, avoiding uncertain repeated
quota consumption. Fix provider settings/network and rerun deliberately.

Do not alter caches to bypass failed timing validation. Missing word events,
unmapped transcript words, corrupt output or a selected-provider failure stops
the edition. Speech-provider provenance becomes an immutable render artifact.
Research/source verification and private/public YouTube gates remain in force.

Verification: regression coverage includes F0/key matching, no paid-tier calls,
missing credentials, unsupported delivery, stale responses, transcript mapping,
cache corruption, no fallback, preview-choice binding and publication-rights
gates. Live Edge auditions were generated locally and decoded to measured PCM
WAV. Azure live synthesis remains untested until credentials are configured.
