param(
    [Parameter(Mandatory=$true)][string]$ScriptPath,
    [Parameter(Mandatory=$true)][string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$scriptInput = Get-Content -LiteralPath $ScriptPath -Raw -Encoding UTF8 | ConvertFrom-Json
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $speaker.Rate = -2
    for ($segmentIndex = 0; $segmentIndex -lt $scriptInput.segments.Count; $segmentIndex++) {
        $wavePath = Join-Path $OutputDirectory ('segment-{0:D4}.wav' -f $segmentIndex)
        $speaker.SetOutputToWaveFile($wavePath)
        $speaker.Speak([string]$scriptInput.segments[$segmentIndex].text)
        $speaker.SetOutputToNull()
    }
} finally {
    $speaker.Dispose()
}
