# 🚀 MV-OS Deployment Steps

## Prerequisites
- ✅ All code committed and pushed to GitHub
- ✅ AWS Account with appropriate permissions
- ✅ RDS Database instance created
- ✅ Secrets Manager configured with DATABASE_URL and JWT_SECRET

## Step 1: Deploy Backend (AWS App Runner)

### Via AWS Console:

1. **Go to AWS App Runner Console**
   - URL: https://console.aws.amazon.com/apprunner
   - Region: us-east-1 (or your preferred region)

2. **Create Service**
   - Click "Create service"
   - Select "Source code repository"
   - Connect your GitHub/GitLab/Bitbucket account
   - Select repository: `ayoussef83/bot` (or your repo name)
   - Branch: `main`

3. **Configure Build**
   - **Build command**: `cd backend && npm install && npm run build`
   - **Start command**: `cd backend && npm run start:prod`
   - **Port**: `3000`

4. **Configure Service**
   - **Service name**: `mv-os-backend`
   - **Instance**: 0.25 vCPU, 0.5 GB memory (minimum)
   - **Auto-deploy**: Enable

5. **Environment Variables**
   - Click "Add environment variable"
   - Add:
     ```
     NODE_ENV = production
     PORT = 3000
     ```

6. **Secrets (from Secrets Manager)**
   - Click "Add secret"
   - Add:
     ```
     DATABASE_URL = mv-os/database-url
     JWT_SECRET = mv-os/jwt-secret
     ```

7. **Health Check**
   - Path: `/api/health`
   - Interval: 10 seconds

8. **Create & Deploy**
   - Click "Create & deploy"
   - Wait 5-10 minutes for deployment
   - **Note the service URL**: e.g., `https://xxxxx.us-east-1.awsapprunner.com`

## Step 2: Deploy Frontend (AWS Amplify)

### Via AWS Console:

1. **Go to AWS Amplify Console**
   - URL: https://console.aws.amazon.com/amplify
   - Click "New app" → "Host web app"

2. **Connect Repository**
   - Select "GitHub" (or your Git provider)
   - Authorize and select repository: `ayoussef83/bot`
   - Branch: `main`

3. **Configure Build Settings**
   - Amplify will auto-detect Next.js
   - **Build settings** (amplify.yml already exists):
     ```yaml
     version: 1
     frontend:
       phases:
         preBuild:
           commands:
             - cd frontend
             - npm install --legacy-peer-deps
         build:
           commands:
             - npm run build
       artifacts:
         baseDirectory: frontend/out
         files:
           - '**/*'
     ```

4. **Environment Variables**
   - Click "Environment variables"
   - Add:
     ```
     NEXT_PUBLIC_API_URL = https://YOUR_APP_RUNNER_URL/api
     ```
   - Replace `YOUR_APP_RUNNER_URL` with your App Runner service URL from Step 1

5. **Save and Deploy**
   - Click "Save and deploy"
   - Wait 5-10 minutes for build and deployment
   - **Note the Amplify URL**: e.g., `https://main.xxxxx.amplifyapp.com`

## Step 3: Run Database Migrations

### Option A: Via EC2 (Temporary Instance)

1. **Launch EC2 Instance**
   - Type: t3.micro (free tier eligible)
   - OS: Amazon Linux 2
   - Security Group: Allow SSH (port 22) from your IP

2. **SSH into Instance**
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs
   ```

4. **Clone Repository**
   ```bash
   git clone https://github.com/ayoussef83/bot.git
   cd bot/backend
   ```

5. **Install Dependencies**
   ```bash
   npm install
   ```

6. **Get Database URL from Secrets Manager**
   ```bash
   aws secretsmanager get-secret-value \
     --secret-id mv-os/database-url \
     --query SecretString --output text > .env
   echo "DATABASE_URL=$(cat .env)" >> .env
   ```

7. **Run Migrations**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   npm run prisma:seed
   ```

8. **Terminate EC2 Instance** (when done)

### Option B: Via Local Machine (If you have AWS CLI configured)

```bash
cd backend

# Get database URL
export DATABASE_URL=$(aws secretsmanager get-secret-value \
  --secret-id mv-os/database-url \
  --query SecretString --output text)

# Run migrations
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
```

## Step 4: Verify Deployment

1. **Backend Health Check**
   - Visit: `https://YOUR_APP_RUNNER_URL/api/health`
   - Should return: `{"status":"ok"}`

2. **Frontend**
   - Visit your Amplify URL
   - Should load the login page

3. **Login**
   - Email: `admin@mindvalley.eg`
   - Password: `admin123`

## Troubleshooting

### Backend Issues
- Check CloudWatch logs in App Runner console
- Verify environment variables are set correctly
- Check database connectivity (RDS security group)

### Frontend Issues
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check Amplify build logs
- Ensure backend CORS allows Amplify domain

### Database Issues
- Verify RDS security group allows App Runner
- Check Secrets Manager has correct database URL
- Ensure RDS instance is running

## Cost Estimate
- **App Runner**: ~$5-10/month
- **Amplify**: $0/month (free tier)
- **RDS**: ~$14.71/month
- **Secrets Manager**: ~$0.40/month
- **Total**: ~$20-25/month

---

**Need help?** Check `cloud-deployment/DEPLOY_NOW.md` for more details.

