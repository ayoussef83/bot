# 🔧 Troubleshooting App Runner Update Failure

## Common Issues and Solutions

### Issue 1: Service is in a Failed State

If the service is in `CREATE_FAILED` or `UPDATE_FAILED` state, you may need to:

1. **Check Service Status:**
   ```bash
   aws apprunner describe-service \
     --service-arn "arn:aws:apprunner:us-east-1:149959196988:service/mv-os-backend/1919b90f9fec4c60a9e1a7fcb8cf293e" \
     --query 'Service.Status' \
     --output text
   ```

2. **If Failed, Delete and Recreate:**
   - Go to App Runner console
   - Delete the failed service
   - Create a new one with the correct configuration

### Issue 2: apprunner.yaml Not in Repository

**Solution:** Make sure `apprunner.yaml` is pushed to GitHub:

1. Check if file exists in repo:
   ```bash
   git ls-files | grep apprunner.yaml
   ```

2. If not, push it:
   ```bash
   git add apprunner.yaml
   git commit -m "Add App Runner config"
   git push origin main
   ```

### Issue 3: apprunner.yaml Syntax Error

**Solution:** Validate YAML syntax:

```bash
# Check YAML syntax
python3 -c "import yaml; yaml.safe_load(open('apprunner.yaml'))" 2>&1
```

Or use online YAML validator.

### Issue 4: Alternative - Update Build Command Instead

If updating to use config file fails, update the build command directly:

1. **Edit Service** → **Step 2: Configure build**
2. Keep "Configure all settings here" selected
3. **Update Build Command:**
   ```
   cd backend && npm install --legacy-peer-deps && npx prisma generate && npm run build
   ```
4. **Start Command:**
   ```
   cd backend && npm run start:prod
   ```
5. **Port:** `3000`
6. Save and deploy

### Issue 5: Service is Deploying

If service is in `OPERATION_IN_PROGRESS`, wait for it to complete before updating.

**Check status:**
```bash
./cloud-deployment/check-service-status.sh
```

### Issue 6: Invalid Configuration

If using config file, ensure:
- File is named exactly `apprunner.yaml`
- File is in repository root (not in subdirectory)
- YAML syntax is correct
- Runtime version is valid (nodejs18, nodejs22, etc.)

## Recommended: Update Build Command Directly

Since updating to config file is failing, try updating the build command:

**In App Runner Console:**

1. Edit service
2. Step 2: Configure build
3. Keep "Configure all settings here"
4. **Build command:**
   ```
   cd backend && npm install --legacy-peer-deps && npm run build
   ```
5. **Start command:**
   ```
   cd backend && npm run start:prod
   ```
6. Save and deploy

This should work without needing the config file.











