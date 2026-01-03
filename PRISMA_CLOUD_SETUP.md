# Prisma Cloud Setup Guide

This guide will help you connect your MV-OS backend to Prisma Cloud.

## Current Setup

Your MV-OS backend is currently configured to use:
- **AWS RDS PostgreSQL** (production)
- **Local PostgreSQL** (development via Docker Compose)

## Option 1: Connect to Prisma Cloud (New Database)

If you want to use Prisma Cloud as your database:

### Step 1: Get Connection String from Prisma Cloud

1. Go to [console.prisma.io](https://console.prisma.io)
2. Copy the connection string shown (it looks like):
   ```
   postgres://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require
   ```

### Step 2: Update Backend Configuration

#### For Local Development:

Create or update `backend/.env`:

```env
# Database - Prisma Cloud
DATABASE_URL="postgres://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require"

# JWT
JWT_SECRET="your-jwt-secret-min-32-chars"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:3001"
```

#### For Production (AWS Secrets Manager):

Update the secret in AWS:

```bash
aws secretsmanager update-secret \
  --secret-id mv-os/database-url \
  --secret-string "postgres://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require" \
  --region us-east-1
```

### Step 3: Test Connection

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Test connection
npx prisma db pull

# Run migrations (if starting fresh)
npx prisma migrate deploy

# Seed database (optional)
npm run prisma:seed
```

## Option 2: Keep AWS RDS, Add Prisma Cloud for Development

You can use Prisma Cloud for local development while keeping AWS RDS for production:

### Update `.env.local`:

```env
# Database - Prisma Cloud (local dev only)
DATABASE_URL="postgres://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require"
```

### Keep Production Using AWS RDS:

Production will continue using AWS Secrets Manager (`mv-os/database-url`).

## Option 3: Use Prisma Accelerate (Connection Pooling)

If you want to use Prisma Accelerate for better performance:

1. Enable "Connect Prisma Accelerate" in Prisma Cloud console
2. Get the Accelerate connection string (starts with `prisma://`)
3. Update your `DATABASE_URL` to use the Accelerate URL

```env
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
```

## Important Notes

⚠️ **Before Switching:**

1. **Backup your current database** if you have important data
2. **Test the connection** before deploying to production
3. **Update all environments** (local, staging, production) if switching globally
4. **Prisma Cloud uses SSL** - make sure `sslmode=require` is in your connection string

## Troubleshooting

### Connection Issues

If you get connection errors:

1. **Check SSL mode**: Ensure `sslmode=require` is in the connection string
2. **Check credentials**: Verify username and password are correct
3. **Check network**: Ensure your IP is allowed (Prisma Cloud may have IP restrictions)
4. **Check Prisma version**: Ensure you're using Prisma 5.22.0 (as in your package.json)

### Migration Issues

If migrations fail:

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or create fresh migrations
npx prisma migrate dev --name init
```

## Next Steps

After connecting:

1. ✅ Test the connection: `npx prisma db pull`
2. ✅ Run migrations: `npx prisma migrate deploy`
3. ✅ Seed data: `npm run prisma:seed`
4. ✅ Start backend: `npm run start:dev`
5. ✅ Test API endpoints

## Need Help?

- Prisma Cloud Docs: https://www.prisma.io/docs/cloud
- Prisma Discord: https://pris.ly/discord

