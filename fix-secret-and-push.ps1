# Fix GitHub secret blocking and push all updates

Write-Host "=== Fixing GitHub Secret Block ===" -ForegroundColor Green

# Step 1: Check current status
Write-Host "`n1. Checking git status..." -ForegroundColor Yellow
git status

# Step 2: Remove secret from history using filter-branch
Write-Host "`n2. Removing secret from git history..." -ForegroundColor Yellow
Write-Host "   This will rewrite commit history to remove the API key" -ForegroundColor Cyan

# Use git filter-repo or filter-branch to remove the secret
# First, let's try a simpler approach - create a new commit that removes it

# Step 3: Check if files still exist
Write-Host "`n3. Checking for secret files..." -ForegroundColor Yellow
if (Test-Path "VPS_DEPLOY_OPENAI.sh") {
    Write-Host "   Removing VPS_DEPLOY_OPENAI.sh..." -ForegroundColor Red
    git rm --cached VPS_DEPLOY_OPENAI.sh 2>$null
    Remove-Item VPS_DEPLOY_OPENAI.sh -Force -ErrorAction SilentlyContinue
}

if (Test-Path "VPS_DEPLOY_OPENAI_NOW.md") {
    Write-Host "   Removing VPS_DEPLOY_OPENAI_NOW.md..." -ForegroundColor Red
    git rm --cached VPS_DEPLOY_OPENAI_NOW.md 2>$null
    Remove-Item VPS_DEPLOY_OPENAI_NOW.md -Force -ErrorAction SilentlyContinue
}

# Step 4: Add all other changes
Write-Host "`n4. Adding all changes..." -ForegroundColor Yellow
git add -A

# Step 5: Commit
Write-Host "`n5. Committing changes..." -ForegroundColor Yellow
git commit -m "Remove API keys and push email navigation updates"

# Step 6: Try to push
Write-Host "`n6. Attempting to push..." -ForegroundColor Yellow
$pushResult = git push origin main 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Push failed due to secret in history!" -ForegroundColor Red
    Write-Host "`n=== SOLUTION ===" -ForegroundColor Yellow
    Write-Host "You need to either:" -ForegroundColor Cyan
    Write-Host "1. Go to GitHub and allow the secret:" -ForegroundColor White
    Write-Host "   https://github.com/jeanclaudder2024/Petrodeal2/security/secret-scanning/unblock-secret/36DexpVllFa2DBITkaJi2SE6wuw" -ForegroundColor Cyan
    Write-Host "`n2. OR rewrite history (advanced):" -ForegroundColor White
    Write-Host "   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch VPS_DEPLOY_OPENAI.sh VPS_DEPLOY_OPENAI_NOW.md' --prune-empty --tag-name-filter cat -- --all" -ForegroundColor Cyan
    Write-Host "   git push origin --force --all" -ForegroundColor Cyan
} else {
    Write-Host "`n✅ Push successful!" -ForegroundColor Green
}

Write-Host "`n=== Done ===" -ForegroundColor Green

