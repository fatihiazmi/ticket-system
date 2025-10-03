# Development Environment Terraform Configuration
# This creates a cost-effective AWS setup for development testing

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# VPC
resource "aws_vpc" "dev" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-dev-vpc"
    Environment = "development"
    Project     = var.project_name
  }
}

# Internet Gateway
resource "aws_internet_gateway" "dev" {
  vpc_id = aws_vpc.dev.id

  tags = {
    Name        = "${var.project_name}-dev-igw"
    Environment = "development"
    Project     = var.project_name
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.dev.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-dev-public-subnet"
    Environment = "development"
    Project     = var.project_name
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.dev.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.dev.id
  }

  tags = {
    Name        = "${var.project_name}-dev-public-rt"
    Environment = "development"
    Project     = var.project_name
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Security Group for Supabase Development
resource "aws_security_group" "supabase_dev" {
  name_prefix = "${var.project_name}-dev-supabase-"
  vpc_id      = aws_vpc.dev.id

  # SSH access
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # HTTP
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # React Development Server
  ingress {
    description = "React Dev Server"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # Supabase Studio
  ingress {
    description = "Supabase Studio"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # Supabase API Gateway
  ingress {
    description = "Supabase API"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # PostgreSQL (for external access during development)
  ingress {
    description = "PostgreSQL"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-dev-supabase-sg"
    Environment = "development"
    Project     = var.project_name
  }
}

# Key Pair
resource "aws_key_pair" "dev" {
  key_name   = "${var.project_name}-dev-key"
  public_key = var.public_key

  tags = {
    Name        = "${var.project_name}-dev-key"
    Environment = "development"
    Project     = var.project_name
  }
}

# EC2 Instance for Supabase Development
resource "aws_instance" "supabase_dev" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.dev.key_name
  vpc_security_group_ids = [aws_security_group.supabase_dev.id]
  subnet_id              = aws_subnet.public.id

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size
    delete_on_termination = true
    encrypted             = true

    tags = {
      Name = "${var.project_name}-dev-root-volume"
    }
  }

  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    docker_compose_version = var.docker_compose_version
  }))

  tags = {
    Name        = "${var.project_name}-dev-supabase"
    Environment = "development"
    Project     = var.project_name
    Type        = "supabase-development"
  }
}

# Elastic IP for stable access
resource "aws_eip" "supabase_dev" {
  instance = aws_instance.supabase_dev.id
  domain   = "vpc"

  tags = {
    Name        = "${var.project_name}-dev-eip"
    Environment = "development"
    Project     = var.project_name
  }

  depends_on = [aws_internet_gateway.dev]
}