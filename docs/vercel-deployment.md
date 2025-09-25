# Vercel Deployment & CI/CD Setup Guide

## Prerequisites
- GitHub repository with your code
- Vercel account (free tier available)
- Supabase project with database configured
- Node.js 18+ locally

## Step 1: Prepare Project for Deployment

### 1.1 Create Environment Variables Template
Create `.env.example` file in project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Analytics
VITE_GA_TRACKING_ID=your_google_analytics_id
```

### 1.2 Update Build Configuration
Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  }
}
```

### 1.3 Create Vercel Configuration
Create `vercel.json` in project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## Step 2: Deploy to Vercel

### 2.1 Push Code to GitHub
```bash
# Add all files and commit
git add .
git commit -m "feat: prepare for Vercel deployment"

# Push to main branch
git push origin main
```

### 2.2 Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2.3 Configure Environment Variables
In Vercel dashboard > Project Settings > Environment Variables:

```
VITE_SUPABASE_URL = your_supabase_project_url
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
```

**Important**: Add these for all environments (Production, Preview, Development)

### 2.4 Deploy
Click "Deploy" - Vercel will build and deploy your app automatically.

## Step 3: Set Up CI/CD Pipeline

### 3.1 Create GitHub Actions Workflow
Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run type checking
      run: npm run type-check
      
    - name: Run linting
      run: npm run lint
      
    - name: Run tests
      run: npm run test
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        
    - name: Build project
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

### 3.2 Configure GitHub Secrets
In GitHub repository > Settings > Secrets and variables > Actions:

1. **VITE_SUPABASE_URL**: Your Supabase project URL
2. **VITE_SUPABASE_ANON_KEY**: Your Supabase anonymous key
3. **VERCEL_TOKEN**: Vercel API token (from Vercel dashboard > Settings > Tokens)
4. **ORG_ID**: Vercel team/organization ID
5. **PROJECT_ID**: Vercel project ID

To get Vercel IDs:
```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel login
vercel link

# Get project info
vercel project ls
```

### 3.3 Create Preview Deployments Workflow
Create `.github/workflows/preview.yml`:

```yaml
name: Preview Deployment

on:
  pull_request:
    branches: [ main ]

jobs:
  preview:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Deploy Preview to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        github-comment: true
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

## Step 4: Configure Domain & SSL

### 4.1 Custom Domain (Optional)
1. In Vercel dashboard > Project > Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. SSL certificate is automatically provisioned

### 4.2 Environment-Specific URLs
- **Production**: `https://your-app.vercel.app`
- **Preview**: `https://your-app-git-branch.vercel.app`
- **Development**: `http://localhost:5173`

## Step 5: Monitoring & Performance

### 5.1 Vercel Analytics
Add to `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@tanstack/react-query', 'zustand']
        }
      }
    }
  }
})
```

### 5.2 Performance Monitoring
Add Web Vitals tracking to `src/main.tsx`:

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

// Track Core Web Vitals
getCLS(console.log)
getFID(console.log)
getFCP(console.log)
getLCP(console.log)
getTTFB(console.log)
```

## Step 6: Database Migrations

### 6.1 Production Database Setup
Create `scripts/setup-production.sql`:

```sql
-- Run this in Supabase SQL Editor for production
-- All the database schema from data-model.md
-- Include RLS policies and indexes
```

### 6.2 Migration Strategy
Create `scripts/migrate.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service key for migrations
)

// Migration functions here
```

## Step 7: Testing Strategy

### 7.1 Staging Environment
- Create a separate Supabase project for staging
- Use Vercel preview deployments for feature testing
- Set up separate environment variables

### 7.2 E2E Testing
Add Playwright for production testing:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Step 8: Deployment Checklist

Before going live:

- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] RLS policies enabled
- [ ] Custom domain configured (if applicable)
- [ ] Analytics set up
- [ ] Error monitoring configured
- [ ] Performance metrics baseline established
- [ ] Backup strategy in place
- [ ] Team access configured

## Commands to Execute

1. **Create Vercel config and environment files:**
```bash
# Create the configuration files
touch vercel.json .env.example
mkdir -p .github/workflows
touch .github/workflows/ci.yml .github/workflows/preview.yml
```

2. **Install additional dependencies:**
```bash
npm install --save-dev web-vitals
```

3. **Deploy to Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Your ticket system will be deployed with:
- ✅ Automatic deployments on push to main
- ✅ Preview deployments for pull requests  
- ✅ Environment variable management
- ✅ Performance monitoring
- ✅ SSL certificates
- ✅ CDN optimization

The CI/CD pipeline will ensure code quality and automatically deploy when tests pass!