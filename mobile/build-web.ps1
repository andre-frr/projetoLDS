# Flutter Web Build Script
# Usage: .\build-web.ps1 -ServerIp "192.168.1.100"

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIp,

    [int]$ApiPort = 3000,
    [int]$GraphQLPort = 4000
)

$ApiBaseUrl = "https://${ServerIp}:${ApiPort}/api"
$GraphQLUrl = "http://${ServerIp}:${GraphQLPort}/graphql"

Write-Host "Building Flutter web with:" -ForegroundColor Green
Write-Host "  API_BASE_URL: $ApiBaseUrl" -ForegroundColor Cyan
Write-Host "  GRAPHQL_URL: $GraphQLUrl" -ForegroundColor Cyan

flutter build web `
    --pwa-strategy=none `
    --dart-define=API_BASE_URL=$ApiBaseUrl `
    --dart-define=GRAPHQL_URL=$GraphQLUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild completed successfully!" -ForegroundColor Green
    Write-Host "Output directory: build/web" -ForegroundColor Yellow
} else {
    Write-Host "`nBuild failed!" -ForegroundColor Red
    exit 1
}

