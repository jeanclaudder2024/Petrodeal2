# Full deploy from Windows: push to GitHub, then run full deploy on VPS.
# Usage:
#   .\deploy-full.ps1                    # push then print VPS commands
#   $env:DEPLOY_SSH = "user@your-vps"; .\deploy-full.ps1   # push then SSH to run FULL_DEPLOY.sh
#   $env:SKIP_PUSH = "1"; .\deploy-full.ps1                # skip git push

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RepoRoot

Write-Host "=========================================="
Write-Host "DEPLOY: Push to GitHub + Full VPS Deploy"
Write-Host "=========================================="
Write-Host ""

# 1. Optional: push to GitHub
if (-not $env:SKIP_PUSH) {
    Write-Host "1. Pushing to GitHub..."
    git add -A
    $status = git status --porcelain
    if (-not $status) {
        Write-Host "   No changes to commit."
    } else {
        git commit -m "Deploy: document API portal and updates"
        git push origin main 2>$null; if ($LASTEXITCODE -ne 0) { git push origin master }
        Write-Host "   Pushed to origin"
    }
    Write-Host ""
} else {
    Write-Host "1. Skipping git push (SKIP_PUSH=1)"
    Write-Host ""
}

# 2. Deploy on VPS
if ($env:DEPLOY_SSH) {
    Write-Host "2. Running full deploy on VPS ($env:DEPLOY_SSH)..."
    ssh $env:DEPLOY_SSH "cd /opt/petrodealhub && bash FULL_DEPLOY.sh"
    Write-Host "   VPS deploy finished"
} else {
    Write-Host "2. Run the full deploy ON YOUR VPS:"
    Write-Host ""
    Write-Host "   ssh root@your-vps-host   # or your VPS user@host"
    Write-Host "   cd /opt/petrodealhub"
    Write-Host "   bash FULL_DEPLOY.sh"
    Write-Host ""
    Write-Host "   Or in one line:"
    Write-Host "   ssh root@your-vps-host 'cd /opt/petrodealhub && bash FULL_DEPLOY.sh'"
    Write-Host ""
    Write-Host "   To run deploy automatically from this script, set:"
    Write-Host "   `$env:DEPLOY_SSH = 'user@your-vps'; .\deploy-full.ps1"
    Write-Host ""
}

Write-Host "=========================================="
Write-Host "DONE"
Write-Host "=========================================="
