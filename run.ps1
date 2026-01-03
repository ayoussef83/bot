# PowerShell script for Windows

Write-Host "🚀 Starting MV-OS System..." -ForegroundColor Green
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow

# Install dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing root dependencies..."
    npm install
}

if (-not (Test-Path "backend/node_modules")) {
    Write-Host "Installing backend dependencies..."
    Set-Location backend
    npm install
    Set-Location ..
}

if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "Installing frontend dependencies..."
    Set-Location frontend
    npm install
    Set-Location ..
}

Write-Host ""
Write-Host "🗄️  Setting up database..." -ForegroundColor Yellow

# Check .env file
if (-not (Test-Path "backend/.env")) {
    Write-Host "⚠️  backend/.env not found. Please create it with your database credentials." -ForegroundColor Yellow
    exit 1
}

# Run Prisma setup
Set-Location backend
Write-Host "Generating Prisma client..."
npx prisma generate

Write-Host "Running migrations..."
npx prisma migrate deploy 2>$null
if ($LASTEXITCODE -ne 0) {
    npx prisma migrate dev --name init
}

Write-Host "Seeding database..."
npm run prisma:seed 2>$null
Set-Location ..

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting servers..." -ForegroundColor Green
Write-Host ""
Write-Host "Backend will run on: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend will run on: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Start backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run start:dev"

# Wait a bit
Start-Sleep -Seconds 3

# Start frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "✅ Servers started in separate windows!" -ForegroundColor Green











