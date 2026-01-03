// Quick script to clean up stuck scheduled notifications
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanup() {
  try {
    const now = new Date();
    
    console.log('Cleaning up stuck scheduled notifications...');
    
    // Find all pending scheduled notifications
    const stuck = await prisma.notification.findMany({
      where: {
        status: 'pending',
        scheduledAt: {
          not: null,
          lte: now,
        },
      },
    });
    
    console.log(`Found ${stuck.length} stuck notifications`);
    
    if (stuck.length > 0) {
      // Update them all to failed and clear scheduledAt
      const result = await prisma.notification.updateMany({
        where: {
          status: 'pending',
          scheduledAt: {
            not: null,
            lte: now,
          },
        },
        data: {
          status: 'failed',
          errorMessage: 'Notification was stuck - cleaned up manually',
          scheduledAt: null,
        },
      });
      
      console.log(`✅ Cleaned up ${result.count} stuck notifications`);
      console.log('Messages should stop now!');
    } else {
      console.log('No stuck notifications found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();











