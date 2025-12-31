# 🎉 App Runner Service Created - Next Steps

## ✅ Service Created Successfully!

**Service ARN:**
```
arn:aws:apprunner:us-east-1:149959196988:service/mv-os-backend/1919b90f9fec4c60a9e1a7fcb8cf293e
```

**Service Name:** `mv-os-backend`

---

## ⏳ Current Status: Deploying

The service is currently deploying. This takes **5-10 minutes**.

**Monitor Progress:**
- AWS Console: https://console.aws.amazon.com/apprunner/home?region=us-east-1#/services/mv-os-backend
- Status will change from "Creating" → "Running" when ready

---

## 📋 After Deployment Completes

### Step 1: Get Service URL

Once status is "Running", get your service URL:

```bash
aws apprunner describe-service \
  --service-arn "arn:aws:apprunner:us-east-1:149959196988:service/mv-os-backend/1919b90f9fec4c60a9e1a7fcb8cf293e" \
  --query 'Service.ServiceUrl' \
  --output text
```

Or check in AWS Console → App Runner → mv-os-backend → Service URL

**Example URL format:** `https://xxxxx.us-east-1.awsapprunner.com`

### Step 2: Test Health Endpoint

```bash
curl https://YOUR_SERVICE_URL/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "service": "mv-os-backend"
}
```

### Step 3: Run Database Migrations

**⚠️ Important:** Before the backend can work properly, you need to run database migrations.

**Option A: Via EC2 (Recommended)**

1. **Launch EC2 Instance:**
   - Instance type: `t3.micro` (free tier eligible)
   - AMI: Amazon Linux 2
   - Security group: Allow SSH (port 22) from your IP

2. **SSH into EC2:**
   ```bash
   ssh ec2-user@YOUR_EC2_IP
   ```

3. **Install Node.js:**
   ```bash
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs
   ```

4. **Clone Repository:**
   ```bash
   git clone YOUR_GITHUB_REPO_URL
   cd "Mvalley System/backend"
   ```

5. **Get Database URL from Secrets Manager:**
   ```bash
   aws secretsmanager get-secret-value \
     --secret-id mv-os/database-url \
     --query SecretString --output text > .env
   echo "DATABASE_URL=$(cat .env)" > .env
   ```

6. **Run Migrations:**
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate deploy
   npm run prisma:seed
   ```

7. **Terminate EC2 Instance** (when done):
   ```bash
   # From your local machine
   aws ec2 terminate-instances --instance-ids i-xxxxx
   ```

**Option B: Via App Runner (One-time Task)**

Create a temporary App Runner service with migration command, then delete it after migrations complete.

### Step 4: Deploy Frontend to Amplify

1. **Install Amplify CLI:**
   ```bash
   npm install -g @aws-amplify/cli
   ```

2. **Initialize Amplify:**
   ```bash
   cd frontend
   amplify init
   # Follow prompts:
   # - Project name: mv-os-frontend
   # - Environment: production
   # - Framework: react
   # - Source directory: .
   # - Build command: npm run build
   # - Start command: npm start
   ```

3. **Add Hosting:**
   ```bash
   amplify add hosting
   # Select: Hosting with Amplify Console
   ```

4. **Set Environment Variable:**
   - In Amplify Console → Environment variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://YOUR_APP_RUNNER_URL/api`

5. **Deploy:**
   ```bash
   amplify publish
   ```

### Step 5: Test Complete System

1. **Access Frontend:**
   - Visit Amplify URL (provided after deployment)

2. **Login:**
   - Email: `admin@mindvalley.eg`
   - Password: `admin123`

3. **Verify:**
   - Dashboard loads
   - Can view students, classes, etc.
   - API calls work

---

## 🔧 Troubleshooting

### Service Status Stuck on "Creating"
- Check CloudWatch logs in App Runner console
- Verify build command executed successfully
- Check for errors in service logs

### Health Check Fails
- Verify `/api/health` endpoint exists
- Check service logs
- Verify port is 3000

### Database Connection Fails
- Verify RDS security group allows App Runner
- Check Secrets Manager has correct database URL
- Verify RDS instance is running

### Frontend Can't Connect
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings (should allow Amplify domain)
- Verify App Runner service is running

---

## 📊 Monitoring

- **CloudWatch Logs**: Automatic for App Runner
- **Metrics**: CPU, Memory, Request count
- **Service URL**: Available in App Runner console

---

## ✅ Deployment Checklist

- [x] App Runner service created
- [ ] Service deployment completed (wait 5-10 min)
- [ ] Service URL obtained
- [ ] Health endpoint tested
- [ ] Database migrations run
- [ ] Frontend deployed to Amplify
- [ ] Frontend API URL configured
- [ ] Complete system tested
- [ ] Login verified

---

**Next:** Wait for deployment to complete, then follow steps above!











