#!/bin/bash
set -e

EXTENSION_ID="premiere-marker-timestamps"
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_ROOT="$HOME/Library/Application Support/Adobe/CEP/extensions"
TARGET_DIR="$TARGET_ROOT/$EXTENSION_ID"

echo
echo "Marker Timestamps installer for Adobe Premiere Pro"
echo "=================================================="
echo

if [ ! -f "$SOURCE_DIR/CSXS/manifest.xml" ]; then
  echo "ERROR: Could not find CSXS/manifest.xml."
  echo "Please run this installer from inside the $EXTENSION_ID folder."
  echo
  read -r -p "Press Return to close..."
  exit 1
fi

echo "Closing Premiere Pro before installing is recommended."
echo

mkdir -p "$TARGET_ROOT"

if [ -d "$TARGET_DIR" ]; then
  echo "Removing old installed copy..."
  rm -rf "$TARGET_DIR"
fi

echo "Installing extension to:"
echo "$TARGET_DIR"
echo

mkdir -p "$TARGET_DIR"
rsync -a \
  --exclude ".git" \
  --exclude "Install on Windows.bat" \
  --exclude "Install on macOS.command" \
  --exclude "Uninstall on Windows.bat" \
  --exclude "Uninstall on macOS.command" \
  "$SOURCE_DIR/" "$TARGET_DIR/"

echo "Enabling unsigned CEP extension loading for this macOS user..."
for version in 6 7 8 9 10 11 12 13 14 15; do
  defaults write "com.adobe.CSXS.$version" PlayerDebugMode 1
done

echo
echo "Installation complete."
echo
echo "Open Premiere Pro, then go to:"
echo "Window > Extensions > Marker Timestamps"
echo
echo "If Premiere Pro was already open, restart it first."
echo
read -r -p "Press Return to close..."
