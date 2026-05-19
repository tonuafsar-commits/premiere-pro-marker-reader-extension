# Public Release Checklist

Use this before sharing the extension widely.

## Functional Testing

- Test on Windows with Premiere Pro installed.
- Test on macOS with Premiere Pro installed.
- Confirm `Window > Extensions > Marker Timestamps` appears.
- Confirm `Scan Markers` reads sequence/timeline markers.
- Confirm output format is `mm:ss - name` or `hh:mm:ss - name`.
- Confirm `Copy` works.
- Confirm `Save TXT` opens a foreground save dialog.
- Confirm TXT file name defaults to the active sequence/timeline name.

## Windows Smooth Install

- Build `release/Marker-Timestamps-Premiere-Installer-Windows.exe`.
- Sign the EXE with `signing/windows-sign.ps1`.
- Test on a clean Windows machine.
- Confirm SmartScreen no longer shows Unknown Publisher.

## macOS Smooth Install

- Build the DMG on a Mac with `signing/macos-build-signed-dmg.command`.
- Sign and notarize the DMG.
- Test on a clean Mac.
- Confirm macOS does not show "Apple could not verify".

## Updates

- Push the GitHub repo publicly.
- Make sure `update.json` is available at the URL used in `js/main.js`.
- Increase `version` in `update.json` when releasing a newer build.
- Increase `CURRENT_VERSION` in `js/main.js`.
- Increase `ExtensionBundleVersion` and extension `Version` in `CSXS/manifest.xml`.
