# 📦 Install PostgreSQL

## Option 1: Install PostgreSQL (Recommended)

### macOS
```bash
# Install Homebrew first (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Create database
createdb mv_os
```

### Windows
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation, remember the password you set for the `postgres` user
4. After installation, open pgAdmin or Command Prompt
5. Create database:
```sql
CREATE DATABASE mv_os;
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql-14
sudo systemctl start postgresql
sudo -u postgres createdb mv_os
```

## Option 2: Use Docker (If Docker is installed)

```bash
# Start PostgreSQL in Docker
docker run -d \
  --name mv-os-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mv_os \
  -p 5432:5432 \
  postgres:14-alpine

# Or use docker-compose (if you have the docker-compose.yml file)
docker compose up -d postgres
```

## Option 3: Use a Cloud Database

You can use a free PostgreSQL service like:
- **Supabase**: https://supabase.com (Free tier available)
- **Neon**: https://neon.tech (Free tier available)
- **Railway**: https://railway.app (Free tier available)

Just copy the connection string and update `backend/.env`:
```env
DATABASE_URL="your-cloud-database-connection-string"
```

## After Installing PostgreSQL

1. Update `backend/.env` with your credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/mv_os?schema=public"
```

2. Run database setup:
```bash
cd backend
npx prisma migrate dev --name init
npm run prisma:seed
```

3. Start the servers!












