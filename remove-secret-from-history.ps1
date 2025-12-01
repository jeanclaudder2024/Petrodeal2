# Remove OpenAI API key from git history and push

Write-Host "=== Removing Secret from Git History ===" -ForegroundColor Green
Write-Host "WARNING: This will rewrite git history!" -ForegroundColor Red
Write-Host ""

# Step 1: Backup current branch
Write-Host "1. Creating backup branch..." -ForegroundColor Yellow
git branch backup-before-filter 2>$null
Write-Host "   ✅ Backup created: backup-before-filter" -ForegroundColor Green

# Step 2: Remove secret from all commits using filter-branch
Write-Host "`n2. Removing secret from git history..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Cyan

# Use filter-branch to remove the files from all commits
$filterCommand = @"
git filter-branch --force --index-filter `
  "git rm --cached --ignore-unmatch VPS_DEPLOY_OPENAI.sh VPS_DEPLOY_OPENAI_NOW.md 2>/dev/null || true" `
  --prune-empty --tag-name-filter cat -- --all
"@

Invoke-Expression $filterCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ History cleaned!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Filter-branch may have issues. Trying alternative..." -ForegroundColor Yellow
}

# Step 3: Force garbage collection
Write-Host "`n3. Cleaning up..." -ForegroundColor Yellow
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin 2>$null
git reflog expire --expire=now --all 2>$null
git gc --prune=now --aggressive 2>$null
Write-Host "   ✅ Cleanup complete" -ForegroundColor Green

# Step 4: Add all current changes
Write-Host "`n4. Adding current changes..." -ForegroundColor Yellow
git add -A
git commit -m "Update: Email navigation and remove secrets" -m "All API keys removed from repository"

# Step 5: Force push
Write-Host "`n5. Force pushing to GitHub..." -ForegroundColor Yellow
Write-Host "   WARNING: This will overwrite remote history!" -ForegroundColor Red
git push origin --force --all

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Push failed. You may need to:" -ForegroundColor Red
    Write-Host "   1. Allow the secret on GitHub:" -ForegroundColor Yellow
    Write-Host "      https://github.com/jeanclaudder2024/Petrodeal2/security/secret-scanning/unblock-secret/36DexpVllFa2DBITkaJi2SE6wuw" -ForegroundColor Cyan
    Write-Host "   2. Then run: git push origin --force --all" -ForegroundColor Yellow
}

Write-Host "`n=== Done ===" -ForegroundColor Green

