#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXTENSION_DIR="$PROJECT_DIR/premiere-marker-timestamps"
BUILD_DIR="$PROJECT_DIR/release/macos-build"
DMG_PATH="$PROJECT_DIR/release/Marker-Timestamps-Premiere-Installer-macOS.dmg"
VOLUME_NAME="Marker Timestamps Installer"

APP_CERT="${APP_CERT:-Developer ID Application: YOUR NAME (TEAMID)}"
NOTARY_PROFILE="${NOTARY_PROFILE:-}"

if ! command -v hdiutil >/dev/null 2>&1; then
  echo "hdiutil is required. Run this on macOS."
  exit 1
fi

if ! command -v codesign >/dev/null 2>&1; then
  echo "codesign is required. Install Xcode command line tools."
  exit 1
fi

if [ ! -d "$EXTENSION_DIR" ]; then
  echo "Extension folder not found: $EXTENSION_DIR"
  exit 1
fi

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cp -R "$EXTENSION_DIR" "$BUILD_DIR/"

find "$BUILD_DIR" -name "*.command" -exec chmod +x {} \;
find "$BUILD_DIR" -name "*.command" -exec codesign --force --timestamp --sign "$APP_CERT" {} \;

rm -f "$DMG_PATH"
hdiutil create -volname "$VOLUME_NAME" -srcfolder "$BUILD_DIR" -ov -format UDZO "$DMG_PATH"
codesign --force --timestamp --sign "$APP_CERT" "$DMG_PATH"

if [ -n "$NOTARY_PROFILE" ]; then
  xcrun notarytool submit "$DMG_PATH" --keychain-profile "$NOTARY_PROFILE" --wait
  xcrun stapler staple "$DMG_PATH"
else
  echo
  echo "DMG was signed but not notarized."
  echo "Set NOTARY_PROFILE to a stored notarytool profile to notarize automatically."
fi

echo
echo "Created:"
echo "$DMG_PATH"
