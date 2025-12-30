import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

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

