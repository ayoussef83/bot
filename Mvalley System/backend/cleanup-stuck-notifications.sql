-- Clean up stuck scheduled notifications
-- This marks all pending scheduled notifications as failed and clears their scheduledAt

UPDATE notifications
SET 
  status = 'failed',
  "errorMessage" = 'Notification was stuck - cleaned up manually',
  "scheduledAt" = NULL
WHERE 
  status = 'pending' 
  AND "scheduledAt" IS NOT NULL
  AND "scheduledAt" <= NOW();

-- Check how many were cleaned up
SELECT COUNT(*) as cleaned_count
FROM notifications
WHERE 
  status = 'failed' 
  AND "errorMessage" = 'Notification was stuck - cleaned up manually';







