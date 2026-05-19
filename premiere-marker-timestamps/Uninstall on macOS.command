#!/bin/bash
set -e

EXTENSION_ID="premiere-marker-timestamps"
TARGET_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/$EXTENSION_ID"

echo
echo "Marker Timestamps uninstaller for Adobe Premiere Pro"
echo "===================================================="
echo

if [ -d "$TARGET_DIR" ]; then
  echo "Removing:"
  echo "$TARGET_DIR"
  rm -rf "$TARGET_DIR"
  echo
  echo "Extension removed."
else
  echo "Extension was not found at:"
  echo "$TARGET_DIR"
fi

echo
echo "Note: CEP PlayerDebugMode settings were left unchanged because"
echo "other development extensions may use them."
echo
read -r -p "Press Return to close..."
