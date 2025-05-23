# Development startup script for Windows PowerShell
Write-Host "Starting SQL Analytics Platform Development Environment..." -ForegroundColor Green

# Start backend in a new PowerShell window
Write-Host "Starting Backend Server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python app.py"

# Wait a few seconds for backend to start
Start-Sleep -Seconds 3

# Start frontend in a new PowerShell window with environment variable
Write-Host "Starting Frontend Server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:VITE_API_URL='http://localhost:5000/api'; npm run dev"

Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend: http://localhost:5000" -ForegroundColor Yellow
Write-Host "API Docs: http://localhost:5000/api-docs" -ForegroundColor Yellow 