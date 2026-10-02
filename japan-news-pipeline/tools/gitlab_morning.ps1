$ErrorActionPreference = 'Stop'
foreach ($name in @('NEWS_STATE_ROOT','NEWS_INBOX','YOUTUBE_CHANNEL_ID','YOUTUBE_OAUTH_TOKEN')) {
    if (-not [Environment]::GetEnvironmentVariable($name)) { throw "Missing GitLab variable: $name" }
}
$checkout = [IO.Path]::GetFullPath($env:CI_PROJECT_DIR).TrimEnd('\') + '\'
foreach ($value in @($env:NEWS_STATE_ROOT,$env:NEWS_INBOX)) {
    if (-not [IO.Path]::IsPathRooted($value)) { throw 'State and inbox paths must be absolute.' }
    $resolved = [IO.Path]::GetFullPath($value).TrimEnd('\') + '\'
    if ($resolved.StartsWith($checkout,[StringComparison]::OrdinalIgnoreCase)) { throw 'Durable state and inbox must be outside the disposable checkout.' }
}
New-Item -ItemType Directory -Force -Path $env:NEWS_STATE_ROOT | Out-Null
$tokenPath = Join-Path $env:NEWS_STATE_ROOT 'oauth-token.json'
if (-not (Test-Path -LiteralPath $tokenPath)) {
    Copy-Item -LiteralPath $env:YOUTUBE_OAUTH_TOKEN -Destination $tokenPath
}
$configPath = Join-Path $env:NEWS_STATE_ROOT 'runner-config.json'
@{channel_id=$env:YOUTUBE_CHANNEL_ID;oauth_token=$tokenPath} | ConvertTo-Json | Set-Content -LiteralPath $configPath -Encoding UTF8
switch ($env:UPLOAD_MODE) {
    'current' {
        $edition = 'japan-news-20261002-en'
        $bundle = 'deliverables/japan-news-20261002'
        if ($env:CURRENT_EDITION -eq 'philippine-news-20261003-en') {
            $edition = 'philippine-news-20261003-en'
            $bundle = 'deliverables/philippine-news-20261003'
        } elseif ($env:CURRENT_EDITION -eq 'global-news-20261003-en') {
            $edition = 'global-news-20261003-en'
            $bundle = 'deliverables/global-news-20261003'
        } elseif ($env:CURRENT_EDITION -eq 'ai-news-20261003-en') {
            $edition = 'ai-news-20261003-en'
            $bundle = 'deliverables/ai-news-20261003'
        } elseif ($env:CURRENT_EDITION -and $env:CURRENT_EDITION -ne $edition) {
            throw 'Unsupported CURRENT_EDITION; use morning mode for a new reviewed edition.'
        }
        python -m news_pipeline --state-root $env:NEWS_STATE_ROOT --config $configPath upload-rendered --edition $edition --bundle $bundle
    }
    'morning' {
        python -m news_pipeline.morning --state-root $env:NEWS_STATE_ROOT --config $configPath --inbox $env:NEWS_INBOX
    }
    'dry-run' {
        python -m news_pipeline.morning --state-root $env:NEWS_STATE_ROOT --config $configPath --inbox $env:NEWS_INBOX --dry-run
    }
    default { throw 'UPLOAD_MODE must be current, morning, or dry-run.' }
}
if ($LASTEXITCODE -ne 0) { throw "Upload command failed with exit code $LASTEXITCODE. Preserve state before recovery." }
