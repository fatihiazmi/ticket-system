#!/bin/bash
# Vercel Deployment Script
# Run this script to deploy your ticket system to Vercel

echo "🚀 Starting Vercel Deployment Process..."

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Step 2: Install Vercel CLI if not installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Step 3: Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found."
    echo "Please create .env.local with your Supabase credentials:"
    echo "VITE_SUPABASE_URL=your_supabase_url"
    echo "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo ""
    read -p "Do you want to continue without environment variables? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 4: Run build test locally
echo "🔨 Testing build locally..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

# Step 5: Login to Vercel
echo "🔐 Logging into Vercel..."
vercel login

# Step 6: Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Configure environment variables in Vercel dashboard"
echo "2. Set up GitHub secrets for CI/CD"
echo "3. Push to main branch to trigger automatic deployments"