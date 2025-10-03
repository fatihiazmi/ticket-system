#!/usr/bin/env pwsh
# Development Environment Management Script
# This script helps manage your development environment

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "destroy", "cost")]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [switch]$Local,
    
    [Parameter(Mandatory=$false)]
    [string]$Service = "all"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$InfrastructureDir = Join-Path $ProjectRoot "infrastructure"
$TerraformDir = Join-Path $InfrastructureDir "terraform\environments\$Environment"
$DockerDir = Join-Path $InfrastructureDir "docker"

function Show-Usage {
    Write-Host "Development Environment Management" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\manage-dev-environment.ps1 -Action <action> [options]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Yellow
    Write-Host "  start     - Start the development environment"
    Write-Host "  stop      - Stop the development environment"
    Write-Host "  restart   - Restart the development environment"
    Write-Host "  status    - Show environment status"
    Write-Host "  logs      - Show service logs"
    Write-Host "  destroy   - Destroy the environment (AWS resources)"
    Write-Host "  cost      - Show cost estimation"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Local           - Manage local Docker environment only"
    Write-Host "  -Environment     - Environment name (default: development)"
    Write-Host "  -Service         - Specific service name (default: all)"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\manage-dev-environment.ps1 -Action start -Local"
    Write-Host "  .\manage-dev-environment.ps1 -Action status"
    Write-Host "  .\manage-dev-environment.ps1 -Action logs -Service db"
    Write-Host "  .\manage-dev-environment.ps1 -Action destroy"
}

function Start-LocalEnvironment {
    Write-Host "🐳 Starting local development environment..." -ForegroundColor Cyan
    
    $LocalDir = Join-Path $DockerDir "local"
    if (-not (Test-Path $LocalDir)) {
        Write-Host "❌ Local environment not found. Run setup-dev-environment.ps1 -LocalOnly first." -ForegroundColor Red
        exit 1
    }
    
    Push-Location $LocalDir
    try {
        docker-compose up -d
        Write-Host "✅ Local environment started" -ForegroundColor Green
        Show-LocalUrls
    } finally {
        Pop-Location
    }
}

function Stop-LocalEnvironment {
    Write-Host "🛑 Stopping local development environment..." -ForegroundColor Cyan
    
    $LocalDir = Join-Path $DockerDir "local"
    Push-Location $LocalDir
    try {
        docker-compose down
        Write-Host "✅ Local environment stopped" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

function Show-LocalUrls {
    Write-Host "`n🌐 Local Service URLs:" -ForegroundColor Green
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   Supabase Studio: http://localhost:3001" -ForegroundColor Cyan
    Write-Host "   Supabase API: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "   PostgreSQL: localhost:5432" -ForegroundColor Cyan
}

function Get-InstanceIP {
    Push-Location $TerraformDir
    try {
        $ip = terraform output -raw instance_public_ip 2>$null
        return $ip
    } catch {
        return $null
    } finally {
        Pop-Location
    }
}

function Start-AWSEnvironment {
    Write-Host "☁️  Starting AWS development environment..." -ForegroundColor Cyan
    
    $InstanceIP = Get-InstanceIP
    if (-not $InstanceIP) {
        Write-Host "❌ AWS infrastructure not found. Run setup-dev-environment.ps1 first." -ForegroundColor Red
        exit 1
    }
    
    # Start services via SSH
    $SSHCommand = "ssh -o StrictHostKeyChecking=no ubuntu@$InstanceIP 'sudo systemctl start supabase-dev.service'"
    Invoke-Expression $SSHCommand
    
    Write-Host "✅ AWS environment started" -ForegroundColor Green
    Write-Host "`n🌐 Service URLs:" -ForegroundColor Green
    Write-Host "   Frontend: http://$InstanceIP:3000" -ForegroundColor Cyan
    Write-Host "   Supabase Studio: http://$InstanceIP:3001" -ForegroundColor Cyan
    Write-Host "   Supabase API: http://$InstanceIP:8000" -ForegroundColor Cyan
}

function Stop-AWSEnvironment {
    Write-Host "🛑 Stopping AWS development environment..." -ForegroundColor Cyan
    
    $InstanceIP = Get-InstanceIP
    if (-not $InstanceIP) {
        Write-Host "❌ AWS infrastructure not found." -ForegroundColor Red
        exit 1
    }
    
    $SSHCommand = "ssh -o StrictHostKeyChecking=no ubuntu@$InstanceIP 'sudo systemctl stop supabase-dev.service'"
    Invoke-Expression $SSHCommand
    
    Write-Host "✅ AWS environment stopped" -ForegroundColor Green
}

function Show-Status {
    if ($Local) {
        Write-Host "📊 Local Environment Status:" -ForegroundColor Cyan
        $LocalDir = Join-Path $DockerDir "local"
        if (Test-Path $LocalDir) {
            Push-Location $LocalDir
            try {
                docker-compose ps
            } finally {
                Pop-Location
            }
        } else {
            Write-Host "❌ Local environment not set up" -ForegroundColor Red
        }
    } else {
        Write-Host "📊 AWS Environment Status:" -ForegroundColor Cyan
        $InstanceIP = Get-InstanceIP
        if ($InstanceIP) {
            Write-Host "   Instance IP: $InstanceIP" -ForegroundColor Green
            $SSHCommand = "ssh -o StrictHostKeyChecking=no ubuntu@$InstanceIP 'sudo systemctl status supabase-dev.service --no-pager'"
            Invoke-Expression $SSHCommand
        } else {
            Write-Host "❌ AWS infrastructure not deployed" -ForegroundColor Red
        }
    }
}

function Show-Logs {
    if ($Local) {
        $LocalDir = Join-Path $DockerDir "local"
        Push-Location $LocalDir
        try {
            if ($Service -eq "all") {
                docker-compose logs -f
            } else {
                docker-compose logs -f $Service
            }
        } finally {
            Pop-Location
        }
    } else {
        $InstanceIP = Get-InstanceIP
        $SSHCommand = "ssh -o StrictHostKeyChecking=no ubuntu@$InstanceIP 'cd /opt/supabase-dev && docker-compose logs -f"
        if ($Service -ne "all") {
            $SSHCommand += " $Service"
        }
        $SSHCommand += "'"
        Invoke-Expression $SSHCommand
    }
}

function Remove-AWSEnvironment {
    Write-Host "💥 Destroying AWS development environment..." -ForegroundColor Red
    Write-Host "⚠️  This will delete all AWS resources and cannot be undone!" -ForegroundColor Yellow
    
    $confirm = Read-Host "Are you sure? Type 'DELETE' to confirm"
    if ($confirm -ne "DELETE") {
        Write-Host "Destruction cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    Push-Location $TerraformDir
    try {
        terraform destroy -auto-approve
        Write-Host "✅ AWS environment destroyed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to destroy environment: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    } finally {
        Pop-Location
    }
}

function Show-CostEstimation {
    Write-Host "💰 Development Environment Cost Estimation" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Local Development (Free):" -ForegroundColor Green
    Write-Host "   Docker containers on your machine - $0/month"
    Write-Host ""
    Write-Host "AWS Development Environment:" -ForegroundColor Yellow
    Write-Host "   EC2 t3.medium (2 vCPU, 4GB RAM):    ~$30.40/month"
    Write-Host "   50GB GP3 storage:                   ~$4.00/month"
    Write-Host "   Data transfer (1GB/month):          ~$0.09/month"
    Write-Host "   Elastic IP:                         ~$3.65/month"
    Write-Host "   Total Estimated Cost:               ~$38.14/month"
    Write-Host ""
    Write-Host "Cost Optimization Tips:" -ForegroundColor Cyan
    Write-Host "   • Stop instance when not in use to save ~$30/month"
    Write-Host "   • Use spot instances for 60-90% cost reduction"
    Write-Host "   • Start with local development (free) then scale up"
    Write-Host "   • Consider AWS Free Tier (t2.micro) for 12 months"
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Gray
    Write-Host "   Stop instance:  .\manage-dev-environment.ps1 -Action stop"
    Write-Host "   Start instance: .\manage-dev-environment.ps1 -Action start"
    Write-Host "   Destroy all:    .\manage-dev-environment.ps1 -Action destroy"
}

# Main action handling
switch ($Action) {
    "start" {
        if ($Local) {
            Start-LocalEnvironment
        } else {
            Start-AWSEnvironment
        }
    }
    
    "stop" {
        if ($Local) {
            Stop-LocalEnvironment
        } else {
            Stop-AWSEnvironment
        }
    }
    
    "restart" {
        if ($Local) {
            Stop-LocalEnvironment
            Start-Sleep 5
            Start-LocalEnvironment
        } else {
            Stop-AWSEnvironment
            Start-Sleep 10
            Start-AWSEnvironment
        }
    }
    
    "status" {
        Show-Status
    }
    
    "logs" {
        Show-Logs
    }
    
    "destroy" {
        if ($Local) {
            Write-Host "🗑️  Removing local environment..." -ForegroundColor Yellow
            Stop-LocalEnvironment
            $LocalDir = Join-Path $DockerDir "local"
            if (Test-Path $LocalDir) {
                Remove-Item $LocalDir -Recurse -Force
                Write-Host "✅ Local environment removed" -ForegroundColor Green
            }
        } else {
            Remove-AWSEnvironment
        }
    }
    
    "cost" {
        Show-CostEstimation
    }
    
    default {
        Show-Usage
    }
}