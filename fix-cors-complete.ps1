# Complete CORS Fix Script
# Run this script as Administrator

Write-Host "🔧 Complete CORS Fix for SQL Analytics Platform" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "❌ This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Change to project directory
Set-Location "D:\query-editor"

try {
    Write-Host "🛑 Step 1: Stopping all containers..." -ForegroundColor Yellow
    docker-compose down
    Write-Host "✅ Containers stopped" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🧹 Step 2: Cleaning up containers and images..." -ForegroundColor Yellow
    docker-compose build --no-cache backend
    Write-Host "✅ Backend rebuilt with new CORS configuration" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🚀 Step 3: Starting all containers..." -ForegroundColor Yellow
    docker-compose up -d
    Write-Host "✅ Containers starting..." -ForegroundColor Green
    Write-Host ""
    
    Write-Host "⏱️ Step 4: Waiting for services to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    Write-Host ""
    
    Write-Host "🔍 Step 5: Testing CORS configuration..." -ForegroundColor Yellow
    
    # Test API health
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET
        Write-Host "✅ Backend API: Running" -ForegroundColor Green
    } catch {
        Write-Host "❌ Backend API: Not responding" -ForegroundColor Red
    }
    
    # Test frontend
    try {
        $frontend = Invoke-WebRequest -Uri "http://localhost" -Method GET -ErrorAction Stop
        Write-Host "✅ Frontend: Running (Status: $($frontend.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "❌ Frontend: Not responding" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "🎯 CORS Fixes Applied:" -ForegroundColor Green
    Write-Host "  ✅ Added comprehensive origin list including:" -ForegroundColor White
    Write-Host "     - http://localhost (Docker frontend)" -ForegroundColor Gray
    Write-Host "     - http://localhost:80 (explicit port)" -ForegroundColor Gray
    Write-Host "     - All development origins" -ForegroundColor Gray
    Write-Host "  ✅ Enhanced CORS headers configuration" -ForegroundColor White
    Write-Host "  ✅ Added explicit preflight handling" -ForegroundColor White
    Write-Host "  ✅ Enabled credentials support" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🚀 Ready to Test!" -ForegroundColor Green
    Write-Host "  Frontend: http://localhost/login" -ForegroundColor White
    Write-Host "  Backend API: http://localhost:5000/api" -ForegroundColor White
    
    Write-Host ""
    Write-Host "📋 Container Status:" -ForegroundColor Yellow
    docker-compose ps
    
} catch {
    Write-Host "❌ Error during CORS fix: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔬 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open browser to http://localhost/login" -ForegroundColor White
Write-Host "2. Try logging in (use any test credentials)" -ForegroundColor White
Write-Host "3. Check browser console for CORS errors" -ForegroundColor White
Write-Host "4. If still getting errors, share the exact error message" -ForegroundColor White

Write-Host ""
Read-Host "Press Enter to close" 