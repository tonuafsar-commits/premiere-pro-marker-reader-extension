param(
  [Parameter(Mandatory = $true)]
  [string]$InstallerPath,

  [Parameter(Mandatory = $true)]
  [string]$CertificatePath,

  [string]$CertificatePassword = "",

  [string]$TimestampUrl = "http://timestamp.digicert.com"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $InstallerPath)) {
  throw "Installer was not found: $InstallerPath"
}

if (-not (Test-Path -LiteralPath $CertificatePath)) {
  throw "Certificate was not found: $CertificatePath"
}

$signtool = Get-ChildItem -Path "${env:ProgramFiles(x86)}\Windows Kits\10\bin" -Recurse -Filter signtool.exe -ErrorAction SilentlyContinue |
  Sort-Object FullName -Descending |
  Select-Object -First 1

if (-not $signtool) {
  throw "signtool.exe was not found. Install Windows SDK first."
}

$arguments = @(
  "sign",
  "/f", $CertificatePath,
  "/fd", "SHA256",
  "/tr", $TimestampUrl,
  "/td", "SHA256"
)

if ($CertificatePassword) {
  $arguments += @("/p", $CertificatePassword)
}

$arguments += $InstallerPath

& $signtool.FullName @arguments

if ($LASTEXITCODE -ne 0) {
  throw "Signing failed."
}

& $signtool.FullName verify /pa /v $InstallerPath

if ($LASTEXITCODE -ne 0) {
  throw "Signature verification failed."
}

Write-Host "Signed and verified:" $InstallerPath
