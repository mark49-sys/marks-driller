# MarkDriller Desktop Shortcut & Windows Icon Cache Synchronizer
# Updates desktop and start menu shortcuts directly to official multi-resolution ICO
# and triggers Windows Shell notification to reload Explorer icon cache.

$ErrorActionPreference = 'SilentlyContinue'

$sourceIco = "$PSScriptRoot\..\public\favicon.ico"
if (-not (Test-Path $sourceIco)) {
    throw "Source icon not found at $sourceIco. Please run 'npm run icons' first."
}

$sourceIco = (Resolve-Path $sourceIco).Path
Write-Host "Syncing official MarkDriller icon: $sourceIco" -ForegroundColor Cyan

# 1. Update Chrome Web Application cached ICO & MD5
$chromeWebAppsDir = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Web Applications"
if (Test-Path $chromeWebAppsDir) {
    Get-ChildItem $chromeWebAppsDir -Filter "*bhnjnfpcpacdhkmpmhhononcebdchngl*" -Recurse | Where-Object { $_.Extension -eq '.ico' } | ForEach-Object {
        $targetIco = $_.FullName
        Write-Host "Updating Chrome PWA cached icon: $targetIco" -ForegroundColor Green
        Copy-Item -Path $sourceIco -Destination $targetIco -Force

        $targetMd5 = "$targetIco.md5"
        $md5 = [System.Security.Cryptography.MD5]::Create()
        $stream = [System.IO.File]::OpenRead($targetIco)
        $hashBytes = $md5.ComputeHash($stream)
        $stream.Close()
        $stream.Dispose()
        [System.IO.File]::WriteAllBytes($targetMd5, $hashBytes)
    }
}

# 2. Known Shortcut Locations (Direct check without slow recursion into OneDrive node_modules)
$targetShortcuts = @(
    "$HOME\OneDrive\Desktop\MarkDriller CBT & Examination Platform.lnk",
    "$HOME\Desktop\MarkDriller CBT & Examination Platform.lnk",
    "$env:PUBLIC\Desktop\MarkDriller CBT & Examination Platform.lnk",
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Chrome Apps\MarkDriller CBT & Examination Platform.lnk"
)

$sh = New-Object -ComObject WScript.Shell
foreach ($scPath in $targetShortcuts) {
    if (Test-Path $scPath) {
        try {
            $sc = $sh.CreateShortcut($scPath)
            Write-Host "Updating Shortcut: $scPath" -ForegroundColor Green
            Write-Host "  Previous IconLocation: $($sc.IconLocation)"
            $sc.IconLocation = "$sourceIco,0"
            $sc.Save()
            Write-Host "  Updated IconLocation: $($sc.IconLocation)"
            [System.Runtime.InteropServices.Marshal]::ReleaseComObject($sc) | Out-Null
        } catch {
            Write-Host "Notice: Failed to update $scPath" -ForegroundColor Yellow
        }
    }
}
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($sh) | Out-Null

# 3. Notify Windows Shell
try {
    Add-Type -TypeDefinition @"
    using System;
    using System.Runtime.InteropServices;
    public class WinShellNotifier {
        [DllImport("shell32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);
    }
"@
    [WinShellNotifier]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
    Write-Host "Windows Shell notified (SHCNE_ASSOCCHANGED)." -ForegroundColor Green
} catch {
    Write-Host "Notice: SHChangeNotify failed, calling ie4uinit..." -ForegroundColor Yellow
}

# 4. Trigger Windows built-in icon cache reload utility
Start-Process "ie4uinit.exe" -ArgumentList "-show" -NoNewWindow -Wait -ErrorAction SilentlyContinue

Write-Host "Icon synchronization complete!" -ForegroundColor Cyan
