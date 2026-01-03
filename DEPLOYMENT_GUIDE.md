# 🚀 Deployment Guide - MV-OS

## ✅ Current Status

**Backend**: ✅ **RUNNING**
- URL: `https://mzmeyp2cw9.us-east-1.awsapprunner.com`
- Health: ✅ Healthy
- Status: Ready for frontend connection

**Frontend**: ⏳ **Ready to Deploy**
- Build: ✅ Passes
- API URL: Updated to backend URL
- Status: Ready for Amplify deployment

## 🚀 Deploy Frontend to AWS Amplify

### Option 1: Via AWS Console (Recommended - 5 minutes)

1. **Go to AWS Amplify Console**:
   ```
   https://console.aws.amazon.com/amplify
   ```

2. **Create New App**:
   - Click **"New app"** → **"Host web app"**
   - Select **"GitHub"** (or your Git provider)
   - Authorize AWS Amplify
   - Select repository: Your repository
   - Select branch: **`main`**
   - Click **"Next"**

3. **Configure Build Settings**:
   - Amplify should auto-detect `amplify.yml`
   - If not, use the configuration from `amplify.yml` in project root

4. **Add Environment Variable**:
   - Click **"Add environment variable"**
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api`
   - Click **"Save"**

5. **Deploy**:
   - Review settings
   - Click **"Save and deploy"**
   - Wait 5-10 minutes

6. **Get Your URL**:
   - Once deployed, you'll get a URL like: `https://main.xxxxx.amplifyapp.com`

### Option 2: Via Amplify CLI

```bash
# Install Amplify CLI (if not installed)
npm install -g @aws-amplify/cli

# Navigate to frontend
cd frontend

# Initialize Amplify
amplify init
# Follow prompts:
# - Project name: mv-os-frontend
# - Environment: production
# - Framework: react
# - Source directory: .
# - Build command: npm run build
# - Start command: npm start

# Add hosting
amplify add hosting
# Select: Hosting with Amplify Console

# Set environment variable
amplify env add
# Add: NEXT_PUBLIC_API_URL=https://mzmeyp2cw9.us-east-1.awsapprunner.com/api

# Deploy
amplify publish
```

## ✅ Verify Deployment

1. **Test Frontend URL**: Visit your Amplify URL
2. **Test Login**: Use default credentials:
   - Email: `admin@mindvalley.eg`
   - Password: `admin123`
3. **Check API Connection**: Verify frontend connects to backend
4. **Test Features**: Navigate through the app

## 🔧 Troubleshooting

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is set correctly in Amplify
- Check CORS settings in backend
- Verify backend is running

### Build fails
- Check Amplify build logs
- Verify `amplify.yml` is correct
- Check Node.js version (should be 18+)

### API errors
- Check backend health: `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api/health`
- Verify environment variables in Amplify
- Check CloudWatch logs for backend

## 📊 Deployment Checklist

- [x] Backend deployed and running
- [x] Frontend builds successfully
- [x] API URL updated
- [ ] Frontend deployed to Amplify
- [ ] Environment variables set
- [ ] Deployment tested
- [ ] Login verified

## 🎉 After Deployment

Once both are deployed:
- ✅ Backend: `https://mzmeyp2cw9.us-east-1.awsapprunner.com`
- ✅ Frontend: `https://main.xxxxx.amplifyapp.com`

Your MV-OS system is fully cloud-based and ready to use!

---

**Last Updated**: $(date)
**Backend Status**: ✅ Running
**Frontend Status**: ⏳ Ready to deploy


