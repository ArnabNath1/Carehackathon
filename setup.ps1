# CareOps Setup Script
# Run this to set up your development environment

Write-Host "🚀 CareOps Setup Script" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($pythonVersion -match "Python 3\.1[1-9]") {
    Write-Host "✅ Python $pythonVersion found" -ForegroundColor Green
} else {
    Write-Host "❌ Python 3.11+ required. Please install from python.org" -ForegroundColor Red
    exit 1
}

# Check Node
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($nodeVersion -match "v1[8-9]" -or $nodeVersion -match "v[2-9][0-9]") {
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js 18+ required. Please install from nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location backend
pip install -r requirements.txt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location ..\frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Set up Supabase:" -ForegroundColor White
Write-Host "   - Go to https://supabase.com" -ForegroundColor Gray
Write-Host "   - Create a new project" -ForegroundColor Gray
Write-Host "   - Run database/schema.sql in SQL Editor" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Update .env file with your Supabase credentials" -ForegroundColor White
Write-Host ""
Write-Host "3. Start the backend:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   uvicorn main:app --reload" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Start the frontend (in a new terminal):" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Visit http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation: docs/QUICK_START.md" -ForegroundColor Cyan
Write-Host ""
