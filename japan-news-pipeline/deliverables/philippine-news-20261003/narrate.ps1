param([Parameter(Mandatory=$true)][string]$EditionDirectory)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$narratorCode = @'
using System;
using System.Collections.Generic;
using System.Speech.Synthesis;
using System.Speech.AudioFormat;
public class JapanWordTiming {
    public string text;
    public double start;
    public int index;
    public int count;
}
public static class JapanNarrator {
    public static JapanWordTiming[] Render(string text, string output) {
        var words = new List<JapanWordTiming>();
        using (var speaker = new SpeechSynthesizer()) {
            speaker.SelectVoice("Microsoft Zira Desktop");
            speaker.Rate = 0;
            speaker.SpeakProgress += (sender, e) => words.Add(new JapanWordTiming {
                text = e.Text, start = e.AudioPosition.TotalSeconds,
                index = e.CharacterPosition, count = e.CharacterCount
            });
            // Keep SAPI word events and the voice's native stream on the same clock.
            speaker.SetOutputToWaveFile(output, new SpeechAudioFormatInfo(16000, AudioBitsPerSample.Sixteen, AudioChannel.Mono));
            speaker.Speak(text);
            speaker.SetOutputToNull();
        }
        return words.ToArray();
    }
}
'@
Add-Type -TypeDefinition $narratorCode -ReferencedAssemblies 'System.Speech'
$editionRoot = (Resolve-Path -LiteralPath $EditionDirectory).Path
$scriptData = Get-Content -LiteralPath (Join-Path $editionRoot 'script.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$speechDirectory = Join-Path $editionRoot 'speech'
New-Item -ItemType Directory -Path $speechDirectory -Force | Out-Null
for ($segmentNumber = 0; $segmentNumber -lt $scriptData.segments.Count; $segmentNumber++) {
    $segmentPath = Join-Path $speechDirectory ('segment-{0:D4}.wav' -f $segmentNumber)
    $wordData = [JapanNarrator]::Render([string]$scriptData.segments[$segmentNumber].text, $segmentPath)
    ConvertTo-Json -InputObject @($wordData) -Depth 5 | Set-Content -LiteralPath ($segmentPath + '.words.json') -Encoding UTF8
}
Write-Output 'Real local narration and speech-event timings generated.'
