// Script to create admin@mvalley.eg user in production database
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { execSync } = require('child_process');

async function main() {
  console.log('🔐 Getting database connection string from Secrets Manager...');
  
  const dbUrl = execSync('aws secretsmanager get-secret-value --secret-id mv-os/database-url --query SecretString --output text', {
    encoding: 'utf-8'
  }).trim();
  
  if (!dbUrl) {
    console.error('❌ Failed to get database URL from Secrets Manager');
    process.exit(1);
  }
  
  console.log('✅ Got database URL');
  console.log('');
  console.log('🔧 Creating admin@mvalley.eg user...');
  
  // Set DATABASE_URL for Prisma
  process.env.DATABASE_URL = dbUrl;
  
  const prisma = new PrismaClient();
  
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'admin@mvalley.eg' },
      update: {
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        status: 'active',
      },
      create: {
        email: 'admin@mvalley.eg',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        status: 'active',
      },
    });
    
    console.log('✅ User created/updated successfully!');
    console.log('');
    console.log('📝 Login credentials:');
    console.log('   Email: admin@mvalley.eg');
    console.log('   Password: admin123');
    console.log('');
    console.log('User details:', {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    console.error('❌ Failed to create user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();










