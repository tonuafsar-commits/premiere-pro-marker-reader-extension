# Release Signing

These scripts prepare the extension for smoother public installation.

Unsigned builds can work, but Windows and macOS may warn users because the files are not from a verified developer. To remove those warnings for broad public distribution, you need real signing credentials:

- Windows: a code-signing certificate, usually EV or OV, as a `.pfx` file or hardware-backed certificate.
- macOS: an Apple Developer account with Developer ID certificates, plus notarization access.

## Windows

Use `windows-sign.ps1` after building the Windows installer.

Example:

```powershell
.\signing\windows-sign.ps1 `
  -InstallerPath .\release\Marker-Timestamps-Premiere-Installer-Windows.exe `
  -CertificatePath C:\path\certificate.pfx `
  -TimestampUrl http://timestamp.digicert.com
```

If the certificate requires a password:

```powershell
.\signing\windows-sign.ps1 `
  -InstallerPath .\release\Marker-Timestamps-Premiere-Installer-Windows.exe `
  -CertificatePath C:\path\certificate.pfx `
  -CertificatePassword "password"
```

## macOS

Run `macos-build-signed-dmg.command` on a Mac after installing Xcode command line tools.

You need:

- Developer ID Application certificate
- Developer ID Installer certificate
- Apple ID app-specific password, or a stored notarytool profile

The script creates a signed DMG and submits it for notarization.

## Important

Without signing and notarization:

- Windows may show SmartScreen or Unknown Publisher.
- macOS may show "Apple could not verify".
- Some antivirus tools may delay or block first-run installation.

That is operating system trust behavior, not a Premiere extension bug.
