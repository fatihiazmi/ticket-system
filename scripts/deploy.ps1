# Vercel Deployment Script for Windows PowerShell
# Run this script to deploy your ticket system to Vercel

Write-Host "🚀 Starting Vercel Deployment Process..." -ForegroundColor Green

# Step 1: Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Step 2: Install Vercel CLI if not installed
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI already installed" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Step 3: Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Warning: .env.local not found." -ForegroundColor Yellow
    Write-Host "Please create .env.local with your Supabase credentials:"
    Write-Host "VITE_SUPABASE_URL=your_supabase_url"
    Write-Host "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
    Write-Host ""
    $continue = Read-Host "Do you want to continue without environment variables? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Step 4: Run build test locally
Write-Host "🔨 Testing build locally..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please fix errors before deploying." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful!" -ForegroundColor Green

# Step 5: Login to Vercel
Write-Host "🔐 Logging into Vercel..." -ForegroundColor Yellow
vercel login

# Step 6: Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure environment variables in Vercel dashboard"
Write-Host "2. Set up GitHub secrets for CI/CD"
Write-Host "3. Push to main branch to trigger automatic deployments"