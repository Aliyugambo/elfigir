# Elfigir - Production Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- A domain name pointing to your server
- A PostgreSQL database (Aiven Cloud, self-hosted, or managed service)
- A Redis instance
- Cloudinary account (for image uploads)
- SMTP credentials (Google, SendGrid, etc.)

## Quick Start

```bash
# 1. Copy env file and fill in values
cp .env.example .env.production
# Edit .env.production with your actual values

# 2. Deploy
./deploy.sh
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_USER` | Yes | PostgreSQL username |
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `DB_NAME` | Yes | Database name |
| `DB_HOST` | Yes | PostgreSQL host (e.g., `your-db.aivencloud.com`) |
| `DB_PORT` | Yes | PostgreSQL port (usually 5432 or Aiven's port) |
| `JWT_SECRET` | Yes | Long random string for JWT signing |
| `FRONTEND_URL` | Yes | Frontend URL (e.g., `https://elfigir.com`) |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL (e.g., `https://elfigir.com/api/v1`) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | Yes | SMTP server port (587 for TLS) |
| `SMTP_USER` | Yes | SMTP username |
| `SMTP_PASSWORD` | Yes | SMTP password/app password |
| `SMTP_FROM` | Yes | From email address |

## File Structure for Deployment

```
elfigir/
├── docker-compose.prod.yml    # Production orchestration
├── docker-compose.yml          # Local development
├── .env.production             # Production env vars
├── .env.example                # Template env vars
├── deploy.sh                   # One-step deploy script
├── nginx/
│   └── nginx.conf              # Reverse proxy config
├── backend/
│   ├── Dockerfile              # Backend container
│   ├── src/                    # NestJS source
│   └── Dockerfile              # Multi-stage build
└── frontend/
    ├── Dockerfile              # Frontend container
    ├── src/                    # Next.js source
    └── Dockerfile              # Multi-stage build
```

## How Frontend and Backend Communicate

### 1. API URL (Frontend → Backend)

The frontend reads `NEXT_PUBLIC_API_URL` from its environment at **build time**:

```env
# frontend .env.production
NEXT_PUBLIC_API_URL=https://your-domain.com/api/v1
```

This value is baked into the static JavaScript bundles during `npm run build`. All API calls from the browser go to this URL.

### 2. CORS (Backend ← Frontend)

The backend CORS is configured in `main.ts`:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

Set `FRONTEND_URL` in the backend's environment to match your frontend domain.

### 3. Same-Network Communication (Docker)

In Docker Compose, containers communicate using service names as hostnames:

- Frontend container → `http://api:3001/api/v1` (internal Docker network)
- Backend container → `postgres:5432`, `redis:6379` (internal Docker network)

### 4. Reverse Proxy (Nginx)

Nginx handles external traffic and routes it:

- `https://yourdomain.com` → Frontend (port 3000)
- `https://yourdomain.com/api/v1/*` → Backend (port 3001)
- `https://yourdomain.com/docs` → Swagger (port 3001)

## Step-by-Step Deployment

### Option A: Docker Compose (Self-Hosted)

1. **Prepare environment**
   ```bash
   cp .env.example .env.production
   # Edit .env.production with real values
   ```

2. **Deploy**
   ```bash
   ./deploy.sh
   ```

3. **Verify**
   ```bash
   docker compose -f docker-compose.prod.yml logs -f
   ```

4. **Update (after code changes)**
   ```bash
   ./deploy.sh
   # Or manually:
   docker compose -f docker-compose.prod.yml up -d --build
   ```

### Option B: Aiven + PaaS (Recommended for this project)

Since the project already uses Aiven for PostgreSQL:

1. **Aiven database** — Already set up, just ensure it's running and your server IP is whitelisted
2. **Deploy backend** — Push to a PaaS (Railway, Render, Fly.io, AWS ECS) pointing to `Aiven` for database
3. **Deploy frontend** — Push to Vercel, Netlify, or similar
4. **Set env vars** on both platforms

### Option C: Manual VPS Deployment

1. **Set up server**
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx
   sudo systemctl enable docker
   sudo systemctl start docker
   ```

2. **Deploy code**
   ```bash
   git clone https://your-repo.git elfigir
   cd elfigir
   cp .env.example .env.production
   # Edit .env.production
   ```

3. **Set up SSL**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

4. **Deploy**
   ```bash
   ./deploy.sh
   ```

## Troubleshooting

### Frontend can't reach backend
- Check `NEXT_PUBLIC_API_URL` matches the backend's public URL
- Check CORS settings (`FRONTEND_URL` in backend env)
- Check that Nginx proxy routes `/api/` to the backend

### Database connection refused
- Verify `DATABASE_URL` is correct
- Check database is running and IP is whitelisted (for Aiven)
- Test: `nc -zv $DB_HOST $DB_PORT`

### Images not displaying
- Check Cloudinary credentials are correct
- Verify images uploaded successfully check the Cloudinary dashboard
- Check `banner` field (not `image`) in `CreateRestaurantDto`

### 400 "property X should not exist" errors
- This means `forbidNonWhitelisted: true` in ValidationPipe is rejecting unknown fields
- Check that the DTO includes all fields the frontend is sending
- Run `npm run build` in backend after DTO changes