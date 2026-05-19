@echo off
setlocal

set "EXTENSION_ID=premiere-marker-timestamps"
set "SOURCE_DIR=%~dp0"
set "TARGET_ROOT=%APPDATA%\Adobe\CEP\extensions"
set "TARGET_DIR=%TARGET_ROOT%\%EXTENSION_ID%"

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

if not exist "%TARGET_ROOT%" (
  mkdir "%TARGET_ROOT%" >nul 2>nul
)

if exist "%TARGET_DIR%" (
  echo Removing old installed copy...
  rmdir /s /q "%TARGET_DIR%"
)

echo Installing extension to:
echo %TARGET_DIR%
echo.

robocopy "%SOURCE_DIR%" "%TARGET_DIR%" /E /XD ".git" /XF "Install on Windows.bat" "Install on macOS.command" "Uninstall on Windows.bat" "Uninstall on macOS.command" >nul
if errorlevel 8 (
  echo ERROR: File copy failed.
  echo.
  pause
  exit /b 1
)

echo Enabling unsigned CEP extension loading for this Windows user...
for %%V in (6 7 8 9 10 11 12 13 14 15) do (
  reg add "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul
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
