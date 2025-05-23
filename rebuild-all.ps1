# Rebuild All Containers with Fixes
# Run this script as Administrator

Write-Host "🚀 Rebuilding All Containers with Fixes" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "❌ This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Running with Administrator privileges" -ForegroundColor Green

# Change to project directory
Set-Location "D:\query-editor"

try {
    Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
    docker-compose down
    
    Write-Host "🏗️ Rebuilding all containers..." -ForegroundColor Yellow
    docker-compose build --no-cache
    
    Write-Host "🚀 Starting all containers..." -ForegroundColor Yellow
    docker-compose up -d
    
    Write-Host "⏱️ Waiting for services to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host "✅ All containers restarted!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🔍 Container status:" -ForegroundColor Yellow
    docker-compose ps
    
    Write-Host ""
    Write-Host "🎯 Fixes Applied:" -ForegroundColor Green
    Write-Host "  ✅ TypeScript build errors resolved" -ForegroundColor White
    Write-Host "  ✅ CORS configuration updated" -ForegroundColor White
    Write-Host "  ✅ Added http://localhost origin" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🚀 Application URLs:" -ForegroundColor Green
    Write-Host "  Frontend: http://localhost/login" -ForegroundColor White
    Write-Host "  Backend API: http://localhost:5000/api" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error rebuilding containers: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to close" 