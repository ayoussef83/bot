# 🐳 Docker Deployment - Quick Start

## Current Situation

- ✅ Dockerfile created and ready
- ❌ Docker not installed locally
- ✅ ECR repository exists
- ✅ App Runner ready for container deployment

## Easiest Path: Install Docker Desktop

### Step 1: Install Docker Desktop

**macOS:**
```bash
# Download from: https://www.docker.com/products/docker-desktop
# Or use Homebrew:
brew install --cask docker
```

**Then:**
1. Open Docker Desktop
2. Wait for it to start
3. Verify: `docker --version`

### Step 2: Deploy

```bash
./cloud-deployment/deploy-docker.sh
```

This single command will:
- Build Docker image
- Push to ECR
- Create App Runner service
- Configure everything automatically

## Alternative: Build on EC2

If you can't install Docker locally:

### Step 1: Launch EC2 Instance

```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --key-name YOUR_KEY \
  --security-group-ids sg-xxxxx
```

### Step 2: SSH and Build

```bash
# SSH to EC2
ssh ec2-user@YOUR_EC2_IP

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo usermod -aG docker ec2-user
newgrp docker

# Clone and build
git clone https://github.com/ayoussef83/bot.git
cd bot/backend

# Build image
docker build -t mv-os-backend:latest -f Dockerfile .

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 149959196988.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag mv-os-backend:latest 149959196988.dkr.ecr.us-east-1.amazonaws.com/mv-os-backend:latest
docker push 149959196988.dkr.ecr.us-east-1.amazonaws.com/mv-os-backend:latest
```

### Step 3: Create App Runner Service

```bash
./cloud-deployment/create-app-runner-from-ecr.sh
```

## Benefits of Docker

- ✅ **No build issues** - Everything pre-built
- ✅ **Consistent** - Same image locally and in cloud
- ✅ **Faster** - No build step in App Runner
- ✅ **Reliable** - Test locally before deploying

---

**Recommendation:** Install Docker Desktop for the easiest experience!












