import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@mvalley.eg' },
    update: {},
    create: {
      email: 'admin@mvalley.eg',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      status: 'active',
    },
  });

  console.log('✅ Created super admin:', superAdmin.email);

  // Create sample management user
  const management = await prisma.user.upsert({
    where: { email: 'management@mvalley.eg' },
    update: {},
    create: {
      email: 'management@mvalley.eg',
      password: hashedPassword,
      firstName: 'Management',
      lastName: 'User',
      role: 'management',
      status: 'active',
    },
  });

  console.log('✅ Created management user:', management.email);

  // Create sample instructor user
  const instructorUser = await prisma.user.upsert({
    where: { email: 'instructor@mvalley.eg' },
    update: {},
    create: {
      email: 'instructor@mvalley.eg',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Instructor',
      role: 'instructor',
      status: 'active',
    },
  });

  // Create instructor profile
  const instructor = await prisma.instructor.upsert({
    where: { userId: instructorUser.id },
    update: {},
    create: {
      userId: instructorUser.id,
      costType: 'hourly',
      costAmount: 200,
    },
  });

  console.log('✅ Created instructor:', instructorUser.email);

  // Create sample locations data (if needed)
  console.log('✅ Seed completed!');
  console.log('\n📝 Default credentials:');
  console.log('   Super Admin: admin@mvalley.eg / admin123');
  console.log('   Management: management@mvalley.eg / admin123');
  console.log('   Instructor: instructor@mvalley.eg / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


