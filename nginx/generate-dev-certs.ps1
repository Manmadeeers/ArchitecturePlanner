$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$certsDir = Join-Path $scriptDir "certs"

if (-not (Test-Path -LiteralPath $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir | Out-Null
}

$fullchainPath = Join-Path $certsDir "fullchain.pem"
$privkeyPath = Join-Path $certsDir "privkey.pem"

docker run --rm `
    -v "${certsDir}:/certs" `
    alpine/openssl req -x509 -nodes -days 365 `
    -newkey rsa:2048 `
    -keyout /certs/privkey.pem `
    -out /certs/fullchain.pem `
    -subj "/CN=localhost"

Write-Host "Generated:"
Write-Host " - $fullchainPath"
Write-Host " - $privkeyPath"
