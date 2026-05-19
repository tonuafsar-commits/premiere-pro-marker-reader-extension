# Marker Timestamps for Adobe Premiere Pro

A lightweight CEP extension that scans the currently active Premiere Pro sequence and lists its timeline marker times plus marker names in a copy-ready format.

Example output:

```text
00:15 - Intro
01:42 - Product closeup
03:08 - End screen
```

For marker times under one hour, the panel outputs `mm:ss - name`. For marker times at one hour or later, it outputs `hh:mm:ss - name` because the hour is required to avoid ambiguity. Frames are ignored and never shown.

## Files

- `CSXS/manifest.xml` - CEP extension manifest for Premiere Pro.
- `index.html` - Panel markup.
- `css/styles.css` - Lightweight panel styling.
- `js/main.js` - Panel logic and copy behavior.
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

Double-click:

```text
Install on macOS.command
```

If macOS blocks the file because it was downloaded from the internet, right-click it and choose `Open`.

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

The scanner reads sequence markers from `app.project.activeSequence.markers`, including each marker's `name` field. Clip markers are not included.
