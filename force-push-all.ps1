# Force push all changes to GitHub

Write-Host "=== Checking Git Status ===" -ForegroundColor Green

# Show current status
Write-Host "`n1. Current git status:" -ForegroundColor Yellow
git status

# Show uncommitted changes
Write-Host "`n2. Uncommitted files:" -ForegroundColor Yellow
git status --short

# Add all files
Write-Host "`n3. Adding all files..." -ForegroundColor Yellow
git add -A

# Show what will be committed
Write-Host "`n4. Files staged for commit:" -ForegroundColor Yellow
git status --short

# Commit
Write-Host "`n5. Committing changes..." -ForegroundColor Yellow
git commit -m "Update: Email navigation buttons and admin panel improvements"

# Show last commit
Write-Host "`n6. Last commit:" -ForegroundColor Yellow
git log --oneline -1

# Push
Write-Host "`n7. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

# Verify
Write-Host "`n8. Verifying push..." -ForegroundColor Yellow
git log --oneline -1
git status

Write-Host "`n=== Done! ===" -ForegroundColor Green

