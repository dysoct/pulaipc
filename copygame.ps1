Add-Type -AssemblyName System.Windows.Forms

$scriptDir =$PSScriptRoot

$MasterRepoPath = Join-Path $scriptDir "..\nsp"

$GameListFile = Join-Path $scriptDir "games_to_copy.txt"

if (-not (Test-Path -Path $GameListFile)) {
    Write-Host "Error: games_to_copy.txt not found." -ForegroundColor Red
    exit
}

if (-not (Test-Path -Path $MasterRepoPath)) {
    Write-Host "Error: nsp folder not found at $MasterRepoPath" -ForegroundColor Red
    exit
}

$folderPaths = New-Object System.Collections.Specialized.StringCollection

$successCount = 0

$notFoundCount = 0

$rawLines = Get-Content -Path $GameListFile

$requestedGames = New-Object System.Collections.Generic.List[string]

foreach ($line in $rawLines) {
    if (-not [string]::IsNullOrWhiteSpace($line)) {
        $requestedGames.Add($line.Trim())
    }
}

Write-Host "Locating $($requestedGames.Count) games inside:$MasterRepoPath..." -ForegroundColor Cyan

foreach ($gameName in $requestedGames) {
    $foundFolder = Get-ChildItem -Path $MasterRepoPath -Directory | Where-Object { $_.Name -like "*$gameName*" } | Select-Object -First 1

    if ($foundFolder) {
        [void]$folderPaths.Add($foundFolder.FullName)
        Write-Host "Found: $($foundFolder.Name)" -ForegroundColor Green
        [void]($successCount++)
    } else {
        Write-Host "Not Found: $gameName" -ForegroundColor Red
        [void]($notFoundCount++)
    }
}

if ($folderPaths.Count -gt 0) {     [System.Windows.Forms.Clipboard]::SetFileDropList($folderPaths)
    
    Write-Host "`nSuccess! $successCount game folders copied to Clipboard." -ForegroundColor Green
    Write-Host "Go to your MTP Switch window and press Ctrl + V to paste!" -ForegroundColor Yellow
} else {
    Write-Host "`nNo valid game folders were found to copy." -ForegroundColor Red
}
