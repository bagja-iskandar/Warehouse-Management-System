# ==============================================================================
# Multi-stage Dockerfile for NestJS Backend (Production-ready)
# ==============================================================================

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install build dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build
RUN npx prisma generate

# Stage 2: Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client

# Non-root user for security
USER node

EXPOSE 5000

CMD ["node", "dist/src/main.js"]

