[CmdletBinding()]
param(
    [string]$Droplet = "deploy@129.212.239.28",
    [string]$Branch = "main",
    [string]$DeployPath = "~/waste2goods",
    [switch]$LocalOnly
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

$files = @(
  "packages/backend/src/index-mysql.js",
  "packages/backend/src/index.js",
  "packages/backend/src/security/oauth-user-store.js",
  "packages/backend/src/db-mysql.js",
  "packages/mobile-app/src/app/App.tsx",
  "deploy-remove-welcome-points.ps1",
  "remote-update.sh"
)

function Step($n, $msg) { Write-Host "[$n] $msg" -ForegroundColor Cyan }

Step 1 "Checking working tree"
$changed = (git status --porcelain | ForEach-Object { $_.Substring(3).Trim() })
foreach ($f in $files) {
    if ($changed -contains $f) { Write-Host "  found: $f" -ForegroundColor Green }
    else { Write-Warning "  not modified: $f" }
}

Step 2 "Staging changed files"
git add -- $files
Write-Host (git diff --cached --name-only | ForEach-Object { "  staged: $_" })

Step 3 "Committing"
$msg = "fix: remove automatic 50 welcome points on registration"
if ((git diff --cached --name-only | Measure-Object).Count -eq 0) {
    Write-Warning "Nothing staged to commit - skipping commit step."
} else {
    git commit -m $msg
}

Step 4 "Pushing to origin/$Branch"
git push origin $Branch

if ($LocalOnly) {
    Write-Host "LocalOnly set: committed + pushed locally. Skipping droplet steps." -ForegroundColor Yellow
    return
}

Step 5 "Deploying on droplet ($Droplet): pull -> rebuild api+web -> SQL cleanup"
Get-Content -Raw "$PSScriptRoot\remote-update.sh" | ssh $Droplet "bash -s -- $Branch"

Write-Host "DONE. New registrations now start at 0 points." -ForegroundColor Green
