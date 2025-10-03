# Development Environment Variables

variable "aws_region" {
  description = "AWS region for development environment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "ticket-system"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "instance_type" {
  description = "EC2 instance type for development"
  type        = string
  default     = "t3.medium"  # 2 vCPU, 4GB RAM - sufficient for development
}

variable "root_volume_size" {
  description = "Root volume size in GB"
  type        = number
  default     = 50
}

variable "docker_compose_version" {
  description = "Docker Compose version to install"
  type        = string
  default     = "2.21.0"
}

variable "public_key" {
  description = "Public key for SSH access"
  type        = string
  # Generate with: ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the development instance"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Restrict this to your IP for security
  # Example: ["203.0.113.0/32"]  # Your public IP
}