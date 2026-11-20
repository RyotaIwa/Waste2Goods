# Builds the Pre-UAT submission ZIP per form Section H.
# Run from the repo root:  pwsh -File evidence\make_submission_zip.ps1 -TeamName "TeamAlpha"
param(
    [string]$TeamName = "TeamName"
)

$root = Split-Path -Parent $PSScriptRoot
$staging = Join-Path $env:TEMP "w2g_submission"
$zipPath = Join-Path $root "${TeamName}_Waste2Goods_Testing.zip"

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Force -Path (Join-Path $staging "evidence") | Out-Null

# 1. The filled form
$form = Join-Path $root "PRE-UAT_Testing_Submission_Waste2Goods.docx"
if (Test-Path $form) { Copy-Item $form $staging }

# 2. Evidence folders
Copy-Item (Join-Path $root "evidence\screenshots") (Join-Path $staging "evidence\screenshots") -Recurse -ErrorAction SilentlyContinue
Copy-Item (Join-Path $root "evidence\reports")    (Join-Path $staging "evidence\reports")    -Recurse -ErrorAction SilentlyContinue
Copy-Item (Join-Path $root "evidence\by-test-id") (Join-Path $staging "evidence\by-test-id") -Recurse -ErrorAction SilentlyContinue

# 3. Repo info text file
$commit = (git -C $root rev-parse --short HEAD 2>$null)
@"
Repository : https://github.com/RyotaIwa/Waste2Goods.git
Branch     : main
Commit     : $commit
System     : Waste2Goods - Gamified Recycling Platform
Built      : $(Get-Date -Format 'yyyy-MM-dd HH:mm')
"@ | Set-Content (Join-Path $staging "repo-info.txt") -Encoding utf8

# 4. Zip it
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$staging\*" -DestinationPath $zipPath

Write-Host ""
Write-Host "Submission ZIP created:" -ForegroundColor Green
Write-Host "  $zipPath"
Write-Host ""
Write-Host "Contents:"
Get-ChildItem $staging -Recurse -File | ForEach-Object {
    Write-Host ("  " + $_.FullName.Replace($staging, ""))
}
Write-Host ""
Write-Host "Reminder: rename to ${TeamName}_Waste2Goods_Testing.zip with your real team name." -ForegroundColor Yellow
