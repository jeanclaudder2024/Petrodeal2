# PowerShell script to add email files to git

Write-Host "=== Adding Email Files to Git ===" -ForegroundColor Green

# Check if files exist
$files = @(
    "src/pages/admin/EmailConfiguration.tsx",
    "src/pages/admin/EmailTemplates.tsx",
    "src/pages/admin/AutoReplySystem.tsx",
    "src/utils/emailService.ts",
    "document-processor/email_service.py"
)

Write-Host "`n1. Checking files exist..." -ForegroundColor Yellow
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $file NOT FOUND!" -ForegroundColor Red
    }
}

# Add files to git
Write-Host "`n2. Adding files to git..." -ForegroundColor Yellow
foreach ($file in $files) {
    if (Test-Path $file) {
        git add $file
        Write-Host "   ✓ Added $file" -ForegroundColor Green
    }
}

# Check status
Write-Host "`n3. Git status:" -ForegroundColor Yellow
git status --short

# Commit
Write-Host "`n4. Committing..." -ForegroundColor Yellow
git commit -m "Add email system pages: EmailConfiguration, EmailTemplates, AutoReplySystem"

# Push
Write-Host "`n5. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

# Verify
Write-Host "`n6. Verifying files are tracked..." -ForegroundColor Yellow
$tracked = git ls-files | Select-String "Email"
if ($tracked) {
    Write-Host "   ✓ Files are tracked:" -ForegroundColor Green
    $tracked | ForEach-Object { Write-Host "     $_" -ForegroundColor Cyan }
} else {
    Write-Host "   ✗ No email files found in git!" -ForegroundColor Red
}

Write-Host "`n=== Done! ===" -ForegroundColor Green
Write-Host "Now run on VPS: git pull origin main" -ForegroundColor Yellow

