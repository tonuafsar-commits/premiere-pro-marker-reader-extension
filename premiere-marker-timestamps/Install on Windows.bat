@echo off
setlocal

set "EXTENSION_ID=premiere-marker-timestamps"
set "SOURCE_DIR=%~dp0"

echo.
echo Marker Timestamps installer for Adobe Premiere Pro
echo ==================================================
echo.

if not exist "%SOURCE_DIR%CSXS\manifest.xml" (
  echo ERROR: Could not find CSXS\manifest.xml.
  echo Please run this installer from inside the %EXTENSION_ID% folder.
  echo.
  pause
  exit /b 1
)

echo Closing Premiere Pro before installing is recommended.
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'Stop';" ^
  "$source = [System.IO.Path]::GetFullPath('%SOURCE_DIR%');" ^
  "$targetRoot = Join-Path $env:APPDATA 'Adobe\CEP\extensions';" ^
  "$target = Join-Path $targetRoot '%EXTENSION_ID%';" ^
  "$excluded = @('Install on Windows.bat','Install on macOS.command','Uninstall on Windows.bat','Uninstall on macOS.command');" ^
  "if (-not (Test-Path -LiteralPath (Join-Path $source 'CSXS\manifest.xml'))) { throw 'CSXS\manifest.xml was not found. Extract the zip first, then run this installer from the extracted folder.' }" ^
  "New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null;" ^
  "if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Recurse -Force }" ^
  "New-Item -ItemType Directory -Path $target -Force | Out-Null;" ^
  "Get-ChildItem -LiteralPath $source -Force | Where-Object { $excluded -notcontains $_.Name } | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $target -Recurse -Force };" ^
  "foreach ($version in 6..15) { New-Item -Path ('HKCU:\Software\Adobe\CSXS.' + $version) -Force | Out-Null; New-ItemProperty -Path ('HKCU:\Software\Adobe\CSXS.' + $version) -Name PlayerDebugMode -Value '1' -PropertyType String -Force | Out-Null };" ^
  "Write-Host ''; Write-Host 'Installed to:'; Write-Host $target;"

if errorlevel 1 (
  echo.
  echo ERROR: Installation failed.
  echo Make sure the zip is fully extracted, close Premiere Pro, and run this installer again.
  echo.
  pause
  exit /b 1
)

echo.
echo Installation complete.
echo.
echo Open Premiere Pro, then go to:
echo Window ^> Extensions ^> Marker Timestamps
echo.
echo If Premiere Pro was already open, restart it first.
echo.
pause
