# Vault Treasury — Docker Commands Reference

> Quick reference for all Docker-related commands in the Vault Treasury project.

---

## Prerequisites

- Docker 20.10+
- Docker Compose v2+
- Create `.env` file from `.env.example` with your credentials
- **Upstash Redis** account (cloud-hosted Redis)

```bash
# Check Docker version
docker --version
docker compose version
```

---

## Development (Full Stack with Hot-Reload)

Use for full containerized development with live code changes.

```bash
# Build and start all services
docker compose -f docker-compose.dev.yml up --build

# Start in detached mode
docker compose -f docker-compose.dev.yml up -d --build

# View logs for all services
docker compose -f docker-compose.dev.yml logs -f

# View logs for specific service
docker compose -f docker-compose.dev.yml logs -f frontend
docker compose -f docker-compose.dev.yml logs -f backend

# Rebuild a specific service
docker compose -f docker-compose.dev.yml up --build frontend

# Stop all services
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes
docker compose -f docker-compose.dev.yml down -v

# Restart a specific service
docker compose -f docker-compose.dev.yml restart backend

# Execute command in running container
docker compose -f docker-compose.dev.yml exec backend sh
docker compose -f docker-compose.dev.yml exec frontend sh
```

---

## Production

Use for production-like builds and deployment testing.

```bash
# Build and start production stack
docker compose -f docker-compose.prod.yml up --build

# Start in detached mode
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check service health
docker compose -f docker-compose.prod.yml ps

# Stop all services
docker compose -f docker-compose.prod.yml down

# Stop and remove everything (volumes, networks)
docker compose -f docker-compose.prod.yml down -v --rmi all

# Scale backend (if needed)
docker compose -f docker-compose.prod.yml up -d --scale backend=3
```

---

## Building Individual Images

```bash
# Build frontend image
docker build -t vault-frontend:latest ./frontend

# Build frontend for production
docker build -t vault-frontend:prod --target production ./frontend

# Build backend image
docker build -t vault-backend:latest ./backend

# Build backend for production
docker build -t vault-backend:prod --target production ./backend
```

---

## Cleanup Commands

```bash
# Remove all stopped containers
docker container prune -f

# Remove unused images
docker image prune -f

# Remove unused volumes
docker volume prune -f

# Remove all unused objects (containers, images, networks, volumes)
docker system prune -a --volumes -f

# Remove specific project images
docker rmi vault-treasury-frontend vault-treasury-backend
```

---

## Debugging

```bash
# Check container resource usage
docker stats

# Inspect a container
docker inspect vault-treasury-backend-1

# View container processes
docker top vault-treasury-backend-1

# Copy files from container
docker cp vault-treasury-backend-1:/app/dist ./local-dist

# Access container shell
docker exec -it vault-treasury-backend-1 sh
docker exec -it vault-treasury-frontend-1 sh
```

---

## Common Workflows

### Fresh Start (Clean Rebuild)

```bash
# Stop everything, remove volumes, rebuild
docker compose -f docker-compose.dev.yml down -v
docker system prune -f
docker compose -f docker-compose.dev.yml up --build
```

### Update Dependencies

```bash
# Rebuild without cache after package.json changes
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up
```

### Local Development (Recommended)

```bash
# Run frontend locally
cd frontend && pnpm dev

# Run backend locally (in another terminal)
cd backend && pnpm start:dev

# Redis is provided by Upstash (no local container needed)
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Upstash Redis (TLS connection)
REDIS_URL=rediss://default:YOUR_PASSWORD@your-endpoint.upstash.io:6379

# Sentinel (optional, defaults to localhost)
SENTINEL_API_URL=http://localhost:8000
```

---

## Ports Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 8001 | http://localhost:8001/api |
| Health Check | 8001 | http://localhost:8001/api/health |
| Sentinel-ML | 8000 | http://localhost:8000 |
| Upstash Redis | 6379 | rediss://...upstash.io:6379 |
