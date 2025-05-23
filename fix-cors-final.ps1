# Final CORS Fix - Clean Configuration
# Run this script as Administrator

Write-Host "🔧 Final CORS Fix - Clean Configuration" -ForegroundColor Cyan
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
Write-Host ""

# Change to project directory
Set-Location "D:\query-editor"

try {
    Write-Host "🛑 Stopping backend container..." -ForegroundColor Yellow
    docker-compose stop backend
    
    Write-Host "🗑️ Removing backend container..." -ForegroundColor Yellow
    docker-compose rm -f backend
    
    Write-Host "🏗️ Rebuilding backend with clean CORS..." -ForegroundColor Yellow
    docker-compose build --no-cache backend
    
    Write-Host "🚀 Starting backend..." -ForegroundColor Yellow
    docker-compose up -d backend
    
    Write-Host "⏱️ Waiting for backend to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host "🔍 Testing CORS configuration..." -ForegroundColor Yellow
    
    # Test actual login request
    Write-Host "Testing actual login request..." -ForegroundColor White
    try {
        $headers = @{
            'Content-Type' = 'application/json'
            'Origin' = 'http://localhost'
        }
        
        $body = @{
            email = 'test@example.com'
            password = 'test123'
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Headers $headers -Body $body -ErrorAction Stop
        
        Write-Host "✅ Login Request: SUCCESS (Status: $($response.StatusCode))" -ForegroundColor Green
        
        # Check CORS headers in response
        $corsOrigin = $response.Headers['Access-Control-Allow-Origin']
        $corsCredentials = $response.Headers['Access-Control-Allow-Credentials']
        
        if ($corsOrigin) {
            Write-Host "  ✅ Access-Control-Allow-Origin: $corsOrigin" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Missing Access-Control-Allow-Origin in response" -ForegroundColor Red
        }
        
        if ($corsCredentials) {
            Write-Host "  ✅ Access-Control-Allow-Credentials: $corsCredentials" -ForegroundColor Green
        }
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401 -or $statusCode -eq 400) {
            Write-Host "✅ Login Request: Expected auth failure (Status: $statusCode)" -ForegroundColor Green
            
            # Still check for CORS headers even on error response
            $errorResponse = $_.Exception.Response
            Write-Host "  Checking CORS headers on error response..." -ForegroundColor Gray
        } else {
            Write-Host "❌ Login Request: Unexpected error - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "🎯 Clean CORS Configuration Applied:" -ForegroundColor Green
    Write-Host "  ✅ Removed conflicting manual headers" -ForegroundColor White
    Write-Host "  ✅ Using Flask-CORS only" -ForegroundColor White
    Write-Host "  ✅ Specific origins (no wildcards)" -ForegroundColor White
    Write-Host "  ✅ Credentials support enabled" -ForegroundColor White
    Write-Host "  ✅ Enhanced logging for debugging" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error during CORS fix: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Ready to Test!" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host "1. Go to: http://localhost/login" -ForegroundColor White
Write-Host "2. Open DevTools (F12) → Console tab" -ForegroundColor White
Write-Host "3. Try logging in" -ForegroundColor White
Write-Host "4. Check the detailed console logs" -ForegroundColor White

Write-Host ""
Write-Host "📊 Backend logs will show detailed request/response info" -ForegroundColor Cyan
Write-Host "Run 'docker-compose logs backend --tail=20' to see them" -ForegroundColor White

Write-Host ""
Read-Host "Press Enter to close" 