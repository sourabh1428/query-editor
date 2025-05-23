# Test CORS Configuration
Write-Host "🔍 Testing CORS Configuration" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Test basic API connectivity
Write-Host "1. Testing basic API connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET
    Write-Host "✅ API Health Check: OK" -ForegroundColor Green
} catch {
    Write-Host "❌ API Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test OPTIONS request (preflight)
Write-Host ""
Write-Host "2. Testing OPTIONS preflight request..." -ForegroundColor Yellow
try {
    $headers = @{
        'Origin' = 'http://localhost'
        'Access-Control-Request-Method' = 'POST'
        'Access-Control-Request-Headers' = 'Content-Type'
    }
    
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method OPTIONS -Headers $headers -ErrorAction Stop
    
    Write-Host "✅ OPTIONS Request Status: $($response.StatusCode)" -ForegroundColor Green
    
    # Check CORS headers
    $corsHeaders = $response.Headers | Where-Object { $_.Key -like "*Access-Control*" }
    if ($corsHeaders) {
        Write-Host "✅ CORS Headers Present:" -ForegroundColor Green
        $corsHeaders | ForEach-Object { Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor White }
    } else {
        Write-Host "❌ No CORS headers found" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ OPTIONS Request Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "If you see errors above, run the rebuild script as Administrator:" -ForegroundColor Yellow
Write-Host ".\rebuild-all.ps1" -ForegroundColor White

Read-Host "Press Enter to close" 