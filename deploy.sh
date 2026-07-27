#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.production"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.prod.yml"

echo "============================================"
echo "  Elfigir - Production Deployment"
echo "============================================"

# Validate .env.production exists
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env.production not found!"
  echo "Copy .env.example to .env.production and fill in your values."
  exit 1
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a

# Validate required variables
required_vars=(
  DB_USER DB_PASSWORD DB_NAME DB_HOST DB_PORT
  JWT_SECRET FRONTEND_URL NEXT_PUBLIC_API_URL
  CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET
)

missing=false
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "ERROR: Missing required variable: $var"
    missing=true
  fi
done

if [ "$missing" = true ]; then
  echo ""
  echo "Please fill in all required variables in .env.production"
  exit 1
fi

echo ""
echo "Building and starting services..."
echo ""

# Build and start
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

echo ""
echo "Waiting for services to be healthy..."
sleep 10

# Check status
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo ""
echo "============================================"
echo "  Deployment complete!"
echo "============================================"
echo "  Frontend: https://your-frontend-domain.com"
echo "  API Docs: https://your-domain.com/docs"
echo "  API Health: https://your-domain.com/api/v1/auth/sign-in"
echo "============================================"