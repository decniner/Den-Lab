$ErrorActionPreference = 'Stop'
$pipelinePath = Join-Path $PSScriptRoot 'production.py'
$pythonCommand = Get-Command python -ErrorAction SilentlyContinue
if ($pythonCommand) {
    & $pythonCommand.Source $pipelinePath @args
} else {
    $pyCommand = Get-Command py -ErrorAction SilentlyContinue
    if (-not $pyCommand) { throw 'Python 3.9+ is required (python or py launcher not found).' }
    & $pyCommand.Source -3 $pipelinePath @args
}
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
