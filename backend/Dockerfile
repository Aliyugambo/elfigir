FROM node:20-alpine AS builder

WORKDIR /build

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build application
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3001

CMD ["node", "dist/main.js"]
