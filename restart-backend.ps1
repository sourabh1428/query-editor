# Restart Backend with CORS Fix
# Run this script as Administrator

Write-Host "🔄 Restarting Backend with CORS Fix" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

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
    Write-Host "🛠️ Rebuilding backend container..." -ForegroundColor Yellow
    docker-compose build backend
    
    Write-Host "🔄 Restarting backend container..." -ForegroundColor Yellow
    docker-compose up -d backend
    
    Write-Host "⏱️ Waiting for backend to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host "✅ Backend restart complete!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🔍 Checking backend status..." -ForegroundColor Yellow
    docker-compose ps backend
    
    Write-Host ""
    Write-Host "🚀 Try logging in again at: http://localhost/login" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error restarting backend: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to close" 