/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
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
  await app.listen(port);
  Logger.log(
    `Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap().catch((error: unknown) => {
  Sentry.captureException(error);
  Logger.error('Application failed to start', error);
  process.exitCode = 1;
});
