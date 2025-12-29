# Frontend Dockerfile (Next.js)
# Build stage
FROM public.ecr.aws/docker/library/node:18-bullseye-slim AS builder

WORKDIR /app

# Build-time env (baked into client bundle)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy package files
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production image
FROM public.ecr.aws/docker/library/node:18-bullseye-slim

WORKDIR /app

# Runtime env (server)
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files
COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/package.json ./package.json

# Expose port
EXPOSE 3000

# Start application
CMD ["sh", "-c", "npm run start -- -p ${PORT}"]

