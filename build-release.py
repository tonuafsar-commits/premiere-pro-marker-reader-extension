#!/usr/bin/env python3
"""Build cross-platform release ZIPs with macOS-safe script permissions."""

from __future__ import annotations

import os
import stat
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent
EXTENSION_DIR = ROOT / "premiere-marker-timestamps"
DIST_DIR = ROOT / "dist"
MAC_ZIP = DIST_DIR / "Marker-Timestamps-Premiere-Extension-macOS.zip"
WINDOWS_ZIP = DIST_DIR / "Marker-Timestamps-Premiere-Extension-Windows-Manual.zip"
COMPLETE_ZIP = DIST_DIR / "Marker-Timestamps-Complete-Package.zip"
WINDOWS_EXE = DIST_DIR / "Marker-Timestamps-Premiere-Installer-Windows.exe"

TEXT_SUFFIXES = {
    ".bat",
    ".command",
    ".css",
    ".html",
    ".js",
    ".json",
    ".jsx",
    ".md",
    ".txt",
    ".xml",
}

MAC_EXECUTABLE_NAMES = {
    "Install on macOS.command",
    "Uninstall on macOS.command",
}


def main() -> None:
    if not (EXTENSION_DIR / "CSXS" / "manifest.xml").exists():
        raise SystemExit("Could not find premiere-marker-timestamps/CSXS/manifest.xml")

    DIST_DIR.mkdir(exist_ok=True)
    normalize_macos_scripts()
    build_extension_zip(MAC_ZIP, platform="macos")
    build_extension_zip(WINDOWS_ZIP, platform="windows")
    build_complete_zip()

    print("Built:")
    print(f"  {MAC_ZIP}")
    print(f"  {WINDOWS_ZIP}")
    print(f"  {COMPLETE_ZIP}")


def normalize_macos_scripts() -> None:
    for path in EXTENSION_DIR.glob("*.command"):
        data = path.read_bytes()
        path.write_bytes(data.replace(b"\r\n", b"\n").replace(b"\r", b"\n"))


def build_extension_zip(zip_path: Path, *, platform: str) -> None:
    if zip_path.exists():
        zip_path.unlink()

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        add_tree(archive, EXTENSION_DIR, Path("premiere-marker-timestamps"), platform=platform)


def build_complete_zip() -> None:
    if COMPLETE_ZIP.exists():
        COMPLETE_ZIP.unlink()

    with zipfile.ZipFile(COMPLETE_ZIP, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        add_file(archive, ROOT / "README.md", Path("README.md"))
        add_file(archive, ROOT / "README-WINDOWS.txt", Path("README-WINDOWS.txt"))
        add_file(archive, ROOT / "README-MACOS.txt", Path("README-MACOS.txt"))
        add_file(archive, ROOT / "Marker-Timestamps-Install-Guide.txt", Path("Marker-Timestamps-Install-Guide.txt"))
        add_file(archive, MAC_ZIP, Path("macOS") / MAC_ZIP.name, binary=True)
        add_file(archive, WINDOWS_ZIP, Path("Windows") / WINDOWS_ZIP.name, binary=True)
        if WINDOWS_EXE.exists():
            add_file(archive, WINDOWS_EXE, Path("Windows") / WINDOWS_EXE.name, binary=True)


def add_tree(archive: zipfile.ZipFile, source: Path, archive_root: Path, *, platform: str) -> None:
    for path in sorted(source.rglob("*")):
        relative = path.relative_to(source)
        if should_exclude(relative, platform=platform):
            continue
        archive_name = archive_root / relative
        if path.is_dir():
            add_directory(archive, archive_name)
        else:
            add_file(archive, path, archive_name)


def should_exclude(relative: Path, *, platform: str) -> bool:
    name = relative.name
    if any(part in {".git", "__pycache__"} for part in relative.parts):
        return True
    if platform == "macos" and name in {"Install on Windows.bat", "Uninstall on Windows.bat"}:
        return True
    if platform == "windows" and name in {
        "Install on macOS.command",
        "Uninstall on macOS.command",
        "macOS - If Apple Could Not Verify.txt",
    }:
        return True
    return False


def add_directory(archive: zipfile.ZipFile, archive_name: Path) -> None:
    info = zipfile.ZipInfo(to_zip_name(archive_name) + "/")
    info.external_attr = (stat.S_IFDIR | 0o755) << 16
    archive.writestr(info, b"")


def add_file(archive: zipfile.ZipFile, source: Path, archive_name: Path, *, binary: bool = False) -> None:
    data = source.read_bytes()
    if not binary and source.suffix.lower() in TEXT_SUFFIXES:
        data = data.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
        if source.suffix.lower() == ".bat":
            data = data.replace(b"\n", b"\r\n")

    mode = 0o644
    if source.name in MAC_EXECUTABLE_NAMES or os.access(source, os.X_OK):
        mode = 0o755

    info = zipfile.ZipInfo(to_zip_name(archive_name))
    info.external_attr = (stat.S_IFREG | mode) << 16
    archive.writestr(info, data)


def to_zip_name(path: Path) -> str:
    return path.as_posix()


if __name__ == "__main__":
    main()
