# Marker Timestamps for Adobe Premiere Pro

A lightweight CEP extension that scans the currently active Premiere Pro sequence and lists its timeline marker times plus marker names in a copy-ready format.

Example output:

```text
00:15 - Intro
01:42 - Product closeup
03:08 - End screen
```

For marker times under one hour, the panel outputs `mm:ss - name`. For marker times at one hour or later, it outputs `hh:mm:ss - name` because the hour is required to avoid ambiguity. Frames are ignored and never shown.

The panel can also show an in-panel update notice when a newer version is published through the hosted `update.json` file.

## Files

- `CSXS/manifest.xml` - CEP extension manifest for Premiere Pro.
- `index.html` - Panel markup.
- `css/styles.css` - Lightweight panel styling.
- `js/main.js` - Panel logic and copy behavior.
- `Save TXT` - Exports the generated marker list as a `.txt` file to a chosen location.
- `js/CSInterface.js` - Minimal CEP bridge wrapper.
- `jsx/host.jsx` - Premiere Pro ExtendScript marker scanner.

## Easy Install

Close Premiere Pro first.

### Windows

Double-click:

```text
Install on Windows.bat
```

The installer copies the extension to:

```text
%APPDATA%\Adobe\CEP\extensions\premiere-marker-timestamps
```

It also enables CEP development extension loading for the current Windows user.

### macOS

Do not double-click the installer the first time. Because this is not signed/notarized with an Apple Developer certificate, macOS may block it.

Right-click or Control-click:

```text
Install on macOS.command
```

Then choose:

```text
Open
```

If macOS shows `Apple could not verify "Install on macOS.command" is free of malware` and only offers `Move to Trash` or `Done`, open the included file:

```text
macOS - If Apple Could Not Verify.txt
```

The short fix is to open Terminal and run:

```text
xattr -dr com.apple.quarantine /path/to/premiere-marker-timestamps
```

Tip: type `xattr -dr com.apple.quarantine ` with a space at the end, drag the `premiere-marker-timestamps` folder into Terminal, then press Return.

The installer copies the extension to:

```text
~/Library/Application Support/Adobe/CEP/extensions/premiere-marker-timestamps
```

It also enables CEP development extension loading for the current macOS user.

## Open in Premiere Pro

After installing, restart Premiere Pro and open:

```text
Window > Extensions > Marker Timestamps
```

Yes, the extension should show there after installation. If it does not, restart Premiere Pro once more and confirm the folder contains `CSXS/manifest.xml` inside the Adobe CEP extensions directory.

## Uninstall

Windows:

```text
Uninstall on Windows.bat
```

macOS:

```text
Uninstall on macOS.command
```

## Usage

1. Open a Premiere Pro project and activate the sequence timeline.
2. Click `Scan Markers`.
3. Click `Copy` to copy the timestamp and marker name list.
4. Click `Save TXT` to choose a location and export the same list as a `.txt` file. The suggested file name uses the active sequence/timeline name.
5. After the TXT file is saved, a popup confirms the saved file path.

The scanner reads sequence markers from `app.project.activeSequence.markers`, including each marker's `name` field. Clip markers are not included.
