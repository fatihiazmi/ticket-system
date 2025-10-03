# Self-Hosted Supabase Docker Architecture Plan for AWS EC2

## Executive Summary

This document provides a **complete self-hosted Supabase architecture** for the React TypeScript ticket system on AWS EC2. Instead of building custom backend services, we'll self-host the entire Supabase stack using Docker containers - providing the exact same APIs and functionality you're already using, but under your complete control.

## Architecture Overview: Self-Hosted Supabase Stack

### What We're Building
```
┌─────────────┐    ┌──────────────┐    ┌─────────────────────────────────┐
│   Browser   │───▶│   AWS ALB    │───▶│         EC2 Instance(s)         │
│             │    │   + WAF      │    │  ┌─────────────────────────────┐ │
│             │    │              │    │  │   Self-Hosted Supabase      │ │
│             │    │              │    │  │  ┌─────────────────────┐   │ │
│             │    │              │    │  │  │  React Frontend     │   │ │
│             │    │              │    │  │  │  (Nginx Container)  │   │ │
│             │    │              │    │  │  └─────────────────────┘   │ │
│             │    │              │    │  │  ┌─────────────────────┐   │ │
│             │    │              │    │  │  │  Kong API Gateway   │   │ │
│             │    │              │    │  │  │  (Routes all APIs)  │   │ │
│             │    │              │    │  │  └─────────────────────┘   │ │
│             │    │              │    │  │  ┌─────────────────────┐   │ │
│             │    │              │    │  │  │  Supabase Studio    │   │ │
│             │    │              │    │  │  │  (Admin Dashboard)  │   │ │
│             │    │              │    │  │  └─────────────────────┘   │ │
│             │    │              │    │  │  ┌─────────────────────┐   │ │
│             │    │              │    │  │  │  GoTrue (Auth)      │   │ │
│             │    │              │    │  │  │  PostgREST (API)    │   │ │
│             │    │              │    │  │  │  Realtime Server    │   │ │
│             │    │              │    │  │  │  Storage API        │   │ │
│             │    │              │    │  │  │  Edge Functions     │   │ │
│             │    │              │    │  │  └─────────────────────┘   │ │
│             │    │              │    │  │  ┌─────────────────────┐   │ │
│             │    │              │    │  │  │  PostgreSQL 15      │   │ │
│             │    │              │    │  │  │  (with Extensions)  │   │ │
│             │    │              │    │  │  └─────────────────────┘   │ │
│             │    │              │    │  └─────────────────────────────┘ │
└─────────────┘    └──────────────┘    └─────────────────────────────────┘
```

## Self-Hosted Supabase Components

### Official Supabase Services (No Custom Development Needed!)
- **Kong API Gateway**: Routes all API requests to appropriate services
- **GoTrue**: JWT-based authentication (same as Supabase Auth)
- **PostgREST**: Auto-generated REST API from PostgreSQL schema
- **Realtime**: WebSocket server for real-time subscriptions
- **Storage API**: File upload/download with access controls
- **Edge Functions**: Serverless JavaScript/TypeScript functions
- **Supabase Studio**: Web dashboard for database management
- **PostgreSQL 15**: Enhanced with Supabase extensions and RLS
- **Analytics**: Request logging and metrics (Logflare)

## Self-Hosted Supabase Docker Setup

### Getting the Official Supabase Docker Stack

The beauty of self-hosting Supabase is that you get the exact same services you're already using, just running on your infrastructure:

```bash
# Clone the official Supabase repository
git clone --depth 1 https://github.com/supabase/supabase

# Create your project directory
mkdir ticket-system-supabase

# Copy the Docker setup
cp -rf supabase/docker/* ticket-system-supabase/
cp supabase/docker/.env.example ticket-system-supabase/.env

cd ticket-system-supabase
```

### Production Docker Compose Configuration

Here's the production-ready docker-compose setup for self-hosted Supabase:

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # React Frontend served by Nginx
  frontend:
    build:
      context: ../
      dockerfile: docker/frontend/Dockerfile
    container_name: ticket-frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - kong
    networks:
      - supabase-network
    restart: unless-stopped

  # Supabase Studio (Admin Dashboard)
  studio:
    container_name: supabase-studio
    image: supabase/studio:latest
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "require('http').get('http://localhost:3000/api/profile', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
        ]
      timeout: 5s
      interval: 5s
      retries: 3
    depends_on:
      analytics:
        condition: service_healthy
    environment:
      STUDIO_PG_META_URL: http://meta:8080
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      
      DEFAULT_ORGANIZATION_NAME: ${STUDIO_DEFAULT_ORGANIZATION}
      DEFAULT_PROJECT_NAME: ${STUDIO_DEFAULT_PROJECT}
      
      SUPABASE_URL: http://kong:8000
      SUPABASE_PUBLIC_URL: ${SUPABASE_PUBLIC_URL}
      SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_KEY: ${SERVICE_ROLE_KEY}
      AUTH_JWT_SECRET: ${JWT_SECRET}
      
      LOGFLARE_API_KEY: ${LOGFLARE_API_KEY}
      LOGFLARE_URL: http://analytics:4000
      NEXT_PUBLIC_ENABLE_LOGS: true
      NEXT_ANALYTICS_BACKEND_PROVIDER: postgres
    networks:
      - supabase-network

  # Kong API Gateway (Routes all Supabase APIs)
  kong:
    container_name: supabase-kong
    image: kong:2.8.1
    restart: unless-stopped
    entrypoint: bash -c 'eval "echo \"$$(cat ~/temp.yml)\"" > ~/kong.yml && /docker-entrypoint.sh kong docker-start'
    ports:
      - ${KONG_HTTP_PORT}:8000/tcp
      - ${KONG_HTTPS_PORT}:8443/tcp
    depends_on:
      analytics:
        condition: service_healthy
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /home/kong/kong.yml
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_PLUGINS: request-transformer,cors,key-auth,acl,basic-auth
      KONG_NGINX_PROXY_PROXY_BUFFER_SIZE: 160k
      KONG_NGINX_PROXY_PROXY_BUFFERS: 64 160k
      SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_KEY: ${SERVICE_ROLE_KEY}
      DASHBOARD_USERNAME: ${DASHBOARD_USERNAME}
      DASHBOARD_PASSWORD: ${DASHBOARD_PASSWORD}
    volumes:
      - ./volumes/api/kong.yml:/home/kong/temp.yml:ro
    networks:
      - supabase-network

  # GoTrue (Authentication Service)
  auth:
    container_name: supabase-auth
    image: supabase/gotrue:latest
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--no-verbose",
          "--tries=1",
          "--spider",
          "http://localhost:9999/health"
        ]
      timeout: 5s
      interval: 5s
      retries: 3
    restart: unless-stopped
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: ${API_EXTERNAL_URL}
      
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
      
      GOTRUE_SITE_URL: ${SITE_URL}
      GOTRUE_URI_ALLOW_LIST: ${ADDITIONAL_REDIRECT_URLS}
      GOTRUE_DISABLE_SIGNUP: ${DISABLE_SIGNUP}
      
      GOTRUE_JWT_ADMIN_ROLES: service_role
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_EXP: ${JWT_EXPIRY}
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      
      GOTRUE_EXTERNAL_EMAIL_ENABLED: ${ENABLE_EMAIL_SIGNUP}
      GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED: ${ENABLE_ANONYMOUS_USERS}
      GOTRUE_MAILER_AUTOCONFIRM: ${ENABLE_EMAIL_AUTOCONFIRM}
      GOTRUE_SMTP_ADMIN_EMAIL: ${SMTP_ADMIN_EMAIL}
      GOTRUE_SMTP_HOST: ${SMTP_HOST}
      GOTRUE_SMTP_PORT: ${SMTP_PORT}
      GOTRUE_SMTP_USER: ${SMTP_USER}
      GOTRUE_SMTP_PASS: ${SMTP_PASS}
      GOTRUE_SMTP_SENDER_NAME: ${SMTP_SENDER_NAME}
      GOTRUE_MAILER_URLPATHS_INVITE: ${MAILER_URLPATHS_INVITE}
      GOTRUE_MAILER_URLPATHS_CONFIRMATION: ${MAILER_URLPATHS_CONFIRMATION}
      GOTRUE_MAILER_URLPATHS_RECOVERY: ${MAILER_URLPATHS_RECOVERY}
      GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE: ${MAILER_URLPATHS_EMAIL_CHANGE}
      
      GOTRUE_EXTERNAL_PHONE_ENABLED: ${ENABLE_PHONE_SIGNUP}
      GOTRUE_SMS_AUTOCONFIRM: ${ENABLE_PHONE_AUTOCONFIRM}
    networks:
      - supabase-network

  # PostgREST (Auto-generated REST API)
  rest:
    container_name: supabase-rest
    image: postgrest/postgrest:latest
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    restart: unless-stopped
    environment:
      PGRST_DB_URI: postgres://authenticator:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
      PGRST_DB_SCHEMAS: ${PGRST_DB_SCHEMAS}
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${JWT_SECRET}
      PGRST_DB_USE_LEGACY_GUCS: "false"
      PGRST_APP_SETTINGS_JWT_SECRET: ${JWT_SECRET}
      PGRST_APP_SETTINGS_JWT_EXP: ${JWT_EXPIRY}
    command: "postgrest"
    networks:
      - supabase-network

  # Realtime (WebSocket subscriptions)
  realtime:
    container_name: realtime-dev.supabase-realtime
    image: supabase/realtime:latest
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    healthcheck:
      test:
        [
          "CMD",
          "curl",
          "-sSfL",
          "--head",
          "-o",
          "/dev/null",
          "-H",
          "Authorization: Bearer ${ANON_KEY}",
          "http://localhost:4000/api/tenants/realtime-dev/health"
        ]
      timeout: 5s
      interval: 5s
      retries: 3
    restart: unless-stopped
    environment:
      PORT: 4000
      DB_HOST: ${POSTGRES_HOST}
      DB_PORT: ${POSTGRES_PORT}
      DB_USER: supabase_admin
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_NAME: ${POSTGRES_DB}
      DB_AFTER_CONNECT_QUERY: 'SET search_path TO _realtime'
      DB_ENC_KEY: supabaserealtime
      API_JWT_SECRET: ${JWT_SECRET}
      FLY_ALLOC_ID: fly123
      FLY_APP_NAME: realtime
      SECRET_KEY_BASE: UpNVntn3cDxHJpq99YMc1T1AQgQpc8kfYTuRgBiYa15BLrx8etQoXz3gZv1/u2oq
      ERL_AFLAGS: -proto_dist inet_tcp
      ENABLE_TAILSCALE: "false"
      DNS_NODES: "''"
    command: >
      sh -c "/app/bin/migrate && /app/bin/realtime eval 'Realtime.Release.seeds(Realtime.Repo)' && /app/bin/server"
    networks:
      - supabase-network

  # Storage API (File uploads/downloads)
  storage:
    container_name: supabase-storage
    image: supabase/storage-api:latest
    depends_on:
      db:
        condition: service_healthy
      rest:
        condition: service_started
      imgproxy:
        condition: service_started
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--no-verbose",
          "--tries=1",
          "--spider",
          "http://localhost:5000/status"
        ]
      timeout: 5s
      interval: 5s
      retries: 3
    restart: unless-stopped
    environment:
      ANON_KEY: ${ANON_KEY}
      SERVICE_KEY: ${SERVICE_ROLE_KEY}
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: postgres://supabase_storage_admin:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
      FILE_SIZE_LIMIT: 52428800
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      TENANT_ID: stub
      REGION: stub
      GLOBAL_S3_BUCKET: stub
      ENABLE_IMAGE_TRANSFORMATION: "true"
      IMGPROXY_URL: http://imgproxy:5001
    volumes:
      - ./volumes/storage:/var/lib/storage:z
    networks:
      - supabase-network

  # Edge Functions Runtime
  functions:
    container_name: supabase-edge-functions
    image: supabase/edge-runtime:latest
    restart: unless-stopped
    depends_on:
      analytics:
        condition: service_healthy
    environment:
      JWT_SECRET: ${JWT_SECRET}
      SUPABASE_URL: http://kong:8000
      SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY}
      SUPABASE_DB_URL: postgresql://postgres:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
      VERIFY_JWT: "${FUNCTIONS_VERIFY_JWT}"
    volumes:
      - ./volumes/functions:/home/deno/functions:Z
    command:
      - start
      - --main-service
      - /home/deno/functions/main
    networks:
      - supabase-network

  # PostgreSQL Database with Supabase Extensions
  db:
    container_name: supabase-db
    image: supabase/postgres:15.1.1.118
    healthcheck:
      test: pg_isready -U postgres -h localhost
      interval: 5s
      timeout: 5s
      retries: 10
    depends_on:
      vector:
        condition: service_healthy
    command:
      - postgres
      - -c
      - config_file=/etc/postgresql/postgresql.conf
      - -c
      - log_min_messages=fatal
    restart: unless-stopped
    ports:
      - ${POSTGRES_PORT}:${POSTGRES_PORT}
    environment:
      POSTGRES_HOST: /var/run/postgresql
      PGPORT: ${POSTGRES_PORT}
      POSTGRES_PORT: ${POSTGRES_PORT}
      PGPASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      PGDATABASE: ${POSTGRES_DB}
      POSTGRES_DB: ${POSTGRES_DB}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXP: ${JWT_EXPIRY}
    volumes:
      - ./volumes/db/realtime.sql:/docker-entrypoint-initdb.d/migrations/99-realtime.sql:Z
      - ./volumes/db/webhooks.sql:/docker-entrypoint-initdb.d/init-scripts/98-webhooks.sql:Z
      - ./volumes/db/roles.sql:/docker-entrypoint-initdb.d/init-scripts/99-roles.sql:Z
      - ./volumes/db/jwt.sql:/docker-entrypoint-initdb.d/init-scripts/99-jwt.sql:Z
      - ./volumes/db/data:/var/lib/postgresql/data:Z
      - ./volumes/db/logs.sql:/docker-entrypoint-initdb.d/migrations/99-logs.sql:Z
      - db-config:/etc/postgresql-custom
    networks:
      - supabase-network

  # Supporting Services
  imgproxy:
    container_name: supabase-imgproxy
    image: darthsim/imgproxy:latest
    healthcheck:
      test: [ "CMD", "imgproxy", "health" ]
      timeout: 5s
      interval: 5s
      retries: 3
    environment:
      IMGPROXY_BIND: ":5001"
      IMGPROXY_LOCAL_FILESYSTEM_ROOT: /
      IMGPROXY_USE_ETAG: "true"
      IMGPROXY_ENABLE_WEBP_DETECTION: ${IMGPROXY_ENABLE_WEBP_DETECTION}
    volumes:
      - ./volumes/storage:/var/lib/storage:z
    networks:
      - supabase-network

  meta:
    container_name: supabase-meta
    image: supabase/postgres-meta:latest
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    restart: unless-stopped
    environment:
      PG_META_PORT: 8080
      PG_META_DB_HOST: ${POSTGRES_HOST}
      PG_META_DB_PORT: ${POSTGRES_PORT}
      PG_META_DB_NAME: ${POSTGRES_DB}
      PG_META_DB_USER: supabase_admin
      PG_META_DB_PASSWORD: ${POSTGRES_PASSWORD}
    networks:
      - supabase-network

  analytics:
    container_name: supabase-analytics
    image: supabase/logflare:latest
    healthcheck:
      test: [ "CMD", "curl", "http://localhost:4000/health" ]
      timeout: 5s
      interval: 5s
      retries: 10
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      LOGFLARE_NODE_HOST: 127.0.0.1
      DB_USERNAME: supabase_admin
      DB_DATABASE: ${POSTGRES_DB}
      DB_HOSTNAME: ${POSTGRES_HOST}
      DB_PORT: ${POSTGRES_PORT}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_SCHEMA: _analytics
      LOGFLARE_API_KEY: ${LOGFLARE_API_KEY}
      LOGFLARE_SINGLE_TENANT: true
      LOGFLARE_SUPABASE_MODE: true
      LOGFLARE_MIN_CLUSTER_SIZE: 1
      POSTGRES_BACKEND_URL: postgresql://supabase_admin:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
      POSTGRES_BACKEND_SCHEMA: _analytics
      LOGFLARE_FEATURE_FLAG_OVERRIDE: multibackend=true
    networks:
      - supabase-network

  vector:
    container_name: supabase-vector
    image: timberio/vector:latest
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--no-verbose",
          "--tries=1",
          "--spider",
          "http://vector:9001/health"
        ]
      timeout: 5s
      interval: 5s
      retries: 3
    volumes:
      - ./volumes/logs/vector.yml:/etc/vector/vector.yml:ro
      - ${DOCKER_SOCKET_LOCATION}:/var/run/docker.sock:ro
    environment:
      LOGFLARE_API_KEY: ${LOGFLARE_API_KEY}
    command: [ "--config", "etc/vector/vector.yml" ]
    networks:
      - supabase-network

networks:
  supabase-network:
    driver: bridge

volumes:
  db-config:
```

## Project Structure

```
ticket-system/
├── frontend/                    # Your existing React app
├── supabase-docker/            # Self-hosted Supabase stack
│   ├── docker-compose.prod.yml # Production compose file
│   ├── .env                    # Environment variables
│   ├── volumes/
│   │   ├── db/                 # Database initialization scripts
│   │   ├── storage/            # File storage
│   │   ├── functions/          # Edge Functions
│   │   ├── api/                # Kong configuration
│   │   └── logs/               # Log configuration
│   └── nginx/                  # Frontend proxy configuration
└── docker/
    └── frontend/
        ├── Dockerfile          # React app Dockerfile
        └── nginx.conf          # Nginx configuration
```

## Environment Configuration

Create a production `.env` file for your self-hosted Supabase:

```bash
# .env
############
# Secrets
# YOU MUST CHANGE THESE BEFORE GOING INTO PRODUCTION
############

POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
ANON_KEY=your-anon-key
SERVICE_ROLE_KEY=your-service-role-key
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=your-secure-dashboard-password

############
# Database
############
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432
POOLER_TENANT_ID=your-tenant-id

############
# API Proxy
############
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

############
# API
############
API_EXTERNAL_URL=https://yourdomain.com
SUPABASE_PUBLIC_URL=https://yourdomain.com

############
# Email Auth
############
SITE_URL=https://yourdomain.com
ADDITIONAL_REDIRECT_URLS=
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
SMTP_ADMIN_EMAIL=admin@yourdomain.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_SENDER_NAME=Your App Name
ENABLE_ANONYMOUS_USERS=false
ENABLE_PHONE_SIGNUP=false
ENABLE_PHONE_AUTOCONFIRM=false

############
# Misc
############
STUDIO_DEFAULT_ORGANIZATION=Your Organization
STUDIO_DEFAULT_PROJECT=Your Project
PGRST_DB_SCHEMAS=public,storage,graphql_public
LOGFLARE_API_KEY=your-super-secret-and-long-logflare-key
DOCKER_SOCKET_LOCATION=/var/run/docker.sock
IMGPROXY_ENABLE_WEBP_DETECTION=false
FUNCTIONS_VERIFY_JWT=false

############
# Email Templates
############
MAILER_URLPATHS_INVITE=/auth/v1/verify
MAILER_URLPATHS_CONFIRMATION=/auth/v1/verify
MAILER_URLPATHS_RECOVERY=/auth/v1/verify
MAILER_URLPATHS_EMAIL_CHANGE=/auth/v1/verify
```

## Frontend Dockerfile

```dockerfile
# docker/frontend/Dockerfile
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/frontend/nginx.conf /etc/nginx/nginx.conf

# Add security headers
RUN echo 'add_header X-Frame-Options "SAMEORIGIN" always;' > /etc/nginx/conf.d/security.conf && \
    echo 'add_header X-Content-Type-Options "nosniff" always;' >> /etc/nginx/conf.d/security.conf && \
    echo 'add_header X-XSS-Protection "1; mode=block" always;' >> /etc/nginx/conf.d/security.conf

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
```

## Nginx Configuration for Frontend + Supabase Proxy

```nginx
# docker/frontend/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    # Upstream for Supabase Kong Gateway
    upstream supabase_kong {
        server kong:8000;
    }

    server {
        listen 80;
        server_name _;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Frontend React App
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # Supabase API Proxy (REST API)
        location /rest/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://supabase_kong;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS headers
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PATCH, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Accept, Authorization, Content-Type, X-Requested-With, Range, apikey' always;
            
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*';
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PATCH, PUT, DELETE, OPTIONS';
                add_header 'Access-Control-Allow-Headers' 'Accept, Authorization, Content-Type, X-Requested-With, Range, apikey';
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Type' 'text/plain; charset=utf-8';
                add_header 'Content-Length' 0;
                return 204;
            }
        }

        # Supabase Auth API
        location /auth/ {
            limit_req zone=auth burst=10 nodelay;
            
            proxy_pass http://supabase_kong;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Supabase Realtime WebSocket
        location /realtime/ {
            proxy_pass http://supabase_kong;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Supabase Storage API
        location /storage/ {
            proxy_pass http://supabase_kong;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # File upload size limit (adjust as needed)
            client_max_body_size 50M;
        }

        # Supabase Edge Functions
        location /functions/ {
            proxy_pass http://supabase_kong;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }

    # Supabase Studio Access (Admin Dashboard)
    server {
        listen 443 ssl http2;
        server_name admin.yourdomain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;

        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;

        # Restrict access to admin IPs (optional)
        # allow 203.0.113.0/24;  # Your office IP range
        # deny all;

        location / {
            proxy_pass http://supabase_kong;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## AWS Infrastructure & Cost Analysis

### EC2 Instance Sizing & Costs for Self-Hosted Supabase

#### Option 1: Single Instance (Most Cost-Effective)
```yaml
Instance Type: t3.xlarge (4 vCPU, 16 GB RAM)
Monthly Cost: ~$120-135/month
Storage: 200GB GP3 SSD (~$16/month)
Data Transfer: ~$5-10/month
Load Balancer: ~$22/month
Route 53: ~$0.50/month

Total Monthly Cost: ~$163-183/month

Resource Allocation:
- Frontend (Nginx): 512MB RAM
- Kong API Gateway: 1GB RAM
- Supabase Studio: 1GB RAM
- GoTrue (Auth): 512MB RAM
- PostgREST (API): 1GB RAM
- Realtime Server: 1GB RAM
- Storage API: 512MB RAM
- Edge Functions: 512MB RAM
- PostgreSQL 15: 6GB RAM
- Analytics/Logflare: 1GB RAM
- Supporting services: 2GB RAM
- System: 1GB RAM
```

#### Option 2: Distributed Setup (Higher Availability)
```yaml
Frontend Load Balancer: t3.small (2 instances) - ~$30/month
Supabase Stack: t3.xlarge (2 instances) - ~$240/month
Database: t3.large (1 primary + 1 standby) - ~$120/month
Storage: 400GB GP3 SSD - ~$32/month
Application Load Balancer: ~$22/month
Route 53: ~$0.50/month

Total Monthly Cost: ~$444-474/month

Benefits:
- High availability for all services
- Database replication
- Load balancing across instances
- Better resource isolation
```

#### Option 3: Production-Ready (Enterprise Scale)
```yaml
Frontend: t3.medium (3 instances + ASG) - ~$90/month
Supabase Services: t3.2xlarge (3 instances + ASG) - ~$540/month
Database: RDS PostgreSQL (Multi-AZ) - ~$180/month
Cache: ElastiCache for session management - ~$45/month
Storage: EFS for shared files + S3 for backups - ~$25/month
Load Balancer: ALB + WAF + CloudFront - ~$50/month
Monitoring: CloudWatch + custom dashboards - ~$15/month

Total Monthly Cost: ~$945-980/month

Benefits:
- Enterprise-grade availability (99.9%+ uptime)
- Auto-scaling based on demand
- Managed database with automated backups
- Global CDN for static assets
- Advanced monitoring and alerting
```

## No Frontend Changes Required!

The beauty of self-hosting Supabase is that **your React application requires NO code changes**. You'll simply update your environment variables:

```typescript
// src/lib/supabase.ts (NO CHANGES NEEDED!)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL // Just point to your domain
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY // Same key structure

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Environment variables update:
```bash
# .env.local (your React app)
VITE_SUPABASE_URL=https://yourdomain.com
VITE_SUPABASE_ANON_KEY=your-anon-key-from-self-hosted-setup
```

All your existing code works exactly the same:
- Authentication: `supabase.auth.signUp()`, `supabase.auth.signIn()`
- Database: `supabase.from('table').select()`
- Realtime: `supabase.channel().on()`
- Storage: `supabase.storage.from('bucket')`
- Edge Functions: `supabase.functions.invoke()`

## Migration from Supabase Cloud to Self-Hosted

### 1. Export Your Existing Database Schema and Data

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your existing project
supabase link --project-ref your-project-ref

# Pull your schema (migrations)
supabase db pull

# Export your data
supabase db dump --data-only > migration-data.sql
```

### 2. Set Up Your Self-Hosted Environment

```bash
# Clone Supabase repository
git clone --depth 1 https://github.com/supabase/supabase

# Create project directory
mkdir ticket-system-supabase
cp -rf supabase/docker/* ticket-system-supabase/
cp supabase/docker/.env.example ticket-system-supabase/.env

cd ticket-system-supabase

# Generate secure passwords and keys
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For POSTGRES_PASSWORD
# Generate ANON_KEY and SERVICE_ROLE_KEY using https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys
```

### 3. Configure Your Environment

Edit your `.env` file with secure values (refer to Environment Configuration section above).

### 4. Start Your Self-Hosted Supabase

```bash
# Start the Supabase stack
docker compose up -d

# Wait for all services to be healthy
docker compose ps

# Apply your existing schema
psql "postgresql://postgres:your-password@localhost:5432/postgres" < supabase/migrations/*.sql

# Import your data
psql "postgresql://postgres:your-password@localhost:5432/postgres" < migration-data.sql
```

### 5. Update Your React App Configuration

```bash
# Update your React app environment variables
# .env.local
VITE_SUPABASE_URL=https://yourdomain.com
VITE_SUPABASE_ANON_KEY=your-new-anon-key
```

### 6. Test Everything Works

Your existing React app should work immediately with no code changes needed!

```typescript
// All existing code continues to work:
const { data: tickets } = await supabase
  .from('tickets')
  .select('*')

const { user } = await supabase.auth.signUp({
  email,
  password
})

// Real-time subscriptions work the same
supabase
  .channel('tickets')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, 
    (payload) => console.log(payload)
  )
  .subscribe()
```

## Deployment & CI/CD Pipeline

### GitHub Actions Workflow for Self-Hosted Supabase
```yaml
# .github/workflows/deploy-self-hosted-supabase.yml
name: Deploy Self-Hosted Supabase Stack

on:
  push:
    branches: [main, staging]

env:
  AWS_REGION: us-east-1

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Build and push frontend image
        run: |
          # Build React app
          npm install
          npm run build
          
          # Build Docker image
          docker build -f docker/frontend/Dockerfile -t ticket-frontend:latest .
          
          # Tag and push to ECR (optional)
          # docker tag ticket-frontend:latest $ECR_REGISTRY/ticket-frontend:${{ github.sha }}
          # docker push $ECR_REGISTRY/ticket-frontend:${{ github.sha }}

      - name: Deploy to EC2
        run: |
          # Deploy to staging or production
          aws ssm send-command \
            --document-name "AWS-RunShellScript" \
            --parameters 'commands=[
              "cd /opt/ticket-system-supabase",
              "git pull origin main",
              "docker compose -f docker-compose.prod.yml pull",
              "docker compose -f docker-compose.prod.yml up -d",
              "docker system prune -f"
            ]' \
            --targets "Key=tag:Environment,Values=${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}"
```

## Monitoring & Backup Strategy

### Supabase Analytics Dashboard
The self-hosted Supabase includes a built-in analytics dashboard accessible via Supabase Studio. Monitor:
- Database performance
- API request metrics
- Authentication events
- Real-time connections
- Storage usage

### Database Backup Script
```bash
#!/bin/bash
# scripts/backup-supabase.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
POSTGRES_PASSWORD="your-postgres-password"

# Full database backup with schema and data
docker exec supabase-db pg_dump -U postgres -h localhost postgres > "$BACKUP_DIR/supabase_full_backup_$DATE.sql"

# Schema-only backup
docker exec supabase-db pg_dump -U postgres -h localhost --schema-only postgres > "$BACKUP_DIR/supabase_schema_$DATE.sql"

# Data-only backup
docker exec supabase-db pg_dump -U postgres -h localhost --data-only postgres > "$BACKUP_DIR/supabase_data_$DATE.sql"

# Storage files backup
tar -czf "$BACKUP_DIR/supabase_storage_$DATE.tar.gz" -C ./volumes storage

# Upload to S3
aws s3 sync "$BACKUP_DIR" s3://your-backup-bucket/supabase-backups/

# Clean old backups (keep 30 days)
find "$BACKUP_DIR" -name "supabase_*" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Monitoring with Grafana (Optional)
```yaml
# Add to docker-compose.prod.yml
  grafana:
    image: grafana/grafana:latest
    container_name: supabase-grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3001:3000"
    networks:
      - supabase-network
    restart: unless-stopped

volumes:
  grafana_data:
```

## Cost-Effectiveness Analysis

### Total Cost Breakdown (Self-Hosted Supabase)

```yaml
Monthly Costs (Single EC2):
  EC2 t3.xlarge instance: $135/month
  200GB GP3 storage: $16/month
  Application Load Balancer: $22/month
  Route 53 hosted zone: $0.50/month
  Data transfer: $5-10/month
  SSL certificate (ACM): Free
  Backup S3 storage: $5-10/month

Total: $183-203/month
Annual Cost: $2,196-2,436

Compared to Alternatives:
  - Supabase Pro (grows with usage): $25-200+/month = $300-2,400+/year
  - Custom development approach: $500-1000/month = $6,000-12,000/year
  - AWS managed services: $500-800/month = $6,000-9,600/year
  - Static hosting + Supabase: $25-50/month = $300-600/year (but no control)

Self-hosting break-even point: ~15,000-20,000 monthly active users vs Supabase Pro
```

### When Self-Hosting Supabase Makes Sense

✅ **Advantages:**
- **Complete control** over data and infrastructure
- **No vendor lock-in** - you own the entire stack
- **No code changes required** - exact same APIs as Supabase Cloud
- **Compliance requirements** (data residency, SOC2, HIPAA, etc.)
- **Cost predictability** for high-usage applications
- **Custom configuration** and performance tuning
- **Data sovereignty** - your data never leaves your infrastructure

❌ **Considerations:**
- **Operational overhead** (maintenance, updates, monitoring)
- **Higher base costs** than managed Supabase for small applications
- **Security responsibility** (patches, SSL certificates, access management)
- **Backup and disaster recovery** planning required
- **DevOps expertise** needed for production operations

## Implementation Timeline

### Phase 1: Infrastructure Setup (1-2 weeks)
- Week 1: Set up AWS infrastructure (EC2, ALB, Route 53)
- Week 2: Configure domain, SSL certificates, and security groups

### Phase 2: Self-Hosted Supabase Deployment (1-2 weeks)
- Week 3: Deploy Supabase Docker stack and configure services
- Week 4: Set up monitoring, backups, and test all functionality

### Phase 3: Data Migration (1 week)
- Week 5: Export data from Supabase Cloud and import to self-hosted
- Test all functionality and performance

### Phase 4: Frontend Migration & Go-Live (1 week)
- Week 6: Update React app environment variables
- Deploy and test in production
- DNS cutover from Supabase Cloud to self-hosted

**Total Timeline: 4-6 weeks** (much faster than custom development!)

## Recommendation

For your requirement of "dockerize and self host everything," the **self-hosted Supabase approach at ~$180-200/month** is the optimal solution because:

✅ **Zero code changes** - your React app works immediately  
✅ **Complete control** over your entire stack  
✅ **All Supabase features** - Auth, Database, Realtime, Storage, Functions  
✅ **Proven architecture** - using official Supabase Docker containers  
✅ **Much faster implementation** - weeks instead of months  
✅ **Future flexibility** - can always move back to cloud or other providers  
✅ **Cost-effective** at scale compared to managed services  

This gives you everything you want: complete self-hosting control with minimal development overhead and maximum compatibility with your existing application.

Would you like me to help you start with the AWS infrastructure setup or the Supabase Docker deployment?