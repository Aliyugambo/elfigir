# 🍽️ Elfigir - Food Delivery Platform Setup Guide

## Prerequisites

- **Node.js**: v20 or higher
- **npm**: v10 or higher (or yarn/pnpm)
- **Docker & Docker Compose**: For containerized setup
- **PostgreSQL**: v14+ (if running locally without Docker)
- **Redis**: v7+ (if running locally without Docker)

## Installation & Setup

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd elfigir
``` 

2. **Setup environment variables**
```bash
# Copy and edit the environment file
cp .env.example .env
```

3. **Start services with Docker Compose**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- Backend API (NestJS)
- Frontend (Next.js)

4. **Run database migrations**
```bash
docker-compose exec api npm run prisma:migrate
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/docs

### Option 2: Local Development Setup

#### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

4. **Update .env with local database credentials**
```
DATABASE_URL="postgresql://user:password@localhost:5432/elfigir_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your_secret_key"
```

5. **Create PostgreSQL database**
```bash
createdb elfigir_db
```

6. **Run Prisma migrations**
```bash
npm run prisma:generate
npm run prisma:migrate
```

7. **Start development server**
```bash
npm run start:dev
```

Backend runs on http://localhost:3001

#### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env.local
```

4. **Start development server**
```bash
npm run dev
```

Frontend runs on http://localhost:3000

## Project Structure

### Backend (`/backend`)

```
src/
├── common/                 # Shared services and utilities
│   ├── prisma.service.ts  # Database service
│   ├── auth.service.ts    # Authentication utilities
│   └── cloudinary.service.ts  # File upload service
├── modules/               # Feature modules
│   ├── auth/             # Authentication module
│   │   ├── auth.dto.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   └── jwt.guard.ts
│   ├── restaurants/      # Restaurant management
│   └── orders/           # Order management
├── app.module.ts
└── main.ts
```

### Frontend (`/frontend`)

```
src/
├── app/                  # Next.js App Router
│   ├── page.tsx         # Home page
│   ├── layout.tsx       # Root layout
│   ├── login/           # Login page
│   ├── signup/          # Signup page
│   ├── checkout/        # Checkout page
│   ├── orders/          # Orders page
│   └── restaurant/      # Restaurant detail
├── components/          # Reusable components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── RestaurantCard.tsx
│   ├── MenuItemCard.tsx
│   └── CartSidebar.tsx
├── services/            # API services
│   ├── auth.service.ts
│   ├── restaurant.service.ts
│   └── order.service.ts
├── store/              # Zustand stores
│   ├── auth.store.ts
│   ├── cart.store.ts
│   └── ui.store.ts
├── types/              # TypeScript types
└── lib/                # Utilities
```

## Database Schema

Key tables:
- **users** - Customer/Restaurant/Admin profiles
- **restaurants** - Restaurant information
- **menus** - Menu categories
- **menu_items** - Individual food items
- **orders** - Customer orders
- **order_items** - Items in orders
- **reviews** - Customer reviews
- **favorites** - Favorite restaurants

## API Endpoints

### Authentication
- `POST /api/v1/auth/sign-up` - Register
- `POST /api/v1/auth/sign-in` - Login
- `GET /api/v1/auth/profile` - Get profile (Protected)

### Restaurants
- `GET /api/v1/restaurants` - List restaurants
- `GET /api/v1/restaurants/:id` - Get restaurant details
- `GET /api/v1/restaurants/slug/:slug` - Get by slug

### Orders
- `POST /api/v1/orders` - Create order (Protected)
- `GET /api/v1/orders/:id` - Get order (Protected)
- `GET /api/v1/orders` - List user orders (Protected)

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/elfigir_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRATION=24h
API_PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_NAME=Elfigir
```

## Common Commands

### Backend
```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database

# Linting
npm run lint
npm run format
```

### Frontend
```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint
npm run format
```

## Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild images
docker-compose up -d --build

# Run specific service
docker-compose up -d api
docker-compose up -d frontend
```

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Run migrations: `npm run prisma:migrate`

### Port Already in Use
- Backend (3001): `lsof -i :3001` and kill the process
- Frontend (3000): `lsof -i :3000` and kill the process

### Dependencies Issues
- Clear node_modules: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`

### CORS Errors
- Check FRONTEND_URL in backend .env
- Ensure frontend URL matches in CORS config

## Next Steps

1. Review the main README for feature overview
2. Check API documentation at `/docs` endpoint
3. Explore the codebase structure
4. Start developing!

## Support

For issues or questions, please refer to the main README.md or contact support@elfigir.com
