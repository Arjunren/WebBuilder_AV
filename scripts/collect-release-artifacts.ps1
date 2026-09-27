$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectRoot 'release-artifacts'
$windowsSource = Join-Path $projectRoot 'src-tauri\target\release\bundle\nsis\WebBuilder_AV_1.1.1_x64-setup.exe'
$androidSource = Join-Path $projectRoot 'src-tauri\gen\android\app\build\outputs\apk\universal\debug\app-universal-debug.apk'
$windowsDestination = Join-Path $artifactDirectory 'WebBuilder_AV_Windows.exe'
$androidDestination = Join-Path $artifactDirectory 'WebBuilder_AV_Android.apk'

foreach ($source in @($windowsSource, $androidSource)) {
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
    throw "Required build artifact is missing: $source"
  }
}

New-Item -ItemType Directory -Path $artifactDirectory -Force | Out-Null
Copy-Item -LiteralPath $windowsSource -Destination $windowsDestination -Force
Copy-Item -LiteralPath $androidSource -Destination $androidDestination -Force

function Get-Sha256([string]$path) {
  $stream = [System.IO.File]::OpenRead($path)
  $algorithm = [System.Security.Cryptography.SHA256]::Create()
  try {
    return -join ($algorithm.ComputeHash($stream) | ForEach-Object { $_.ToString('X2') })
  }
  finally {
    $algorithm.Dispose()
    $stream.Dispose()
  }
}

@($windowsDestination, $androidDestination) |
  ForEach-Object { "{0}  {1}" -f (Get-Sha256 $_), (Split-Path -Leaf $_) } |
  Set-Content -LiteralPath (Join-Path $artifactDirectory 'SHA256SUMS.txt') -Encoding utf8

Write-Output $windowsDestination
Write-Output $androidDestination
