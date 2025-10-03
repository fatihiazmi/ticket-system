#!/usr/bin/env pwsh
# Development Environment Setup Script for Windows PowerShell
# This script automates the entire development setup process

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [switch]$LocalOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipInfrastructure,
    
    [Parameter(Mandatory=$false)]
    [string]$AWSProfile = "default"
)

# Configuration
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$InfrastructureDir = Join-Path $ProjectRoot "infrastructure"
$TerraformDir = Join-Path $InfrastructureDir "terraform\environments\$Environment"
$AnsibleDir = Join-Path $InfrastructureDir "ansible"
$DockerDir = Join-Path $InfrastructureDir "docker"

Write-Host "🚀 Setting up Supabase Development Environment" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Project Root: $ProjectRoot" -ForegroundColor Yellow

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Phase 1: Prerequisites Check
Write-Host "`n📋 Phase 1: Checking Prerequisites" -ForegroundColor Cyan

$Prerequisites = @{
    "docker" = "Docker Desktop"
    "docker-compose" = "Docker Compose"
    "terraform" = "Terraform"
    "ansible-playbook" = "Ansible"
    "ssh-keygen" = "SSH Tools"
    "aws" = "AWS CLI"
}

$MissingTools = @()
foreach ($tool in $Prerequisites.Keys) {
    if (Test-Command $tool) {
        Write-Host "✅ $($Prerequisites[$tool]) is installed" -ForegroundColor Green
    } else {
        Write-Host "❌ $($Prerequisites[$tool]) is missing" -ForegroundColor Red
        $MissingTools += $Prerequisites[$tool]
    }
}

if ($MissingTools.Count -gt 0) {
    Write-Host "`n⚠️  Missing tools detected. Please install:" -ForegroundColor Yellow
    $MissingTools | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
    
    if ($LocalOnly) {
        Write-Host "`nFor local development, you only need:" -ForegroundColor Cyan
        Write-Host "   - Docker Desktop" -ForegroundColor Cyan
        Write-Host "   - Git" -ForegroundColor Cyan
    } else {
        Write-Host "`nInstallation commands:" -ForegroundColor Cyan
        Write-Host "   choco install docker-desktop terraform ansible awscli" -ForegroundColor Gray
        Write-Host "   # Or use your preferred package manager" -ForegroundColor Gray
    }
    
    $continue = Read-Host "`nContinue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Phase 2: Local Development Setup
if ($LocalOnly) {
    Write-Host "`n🐳 Phase 2: Local Development Setup" -ForegroundColor Cyan
    
    # Check if Docker is running
    try {
        docker info | Out-Null
        Write-Host "✅ Docker is running" -ForegroundColor Green
    } catch {
        Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        exit 1
    }
    
    # Setup local environment
    $LocalDockerDir = Join-Path $DockerDir "local"
    if (-not (Test-Path $LocalDockerDir)) {
        New-Item -ItemType Directory -Path $LocalDockerDir -Force | Out-Null
    }
    
    # Copy development compose file
    $DevComposeSource = Join-Path $DockerDir "docker-compose.dev.yml"
    $DevComposeDest = Join-Path $LocalDockerDir "docker-compose.yml"
    Copy-Item $DevComposeSource $DevComposeDest -Force
    
    # Copy environment file
    $EnvSource = Join-Path $DockerDir ".env.example"
    $EnvDest = Join-Path $LocalDockerDir ".env"
    if (-not (Test-Path $EnvDest)) {
        Copy-Item $EnvSource $EnvDest
        Write-Host "✅ Environment file created at $EnvDest" -ForegroundColor Green
        Write-Host "   Please review and update the values as needed." -ForegroundColor Yellow
    }
    
    # Start services
    Push-Location $LocalDockerDir
    try {
        Write-Host "`n🚀 Starting Supabase services locally..." -ForegroundColor Cyan
        docker-compose up -d
        
        Write-Host "`n⏳ Waiting for services to be ready..." -ForegroundColor Yellow
        Start-Sleep 30
        
        # Check service health
        $Services = @{
            "Kong API Gateway" = "http://localhost:8000"
            "Supabase Studio" = "http://localhost:3001"
            "React Dev Server" = "http://localhost:3000"
        }
        
        Write-Host "`n🌐 Service URLs:" -ForegroundColor Green
        foreach ($service in $Services.GetEnumerator()) {
            Write-Host "   $($service.Key): $($service.Value)" -ForegroundColor Cyan
        }
        
        Write-Host "`n✅ Local development environment is ready!" -ForegroundColor Green
        Write-Host "   Use 'docker-compose logs -f' to view logs" -ForegroundColor Gray
        Write-Host "   Use 'docker-compose down' to stop services" -ForegroundColor Gray
        
    } catch {
        Write-Host "❌ Failed to start services: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    } finally {
        Pop-Location
    }
    
    exit 0
}

# Phase 3: AWS Infrastructure Setup
if (-not $SkipInfrastructure) {
    Write-Host "`n☁️  Phase 3: AWS Infrastructure Setup" -ForegroundColor Cyan
    
    # Check AWS credentials
    try {
        aws sts get-caller-identity --profile $AWSProfile | Out-Null
        Write-Host "✅ AWS credentials are configured" -ForegroundColor Green
    } catch {
        Write-Host "❌ AWS credentials not found. Please configure AWS CLI:" -ForegroundColor Red
        Write-Host "   aws configure --profile $AWSProfile" -ForegroundColor Gray
        exit 1
    }
    
    # Check if SSH key exists
    $SSHKeyPath = "$env:USERPROFILE\.ssh\id_rsa.pub"
    if (-not (Test-Path $SSHKeyPath)) {
        Write-Host "🔑 Generating SSH key..." -ForegroundColor Yellow
        ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\id_rsa" -N ""
    }
    
    # Get public key content
    $PublicKey = Get-Content $SSHKeyPath -Raw
    
    # Check if terraform.tfvars exists
    $TerraformVars = Join-Path $TerraformDir "terraform.tfvars"
    if (-not (Test-Path $TerraformVars)) {
        Write-Host "📝 Creating Terraform variables file..." -ForegroundColor Yellow
        $VarsExample = Join-Path $TerraformDir "terraform.tfvars.example"
        Copy-Item $VarsExample $TerraformVars
        
        # Update with actual public key
        $VarsContent = Get-Content $TerraformVars -Raw
        $VarsContent = $VarsContent.Replace('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQ... your-public-key-here', $PublicKey.Trim())
        Set-Content $TerraformVars $VarsContent
        
        Write-Host "⚠️  Please review and update $TerraformVars with your settings" -ForegroundColor Yellow
        $continue = Read-Host "Continue with infrastructure deployment? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            exit 0
        }
    }
    
    # Deploy infrastructure
    Push-Location $TerraformDir
    try {
        Write-Host "`n🏗️  Initializing Terraform..." -ForegroundColor Cyan
        terraform init
        
        Write-Host "`n📋 Planning infrastructure..." -ForegroundColor Cyan
        terraform plan
        
        $deploy = Read-Host "`nDeploy infrastructure? This will create AWS resources and incur costs. (y/N)"
        if ($deploy -eq "y" -or $deploy -eq "Y") {
            Write-Host "`n🚀 Deploying infrastructure..." -ForegroundColor Cyan
            terraform apply -auto-approve
            
            # Get outputs
            $InstanceIP = terraform output -raw instance_public_ip
            $SSHCommand = terraform output -raw ssh_command
            
            Write-Host "`n✅ Infrastructure deployed successfully!" -ForegroundColor Green
            Write-Host "   Instance IP: $InstanceIP" -ForegroundColor Cyan
            Write-Host "   SSH Command: $SSHCommand" -ForegroundColor Cyan
            
            # Update Ansible inventory
            $InventoryFile = Join-Path $AnsibleDir "inventories\development.ini"
            $InventoryContent = Get-Content $InventoryFile -Raw
            $InventoryContent = $InventoryContent.Replace('YOUR_EC2_PUBLIC_IP', $InstanceIP)
            Set-Content $InventoryFile $InventoryContent
            
            Write-Host "   Updated Ansible inventory with IP address" -ForegroundColor Green
        } else {
            Write-Host "Skipping infrastructure deployment." -ForegroundColor Yellow
            exit 0
        }
    } catch {
        Write-Host "❌ Infrastructure deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    } finally {
        Pop-Location
    }
}

# Phase 4: Application Deployment
Write-Host "`n🎯 Phase 4: Application Deployment with Ansible" -ForegroundColor Cyan

Push-Location $AnsibleDir
try {
    # Wait for instance to be ready
    Write-Host "⏳ Waiting for instance to be ready..." -ForegroundColor Yellow
    Start-Sleep 60
    
    # Deploy application
    Write-Host "🚀 Deploying Supabase stack..." -ForegroundColor Cyan
    ansible-playbook -i inventories/development.ini playbooks/deploy-development.yml
    
    Write-Host "`n✅ Deployment completed successfully!" -ForegroundColor Green
    
    # Display access information
    $InventoryFile = Join-Path "inventories" "development.ini"
    $InventoryContent = Get-Content $InventoryFile
    $InstanceIP = ($InventoryContent | Where-Object { $_ -like "*ansible_host=*" }).Split("=")[1].Split(" ")[0]
    
    Write-Host "`n🌐 Access URLs:" -ForegroundColor Green
    Write-Host "   Frontend: http://$InstanceIP:3000" -ForegroundColor Cyan
    Write-Host "   Supabase Studio: http://$InstanceIP:3001" -ForegroundColor Cyan
    Write-Host "   Supabase API: http://$InstanceIP:8000" -ForegroundColor Cyan
    Write-Host "   PostgreSQL: $InstanceIP:5432" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Application deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}

Write-Host "`n🎉 Development environment setup completed!" -ForegroundColor Green
Write-Host "Your self-hosted Supabase development environment is ready to use." -ForegroundColor Cyan