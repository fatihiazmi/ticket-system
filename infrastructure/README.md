# Development Environment Setup Guide

This guide walks you through setting up a self-hosted Supabase development environment using Infrastructure as Code (Terraform + Ansible).

## Overview

### Development Flow Options

#### Option 1: Local Development (FREE) 🆓

- Docker Compose on your local machine
- All Supabase services running locally
- No cloud costs
- Perfect for initial development and testing

#### Option 2: AWS Development (~$38/month) 💰

- EC2 instance with self-hosted Supabase
- Real cloud environment for testing
- Can be stopped when not in use
- Production-like setup

## Prerequisites

### Required Tools

```powershell
# Install with Chocolatey (recommended)
choco install docker-desktop terraform ansible awscli git

# Or install manually:
# - Docker Desktop: https://docker.com/products/docker-desktop
# - Terraform: https://terraform.io/downloads
# - Ansible: https://docs.ansible.com/ansible/latest/installation_guide/
# - AWS CLI: https://aws.amazon.com/cli/
```

### AWS Setup (for Option 2)

```powershell
# Configure AWS credentials
aws configure --profile default

# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
```

## Quick Start

### Local Development (Free)

```powershell
# Start local development environment
.\scripts\setup-dev-environment.ps1 -LocalOnly

# Access your services:
# - Frontend: http://localhost:3000
# - Supabase Studio: http://localhost:3001
# - Supabase API: http://localhost:8000
```

### AWS Development Environment

```powershell
# Deploy complete AWS infrastructure + application
.\scripts\setup-dev-environment.ps1

# This will:
# 1. Create AWS infrastructure (VPC, EC2, Security Groups)
# 2. Deploy Supabase stack using Ansible
# 3. Configure all services

# Access your services at:
# - Frontend: http://YOUR_IP:3000
# - Supabase Studio: http://YOUR_IP:3001
# - Supabase API: http://YOUR_IP:8000
```

## Environment Management

### Start/Stop Services

```powershell
# Local environment
.\scripts\manage-dev-environment.ps1 -Action start -Local
.\scripts\manage-dev-environment.ps1 -Action stop -Local

# AWS environment
.\scripts\manage-dev-environment.ps1 -Action start
.\scripts\manage-dev-environment.ps1 -Action stop
```

### View Status and Logs

```powershell
# Check status
.\scripts\manage-dev-environment.ps1 -Action status

# View logs
.\scripts\manage-dev-environment.ps1 -Action logs

# View specific service logs
.\scripts\manage-dev-environment.ps1 -Action logs -Service db
```

### Cost Management

```powershell
# View cost estimation
.\scripts\manage-dev-environment.ps1 -Action cost

# Destroy AWS resources (saves money)
.\scripts\manage-dev-environment.ps1 -Action destroy
```

## Development Workflow

### 1. Initial Setup

```powershell
# Clone repository
git clone https://github.com/fatihiazmi/ticket-system.git
cd ticket-system

# Start with local development (free)
.\scripts\setup-dev-environment.ps1 -LocalOnly
```

### 2. Local Development

- Frontend runs at http://localhost:3000 with hot reload
- Supabase Studio at http://localhost:3001 for database management
- All APIs available at http://localhost:8000
- PostgreSQL accessible at localhost:5432

### 3. Cloud Testing (Optional)

```powershell
# When ready to test on cloud
.\scripts\setup-dev-environment.ps1

# Work with real infrastructure
# Deploy changes with Ansible
ansible-playbook -i infrastructure/ansible/inventories/development.ini \
                 infrastructure/ansible/playbooks/deploy-development.yml
```

### 4. Frontend Development

Your React app requires NO changes to work with self-hosted Supabase:

```typescript
// .env.local (for local development)
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=your-development-anon-key

// .env.production (for AWS development)
VITE_SUPABASE_URL=http://YOUR_EC2_IP:8000
VITE_SUPABASE_ANON_KEY=your-development-anon-key
```

All your existing Supabase code works exactly the same:

```typescript
// Authentication
const { user } = await supabase.auth.signUp({ email, password })

// Database queries
const { data } = await supabase.from('tickets').select('*')

// Real-time subscriptions
supabase.channel('tickets').on('postgres_changes', ...)
```

## Cost Breakdown

### Local Development (FREE)

- Docker containers on your machine
- No cloud costs
- Unlimited usage

### AWS Development Environment

#### Option A: Always-On Instance

- EC2 t3.medium: $30.40/month
- 50GB storage: $4.00/month
- Elastic IP: $3.65/month
- **Total: ~$38/month**

#### Option B: Stop When Not in Use

- Running 8 hours/day: ~$12/month
- Storage (always): $4.00/month
- Elastic IP: $3.65/month
- **Total: ~$20/month**

#### Option C: AWS Free Tier (First 12 months)

- t2.micro instance: FREE
- 30GB storage: FREE
- Limited performance but functional
- **Total: ~$4/month (Elastic IP only)**

## Infrastructure Details

### Terraform Modules

```
infrastructure/terraform/
├── environments/
│   └── development/          # Development-specific config
│       ├── main.tf          # Infrastructure definition
│       ├── variables.tf     # Configuration variables
│       ├── outputs.tf       # Output values
│       └── terraform.tfvars # Your specific values
└── modules/                 # Reusable modules (future)
```

### Ansible Roles

```
infrastructure/ansible/
├── playbooks/
│   └── deploy-development.yml    # Main deployment playbook
├── roles/
│   ├── docker/                   # Docker installation
│   ├── supabase-dev/            # Supabase deployment
│   └── security/                # Security hardening
└── inventories/
    └── development.ini          # Server inventory
```

### Docker Configuration

```
infrastructure/docker/
├── docker-compose.dev.yml       # Local development stack
├── Dockerfile.dev              # Development frontend image
└── .env.example               # Environment variables template
```

## Security Considerations

### Development Security

- Default passwords for development convenience
- Auto-confirmation enabled for email auth
- Exposed ports for easy access
- SSH access from your IP only
- HTTP (not HTTPS) for simplicity

### Production Differences

- Strong passwords and secrets
- HTTPS with SSL certificates
- Restricted network access
- Email confirmation required
- WAF and DDoS protection
- Regular security updates

## Troubleshooting

### Common Issues

#### Docker Issues

```powershell
# Check if Docker is running
docker info

# Restart Docker Desktop
# Check disk space (Docker needs ~10GB free)
```

#### AWS Access Issues

```powershell
# Test AWS credentials
aws sts get-caller-identity

# Check region settings
aws configure list
```

#### Service Not Starting

```powershell
# Check logs
.\scripts\manage-dev-environment.ps1 -Action logs

# Check individual service
docker-compose logs supabase-db-dev
```

#### Port Conflicts

If ports 3000, 3001, 8000, or 5432 are in use:

1. Stop conflicting services
2. Or modify ports in docker-compose.dev.yml

### Getting Help

1. Check service logs first
2. Verify all prerequisites are installed
3. Ensure AWS credentials are configured
4. Check Docker Desktop is running
5. Verify network connectivity

## Next Steps

1. **Start Local**: Begin with local development (free)
2. **Test Features**: Develop your application features
3. **Cloud Deploy**: Move to AWS when ready for cloud testing
4. **Team Access**: Add team members' IPs to security groups
5. **Production**: Scale up with production configuration when ready

Your development environment gives you the exact same Supabase experience as the cloud version, but under your complete control and with predictable costs!
