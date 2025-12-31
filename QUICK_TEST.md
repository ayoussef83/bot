# ⚡ Quick Testing Guide

## The Problem
- Deploying to AWS takes 5-7 minutes
- Every change requires waiting for deployment
- Slow iteration cycle

## The Solution: Local Development

### Setup (One Time)

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Configure environment:**
   ```bash
   # Backend
   echo "DATABASE_URL=your_database_url" > backend/.env
   echo "JWT_SECRET=your_secret" >> backend/.env
   
   # Frontend
   echo "NEXT_PUBLIC_API_URL=http://localhost:3000/api" > frontend/.env.local
   ```

3. **Start development servers:**
   ```bash
   ./start-dev.sh
   # OR
   npm run dev
   ```

### Daily Workflow

1. **Start local servers** (30 seconds)
   ```bash
   npm run dev
   ```

2. **Make changes** → Save file

3. **See changes instantly** → Refresh browser

4. **Test thoroughly** → No deployment needed!

5. **Deploy when ready** → Only when feature is complete

## Speed Comparison

| Method | Time per Change | Iterations/hour |
|--------|----------------|-----------------|
| **Local Dev** | < 1 second | 100+ |
| **AWS Deployment** | 5-7 minutes | ~8-12 |

## When to Deploy

✅ **Deploy when:**
- Feature is complete
- Tested locally
- Ready for production
- Multiple changes ready (batch)

❌ **Don't deploy for:**
- Testing a single change
- Debugging
- Experimenting
- UI tweaks

## Tips

1. **Keep local servers running** - Start once, use all day
2. **Use browser DevTools** - Instant debugging
3. **Test in multiple browsers** - Before deploying
4. **Commit frequently** - But deploy less often
5. **Batch deployments** - Deploy multiple features together

## Troubleshooting

**Port in use?**
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**Backend not connecting?**
- Check `backend/.env` has correct DATABASE_URL
- Ensure database is accessible

**Frontend not connecting?**
- Check `frontend/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:3000/api`
- Ensure backend is running

