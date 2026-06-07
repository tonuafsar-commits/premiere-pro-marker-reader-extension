# Marker Timestamps for Adobe Premiere Pro

Marker Timestamps is a lightweight Adobe Premiere Pro CEP extension that scans the currently active sequence/timeline and outputs each sequence marker as:

```text
mm:ss - marker name
```

For markers at one hour or later, it automatically includes the hour:

```text
hh:mm:ss - marker name
```

Example:

```text
00:24 - Sniper Bladeworks MAMU
01:42 - Product closeup
01:03:08 - Final section
```

Frames are ignored and never shown.

After scanning, each timestamp in the main output box is clickable. Click a timestamp to move the active sequence playhead to that marker time.

Duplicate marker names are marked with a red `(!)` badge in the main output box.

The panel can show an update notice when the hosted `update.json` reports a newer version.

## Download

Use the files in the `dist` folder:

- `Marker-Timestamps-Complete-Package.zip` - compact cross-platform download with Windows and macOS manual installer ZIPs.
- `Marker-Timestamps-Premiere-Installer-Windows.exe` - easiest Windows installer.
- `Marker-Timestamps-Premiere-Extension-Windows-Manual.zip` - manual Windows package.
- `Marker-Timestamps-Premiere-Extension-macOS.zip` - macOS package with installer script.

## Windows Install

1. Download `dist/Marker-Timestamps-Premiere-Installer-Windows.exe`.
2. Close Premiere Pro.
3. Run the installer.
4. Restart Premiere Pro.
5. Open `Window > Extensions > Marker Timestamps`.

Windows may show an unknown publisher warning because the installer is not code-signed.

If you are using the compact complete package instead of the EXE, extract:

```text
Windows/Marker-Timestamps-Premiere-Extension-Windows-Manual.zip
```

Then double-click:

```text
Install on Windows.bat
```

## macOS Install

1. Download `dist/Marker-Timestamps-Premiere-Extension-macOS.zip`.
2. Extract the zip.
3. Open the `premiere-marker-timestamps` folder.
4. Right-click `Install on macOS.command` and choose `Open`.
5. If macOS says the file does not have appropriate access privileges, open Terminal and run:

   ```text
   bash "/path/to/premiere-marker-timestamps/Install on macOS.command"
   ```

6. Restart Premiere Pro.
7. Open `Window > Extensions > Marker Timestamps`.

## Usage

1. Open a Premiere Pro project.
2. Activate the sequence/timeline that contains sequence markers.
3. Open `Window > Extensions > Marker Timestamps`.
4. Click `Scan Markers`.
5. Click any timestamp in the main output box to move the playhead to that marker time.
6. Click `Copy`.
7. Click `Save TXT` to export a `.txt` file. The suggested file name uses the active sequence/timeline name.

The extension reads sequence markers from `app.project.activeSequence.markers`. Clip markers inside individual video/audio clips are not included.

## Source

The CEP extension source lives in `premiere-marker-timestamps`.

The Windows installer source lives in `installers/windows`.

The macOS DMG builder helper lives in `installers/macos`.

Build release ZIPs from the project root with:

```text
python build-release.py
```

This builder preserves executable permissions for macOS `.command` files and normalizes text scripts to LF line endings.
