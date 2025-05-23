# Quick Debug Script - Check API connectivity
Write-Host "🔍 Quick API Debug Check" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

# Test if backend is reachable
Write-Host "Testing backend connectivity..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method GET -ErrorAction Stop
    Write-Host "✅ Backend is reachable! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not reachable: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "This suggests your backend container is not running." -ForegroundColor Yellow
    Write-Host "You need to start it with Docker Compose as Administrator." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To check Docker containers, run PowerShell as Administrator and use:" -ForegroundColor Cyan
Write-Host "docker-compose ps" -ForegroundColor White
Write-Host "docker-compose up -d" -ForegroundColor White

Write-Host ""
Read-Host "Press Enter to close" 