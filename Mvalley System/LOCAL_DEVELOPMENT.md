# 🚀 Local Development Guide

## Quick Start (Fast Testing)

Instead of waiting 5-7 minutes for deployment, develop and test locally with **instant hot-reload**:

### 1. Start Both Servers (One Command)

```bash
# Terminal 1: Start both backend and frontend
npm run dev
```

Or use the convenience script:
```bash
./start-dev.sh
```

This starts:
- **Backend**: `http://localhost:3000` (hot-reload enabled)
- **Frontend**: `http://localhost:3001` (hot-reload enabled)

### 2. Configure Local Environment

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

Create `backend/.env` (if not exists):
```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
PORT=3000
```

### 3. Development Workflow

1. **Make changes** → Save file
2. **See changes instantly** → No deployment needed!
3. **Test locally** → `http://localhost:3001`
4. **Deploy when ready** → Only push to production when feature is complete

## Benefits

✅ **Instant feedback** - Changes appear in < 1 second  
✅ **No deployment wait** - Test immediately  
✅ **Faster iteration** - Make 10 changes in 2 minutes  
✅ **Save deployment costs** - Only deploy when ready  
✅ **Better debugging** - Full error messages and stack traces  

## Hot Reload Features

- **Backend**: NestJS watch mode - auto-restarts on file changes
- **Frontend**: Next.js Fast Refresh - updates without losing state
- **Database**: Prisma Studio available for data inspection

## When to Deploy

Only deploy to AWS when:
- ✅ Feature is complete and tested locally
- ✅ All tests pass
- ✅ Ready for production use
- ✅ Multiple features ready (batch deployments)

## Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 3000 and 3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Database Connection Issues
- Ensure DATABASE_URL in `backend/.env` is correct
- Check if database is accessible from your IP
- For AWS RDS: Update security group to allow your IP

### Frontend Can't Connect to Backend
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Ensure backend is running on port 3000
- Check CORS settings in backend

## Advanced: Concurrent Development

Install `concurrently` for better terminal output:
```bash
npm install -D concurrently
```

Then use:
```bash
npm run dev:all
```

