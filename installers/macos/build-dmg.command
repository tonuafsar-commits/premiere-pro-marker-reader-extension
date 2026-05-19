#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
EXTENSION_DIR="$PROJECT_DIR/premiere-marker-timestamps"
GUIDE_FILE="$PROJECT_DIR/Marker-Timestamps-Install-Guide.txt"
BUILD_DIR="$PROJECT_DIR/installers/macos/build"
DMG_NAME="Marker-Timestamps-Premiere-Installer-macOS.dmg"
DMG_PATH="$PROJECT_DIR/$DMG_NAME"

if [ ! -d "$EXTENSION_DIR" ]; then
  echo "ERROR: Could not find premiere-marker-timestamps folder."
  exit 1
fi

if ! command -v hdiutil >/dev/null 2>&1; then
  echo "ERROR: hdiutil was not found. This script must be run on macOS."
  exit 1
fi

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

cp -R "$EXTENSION_DIR" "$BUILD_DIR/"

if [ -f "$GUIDE_FILE" ]; then
  cp "$GUIDE_FILE" "$BUILD_DIR/"
fi

rm -f "$DMG_PATH"
hdiutil create \
  -volname "Marker Timestamps Installer" \
  -srcfolder "$BUILD_DIR" \
  -ov \
  -format UDZO \
  "$DMG_PATH"

echo
echo "Created:"
echo "$DMG_PATH"
