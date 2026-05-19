@echo off
setlocal

set "EXTENSION_ID=premiere-marker-timestamps"
set "TARGET_DIR=%APPDATA%\Adobe\CEP\extensions\%EXTENSION_ID%"

echo.
echo Marker Timestamps uninstaller for Adobe Premiere Pro
echo ====================================================
echo.

if exist "%TARGET_DIR%" (
  echo Removing:
  echo %TARGET_DIR%
  rmdir /s /q "%TARGET_DIR%"
  echo.
  echo Extension removed.
) else (
  echo Extension was not found at:
  echo %TARGET_DIR%
)

echo.
echo Note: CEP PlayerDebugMode registry values were left unchanged because
echo other development extensions may use them.
echo.
pause
