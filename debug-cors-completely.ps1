# Complete CORS Debug & Fix - Ultra Comprehensive
# Run this script as Administrator

Write-Host "🔍 COMPLETE CORS DEBUG & FIX - Ultra Comprehensive" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

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
    Write-Host "🧹 STEP 1: Complete System Reset" -ForegroundColor Yellow
    Write-Host "===============================" -ForegroundColor Yellow
    
    Write-Host "Stopping ALL containers..." -ForegroundColor Gray
    docker-compose down --volumes --remove-orphans
    
    Write-Host "Removing ALL containers..." -ForegroundColor Gray
    docker-compose rm -f
    
    Write-Host "Cleaning Docker system..." -ForegroundColor Gray
    docker system prune -f
    
    Write-Host "✅ Complete reset done" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🏗️ STEP 2: Rebuild with Ultra-Permissive CORS" -ForegroundColor Yellow
    Write-Host "=============================================" -ForegroundColor Yellow
    
    Write-Host "Building ALL containers from scratch..." -ForegroundColor Gray
    docker-compose build --no-cache --pull
    
    Write-Host "✅ Build complete" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🚀 STEP 3: Starting ALL Services" -ForegroundColor Yellow
    Write-Host "================================" -ForegroundColor Yellow
    
    Write-Host "Starting all services..." -ForegroundColor Gray
    docker-compose up -d
    
    Write-Host "✅ All services starting..." -ForegroundColor Green
    Write-Host ""
    
    Write-Host "⏱️ STEP 4: Extended Wait (45 seconds)" -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Yellow
    
    for ($i = 45; $i -gt 0; $i--) {
        if ($i % 5 -eq 0) {
            Write-Host "Waiting for services to fully initialize... $i seconds remaining" -ForegroundColor Gray
        }
        Start-Sleep -Seconds 1
    }
    
    Write-Host "✅ Services should be ready" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🔍 STEP 5: Comprehensive Testing" -ForegroundColor Yellow
    Write-Host "================================" -ForegroundColor Yellow
    
    # Test 1: Basic connectivity
    Write-Host "Test 1: Backend connectivity..." -ForegroundColor White
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 15
        Write-Host "✅ Backend: ONLINE" -ForegroundColor Green
    } catch {
        Write-Host "❌ Backend: OFFLINE - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 2: Frontend connectivity
    Write-Host "Test 2: Frontend connectivity..." -ForegroundColor White
    try {
        $frontend = Invoke-WebRequest -Uri "http://localhost" -Method GET -TimeoutSec 15 -ErrorAction Stop
        Write-Host "✅ Frontend: ONLINE (Status: $($frontend.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "❌ Frontend: OFFLINE - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 3: CORS Preflight
    Write-Host "Test 3: CORS Preflight (OPTIONS)..." -ForegroundColor White
    try {
        $headers = @{
            'Origin' = 'http://localhost'
            'Access-Control-Request-Method' = 'POST'
            'Access-Control-Request-Headers' = 'Content-Type, Authorization'
        }
        
        $options = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method OPTIONS -Headers $headers -TimeoutSec 15 -ErrorAction Stop
        Write-Host "✅ CORS Preflight: SUCCESS (Status: $($options.StatusCode))" -ForegroundColor Green
        
        # Check specific CORS headers
        $allowOrigin = $options.Headers['Access-Control-Allow-Origin']
        $allowCredentials = $options.Headers['Access-Control-Allow-Credentials']
        $allowMethods = $options.Headers['Access-Control-Allow-Methods']
        $allowHeaders = $options.Headers['Access-Control-Allow-Headers']
        
        Write-Host "  CORS Headers in OPTIONS response:" -ForegroundColor Gray
        if ($allowOrigin) { Write-Host "    ✅ Allow-Origin: $allowOrigin" -ForegroundColor Green }
        if ($allowCredentials) { Write-Host "    ✅ Allow-Credentials: $allowCredentials" -ForegroundColor Green }
        if ($allowMethods) { Write-Host "    ✅ Allow-Methods: $allowMethods" -ForegroundColor Green }
        if ($allowHeaders) { Write-Host "    ✅ Allow-Headers: $allowHeaders" -ForegroundColor Green }
        
    } catch {
        Write-Host "❌ CORS Preflight: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 4: Actual POST request
    Write-Host "Test 4: POST Request with CORS..." -ForegroundColor White
    try {
        $postHeaders = @{
            'Content-Type' = 'application/json'
            'Origin' = 'http://localhost'
        }
        
        $postBody = @{
            email = 'test@example.com'
            password = 'test123'
        } | ConvertTo-Json
        
        $post = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Headers $postHeaders -Body $postBody -TimeoutSec 15 -ErrorAction Stop
        Write-Host "✅ POST Request: SUCCESS (Status: $($post.StatusCode))" -ForegroundColor Green
        
        # Check CORS headers in POST response
        $postCorsOrigin = $post.Headers['Access-Control-Allow-Origin']
        $postCorsCredentials = $post.Headers['Access-Control-Allow-Credentials']
        
        Write-Host "  CORS Headers in POST response:" -ForegroundColor Gray
        if ($postCorsOrigin) { Write-Host "    ✅ Allow-Origin: $postCorsOrigin" -ForegroundColor Green }
        if ($postCorsCredentials) { Write-Host "    ✅ Allow-Credentials: $postCorsCredentials" -ForegroundColor Green }
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401 -or $statusCode -eq 400) {
            Write-Host "✅ POST Request: Auth failed as expected (Status: $statusCode)" -ForegroundColor Green
        } else {
            Write-Host "❌ POST Request: Unexpected error - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "📋 STEP 6: Container Status" -ForegroundColor Yellow
    Write-Host "===========================" -ForegroundColor Yellow
    docker-compose ps
    
    Write-Host ""
    Write-Host "🎯 ULTRA-PERMISSIVE CORS APPLIED:" -ForegroundColor Green
    Write-Host "✅ origins=True (allows ALL origins)" -ForegroundColor White
    Write-Host "✅ allow_headers=['*'] (allows ALL headers)" -ForegroundColor White
    Write-Host "✅ Manual backup CORS headers" -ForegroundColor White
    Write-Host "✅ Manual OPTIONS handler" -ForegroundColor White
    Write-Host "✅ Comprehensive logging" -ForegroundColor White
    Write-Host "✅ Zero caching (max_age=0)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error during debug: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 CRITICAL: BROWSER CACHE CLEARING REQUIRED!" -ForegroundColor Red
Write-Host "=============================================" -ForegroundColor Red
Write-Host "Before testing, you MUST clear browser cache:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Chrome/Edge:" -ForegroundColor White
Write-Host "1. Press F12 to open DevTools" -ForegroundColor Gray
Write-Host "2. Right-click the refresh button" -ForegroundColor Gray
Write-Host "3. Select 'Empty Cache and Hard Reload'" -ForegroundColor Gray
Write-Host ""
Write-Host "Firefox:" -ForegroundColor White
Write-Host "1. Press Ctrl+Shift+Delete" -ForegroundColor Gray
Write-Host "2. Select 'Everything' and clear" -ForegroundColor Gray

Write-Host ""
Write-Host "🧪 TESTING STEPS:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host "1. Clear browser cache (MANDATORY!)" -ForegroundColor White
Write-Host "2. Go to: http://localhost/login" -ForegroundColor White
Write-Host "3. Open DevTools (F12) → Console tab" -ForegroundColor White
Write-Host "4. Try logging in with any email/password" -ForegroundColor White
Write-Host "5. Look for ultra-detailed logs in console" -ForegroundColor White
Write-Host "6. Check backend logs: docker-compose logs backend --tail=50" -ForegroundColor White

Write-Host ""
Write-Host "📊 If STILL failing, share the EXACT console output!" -ForegroundColor Yellow

Write-Host ""
Read-Host "Press Enter to close" 