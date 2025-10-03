#!/bin/bash
# User data script for development instance setup

set -e

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ubuntu

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v${docker_compose_version}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install essential tools
apt-get install -y git curl wget unzip htop tree jq

# Install Node.js (for potential local development)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Create application directory
mkdir -p /opt/supabase-dev
chown ubuntu:ubuntu /opt/supabase-dev

# Create docker group and add ubuntu user
groupadd -f docker
usermod -aG docker ubuntu

# Create systemd service for auto-start (optional)
cat > /etc/systemd/system/supabase-dev.service << EOF
[Unit]
Description=Supabase Development Stack
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/supabase-dev
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=ubuntu
Group=docker

[Install]
WantedBy=multi-user.target
EOF

# Enable the service (but don't start yet - wait for code deployment)
systemctl enable supabase-dev.service

# Create log directory
mkdir -p /var/log/supabase-dev
chown ubuntu:ubuntu /var/log/supabase-dev

# Set up firewall (optional)
ufw --force enable
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3000  # React dev server
ufw allow 3001  # Supabase Studio
ufw allow 8000  # Supabase API

# Create a welcome message
cat > /etc/motd << EOF

🚀 Supabase Development Instance Ready!

Instance Details:
- Instance Type: Development Server
- Docker: Installed and configured
- Docker Compose: Installed

Next Steps:
1. Clone your repository to /opt/supabase-dev
2. Deploy using Ansible playbooks
3. Access services:
   - React App: http://YOUR_IP:3000
   - Supabase Studio: http://YOUR_IP:3001
   - Supabase API: http://YOUR_IP:8000

Commands:
- sudo systemctl start supabase-dev.service  (start services)
- sudo systemctl stop supabase-dev.service   (stop services)
- docker-compose logs -f                     (view logs)

EOF

# Log completion
echo "$(date): User data script completed" >> /var/log/user-data.log