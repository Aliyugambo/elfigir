#!/bin/bash

# Elfigir Project Setup Script

echo "🚀 Setting up Elfigir Food Delivery Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v20 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Setup backend
echo ""
echo "📦 Setting up backend..."
cd backend
cp .env.example .env
npm install
echo "✅ Backend dependencies installed"

# Setup frontend
echo ""
echo "📦 Setting up frontend..."
cd ../frontend
cp .env.example .env.local
npm install
echo "✅ Frontend dependencies installed"

# Return to root
cd ..

# Instructions
echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update backend/.env with your database credentials"
echo "2. Update frontend/.env.local if needed"
echo "3. Run: npm run dev:all (from root directory)"
echo ""
echo "📚 Documentation:"
echo "- Setup Guide: SETUP.md"
echo "- API Documentation: http://localhost:3001/docs"
echo ""
echo "Happy coding! 🚀"
