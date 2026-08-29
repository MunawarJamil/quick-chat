/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import 'dotenv/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { initSentry, Sentry } from './config/sentry';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

initSentry();
process.on('unhandledRejection', (reason) => {
  Sentry.captureException(reason);
  Logger.error('Unhandled promise rejection', reason);
});

process.on('uncaughtException', (error) => {
  Sentry.captureException(error);
  Logger.error('Uncaught exception', error);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  

  // CORS — restrict which origins can call this API
  const allowedOrigins =
    process.env.APP_ENV === 'production'
      ? (process.env.CORS_ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim())
      : ['http://localhost:4200', 'http://localhost:3001'];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    credentials: true,
  });



  // for registering validation pipes globally - to ensure data validation at entry points of application 
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());
  const config = new DocumentBuilder()
    .setTitle('kuicksupport API')
    .setDescription('kuicksupport backend API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  Logger.log(
    `Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}


bootstrap().catch((error: unknown) => {
  Sentry.captureException(error);
  Logger.error('Application failed to start', error);
  process.exitCode = 1;
});
