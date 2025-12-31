# Build stage
FROM public.ecr.aws/docker/library/node:18-bullseye-slim AS builder

WORKDIR /app

# Prisma native engines need OpenSSL at runtime; ensure it's present in builder too
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

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
FROM public.ecr.aws/docker/library/node:18-bullseye-slim

WORKDIR /app

# Ensure OpenSSL is present for Prisma query engine
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

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

# Start application (apply DB migrations first)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
