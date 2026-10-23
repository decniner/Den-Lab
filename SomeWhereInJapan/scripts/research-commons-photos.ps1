param(
  [int]$Limit = 0,
  [int]$DelayMilliseconds = 350
)

$ErrorActionPreference = 'Stop'
$siteRoot = Join-Path $PSScriptRoot '..'
$identityData = Get-Content (Join-Path $siteRoot 'data\destination-identities.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$auditData = Get-Content (Join-Path $siteRoot 'data\photo-audit.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$identityById = @{}
foreach ($item in $identityData.records) { $identityById[$item.id] = $item }
$existingPath = Join-Path $siteRoot 'data\commons-photo-research.json'
$resultsById = @{}
if (Test-Path $existingPath) {
  try {
    $old = Get-Content $existingPath -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($item in $old.records) { $resultsById[$item.placeId] = $item }
  } catch { }
}

$usedTitles = @{}
foreach ($item in $resultsById.Values) {
  if ($item.status -eq 'matched' -and $item.fileTitle) { $usedTitles[$item.fileTitle] = $true }
}
$rows = @($auditData.rows | Where-Object { $_.verdict -eq 'UNVERIFIABLE' })
if ($Limit -gt 0) { $rows = @($rows | Select-Object -First $Limit) }
$completed = 0
function Invoke-CommonsApi([string]$RequestUri) {
  $raw = & curl.exe -sS --retry 1 --retry-delay 1 --max-time 20 -A 'SomewhereInJapan/1.0 (destination photo source and license research)' $RequestUri 2>$null
  if ($LASTEXITCODE -ne 0) { throw "Commons request failed with curl exit code $LASTEXITCODE" }
  return (($raw -join "`n") | ConvertFrom-Json)
}

foreach ($row in $rows) {
  $placeId = $row.placeId
  if (-not $placeId) {
    $placeId = ($identityData.records | Where-Object { $_.name -eq $row.place } | Select-Object -First 1).id
  }
  if (-not $placeId -or $resultsById.ContainsKey($placeId) -and $resultsById[$placeId].status -eq 'matched') { continue }
  $identity = $identityById[$placeId]
  if (-not $identity) { continue }

  $region = [string]$identity.region
  $genericWords = @('the','a','an','in','at','by','from','under','after','near','into','along','above','below','of','and','with','s','japan','high','low','wide','wild','green','blue','great','little','old','new','deep','bright','clear','quiet','calm','rising','falling','edge','coast','sky','water','view','views','days','day','nights','night','morning','evening','summer','winter','spring','autumn','bloom','blossom','blossoms','lamplight','story','memory','lanes','streets','quarter','volcanic','sunset','far','west','country','hidden','secret','beautiful','best','famous','popular','ancient','historic','history','scenic','natural','national','park','mountain','mountains','peninsula','island','islands','bay','valley','cape','waterfall','falls','bridge','garden','temple','shrine','castle','museum','district','route','coastal','coastline')
  $coreWords = @(([regex]::Replace($identity.id.ToLowerInvariant(), '[^a-z0-9]+', ' ')).Split(' ') | Where-Object { $_.Length -ge 3 -and $_ -notin $genericWords } | Select-Object -First 2)
  if ($coreWords.Count -eq 0) { $coreWords = @(([regex]::Replace($identity.name.ToLowerInvariant(), '[^a-z0-9]+', ' ')).Split(' ') | Where-Object { $_.Length -ge 3 } | Select-Object -First 1) }
  $query = $coreWords -join ' '
  $encoded = [uri]::EscapeDataString($query)
  $uri = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=15&prop=imageinfo&iiprop=url&iiurlwidth=1400&format=json&gsrsearch=$encoded"
  $record = [ordered]@{ placeId=$placeId; place=$identity.name; query=$query; status='no-match'; searchedOn=(Get-Date -Format 'yyyy-MM-dd') }
  try {
    $response = Invoke-CommonsApi $uri
    $pages = @($response.query.pages.PSObject.Properties.Value)
    $keywords = @(([regex]::Replace($identity.id.ToLowerInvariant(), '[^a-z0-9]+', ' ')).Split(' ') | Where-Object { $_.Length -ge 3 -and $_ -notin $genericWords -and $_ -notin @('city','island','place','museum','garden','temple','shrine','castle','park','bridge','station','beach','bay','mount','mountain','river','lake','cape','valley','falls','waterfall','islands','cave','road','street','route','arts','art','tower','market','island','island') } | Select-Object -Unique)
    $candidates = foreach ($page in $pages) {
      $info = $page.imageinfo | Select-Object -First 1
      if (-not $info.thumburl -or -not $info.descriptionurl) { continue }
      $title = [string]$page.title
      if ($title -match '(?i)(emblem|coat of arms|flag of|location map|blank map|logo|map of)' ) { continue }
      if ($usedTitles.ContainsKey($title)) { continue }
      $normalizedTitle = [regex]::Replace($title.ToLowerInvariant(), '[^a-z0-9]+', ' ')
      $matches = @($keywords | Where-Object { $normalizedTitle -match "\b$([regex]::Escape($_))\b" })
      if ($matches.Count -eq 0) { continue }
      $score = $matches.Count * 10
      if ($normalizedTitle.Contains($identity.id.Replace('-', ' '))) { $score += 20 }
      [pscustomobject]@{ Page=$page; Info=$info; Title=$title; Score=$score; MatchCount=$matches.Count }
    }
    $best = @($candidates | Sort-Object Score -Descending | Select-Object -First 1)
    if ($best.Count -gt 0) {
      $photo = $best[0]
      $detailsUri = "https://commons.wikimedia.org/w/api.php?action=query&pageids=$($photo.Page.pageid)&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=1400&format=json"
      $details = Invoke-CommonsApi $detailsUri
      $detailPage = @($details.query.pages.PSObject.Properties.Value | Select-Object -First 1)
      $detailInfo = $detailPage[0].imageinfo | Select-Object -First 1
      $license = [string]$detailInfo.extmetadata.LicenseShortName.value
      $artist = [string]$detailInfo.extmetadata.Artist.value
      $artist = [System.Net.WebUtility]::HtmlDecode(([regex]::Replace($artist, '<[^>]+>', ' '))).Trim()
      if ($license -and $artist -and $detailInfo.thumburl) {
        $record.status = 'matched'
        $record.fileTitle = $photo.Title
        $record.imageUrl = $detailInfo.thumburl
        $record.sourcePage = $detailInfo.descriptionurl
        $record.photographer = $artist
        $record.license = $license
        $record.alt = "Photograph of $($identity.name) in $region, Japan"
        $record.matchScore = $photo.Score
        $usedTitles[$photo.Title] = $true
      }
    }
  } catch {
    $record.status = 'query-error'
    $record.error = $_.Exception.Message
  }
  $resultsById[$placeId] = [pscustomobject]$record
  $completed++
  if ($completed % 10 -eq 0) {
    $records = @($resultsById.Values | Sort-Object placeId)
    $out = [ordered]@{ generatedOn=(Get-Date -Format 'yyyy-MM-dd'); searchedCount=$records.Count; matchedCount=@($records | Where-Object status -eq 'matched').Count; records=$records }
    $json = $out | ConvertTo-Json -Depth 12
    [System.IO.File]::WriteAllText($existingPath, $json + "`n", [System.Text.UTF8Encoding]::new($false))
    Write-Output "Checked $completed of $($rows.Count) remaining photos; matched $(@($records | Where-Object status -eq 'matched').Count) total."
  }
  Start-Sleep -Milliseconds $DelayMilliseconds
}

$allRecords = @($resultsById.Values | Sort-Object placeId)
$final = [ordered]@{ generatedOn=(Get-Date -Format 'yyyy-MM-dd'); searchedCount=$allRecords.Count; matchedCount=@($allRecords | Where-Object status -eq 'matched').Count; records=$allRecords }
[System.IO.File]::WriteAllText($existingPath, ($final | ConvertTo-Json -Depth 12) + "`n", [System.Text.UTF8Encoding]::new($false))
Write-Output "Finished: $(@($allRecords | Where-Object status -eq 'matched').Count) destination-matched, licensed images; $(@($allRecords | Where-Object status -ne 'matched').Count) still require research."
