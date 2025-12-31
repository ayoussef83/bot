import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaService } from './prisma/prisma.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS for dashboard clients.
    // - If FRONTEND_URL is set (comma-separated), only allow those origins.
    // - If not set, allow any origin (token auth uses Authorization header; no cookies needed).
    const allowedOrigins = (process.env.FRONTEND_URL || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    app.enableCors({
      origin: (origin, callback) => {
        // allow non-browser clients (no Origin header)
        if (!origin) return callback(null, true);

        if (allowedOrigins.length === 0) return callback(null, true);

        return callback(null, allowedOrigins.includes(origin));
      },
      credentials: false,
    });
    
    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter());
    
    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    // Global prefix
    app.setGlobalPrefix('api');

    // Safe auto-seed (only when DB is empty). This is needed after Option A reset.
    const prisma = app.get(PrismaService);
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);

      const superAdmin = await prisma.user.create({
        data: {
          email: 'admin@mvalley.eg',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'super_admin',
          status: 'active',
        },
      });

      await prisma.user.create({
        data: {
          email: 'management@mvalley.eg',
          password: hashedPassword,
          firstName: 'Management',
          lastName: 'User',
          role: 'management',
          status: 'active',
        },
      });

      const instructorUser = await prisma.user.create({
        data: {
          email: 'instructor@mvalley.eg',
          password: hashedPassword,
          firstName: 'John',
          lastName: 'Instructor',
          role: 'instructor',
          status: 'active',
        },
      });

      await prisma.instructor.create({
        data: {
          userId: instructorUser.id,
          costType: 'hourly',
          costAmount: 200,
        },
      });

      // Expense categories
      const categories = [
        { name: 'Instructor Payouts', code: 'INSTR', description: 'Instructor fees and salaries' },
        { name: 'Rent', code: 'RENT', description: 'Office and classroom rent' },
        { name: 'Marketing', code: 'MKTG', description: 'Marketing and advertising expenses' },
        { name: 'Utilities', code: 'UTIL', description: 'Electricity, water, internet' },
        { name: 'Operations', code: 'OPS', description: 'Office supplies and operations' },
        { name: 'Other', code: 'OTHER', description: 'Other expenses' },
      ];
      for (const c of categories) {
        await prisma.expenseCategory.create({ data: c });
      }

      // Cash accounts
      const cashAccounts = [
        { name: 'Main Bank Account', type: 'bank', accountNumber: '0000000001', bankName: 'Default Bank', balance: 0, currency: 'EGP', isActive: true },
        { name: 'Cash Register', type: 'cash', accountNumber: '', bankName: '', balance: 0, currency: 'EGP', isActive: true },
        { name: 'Vodafone Cash', type: 'wallet', accountNumber: '', bankName: '', balance: 0, currency: 'EGP', isActive: true },
      ] as const;
      for (const a of cashAccounts) {
        await prisma.cashAccount.create({ data: a as any });
      }

      // Create current financial period
      const now = new Date();
      const periodCode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      await prisma.financialPeriod.create({
        data: {
          periodCode,
          startDate,
          endDate,
          status: 'open',
          notes: 'Auto-created on empty DB bootstrap',
        } as any,
      });

      // eslint-disable-next-line no-console
      console.log(`🌱 Auto-seeded empty DB. Admin: ${superAdmin.email} / admin123`);
    }
    
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 MV-OS Backend running on port ${port}`);
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    console.error('Error details:', error instanceof Error ? error.stack : JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Unhandled error during bootstrap:', error);
  console.error('Error details:', error instanceof Error ? error.stack : JSON.stringify(error, null, 2));
  process.exit(1);
});

