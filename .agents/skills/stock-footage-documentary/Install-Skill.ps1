[CmdletBinding()]
param(
    [string]$Destination = (Join-Path $env:USERPROFILE '.codex\skills\stock-footage-documentary')
)

$ErrorActionPreference = 'Stop'
$source = $PSScriptRoot
if (Test-Path -LiteralPath $Destination) {
    throw "Destination already exists; refusing to overwrite: $Destination"
}

$parent = Split-Path -Parent $Destination
New-Item -ItemType Directory -Path $parent -Force | Out-Null
Copy-Item -LiteralPath $source -Destination $Destination -Recurse
Write-Output "Installed skill bundle to: $Destination"
Write-Output 'Restart Codex CLI to reload available skills.'
