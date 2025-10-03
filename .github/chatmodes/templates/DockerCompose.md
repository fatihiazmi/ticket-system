# Example Scaffold: `docker-compose.yml`

```yaml
version: '3.9'

services:
  # Core Database
  db:
    image: supabase/postgres:15.1.0.123
    container_name: supabase_db
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - db_data:/var/lib/postgresql/data
    networks:
      - supabase_internal

  # Supabase APIs
  auth:
    image: supabase/gotrue:v2.132.0
    depends_on:
      - db
    environment:
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
    networks:
      - supabase_internal

  realtime:
    image: supabase/realtime:v2.21.0
    depends_on:
      - db
    environment:
      DB_HOST: db
      DB_USER: ${POSTGRES_USER}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_NAME: ${POSTGRES_DB}
    networks:
      - supabase_internal

  rest:
    image: postgrest/postgrest:v12.0.2
    depends_on:
      - db
    environment:
      PGRST_DB_URI: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      PGRST_DB_SCHEMA: public
      PGRST_JWT_SECRET: ${JWT_SECRET}
    networks:
      - supabase_internal

  storage:
    image: supabase/storage-api:v0.36.0
    depends_on:
      - db
    environment:
      ANON_KEY: ${ANON_KEY}
      SERVICE_KEY: ${SERVICE_KEY}
      POSTGREST_URL: http://rest:3000
    volumes:
      - storage_data:/var/lib/storage
    networks:
      - supabase_internal

  # Reverse Proxy (Traefik)
  traefik:
    image: traefik:v3.0
    command:
      - '--providers.docker=true'
      - '--entrypoints.websecure.address=:443'
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - traefik_data:/etc/traefik
    networks:
      - supabase_internal
      - supabase_public

  # Monitoring
  prometheus:
    image: prom/prometheus
    volumes:
      - prometheus_data:/prometheus
    networks:
      - supabase_internal

  grafana:
    image: grafana/grafana
    depends_on:
      - prometheus
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    ports:
      - '3001:3000'
    networks:
      - supabase_internal

volumes:
  db_data:
  storage_data:
  prometheus_data:
  traefik_data:

networks:
  supabase_internal:
    driver: bridge
  supabase_public:
    driver: bridge
```
