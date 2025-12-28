# Build stage
FROM public.ecr.aws/docker/library/node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Generate Prisma client (pin CLI to avoid accidental Prisma 6/7 installs in CI)
RUN npx prisma@5.22.0 generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM public.ecr.aws/docker/library/node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm install --only=production --legacy-peer-deps

# Generate Prisma client for production (pin CLI to avoid accidental Prisma 6/7 installs in CI)
RUN npx prisma@5.22.0 generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start application
CMD ["node", "dist/main.js"]
