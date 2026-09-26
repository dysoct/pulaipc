# =========================================================
# Pulai PC - Game List Exporter & GitHub Auto-Sync
# =========================================================

# Path to 'nsp' folder located one level up from script directory
$gameDirectoryPath = Join-Path -Path$PSScriptRoot -ChildPath "..\nsp"

# Path to index.html in the same directory as script
$htmlPath = Join-Path -Path$PSScriptRoot -ChildPath "index.html"

if (-not (Test-Path $htmlPath)) {
    Write-Host "[ERROR] index.html not found at: $htmlPath" -ForegroundColor Red
    pause
    exit 1
}

if (-not (Test-Path $gameDirectoryPath)) {
    Write-Host "[ERROR] 'nsp' folder not found at: $gameDirectoryPath" -ForegroundColor Red
    pause
    exit 1
}

$resolvedGamePath = (Resolve-Path$gameDirectoryPath).Path
Write-Host "[1/3] Scanning game folders at: $resolvedGamePath..." -ForegroundColor Cyan

# Scan game directories and build JS object array
$gameEntries = foreach ($dir in Get-ChildItem -Path$resolvedGamePath -Directory) {
    if ($dir.Name -like ".*") { continue }

    # Clean bracketed tags like [NSP], [v1.0] and escape double quotes
    $cleanName =$dir.Name -replace '\s*\[.*?\]', ''
    $cleanName =$cleanName -replace '"', '\"'
    
    $files = Get-ChildItem -LiteralPath$dir.FullName -Recurse -File -Force -ErrorAction SilentlyContinue
    $bytes = ($files | Measure-Object -Property Length -Sum).Sum
    $gbSize = [math]::Round($bytes / 1GB, 2)

    "      { name: "$cleanName", size: $gbSize }"
}

# Construct JavaScript array
$jsArray = "const games = [rn" + ($gameEntries -join ",rn") + "rn    ];"

Write-Host "[2/3] Updating index.html dataset..." -ForegroundColor Cyan

# Replace const games = [...] array in index.html
$htmlContent = Get-Content -Path$htmlPath -Raw
$updatedHtml =$htmlContent -replace 'const games = \[[\s\S]*?\];', $jsArray
$updatedHtml \vert{} Out-File -FilePath$htmlPath -Encoding utf8

Write-Host "[SUCCESS] index.html updated locally!" -ForegroundColor Green

# =========================================================
# Git Auto-Push Sequence
# =========================================================
Write-Host "[3/3] Syncing changes to GitHub..." -ForegroundColor Yellow

Set-Location $PSScriptRoot

$currentDate = Get-Date -Format "yyyy-MM-dd HH:mm"

git add index.html
git commit -m "Auto-update game list: $currentDate"
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "n[COMPLETED] Live website updated successfully!" -ForegroundColor Green
} else {
    Write-Host "n[WARNING] Git push failed. Check network or credentials." -ForegroundColor Red
}

pause