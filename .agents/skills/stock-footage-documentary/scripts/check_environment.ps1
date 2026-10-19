[CmdletBinding()]
param()

$ErrorActionPreference = 'Continue'

Write-Output 'Stock Footage Documentary environment check'
Write-Output ('PowerShell: ' + $PSVersionTable.PSVersion.ToString())

$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
    & $python.Source --version
    & $python.Source -c "import importlib.util; print('Kokoro:', 'available' if importlib.util.find_spec('kokoro') else 'not installed')"
} else {
    Write-Output 'Python: not found on PATH'
}

foreach ($name in @('ffmpeg', 'ffprobe')) {
    $tool = Get-Command $name -ErrorAction SilentlyContinue
    if ($tool) {
        $firstLine = & $tool.Source -version 2>&1 | Select-Object -First 1
        Write-Output ($name + ': ' + $firstLine)
    } else {
        Write-Output ($name + ': not found on PATH')
    }
}

foreach ($name in @('PEXELS_API_KEY', 'PIXABAY_API_KEY')) {
    $value = [Environment]::GetEnvironmentVariable($name)
    Write-Output ($name + ': ' + $(if ([string]::IsNullOrWhiteSpace($value)) { 'not configured' } else { 'configured (value hidden)' }))
}
