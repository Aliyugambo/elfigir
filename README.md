# Elfigir - Modern Food Delivery Platform

A full-stack food delivery platform built with modern technologies, inspired by clean and intuitive design principles.

## 🚀 Features

### User Features
- Browse restaurants and menus
- Search and filter restaurants
- Add items to cart with quantity and add-ons
- Secure checkout with multiple payment options
- Order tracking
- Order history
- Account management
- Favorites/Wishlist

### Payment Options
- **Current**: Bank Transfer, Cash on Delivery
- **Future Ready**: Paystack, Flutterwave, Stripe

### Restaurant Features
- Restaurant dashboard
- Menu management
- Order management
- Analytics

### Admin Features
- User management
- Restaurant verification
- Order management
- Analytics dashboard

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 15
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **API Client**: Axios
- **Data Fetching**: TanStack Query (React Query)
- **Components**: Shadcn UI
- **Carousel**: Swiper.js
- **Icons**: React Icons
- **Toast**: Sonner

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + Passport
- **Cache**: Redis
- **Queue**: BullMQ
- **File Upload**: Cloudinary + Multer
- **Email**: Nodemailer
- **API Docs**: Swagger
- **Containerization**: Docker

### Database
- PostgreSQL with Prisma ORM

## 📦 Project Structure

```
elfigir/
├── frontend/                    # Next.js Frontend
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   ├── components/         # Reusable components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities
│   │   ├── services/           # API services
│   │   ├── store/              # Zustand stores
│   │   ├── types/              # TypeScript types
│   │   └── globals.css         # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   └── tailwind.config.js
│
├── backend/                     # NestJS Backend
│   ├── src/
│   │   ├── common/             # Shared services
│   │   ├── modules/            # Feature modules
│   │   │   ├── auth/           # Authentication
│   │   │   ├── restaurants/    # Restaurant management
│   │   │   └── orders/         # Order management
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── docker-compose.yml          # Docker Compose
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### Local Development Setup

1. **Clone and Install Dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. **Setup Environment Variables**
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

3. **Database Setup**
```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed
```

4. **Start Development Servers**
```bash
# Terminal 1 - Backend (from backend/)
npm run start:dev

# Terminal 2 - Frontend (from frontend/)
npm run dev
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/docs

### Docker Setup

```bash
# Setup environment
cp backend/.env.example .env
cp frontend/.env.example .env.local

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec api npm run prisma:migrate

# View logs
docker-compose logs -f
```

## 📝 API Documentation

API documentation is available at `/docs` endpoint when backend is running.

### Key Endpoints

**Authentication**
- `POST /api/v1/auth/sign-up` - Register new user
- `POST /api/v1/auth/sign-in` - Login user
- `GET /api/v1/auth/profile` - Get current user (Protected)

**Restaurants**
- `GET /api/v1/restaurants` - List restaurants with filters
- `GET /api/v1/restaurants/:id` - Get restaurant details
- `GET /api/v1/restaurants/slug/:slug` - Get restaurant by slug

**Orders**
- `POST /api/v1/orders` - Create new order (Protected)
- `GET /api/v1/orders/:id` - Get order details (Protected)
- `GET /api/v1/orders` - Get user orders (Protected)

## 🎨 Design Philosophy

The platform follows a clean, minimalist design approach:
- **Spacing**: Consistent use of spacing for visual hierarchy
- **Typography**: Clear hierarchy with readable fonts
- **Colors**: Brand color (Red/Primary) with neutral backgrounds
- **Interaction**: Smooth animations with Framer Motion
- **Responsive**: Mobile-first responsive design

## 🔐 Authentication

- JWT-based authentication
- Secure password hashing with bcrypt
- Token refresh mechanism
- Protected routes with JWT Guard

## 💾 Database Schema

Key entities:
- **Users** - Customer, Restaurant, Admin, Delivery profiles
- **Restaurants** - Restaurant details and metadata
- **Menus** - Restaurant menus
- **MenuItems** - Individual food items
- **Orders** - Customer orders
- **OrderItems** - Items within orders
- **Reviews** - Customer reviews for restaurants
- **Favorites** - Favorite restaurants

## 🚢 Deployment

### Backend (NestJS)
- Build: `npm run build`
- Start: `npm run start:prod`
- Docker: Dockerfile included

### Frontend (Next.js)
- Build: `npm run build`
- Start: `npm start`
- Docker: Dockerfile included

## 📊 Future Enhancements

- Real-time order tracking with WebSockets
- Payment gateway integration (Paystack, Flutterwave, Stripe)
- Delivery partner tracking
- Advanced analytics
- Multi-language support
- Push notifications
- Restaurant admin dashboard
- Driver app
- Reviews and ratings system

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📧 Support

For support, email support@elfigir.com or visit our website.

---

Built with ❤️ by the Elfigir Team
