# Robust CORS Fix - Complete System Reset and Test
# Run this script as Administrator

Write-Host "🛠️ ROBUST CORS FIX - Complete System Reset" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

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
    Write-Host "🧹 STEP 1: Complete Docker Cleanup" -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Yellow
    
    Write-Host "Stopping all containers..." -ForegroundColor Gray
    docker-compose down
    
    Write-Host "Removing containers..." -ForegroundColor Gray
    docker-compose rm -f
    
    Write-Host "Pruning Docker system..." -ForegroundColor Gray
    docker system prune -f
    
    Write-Host "✅ Docker cleanup complete" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🏗️ STEP 2: Complete Rebuild" -ForegroundColor Yellow
    Write-Host "============================" -ForegroundColor Yellow
    
    Write-Host "Building all containers from scratch..." -ForegroundColor Gray
    docker-compose build --no-cache
    
    Write-Host "✅ Build complete" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🚀 STEP 3: Starting Services" -ForegroundColor Yellow
    Write-Host "=============================" -ForegroundColor Yellow
    
    Write-Host "Starting all services..." -ForegroundColor Gray
    docker-compose up -d
    
    Write-Host "✅ Services starting..." -ForegroundColor Green
    Write-Host ""
    
    Write-Host "⏱️ STEP 4: Waiting for Services (30 seconds)" -ForegroundColor Yellow
    Write-Host "==============================================" -ForegroundColor Yellow
    
    for ($i = 30; $i -gt 0; $i--) {
        Write-Host "Waiting... $i seconds remaining" -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
    
    Write-Host "✅ Wait complete" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🔍 STEP 5: Comprehensive Testing" -ForegroundColor Yellow
    Write-Host "=================================" -ForegroundColor Yellow
    
    # Test 1: Backend Health
    Write-Host "Test 1: Backend Health Check..." -ForegroundColor White
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 10
        Write-Host "✅ Backend API: HEALTHY" -ForegroundColor Green
    } catch {
        Write-Host "❌ Backend API: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 2: Frontend
    Write-Host "Test 2: Frontend Check..." -ForegroundColor White
    try {
        $frontend = Invoke-WebRequest -Uri "http://localhost" -Method GET -TimeoutSec 10 -ErrorAction Stop
        Write-Host "✅ Frontend: HEALTHY (Status: $($frontend.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "❌ Frontend: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 3: CORS Preflight
    Write-Host "Test 3: CORS Preflight Test..." -ForegroundColor White
    try {
        $headers = @{
            'Origin' = 'http://localhost'
            'Access-Control-Request-Method' = 'POST'
            'Access-Control-Request-Headers' = 'Content-Type,Authorization'
        }
        
        $cors = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method OPTIONS -Headers $headers -TimeoutSec 10 -ErrorAction Stop
        Write-Host "✅ CORS Preflight: SUCCESS (Status: $($cors.StatusCode))" -ForegroundColor Green
        
        # Check for CORS headers
        $allowOrigin = $cors.Headers['Access-Control-Allow-Origin']
        $allowMethods = $cors.Headers['Access-Control-Allow-Methods']
        $allowHeaders = $cors.Headers['Access-Control-Allow-Headers']
        
        if ($allowOrigin) {
            Write-Host "  ✅ Access-Control-Allow-Origin: $allowOrigin" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Missing Access-Control-Allow-Origin header" -ForegroundColor Red
        }
        
        if ($allowMethods) {
            Write-Host "  ✅ Access-Control-Allow-Methods: $allowMethods" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Missing Access-Control-Allow-Methods header" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "❌ CORS Preflight: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 4: Actual POST Request
    Write-Host "Test 4: POST Request Test..." -ForegroundColor White
    try {
        $postHeaders = @{
            'Content-Type' = 'application/json'
            'Origin' = 'http://localhost'
        }
        
        $postBody = @{
            email = 'test@example.com'
            password = 'test123'
        } | ConvertTo-Json
        
        $post = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Headers $postHeaders -Body $postBody -TimeoutSec 10 -ErrorAction Stop
        Write-Host "✅ POST Request: SUCCESS (Status: $($post.StatusCode))" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__ 
        if ($statusCode -eq 401 -or $statusCode -eq 400) {
            Write-Host "✅ POST Request: SUCCESS (Auth failed as expected, Status: $statusCode)" -ForegroundColor Green
        } else {
            Write-Host "❌ POST Request: FAILED - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "📋 STEP 6: Container Status" -ForegroundColor Yellow
    Write-Host "============================" -ForegroundColor Yellow
    docker-compose ps
    
    Write-Host ""
    Write-Host "🎯 FIXES APPLIED:" -ForegroundColor Green
    Write-Host "✅ Permissive CORS (origins: *)" -ForegroundColor White
    Write-Host "✅ Enhanced preflight handling" -ForegroundColor White
    Write-Host "✅ Comprehensive logging" -ForegroundColor White
    Write-Host "✅ Explicit CORS mode in frontend" -ForegroundColor White
    Write-Host "✅ Complete container rebuild" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error during robust fix: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 READY TO TEST!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host "1. Open: http://localhost/login" -ForegroundColor White
Write-Host "2. Open Browser DevTools (F12)" -ForegroundColor White
Write-Host "3. Go to Console tab" -ForegroundColor White
Write-Host "4. Try logging in with any credentials" -ForegroundColor White
Write-Host "5. Check console for detailed logs" -ForegroundColor White

Write-Host ""
Write-Host "If you still see CORS errors, copy the EXACT error message" -ForegroundColor Yellow
Write-Host "from the browser console and share it." -ForegroundColor Yellow

Write-Host ""
Read-Host "Press Enter to close" 